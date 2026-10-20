import { getPublishedPackages } from '@/lib/serverContent';
import type { TravelPackage } from '@/lib/packageData';
import { meetsConstraints, parseSearch } from '@/lib/searchConstraints';

export const runtime = 'nodejs';

/* Natural-language package search for the catalogue and compare pickers.
   Budgets and lengths ("under 1k", "3 nights") are read and applied in
   code; TypeSafe's Jev judges only what is left ("beach", "honeymoon
   abroad") against the packages that survive them, each trip carried in
   its own questions: pointing many questions at indexes of one shared
   array made Jev confuse neighbouring trips. A search
   that asks for nothing beyond the limits ("trip under 1k") never reaches
   Jev at all. The catalogue is read here rather than taken from the
   browser, so the key only ever judges our own packages.

   Off unless NEXT_PUBLIC_JEV_SEARCH is "true" — the same switch the browser
   reads to decide whether to call this route at all. */

const JEV_URL = 'https://api.typesafe.ai/v1/systemone';
const JEV_MODEL = 'jev-latest';
/* Applied to the weaker of a trip's two answers. Measured on the catalogue:
   real matches read 0.7 and up; a trip in the wrong place or of the wrong
   kind reads well under 0.5 on that question. */
const MATCH_THRESHOLD = 0.5;
const MAX_QUERY_LENGTH = 100;

const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX = 200;
const cache = new Map<string, { at: number; matches: Match[] }>();

/* Per instance only, but enough to stop one visitor running up the bill. */
const RATE_WINDOW_MS = 60 * 1000;
/* Each pause while typing is a request, so this has to allow a visitor
   trying several phrasings in a row. */
const RATE_MAX = 60;
const hits = new Map<string, number[]>();

type Match = { id: string; probability: number };

/* Region is left out: the imported catalogue's region field is unreliable. */
function tripFor(pkg: TravelPackage) {
  return {
    title: pkg.title,
    location: pkg.location,
    themes: pkg.tags,
    nights: pkg.nights,
    days: pkg.days,
    price_inr_per_person: pkg.price,
    ...(pkg.details?.places?.length ? { places: pkg.details.places.slice(0, 8) } : {}),
  };
}

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((at) => now - at < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5_000) hits.clear();
  return recent.length > RATE_MAX;
}

const QUESTION_LEAD = 'A traveller typed `search` into the search box of an Indian travel site.';

/* Two Nouls per trip, combined in code: one question judging "honeymoon
   abroad" as a whole let the honeymoon outweigh the abroad and returned
   Kerala. Each condition gets its own question, and a trip must pass both. */
function questionsFor(pkg: TravelPackage, index: number) {
  const trip = tripFor(pkg);
  return [
    [`kind${index}`, {
      type: 'noul',
      instructions: { question: `${QUESTION_LEAD} Is this trip the kind of trip the search asks for?`, trip },
      criteria: {
        true: 'The trip offers the kind of holiday, activity, theme or traveller type the search describes, or the search only names a place',
        false: 'The search asks for a kind of trip, activity or traveller type this trip does not offer',
      },
    }],
    [`place${index}`, {
      type: 'noul',
      instructions: { question: `${QUESTION_LEAD} Is this trip in the place the search asks for?`, trip },
      criteria: {
        true: 'The trip goes to the place, region or country the search names, or is near the place it says, or the search names no place at all. "Abroad" or "international" means outside India; "India" or "domestic" means inside India',
        false: 'The search names a place, region or country, or abroad versus India, and this trip is somewhere else',
      },
    }],
  ] as const;
}

/* Two questions with the trip in each come to about 480 tokens a package;
   50 a request stays well inside the 64k per-request context. */
const BATCH_SIZE = 50;

async function askJevBatch(apiKey: string, query: string, packages: TravelPackage[]): Promise<Match[]> {
  const questions = Object.fromEntries(packages.flatMap((pkg, index) => questionsFor(pkg, index)));

  const response = await fetch(JEV_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: JEV_MODEL, state: { search: query }, questions }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Jev returned ${response.status}`);

  const { answers } = await response.json() as { answers: Record<string, { noul?: number }> };
  return packages.map((pkg, index) => ({
    id: pkg.id,
    probability: Math.min(answers[`kind${index}`]?.noul ?? 0, answers[`place${index}`]?.noul ?? 0),
  }));
}

async function askJev(apiKey: string, query: string, packages: TravelPackage[]): Promise<Match[]> {
  const batches = Array.from({ length: Math.ceil(packages.length / BATCH_SIZE) }, (_, index) =>
    packages.slice(index * BATCH_SIZE, (index + 1) * BATCH_SIZE));
  const answers = await Promise.all(batches.map((batch) => askJevBatch(apiKey, query, batch)));
  return answers
    .flat()
    .filter((match) => match.probability >= MATCH_THRESHOLD)
    .sort((a, b) => b.probability - a.probability);
}

export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({ error: 'Invalid request origin.' }, { status: 403 });
  if (Number(request.headers.get('content-length')) > 1_000) return Response.json({ error: 'Request too large.' }, { status: 413 });

  if (process.env.NEXT_PUBLIC_JEV_SEARCH !== 'true') return Response.json({ error: 'Smart search is turned off.' }, { status: 404 });
  const apiKey = process.env.TYPESAFE_JEV;
  if (!apiKey) return Response.json({ error: 'Smart search is not configured.' }, { status: 503 });

  const body = await request.json().catch(() => null) as { query?: unknown } | null;
  const query = typeof body?.query === 'string' ? body.query.trim().replace(/\s+/g, ' ') : '';
  if (query.length < 2 || query.length > MAX_QUERY_LENGTH) return Response.json({ error: 'Enter a search between 2 and 100 characters.' }, { status: 400 });

  const key = query.toLowerCase();
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return Response.json({ matches: cached.matches }, { headers: { 'Cache-Control': 'no-store' } });

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (rateLimited(ip)) return Response.json({ error: 'Too many searches. Please wait a minute.' }, { status: 429 });

  try {
    const constraints = parseSearch(query);
    const candidates = (await getPublishedPackages()).filter((pkg) => meetsConstraints(pkg, constraints));
    const matches = constraints.generic
      ? [...candidates].sort((a, b) => a.price - b.price).map((pkg) => ({ id: pkg.id, probability: 1 }))
      : candidates.length === 0
        ? []
        : await askJev(apiKey, constraints.remainder, candidates);
    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value!);
    cache.set(key, { at: Date.now(), matches });
    return Response.json({ matches }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (cause) {
    console.error('Package search failed', cause instanceof Error ? cause.message : cause);
    return Response.json({ error: 'Smart search is unavailable right now.' }, { status: 502 });
  }
}

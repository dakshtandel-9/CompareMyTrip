import { subscribeToNewsletter } from '@/lib/welcomeEmails';

export const runtime = 'nodejs';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({ error: 'Invalid request origin.' }, { status: 403 });
  if (Number(request.headers.get('content-length')) > 2_000) return Response.json({ error: 'Request too large.' }, { status: 413 });
  const body = await request.json().catch(() => null) as { email?: unknown } | null;
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) return Response.json({ error: 'Enter a valid email address so we know where to send it.' }, { status: 400 });
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const result = await subscribeToNewsletter(email, ip);
    if (result === 'rate-limited') return Response.json({ error: 'Too many sign-ups from this connection. Please try again in an hour.' }, { status: 429 });
    return Response.json({ result }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (cause) {
    console.error('Newsletter subscription failed', cause instanceof Error ? cause.message : cause);
    return Response.json({ error: 'We could not save your subscription. Please try again.' }, { status: 503 });
  }
}

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(file, dependencies = {}, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports, URL, Headers, Request, Response, AbortSignal, console,
    process: { env: { NODE_ENV: 'production' } }, ...globals, require(name) {
      assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`);
      return dependencies[name];
    } });
  return exports;
}
const travellers = load('src/lib/quoteTravellers.ts');

test('quote traveller validation accepts only canonical whole counts from 1 to 20', () => {
  for (let count = 1; count <= 20; count++) assert.equal(travellers.isValidQuoteTravellers(String(count)), true);
  for (const input of ['', ' ', '0', '21', '-1', '1.5', 'NaN', 'Infinity', '1e1', '0x10', '01']) {
    assert.equal(travellers.isValidQuoteTravellers(input), false, input);
  }
});

test('the enquiry writer rejects fractional quote counts before any database write', async () => {
  const writes = [];
  const writer = load('src/lib/firebase/enquiries.ts', {
    '@/lib/quoteTravellers': travellers,
    './client': { getFirebaseDb: () => ({}) },
    'firebase/app': {},
    'firebase/firestore': { collection: () => 'contactEnquiries', serverTimestamp: () => 'now',
      addDoc: async (collection, data) => writes.push({ collection, data }) },
  });
  const input = { name: 'Test Traveller', email: 'test@example.com', phone: '+919999999999',
    destination: 'Kerala', departure: '2026-10-01', travellers: '2', message: '', source: 'custom_quote', userId: 'test-user' };
  for (const value of ['', '0', '21', '1.5', 'Infinity']) {
    await assert.rejects(writer.saveContactEnquiry({ ...input, travellers: value }), /whole number/);
  }
  assert.equal(writes.length, 0);
  await writer.saveContactEnquiry(input);
  assert.equal(writes[0].data.travellers, '2');
  await writer.saveContactEnquiry({ ...input, source: 'contact', userId: '', travellers: '6–9' });
  assert.equal(writes[1].data.travellers, '6–9', 'contact group labels remain compatible');
});

test('maintenance cold outage, recovery, disabled mode and repeated outage keep deliberate decisions', async () => {
  let result = 'timeout';
  const settings = load('src/lib/comingSoonServer.ts', {}, {
    process: { env: { NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'test-project' } },
    fetch: async () => {
      if (result === 'timeout') throw new Error('timeout');
      if (result === 'service-error') return { ok: false, status: 503 };
      return { ok: true, json: async () => ({ enabled: result }) };
    },
  });
  assert.equal(await settings.readComingSoonEnabled(), true, 'cold workers do not unexpectedly open a paused website');
  result = true; assert.equal(await settings.readComingSoonEnabled(), true);
  result = 'service-error'; assert.equal(await settings.readComingSoonEnabled(), true);
  result = false; assert.equal(await settings.readComingSoonEnabled(), false, 'explicit disable takes effect immediately');
  result = 'timeout'; assert.equal(await settings.readComingSoonEnabled(), false);
  result = true; assert.equal(await settings.readComingSoonEnabled(), true);
});

const packages = load('src/lib/packageData.ts');
test('public content retains legitimate legacy packages and withholds drafts and test titles', () => {
  const entries = [
    { id: 'legacy', title: 'Kerala holiday' }, { id: 'published', title: 'Coorg trek', status: 'published' },
    { id: 'draft', title: 'Unfinished plan', status: 'draft' },
    { id: 'test', title: 'test@example.com text' }, { id: 'empty', title: '' },
  ];
  assert.deepEqual(Array.from(packages.publishedPackages(entries), pkg => pkg.id), ['legacy', 'published']);
});

test('an incomplete package does not invent itinerary, inclusions, photos or free cancellation', () => {
  const details = packages.getPackageDetails({ title: 'Test trek', nights: 1, days: 2,
    location: 'Coorg', image: '/real-photo.jpg' });
  for (const field of ['itinerary', 'stays', 'highlights', 'inclusions', 'exclusions']) assert.equal(details[field].length, 0);
  assert.deepEqual(Array.from(details.gallery), ['/real-photo.jpg']);
  assert.doesNotMatch(details.cancellationPolicy, /free cancellation/i);
  assert.match(details.summary, /Contact the travel team/);
});

function content(db) {
  return load('src/lib/serverContent.ts', {
    react: { cache: fn => fn }, 'next/cache': { unstable_cache: fn => fn },
    '@/lib/blogSeed': { BLOG_SEED_POSTS: [{ id: 'seed', status: 'published' }] },
    '@/lib/blogData': { normalizeBlogPost: (id, data) => ({ id, ...data }), sortBlogPosts: posts => posts },
    '@/lib/firebase/admin': { getAdminDb: () => db }, '@/lib/packageData': packages,
    '@/lib/cruiseListings': { isPublishedCruise: (cruise) => (cruise.status ?? 'published') === 'published' },
  });
}

test('production content fails closed instead of silently returning seed records', async () => {
  for (const db of [null, { collection: () => ({ get: async () => { throw new Error('offline'); } }) }]) {
    const source = content(db);
    await assert.rejects(source.getPublishedPackages(), /seed fallback is disabled/);
    await assert.rejects(source.getPublishedBlogPosts(), /seed fallback is disabled/);
  }
  await assert.rejects(content({ collection: () => ({ get: async () => ({ docs: [] }) }) }).getPublishedPackages(), /seed fallback is disabled/);
});

test('a healthy initialized catalogue preserves CMS order, timestamps and publication state', async () => {
  const timestamp = '2026-09-15T00:00:00Z';
  const source = content({ collection: () => ({ get: async () => ({ docs: [
    { id: '_catalog' },
    { id: 'last', data: () => ({ position: 2, package: { title: 'Last holiday' }, updatedAt: { toDate: () => new Date(timestamp) } }) },
    { id: 'first', data: () => ({ position: 1, package: { title: 'First holiday', status: 'published' } }) },
    { id: 'private', data: () => ({ position: 0, package: { title: 'Private draft', status: 'draft' } }) },
  ] }) }) });
  assert.deepEqual(Array.from(await source.getPublishedPackages(), pkg => pkg.id), ['first', 'last']);
  assert.equal((await source.getPackageUpdateTimes()).get('last').toISOString(), new Date(timestamp).toISOString());
});

test('CMS revalidation rejects guests and another origin, then immediately expires content for admins', async () => {
  let authorized = false;
  const events = [];
  const route = load('src/app/api/admin/revalidate-content/route.ts', {
    'next/cache': { revalidateTag: (...args) => events.push(['tag', ...args]), revalidatePath: (...args) => events.push(['path', ...args]) },
    '@/lib/adminApiGuard': { isFirebaseAdmin: async () => authorized, notFound: () => new Response(null, { status: 404 }) },
  });
  const req = origin => new Request('https://example.com/api/admin/revalidate-content', { method: 'POST', headers: { origin } });
  assert.equal((await route.POST(req('https://example.com'))).status, 404);
  authorized = true;
  assert.equal((await route.POST(req('https://other.example'))).status, 404);
  assert.equal(events.length, 0);
  const response = await route.POST(req('https://example.com'));
  assert.equal(response.status, 200);
  assert.match(response.headers.get('cache-control'), /private.*no-store/);
  assert.deepEqual(JSON.parse(JSON.stringify(events)), [['tag', 'public-content', { expire: 0 }], ['path', '/', 'layout'], ['path', '/sitemap.xml']]);
});

test('public content endpoint reports an outage without returning fallback or private content', async () => {
  const route = load('src/app/api/content/route.ts', {
    '@/lib/serverContent': { getPublishedPackages: async () => { throw new Error('private operational detail'); }, getPublishedBlogPosts: async () => [] },
  });
  const response = await route.GET();
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.doesNotMatch(await response.text(), /private operational detail/);
});

test('server maintenance status exposes only the switch and does not mask database errors', async () => {
  for (const mode of [true, false, 'offline']) {
    const route = load('src/app/api/content/status/route.ts', {
      '@/lib/firebase/admin': { getAdminDb: () => ({ collection: () => ({ doc: () => ({ get: async () => {
        if (mode === 'offline') throw new Error('private database detail');
        return { data: () => ({ content: { comingSoon: { enabled: mode }, privateEditorData: 'not public' } }) };
      } }) }) }) },
    });
    const response = await route.GET();
    assert.equal(response.status, mode === 'offline' ? 503 : 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const body = await response.json();
    if (mode !== 'offline') assert.deepEqual(body, { enabled: mode });
    assert.doesNotMatch(JSON.stringify(body), /not public|private database detail/);
  }
});

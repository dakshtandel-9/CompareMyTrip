import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const location = (name, title = 'CompareMyTrip') => ({ name, title, address: 'Bengaluru', averageRating: 0, totalReviewCount: 0 });
const business = location('accounts/2/locations/22');
const review = (id, extra = {}) => ({ reviewId: id, comment: `Review ${id}`, starRating: 'FIVE', createTime: '2026-09-01T00:00:00Z', reviewer: { displayName: `Traveller ${id}` }, ...extra });
function harness({ integration = {}, published, fetcher = () => { throw new Error('Unexpected request'); }, admin = true, env = {} } = {}) {
  const records = new Map([['integrations/googleBusiness', integration]]);
  if (published) records.set('siteContent/googleReviews', published);
  const writes = [];
  const ref = key => ({ key, async get() { return { exists: records.has(key), data: () => records.get(key) }; }, async set(value, options) { records.set(key, options?.merge ? { ...records.get(key), ...value } : value); writes.push(key); } });
  const batch = () => ({ set(r, value, options) { r.set(value, options); return this; }, delete(r) { records.delete(r.key); return this; }, async commit() {} });
  const db = { collection: collection => ({ doc: id => ref(`${collection}/${id}`) }), batch, async runTransaction(fn) { return fn({ ...batch(), get: r => r.get() }); } };
  const modules = new Map();
  const calls = [];
  function load(file) {
    if (modules.has(file)) return modules.get(file);
    const exports = {};
    modules.set(file, exports);
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    vm.runInNewContext(code, { exports, URLSearchParams, URL, Date, Buffer, Request, Response, process: { env }, fetch: async (url, options) => {
      calls.push({ url, options });
      if (url === 'https://oauth2.googleapis.com/token') return Response.json({ access_token: 'test-access-token' });
      return fetcher(new URL(url), options);
    }, require(name) {
      if (name === 'server-only') return {};
      if (name === '@/lib/firebase/admin') return { getAdminDb: () => db };
      if (name === '@/lib/serverAdminGuard') return { isFirebaseAdmin: async () => admin, notFound: () => new Response(null, { status: 404 }) };
      if (name === 'node:crypto') return { timingSafeEqual: (a, b) => a.equals(b) };
      assert.ok(name.startsWith('@/lib/'), `Unexpected import ${name}`);
      return load(`src/${name.slice(2)}.ts`);
    } });
    return exports;
  }
  return { load, calls, records, writes, server: load('src/lib/googleBusinessServer.ts'), shared: load('src/lib/googleBusiness.ts') };
}
const connected = () => ({ clientId: 'test-client', clientSecret: 'test-secret', refreshToken: 'test-refresh', selectedLocation: business.name, locations: [business, location('accounts/1/locations/11', 'Other business')] });

test('discovers businesses across paginated accounts and paginated locations', async () => {
  const h = harness({ integration: connected(), fetcher(url) {
    if (url.pathname === '/v1/accounts') return Response.json(url.searchParams.has('pageToken') ? { accounts: [{ name: 'accounts/2' }] } : { accounts: [{ name: 'accounts/1' }], nextPageToken: 'account-page-2' });
    if (url.pathname === '/v1/accounts/1/locations') return Response.json(url.searchParams.has('pageToken') ? { locations: [{ name: 'locations/12', title: 'Second' }] } : { locations: [{ name: 'locations/11', title: 'First' }], nextPageToken: 'location-page-2' });
    if (url.pathname === '/v1/accounts/2/locations') return Response.json({ locations: [{ name: 'locations/22', title: 'CompareMyTrip' }] });
    throw new Error(url.toString());
  } });
  const found = await h.server.discoverGoogleLocations();
  assert.deepEqual(Array.from(found, x => x.name), ['accounts/1/locations/11', 'accounts/1/locations/12', business.name]);
  assert.equal(h.records.has('siteContent/googleReviews'), false);
});

test('syncs only the chosen business, follows review pages, preserves newest-first API order and true totals', async () => {
  const h = harness({ integration: connected(), fetcher(url) {
    assert.equal(url.pathname, '/v4/accounts/2/locations/22/reviews');
    assert.equal(url.searchParams.get('orderBy'), 'updateTime desc');
    return Response.json(url.searchParams.has('pageToken') ? { reviews: [review('older', { createTime: '2025-12-01T00:00:00Z' })], averageRating: 4.9, totalReviewCount: 52 } : { reviews: [review('newer'), review('stars-only', { comment: '' })], averageRating: 4.9, totalReviewCount: 52, nextPageToken: 'next' });
  } });
  const result = await h.server.syncGoogleReviews(business.name);
  assert.equal(result.count, 2);
  const stored = h.records.get('siteContent/googleReviews');
  assert.deepEqual(Array.from(stored.items, item => item.id), ['google-newer', 'google-older']);
  assert.equal(result.locations.find(x => x.name === business.name).totalReviewCount, 52);
  assert.equal(Date.parse(stored.expiresAt) - Date.parse(stored.syncedAt), 29 * 86400000);
  assert.equal(JSON.stringify(stored).includes('test-secret'), false);
});

test('rejects arbitrary or missing location before requesting Google or publishing', async () => {
  const h = harness({ integration: { ...connected(), selectedLocation: '' } });
  await assert.rejects(h.server.syncGoogleReviews('accounts/9/locations/9'), /select CompareMyTrip/);
  await assert.rejects(h.server.syncGoogleReviews(), /select CompareMyTrip/);
  assert.equal(h.calls.length, 0);
  assert.equal(h.writes.length, 0);
});

test('caps display cache at 100 and removes duplicate review IDs across pages', async () => {
  let page = 0;
  const h = harness({ integration: connected(), fetcher() {
    page++;
    const reviews = Array.from({ length: 50 }, (_, i) => review(String((page - 1) * 49 + i)));
    return Response.json({ reviews, nextPageToken: `page-${page + 1}` });
  } });
  const result = await h.server.syncGoogleReviews();
  assert.equal(result.count, 100);
  assert.equal(page, 3);
  assert.equal(new Set(h.records.get('siteContent/googleReviews').items.map(x => x.id)).size, 100);
});

for (const status of [403, 429]) test(`${status} is not automatically described as missing Google approval`, async () => {
  const h = harness({ integration: connected(), fetcher: () => Response.json({ error: { message: status === 403 ? 'API disabled' : 'Rate limit exceeded' } }, { status }) });
  await assert.rejects(h.server.discoverGoogleLocations(), error => !(error instanceof h.server.NotApprovedError));
  assert.equal(h.records.has('siteContent/googleReviews'), false);
});

test('explicit zero quota is recognized separately', async () => {
  const h = harness({ integration: connected(), fetcher: () => Response.json({ error: { message: 'Quota exceeded: limit value: 0 requests per minute' } }, { status: 429 }) });
  await assert.rejects(h.server.discoverGoogleLocations(), h.server.NotApprovedError);
});

test('disconnect removes imported content and credentials', async () => {
  const h = harness({ integration: connected(), published: { items: [review('old')] } });
  await h.server.clearIntegration();
  assert.equal(h.records.has('siteContent/googleReviews'), false);
  assert.equal(h.records.get('integrations/googleBusiness').refreshToken, '');
});

test('expiry cleanup removes stale and undated imports but keeps fresh imports', async () => {
  for (const expiresAt of [undefined, 'bad-date', '2020-01-01T00:00:00Z', new Date(Date.now() + 86400000).toISOString()]) {
    const h = harness({ published: { expiresAt, items: [] } });
    await h.server.removeExpiredGoogleReviews();
    assert.equal(h.records.has('siteContent/googleReviews'), Date.parse(expiresAt) > Date.now());
  }
});

test('mapping preserves comment text and anonymous reviewer privacy, and does not invent stars', () => {
  const h = harness();
  const mapped = h.shared.toReview(review('one', { comment: ' Exact comment. ', reviewer: { isAnonymous: true, displayName: 'Private', profilePhotoUrl: 'private-photo' } }), 'CompareMyTrip');
  assert.equal(mapped.quote, ' Exact comment. ');
  assert.equal(mapped.name, 'A Google reviewer');
  assert.equal(mapped.avatar, '');
  assert.match(mapped.trip, /Google review/);
  assert.equal(h.shared.toReview(review('bad', { starRating: 'UNKNOWN' }), 'CompareMyTrip'), null);
  assert.equal(h.shared.mergeReviews([{ id: 'a' }], [{ id: 'a' }, { id: 'b' }, { id: 'b' }]).length, 2);
});

test('admin endpoints refuse unauthenticated callers without accessing Google', async () => {
  const h = harness({ admin: false });
  for (const route of ['locations', 'sync']) {
    const response = await h.load(`src/app/api/integrations/google-business/${route}/route.ts`).POST(new Request('http://localhost/api', { method: 'POST' }));
    assert.equal(response.status, 404);
  }
  assert.equal(h.calls.length, 0);
});

test('scheduled sync requires the cron secret and skips fresh imports', async () => {
  const h = harness({ integration: { ...connected(), lastSyncedAt: new Date().toISOString() }, env: { CRON_SECRET: 'test-cron-secret' } });
  const route = h.load('src/app/api/cron/google-reviews/route.ts');
  assert.equal((await route.GET(new Request('http://localhost/cron'))).status, 401);
  assert.equal((await route.GET(new Request('http://localhost/cron', { headers: { Authorization: 'Bearer test-cron-secret' } }))).status, 200);
  assert.equal(h.calls.length, 0);
});

test('local OAuth callback override is separate from the canonical public site URL', () => {
  const h = harness({ env: { NEXT_PUBLIC_SITE_URL: 'https://comparemytrip.in', GOOGLE_BUSINESS_REDIRECT_URI: 'http://localhost:3000/api/integrations/google-business/callback' } });
  const url = new URL(h.server.consentUrl('test-client', 'test-state'));
  assert.equal(url.searchParams.get('redirect_uri'), 'http://localhost:3000/api/integrations/google-business/callback');
  assert.equal(url.searchParams.get('scope'), 'https://www.googleapis.com/auth/business.manage');
});

// Google reports zero quota in ErrorInfo metadata, not necessarily its message.
test('structured zero-quota details trigger approval guidance without misclassifying ordinary throttling', async () => {
  for (const value of ['0', 0, '300', undefined]) {
    const h = harness({ integration: connected(), fetcher: () => Response.json({ error: {
      message: 'Quota exceeded for metric Requests',
      details: [{ metadata: { quota_limit_value: value } }],
    } }, { status: 429 }) });
    await assert.rejects(h.server.discoverGoogleLocations(), error =>
      (error instanceof h.server.NotApprovedError) === (value === '0' || value === 0));
  }
});

import assert from 'node:assert/strict';
const base = process.env.SMOKE_BASE_URL || 'http://localhost:3100';
const maintenance = process.argv.includes('--maintenance');
const catalogue = ['/packages', '/destinations'];
const missingPages = ['/packages/missing-audit-resource', '/destinations/missing-audit-resource', '/blog/missing-audit-resource', '/home1', '/home2', '/home3', '/home4'];
const publicPages = ['/compare', '/blog', '/contact', '/add-on', '/packages/tadiandamol-trek'];
let count = 0;
async function request(path, status = 200, init = {}) {
  const res = await fetch(new URL(path, base), { ...init, redirect: 'manual', signal: AbortSignal.timeout(30_000) });
  assert.equal(res.status, status, `${path}: status`);
  count++;
  return res;
}
async function get(path, status = 200) {
  const res = await request(path, status);
  return { res, html: await res.text() };
}
const { res: home, html } = await get(maintenance ? '/coming-soon' : '/');
for (const header of ['strict-transport-security','x-frame-options','x-content-type-options','referrer-policy','permissions-policy','content-security-policy']) assert.ok(home.headers.get(header), header);
assert.match(html, /<h1/);
if (maintenance) {
  assert.match(html, /noindex/, 'coming-soon page should not be indexed');
  assert.match(html, /<header[\s\S]*href="\/admin\/content"[\s\S]*Admin sign in[\s\S]*<\/header>/, 'admin sign-in must be visible in the coming-soon header');
  for (const path of ['/', ...catalogue, '/signup', ...missingPages, ...publicPages]) {
    const { res } = await get(path, 307);
    const destination = new URL(res.headers.get('location'), base);
    assert.equal(destination.origin, new URL(base).origin, `${path}: same-origin maintenance redirect`);
    assert.equal(destination.pathname, '/coming-soon', `${path}: maintenance redirect`);
    assert.equal(destination.search, '', `${path}: maintenance redirect query`);
    assert.match(res.headers.get('cache-control') || '', /no-store/, `${path}: maintenance redirect must not be cached`);
  }
  for (const path of ['/account', '/checkout/status', '/pay/status']) await get(path);
} else {
  assert.match(html, /<link[^>]*rel="preload"[^>]*as="image"/);
  for (const path of catalogue) {
    const { res, html } = await get(path);
    assert.match(res.headers.get('cache-control') || '', /s-maxage=/, `${path} should be cacheable`);
    assert.match(html, new RegExp(`https://comparemytrip.in${path}`));
    assert.match(html, /<h1/, `${path} server heading`);
    assert.match(html, /<main/, `${path} server content`);
  }
}
for (const path of maintenance ? ['/login', '/forgot-password'] : ['/login', '/signup', '/forgot-password']) {
  const {html} = await get(path);
  assert.match(html, /<h1/, `${path} server heading`);
  assert.match(html, /<input/, `${path} server form`);
}
for (const path of ['/admin', '/admin/content', '/login?next=%2Fadmin%2Fcontent', '/forgot-password?next=%2Fadmin%2Fcontent']) {
  const { html } = await get(path);
  assert.match(html, /noindex/, `${path}: admin/auth pages should not be indexed`);
  if (path.startsWith('/admin')) {
    assert.match(html, /Checking admin access/, `${path}: admin gate is reachable`);
    assert.doesNotMatch(html, /id="complete-profile-title"/, `${path}: no customer onboarding`);
  } else {
    assert.match(html, /<input/, `${path}: sign-in/reset form remains reachable`);
  }
}
for (const path of ['/terms','/privacy','/refund-policy']) {
  const {html} = await get(path);
  assert.match(html, /Draft for review/);
  assert.match(html, /noindex/);
}
const sitemap = (await get('/sitemap.xml')).html;
assert.doesNotMatch(sitemap, /<loc>[^<]*\/(terms|privacy|refund-policy)<\/loc>/);
if (!maintenance) {
  for (const path of missingPages) await get(path,404);
  for (const path of publicPages) await get(path);
}
await get('/api/cron/quote-cleanup',401);
await get('/api/cron/pending-payments',401);
await get('/api/integrations/google-business',404);
await get('/api/admin/payment-reports',404);
await get('/api/account/payment-reports',401);
// An anonymous request must be refused before reading or mutating any records.
for (const [path, status] of [
  ['/api/uploads/image', 404],
  ['/api/account/payments/missing-smoke-resource', 401],
]) {
  const res = await request(path, status, { method: 'POST' });
  await res.body?.cancel();
}
for (const [device, budget] of [['desktop', 6_000_000], ['mobile', 3_000_000]]) {
  const path = `/videos/hero-scroll-${device}-v2.mp4`;
  const assertVideoHeaders = res => {
    assert.match(res.headers.get('content-type') || '', /^video\/mp4\b/i, `${path}: MP4 content type`);
    const cache = res.headers.get('cache-control') || '';
    assert.match(cache, /(?:^|,)\s*public\s*(?:,|$)/i, `${path}: public cache`);
    assert.match(cache, /(?:^|,)\s*max-age=31536000\s*(?:,|$)/i, `${path}: one-year cache`);
    assert.match(cache, /(?:^|,)\s*immutable\s*(?:,|$)/i, `${path}: immutable cache`);
  };
  const video = await request(path);
  try {
    assertVideoHeaders(video);
    const size = Number(video.headers.get('content-length'));
    assert.ok(size > 32 && size <= budget, `${path}: rendition exceeds ${budget} byte budget or omits content length`);
  } finally {
    // Header validation does not need to download the whole video again.
    await video.body?.cancel();
  }
  const range = await request(path, 206, { headers: { range: 'bytes=0-31' } });
  assertVideoHeaders(range);
  assert.match(range.headers.get('content-range') || '', /^bytes 0-31\/\d+$/, `${path}: byte range`);
  const bytes = new Uint8Array(await range.arrayBuffer());
  assert.equal(bytes.length, 32, `${path}: range length`);
  assert.equal(new TextDecoder().decode(bytes.slice(4, 8)), 'ftyp', `${path}: MP4 file signature`);
}
if (process.env.SMOKE_DATABASE === '1') {
  const response = await fetch(new URL('/api/coupons/validate', base), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ packageId: 'tadiandamol-trek', travellers: '2', code: 'CMT_AUDIT_NONEXISTENT' }),
    signal: AbortSignal.timeout(30_000),
  });
  assert.equal(response.status, 200, 'Firestore coupon read');
  assert.deepEqual(await response.json(), { ok: false, message: "We don't recognise that code." });
  count++;
}
console.log(`${count} ${maintenance ? 'maintenance-mode' : 'full-site'} HTTP smoke checks passed against ${base}. No records or payments were created.`);

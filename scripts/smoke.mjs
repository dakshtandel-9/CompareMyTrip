import assert from 'node:assert/strict';
const base = process.env.SMOKE_BASE_URL || 'http://localhost:3100';
let count = 0;
async function get(path, status = 200) {
  const res = await fetch(new URL(path, base), { redirect: 'manual', signal: AbortSignal.timeout(30_000) });
  assert.equal(res.status, status, `${path}: status`);
  count++;
  return { res, html: await res.text() };
}
const { res: home, html } = await get('/');
for (const header of ['strict-transport-security','x-frame-options','x-content-type-options','referrer-policy','permissions-policy','content-security-policy']) assert.ok(home.headers.get(header), header);
assert.match(html, /<link[^>]*rel="preload"[^>]*as="image"/);
assert.match(html, /<h1/);
for (const path of ['/packages','/destinations']) {
  const { res, html } = await get(path);
  assert.match(res.headers.get('cache-control') || '', /s-maxage=/, `${path} should be cacheable`);
  assert.match(html, new RegExp(`https://comparemytrip.in${path}`));
  assert.match(html, /<h1/, `${path} server heading`);
  assert.match(html, /<main/, `${path} server content`);
}
for (const path of ['/login','/signup','/forgot-password']) {
  const {html} = await get(path);
  assert.match(html, /<h1/, `${path} server heading`);
  assert.match(html, /<input/, `${path} server form`);
}
for (const path of ['/terms','/privacy','/refund-policy']) {
  const {html} = await get(path);
  assert.match(html, /Draft for review/);
  assert.match(html, /noindex/);
}
const sitemap = (await get('/sitemap.xml')).html;
assert.doesNotMatch(sitemap, /<loc>[^<]*\/(terms|privacy|refund-policy)<\/loc>/);
for (const path of ['/packages/missing-audit-resource','/destinations/missing-audit-resource','/blog/missing-audit-resource','/home1','/home2','/home3','/home4']) await get(path,404);
for (const path of ['/compare','/blog','/contact','/add-on','/packages/tadiandamol-trek']) await get(path);
await get('/api/cron/quote-cleanup',401);
await get('/api/integrations/google-business',404);
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
console.log(`${count} HTTP smoke checks passed against ${base}. No records or payments were created.`);

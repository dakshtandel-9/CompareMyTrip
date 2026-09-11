import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);
function load(file, mocks = {}, env = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports, require: id => id in mocks ? mocks[id] : require(id), process: { env }, URL, console });
  return exports;
}
const seo = load('src/lib/seo.ts', {}, { NODE_ENV: 'production', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000' });
const payuMocks = { '@/lib/packageData': { DUMMY_PACKAGES: [] }, '@/lib/seo': seo, '@/lib/legalPolicies': { LEGAL_POLICIES_APPROVED: false } };
const payu = load('src/lib/payu.ts', payuMocks);
const input = { key: 'merchant', salt: 'secret', txnid: 'CMT123', amount: '5498.00', productinfo: 'Trek', firstname: 'Test', email: 'test@example.com', udf: ['p1','2','','',''] };
const digest = value => createHash('sha512').update(value).digest('hex');
test('PayU request hash matches independently specified field order including empty fields', () => {
  assert.equal(payu.buildRequestHash(input), digest('merchant|CMT123|5498.00|Trek|Test|test@example.com|p1|2|||||||||secret'));
  assert.notEqual(payu.buildRequestHash(input), payu.buildRequestHash({ ...input, amount: '1.00' }));
});
test('PayU callback hash supports additional charges and rejects tampered responses', () => {
  const base = 'secret|success|||||||||2|p1|test@example.com|Test|Trek|5498.00|CMT123|merchant';
  const hash = payu.buildResponseHash({ ...input, status: 'success' });
  assert.equal(hash, digest(base));
  assert.equal(payu.buildResponseHash({ ...input, status: 'success', additionalCharges: '10.00' }), digest('10.00|' + base));
  assert.equal(payu.hashesMatch(hash, hash), true);
  assert.equal(payu.hashesMatch(hash, payu.buildResponseHash({ ...input, status: 'failure' })), false);
  assert.equal(payu.hashesMatch(hash, hash.slice(1)), false);
});
test('server pricing clamps counts and discounts to a positive gateway amount', () => {
  assert.equal(payu.priceOrder({ price: 2749 }, 2).amount, '5498.00');
  assert.equal(payu.priceOrder({ price: 2749 }, 2, 999999).amount, '1.00');
  assert.equal(payu.priceOrder({ price: 2749 }, -2, -1).amount, '2749.00');
  assert.equal(payu.normaliseTravellers(9999), 20);
  assert.equal(payu.normaliseTravellers('bad'), 1);
});
test('production callbacks ignore localhost configuration and spoofed forwarded hosts', () => {
  const prod = load('src/lib/payu.ts', payuMocks, { NODE_ENV: 'production' });
  assert.equal(prod.siteOrigin(new Request('http://localhost:3100/api/payu/initiate', { headers: { 'x-forwarded-host': 'attacker.example' } })), 'https://comparemytrip.in');
});
test('sandbox remains available but live payments require approved policies and explicit enablement', () => {
  const env = { NODE_ENV: 'production', PAYU_MERCHANT_KEY: 'test', PAYU_SALT: 'test', PAYU_MODE: 'test' };
  assert.equal(load('src/lib/payu.ts', payuMocks, env).getPayuConfig().endpoint, 'https://test.payu.in/_payment');
  assert.equal(load('src/lib/payu.ts', payuMocks, { ...env, PAYU_MODE: 'live' }).getPayuConfig(), null);
});
const coupons = load('src/lib/coupons.ts');
const coupon = { ...coupons.BLANK_COUPON, code: 'SAVE', perUserLimit: 0, percentOff: 20, maxDiscount: 500 };
const context = { subtotal: 5000, packageId: 'p1', today: '2026-09-11', isFirstBooking: true, timesUsedByUser: 0, timesUsedTotal: 0 };
test('coupon percentage caps and minimum payable amount are enforced', () => {
  assert.equal(coupons.discountFor(coupon, 5000), 500);
  assert.equal(coupons.discountFor({ ...coupon, type: 'flat', flatOff: 99999 }, 5000), 4999);
});
test('coupon eligibility rejects expired, restricted, exhausted and repeat-use offers', () => {
  for (const changes of [{ active: false }, { endsOn: '2026-09-10' }, { startsOn: '2026-09-12' }, { packageIds: ['other'] }, { minOrderValue: 6000 }]) {
    assert.equal(coupons.checkCoupon({ ...coupon, ...changes }, context).ok, false);
  }
  assert.equal(coupons.checkCoupon({ ...coupon, usageLimit: 1 }, { ...context, timesUsedTotal: 1 }).ok, false);
  assert.equal(coupons.checkCoupon({ ...coupon, perUserLimit: 1 }, { ...context, timesUsedByUser: 1 }).ok, false);
  assert.equal(coupons.checkCoupon({ ...coupon, firstBookingOnly: true }, { ...context, isFirstBooking: false }).ok, false);
});
function resolver(overrides = {}) {
  return load('src/lib/couponServer.ts', {
    '@/lib/coupons': coupons,
    '@/lib/firebase/serverCoupons': {
      fetchCoupon: async () => coupon, fetchAutoCoupons: async () => [],
      countCouponUses: async () => ({ total: 0, byUser: 0 }), isFirstBooking: async () => true,
      ...overrides,
    },
  }).resolveCoupon;
}
const order = { requestedCode: 'SAVE', subtotal: 5000, packageId: 'p1', identity: { userId: 'u1', email: 'test@example.com' } };
test('resolveCoupon refuses unknown codes and applies eligible explicit codes', async () => {
  assert.equal((await resolver()(order)).applied.discount, 500);
  const missing = await resolver({ fetchCoupon: async () => null })(order);
  assert.equal(missing.applied, null);
  assert.ok(missing.error);
});
test('resolveCoupon selects the greatest eligible auto discount without stacking', async () => {
  const resolve = resolver({ fetchAutoCoupons: async () => [coupon, { ...coupon, code: 'BEST', maxDiscount: 800 }, { ...coupon, code: 'DISABLED', active: false, maxDiscount: 900 }] });
  const result = await resolve({ ...order, requestedCode: '' });
  assert.equal(result.applied.code, 'BEST');
  assert.equal(result.applied.discount, 800);
  assert.equal(result.applied.auto, true);
});

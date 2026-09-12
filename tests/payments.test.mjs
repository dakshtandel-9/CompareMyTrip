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
test('development payment returns stay on the checkout origin despite the public site setting', () => {
  const dev = load('src/lib/payu.ts', payuMocks, {
    NODE_ENV: 'development', NEXT_PUBLIC_SITE_URL: 'https://comparemytrip.in',
  });
  for (const origin of ['http://localhost:3000', 'http://127.0.0.1:3100', 'https://checkout-preview.example']) {
    assert.equal(dev.siteOrigin(new Request(`${origin}/api/payu/initiate`)), origin);
  }
});

function paymentRoutes(env = {}) {
  const payment = load('src/lib/payu.ts', payuMocks, {
    NODE_ENV: 'development', NEXT_PUBLIC_SITE_URL: 'https://comparemytrip.in',
    PAYU_MERCHANT_KEY: input.key, PAYU_SALT: input.salt, ...env,
  });
  const settled = [];
  const pending = [];
  const mocks = {
    '@/lib/payu': { ...payment, resolvePackage: () => ({ id: 'p1', title: 'Trek', price: 2749 }) },
    '@/lib/firebase/serverTrips': {
      settleTrip: async value => { settled.push(value); },
      createPendingTrip: async value => { pending.push(value); },
    },
    '@/lib/firebase/admin': { uidFromIdToken: async () => '' },
    '@/lib/couponServer': { resolveCoupon: async () => ({ applied: null, error: '' }) },
    '@/lib/packageData': { isDepartureAllowed: () => true },
    '@/lib/coupons': { normaliseCode: value => value },
  };
  return {
    callback: load('src/app/api/payu/callback/route.ts', mocks),
    initiate: load('src/app/api/payu/initiate/route.ts', mocks),
    settled, pending,
  };
}

test('initiate sends both PayU return URLs to the local checkout server', async () => {
  const { initiate, pending } = paymentRoutes();
  const response = await initiate.POST(new Request('http://localhost:3100/api/payu/initiate', {
    method: 'POST', body: new URLSearchParams({
      packageId: 'p1', travellers: '2', firstname: input.firstname,
      email: input.email, phone: '9999999999',
    }),
  }));
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /action="https:\/\/test.payu.in\/_payment"/);
  for (const field of ['surl', 'furl']) {
    assert.ok(html.includes(`name="${field}" value="http://localhost:3100/api/payu/callback"`));
  }
  assert.equal(pending.length, 1);
});

for (const [gatewayStatus, state, savedStatus] of [
  ['success', 'success', 'successful'], ['failure', 'failed', 'failed'],
]) {
  test(`verified ${gatewayStatus} callback settles the trip and redirects locally with GET`, async () => {
    const { callback, settled } = paymentRoutes();
    const body = new URLSearchParams({
      key: input.key, txnid: input.txnid, amount: input.amount,
      productinfo: input.productinfo, firstname: input.firstname, email: input.email,
      udf1: 'p1', udf2: '2', status: gatewayStatus,
      hash: payu.buildResponseHash({ ...input, status: gatewayStatus }),
    });
    const response = await callback.POST(new Request('http://localhost:3100/api/payu/callback', { method: 'POST', body }));
    assert.equal(response.status, 303);
    const destination = new URL(response.headers.get('location'));
    assert.equal(destination.origin, 'http://localhost:3100');
    assert.equal(destination.pathname, '/checkout/status');
    assert.equal(destination.searchParams.get('state'), state);
    assert.equal(destination.searchParams.get('txnid'), input.txnid);
    assert.equal(destination.searchParams.get('amount'), input.amount);
    assert.equal(settled.length, 1);
    assert.equal(settled[0].paymentStatus, savedStatus);
  });
}

test('invalid callbacks stay local and cannot settle a payment', async () => {
  const { callback, settled } = paymentRoutes();
  const response = await callback.POST(new Request('http://localhost:3100/api/payu/callback', {
    method: 'POST', body: new URLSearchParams({ status: 'success', hash: 'invalid' }),
  }));
  assert.equal(response.status, 303);
  assert.equal(response.headers.get('location'), 'http://localhost:3100/checkout/status?state=error&reason=hash-mismatch');
  const probe = await callback.GET(new Request('http://localhost:3100/api/payu/callback'));
  assert.equal(probe.headers.get('location'), 'http://localhost:3100/checkout/status?state=error&reason=no-result');
  assert.equal(settled.length, 0);
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

test('a verified pending callback leaves the booking pending for later reconciliation', async () => {
  const { callback, settled } = paymentRoutes();
  const body = new URLSearchParams({
    key: input.key, txnid: input.txnid, amount: input.amount,
    productinfo: input.productinfo, firstname: input.firstname, email: input.email,
    udf1: 'p1', udf2: '2', status: 'pending',
    hash: payu.buildResponseHash({ ...input, status: 'pending' }),
  });
  const response = await callback.POST(new Request('http://localhost:3100/api/payu/callback', { method: 'POST', body }));
  assert.equal(new URL(response.headers.get('location')).searchParams.get('state'), 'pending');
  assert.equal(settled.length, 0);
});

test('signed retry callbacks settle the original booking and carry ownership for late recovery', async () => {
  const { callback, settled } = paymentRoutes();
  const retry = { ...input, txnid: 'RETRY123', udf: ['p1', '2', '', 'CMT123', 'owner'] };
  const body = new URLSearchParams({ key: retry.key, txnid: retry.txnid, amount: retry.amount,
    productinfo: retry.productinfo, firstname: retry.firstname, email: retry.email,
    udf1: 'p1', udf2: '2', udf4: 'CMT123', udf5: 'owner', status: 'success',
    hash: payu.buildResponseHash({ ...retry, status: 'success' }),
  });
  await callback.POST(new Request('http://localhost:3100/api/payu/callback', { method: 'POST', body }));
  assert.equal(settled[0].tripId, 'CMT123');
  assert.equal(settled[0].txnid, 'RETRY123');
  assert.equal(settled[0].recovery.userId, 'owner');
});

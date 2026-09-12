import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
function load(file, mocks = {}, env = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports, require: id => id in mocks ? mocks[id] : require(id), process: { env }, URL, console });
  return exports;
}
const custom = load('src/lib/customPayment.ts');
const payu = load('src/lib/payu.ts', {
  '@/lib/packageData': { DUMMY_PACKAGES: [] }, '@/lib/seo': { getSiteUrl: () => new URL('https://comparemytrip.in') },
  '@/lib/legalPolicies': { LEGAL_POLICIES_APPROVED: false },
}, { PAYU_MERCHANT_KEY: 'test-key', PAYU_SALT: 'test-secret', NODE_ENV: 'development' });
const id = 'CMTTEST123456789';
const details = { amount: '1250.50', firstname: 'Test Traveller', email: 'test@example.com', phone: '+91 99999 99999', reference: 'Kerala advance', agreed: 'yes' };
function routes({ storage = true, record = {}, configured = true } = {}) {
  const saved = [], settled = [];
  const mocks = {
    '@/lib/customPayment': custom,
    '@/lib/payu': { ...payu, newTransactionId: () => id, ...(configured ? {} : { getPayuConfig: () => null }) },
    '@/lib/firebase/serverTrips': {
      createPendingTrip: async value => { if (storage === 'throw') throw new Error('offline'); if (!storage) return false; saved.push(value); return true; },
      settleTrip: async value => { settled.push(value); },
    },
    '@/lib/firebase/admin': { uidFromIdToken: async token => token === 'valid-token' ? 'customer-123' : '', getAdminDb: () => ({ collection: () => ({ doc: () => ({ get: async () => ({ data: () => ({ paymentKind: 'custom', payuEnvironment: 'test', ...record }) }) }) }) }) },
  };
  return { saved, settled, initiate: load('src/app/api/payu/custom/route.ts', mocks), callback: load('src/app/api/payu/custom/callback/route.ts', mocks) };
}
const initiateRequest = (changes = {}) => new Request('http://localhost:3000/api/payu/custom', { method: 'POST', body: new URLSearchParams({ ...details, ...changes }) });
function callbackRequest(changes = {}, tamper = {}) {
  const fields = { key: 'test-key', txnid: id, amount: '1250.50', firstname: details.firstname, email: details.email, productinfo: 'Custom payment — Kerala advance', status: 'success', udf1: 'custom-payment', udf2: '0', udf3: '', udf4: id, udf5: '', mihpayid: 'PAYU1', ...changes };
  fields.hash = payu.buildResponseHash({ ...fields, salt: 'test-secret', udf: [fields.udf1, fields.udf2, fields.udf3, fields.udf4, fields.udf5] });
  return new Request('http://localhost:3000/api/payu/custom/callback', { method: 'POST', body: new URLSearchParams({ ...fields, ...tamper }) });
}

test('custom amounts accept exact paise and reject rounding, signs, exponents and out-of-range values', () => {
  for (const [input, output] of [['1', '1.00'], ['1250.50', '1250.50'], ['1000000', '1000000.00'], [' 25.1 ', '25.10']]) assert.equal(custom.parseCustomAmount(input), output);
  for (const input of ['', '0', '-1', '0.99', '1.001', '1e3', 'Infinity', 'NaN', '+100', '1,000', '1000000.01']) assert.equal(custom.parseCustomAmount(input), null, input);
});
test('initiation records a separate custom payment and signs the exact amount before redirecting', async () => {
  const app = routes();
  const response = await app.initiate.POST(initiateRequest({ packageId: 'existing-booking', txnid: 'OTHER' }));
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /name="amount" value="1250.50"/);
  assert.match(html, /name="txnid" value="CMTTEST123456789"/);
  assert.match(html, /value="http:\/\/localhost:3000\/api\/payu\/custom\/callback"/);
  assert.ok(!html.includes('test-secret'));
  assert.equal(app.saved[0].paymentKind, 'custom');
  assert.equal(app.saved[0].packageId, 'custom-payment');
  assert.equal(app.saved[0].amount, 1250.5);
  assert.equal(app.saved[0].paymentReference, 'Kerala advance');
});
test('bad amount, contact details and missing agreement cannot create a payable record', async () => {
  for (const change of [{ amount: '0' }, { amount: '10.123' }, { email: 'bad' }, { firstname: ' ' }, { phone: '123' }, { phone: '9999999999garbage' }, { agreed: '' }, { reference: 'x'.repeat(121) }]) {
    const app = routes();
    const response = await app.initiate.POST(initiateRequest(change));
    assert.equal(response.status, 303);
    assert.match(response.headers.get('location'), /\/pay\?error=invalid-/);
    assert.equal(app.saved.length, 0);
  }
});
test('missing configuration or storage blocks payment before the gateway handoff', async () => {
  for (const options of [{ configured: false }, { storage: false }, { storage: 'throw' }]) {
    const app = routes(options);
    const response = await app.initiate.POST(initiateRequest());
    assert.equal(response.status, 303);
    assert.match(response.headers.get('location'), /error=(unavailable|storage-unavailable)/);
    assert.equal(app.saved.length, 0);
  }
});
test('HTML in customer input is escaped in the gateway form', async () => {
  const response = await routes().initiate.POST(initiateRequest({ firstname: '<script>alert(1)</script>' }));
  const html = await response.text();
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(!html.includes('<script>alert(1)</script>'));
});
test('verified success and failure settle the custom record; pending remains unconfirmed', async () => {
  for (const status of ['success', 'failure', 'pending']) {
    const app = routes();
    const response = await app.callback.POST(callbackRequest({ status }));
    assert.equal(response.status, 303);
    assert.equal(response.headers.get('location'), `http://localhost:3000/pay/status?txnid=${id}`);
    assert.equal(app.settled.length, status === 'pending' ? 0 : 1);
    if (status !== 'pending') assert.equal(app.settled[0].paymentStatus, status === 'success' ? 'successful' : 'failed');
  }
});
test('tampered amount, signature, merchant and booking identity never settle a payment', async () => {
  for (const [signed, tamper] of [[{}, { amount: '1.00' }], [{}, { hash: 'fake' }], [{ key: 'other' }, {}], [{ udf1: 'package-1' }, {}], [{ udf4: 'OTHER' }, {}]]) {
    const app = routes();
    const response = await app.callback.POST(callbackRequest(signed, tamper));
    assert.equal(app.settled.length, 0);
    assert.equal(response.headers.get('location'), 'http://localhost:3000/pay/status');
  }
  for (const record of [{ paymentKind: 'booking' }, { payuEnvironment: 'live' }]) {
    const app = routes({ record });
    await app.callback.POST(callbackRequest());
    assert.equal(app.settled.length, 0);
  }
});


test('custom payments use verified account identity, never submitted ownership or contact details', async () => {
  const app = routes();
  const response = await app.initiate.POST(initiateRequest({ idToken: 'valid-token', userId: 'someone-else' }));
  assert.equal(response.status, 200);
  assert.equal(app.saved[0].userId, 'customer-123');
  assert.match(await response.text(), /name="udf5" value="customer-123"/);
  const guest = routes();
  await guest.initiate.POST(initiateRequest({ userId: 'someone-else' }));
  assert.equal(guest.saved[0].userId, '');
});

test('invalid authentication stops checkout instead of silently losing the history link', async () => {
  const app = routes();
  const response = await app.initiate.POST(initiateRequest({ idToken: 'forged-token' }));
  assert.equal(response.status, 303);
  assert.match(response.headers.get('location'), /error=session-expired/);
  assert.equal(app.saved.length, 0);
});

const history = load('src/lib/paymentHistory.ts');
test('history never labels unconfirmed or mismatched payments as paid', () => {
  const trip = { paymentStatus: 'pending', tripStatus: 'refunded', amountMismatch: false };
  assert.equal(history.paymentHistoryStatus(trip).label, 'Pending');
  assert.equal(history.paymentHistoryStatus({ ...trip, paymentStatus: 'failed' }).label, 'Failed');
  assert.equal(history.paymentHistoryStatus({ ...trip, paymentStatus: 'successful' }).label, 'Refunded');
  assert.equal(history.paymentHistoryStatus({ ...trip, paymentStatus: 'successful', tripStatus: 'rejected' }).label, 'Paid');
  assert.equal(history.paymentHistoryStatus({ ...trip, paymentStatus: 'successful', amountMismatch: true }).label, 'Under review');
  assert.equal(history.paymentMethodLabel(''), 'Not available');
  assert.equal(history.paymentMethodLabel('upi'), 'UPI');
  assert.equal(history.paymentMethodLabel('CC'), 'Credit card');
  assert.equal(history.paymentMethodLabel('NEW_MODE'), 'NEW_MODE');
});

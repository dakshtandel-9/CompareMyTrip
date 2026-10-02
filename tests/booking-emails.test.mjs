import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(file, dependencies = {}, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, URL, AbortSignal, JSON, console, process: { env: {} }, ...globals, require: (name) => {
    assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`);
    return dependencies[name];
  } });
  return exports;
}

function emails({ env = {}, fetch, db } = {}) {
  const updates = [];
  const store = db ?? { collection: () => ({ doc: id => ({ update: async value => { updates.push([id, value]); } }) }) };
  const quiet = { ...console, warn() {}, error() {} };
  const loaded = load('src/lib/bookingEmails.ts', {
    'firebase-admin/firestore': { FieldValue: { serverTimestamp: () => 'server-time' } },
    './firebase/admin': { getAdminDb: () => store },
    './legalPolicies': load('src/lib/legalPolicies.ts'),
    './customPayment': load('src/lib/customPayment.ts'),
    './seo': { getSiteUrl: () => new URL('https://comparemytrip.in') },
  }, { process: { env }, fetch, console: quiet });
  return { ...loaded, updates };
}

const booking = (extra = {}) => ({
  txnid: 'CMT1', name: 'Priya Sharma', email: 'priya@example.com', phone: '9999999999',
  packageId: 'kurinjal-trek', packageTitle: 'Kurinjal Trek', travellers: 2, perPerson: 4499,
  subtotal: 8998, discount: 500, couponCode: 'SAVE500', amount: 8498, reportedAmount: 8498,
  tripDate: '2026-12-01', payuEnvironment: 'live', payuPaymentId: 'PAYU1', paymentMode: 'UPI',
  amountMismatch: false, ...extra,
});

test('the traveller is told the payment arrived, not that the trip is confirmed', () => {
  const { traveller, ops } = emails().buildBookingEmails('CMT1', booking());
  assert.deepEqual(Array.from(traveller.to), ['priya@example.com']);
  assert.equal(traveller.subject, 'Payment received — Kurinjal Trek (Ref CMT1)');
  for (const body of [traveller.html, traveller.text]) {
    assert.match(body, /Hi Priya/);
    assert.match(body, /₹8,498/);
    assert.match(body, /CMT1/);
    assert.match(body, /PAYU1/);
    assert.match(body, /1 Dec 2026/);
    assert.match(body, /SAVE500 \(−₹500\)/);
    assert.match(body, /confirmed only once you receive that written confirmation/);
    assert.match(body, /support@comparemytrip\.in/);
  }
  assert.deepEqual(Array.from(ops.to), ['support@comparemytrip.in']);
  assert.equal(ops.subject, 'New paid booking: Kurinjal Trek — ₹8,498');
  assert.match(ops.text, /Phone: 9999999999/);
  assert.match(ops.text, /https:\/\/comparemytrip\.in\/admin\/trips/);
  assert.doesNotMatch(ops.text, /CHECK AMOUNT/);
});

test('traveller-supplied text is escaped in the HTML', () => {
  const { traveller, ops } = emails().buildBookingEmails('CMT1', booking({ name: '<img src=x onerror=alert(1)>', packageTitle: 'A & "B"' }));
  assert.doesNotMatch(traveller.html + ops.html, /<img src=x/);
  assert.match(ops.html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(traveller.html, /A &amp; &quot;B&quot;/);
});

test('custom payments, test mode and amount mismatches are labelled for the desk', () => {
  const { traveller, ops } = emails().buildBookingEmails('CMT2', booking({
    packageId: 'custom-payment', paymentKind: 'custom', packageTitle: 'Custom payment — Goa family trip',
    paymentReference: 'Goa family trip', payuEnvironment: 'test', amountMismatch: true, reportedAmount: 100,
    travellers: 0, couponCode: '', discount: 0, tripDate: '',
  }));
  assert.equal(traveller.subject, '[TEST] Payment received — Custom payment — Goa family trip (Ref CMT2)');
  assert.match(traveller.text, /match this payment to your booking/);
  assert.doesNotMatch(traveller.text, /Travellers:|Preferred date:/);
  assert.match(ops.subject, /^\[TEST\] ⚠ CHECK AMOUNT — New custom payment: .* — ₹100$/);
  assert.match(ops.text, /PayU reported ₹100, which does not match the expected ₹8,498/);
  assert.match(ops.text, /Reference given: Goa family trip/);
  assert.match(ops.text, /PayU environment: TEST/);
});

test('a booking without a usable traveller address still notifies the desk', () => {
  const { traveller, ops } = emails().buildBookingEmails('CMT3', booking({ email: '' }));
  assert.equal(traveller, null);
  assert.equal(ops.to.length, 1);
});

test('the desk address can be overridden with a comma-separated list', () => {
  const { ops } = emails({ env: { BOOKING_NOTIFICATION_EMAIL: 'ops@comparemytrip.in, owner@example.com, not-an-email' } })
    .buildBookingEmails('CMT1', booking());
  assert.deepEqual(Array.from(ops.to), ['ops@comparemytrip.in', 'owner@example.com']);
});

test('without an API key nothing is sent and the trip records why', async () => {
  let called = false;
  const app = emails({ fetch: async () => { called = true; } });
  await app.notifyPaidBooking('CMT1', booking());
  assert.equal(called, false);
  assert.deepEqual(JSON.parse(JSON.stringify(app.updates)), [['CMT1', { confirmationEmail: { traveller: 'skipped', ops: 'skipped', at: 'server-time' } }]]);
});

test('with an API key both emails go to Resend with idempotency keys', async () => {
  const requests = [];
  const app = emails({
    env: { RESEND_API_KEY: 're_test', BOOKING_EMAIL_FROM: 'CompareMyTrip <bookings@comparemytrip.in>' },
    fetch: async (url, init) => { requests.push({ url, ...init, body: JSON.parse(init.body) }); return { ok: true }; },
  });
  await app.notifyPaidBooking('CMT1', booking());
  assert.equal(requests.length, 2);
  for (const request of requests) {
    assert.equal(request.url, 'https://api.resend.com/emails');
    assert.equal(request.method, 'POST');
    assert.equal(request.headers.Authorization, 'Bearer re_test');
    assert.equal(request.body.from, 'CompareMyTrip <bookings@comparemytrip.in>');
    assert.equal(request.body.reply_to, 'support@comparemytrip.in');
  }
  assert.deepEqual(requests.map(request => request.headers['Idempotency-Key']).sort(), ['booking-CMT1-ops', 'booking-CMT1-traveller']);
  assert.deepEqual(JSON.parse(JSON.stringify(app.updates))[0][1].confirmationEmail, { traveller: 'sent', ops: 'sent', at: 'server-time' });
});

test('a rejected or unreachable email service never throws and is recorded as failed', async () => {
  const rejected = emails({ env: { RESEND_API_KEY: 're_test' }, fetch: async () => ({ ok: false, status: 403, text: async () => 'domain is not verified' }) });
  await rejected.notifyPaidBooking('CMT1', booking());
  assert.deepEqual(JSON.parse(JSON.stringify(rejected.updates))[0][1].confirmationEmail, { traveller: 'failed', ops: 'failed', at: 'server-time' });

  const offline = emails({ env: { RESEND_API_KEY: 're_test' }, fetch: async () => { throw new Error('network down'); } });
  await offline.notifyPaidBooking('CMT1', booking());
  assert.equal(JSON.parse(JSON.stringify(offline.updates))[0][1].confirmationEmail.ops, 'failed');

  const brokenStore = emails({ env: {}, db: { collection: () => { throw new Error('storage down'); } } });
  await brokenStore.notifyPaidBooking('CMT1', booking());
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import ts from 'typescript';
const require = createRequire(import.meta.url);
function load(file, mocks = {}, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, require: id => id in mocks ? mocks[id] : require(id), Date, Map, Set, Buffer, URL, URLSearchParams, Response, AbortSignal, console, process: { env: {} }, ...globals });
  return exports;
}
const policy = load('src/lib/pendingPayments.ts');
const now = Date.now();
const stamp = value => ({ toMillis: () => value });
const config = { key: 'merchant', salt: 'server-secret', mode: 'test', endpoint: 'https://test.payu.in/_payment' };
const gateway = load('src/lib/payuVerification.ts', { './payu': { getPayuConfig: () => config } });

// Minimal transactional store: writes commit together only if the callback
// succeeds, and concurrent reservations observe each other's committed state.
function database(initial) {
  const store = new Map(Object.entries(initial));
  let queue = Promise.resolve();
  const ops = [];
  const makeDoc = path => ({ path, id: path.split('/').at(-1),
    get: async () => snapshot(path),
    set: async value => { store.set(path, value); },
    delete: async () => { store.delete(path); },
  });
  const snapshot = path => ({ exists: store.has(path), data: () => store.get(path) ? { ...store.get(path) } : undefined, id: path.split('/').at(-1), ref: makeDoc(path) });
  const comparable = value => value?.toMillis ? value.toMillis() : value;
  function collection(name, filters = [], orders = [], count = Infinity, cursor = null) {
    return {
      doc: id => makeDoc(`${name}/${id}`),
      where: (field, operation, value) => collection(name, [...filters, [field, operation, value]], orders, count, cursor),
      orderBy: (field, direction = 'asc') => collection(name, filters, [...orders, [field, direction]], count, cursor),
      limit: value => collection(name, filters, orders, value, cursor),
      startAfter: (...value) => collection(name, filters, orders, count, value),
      get: async () => {
        let docs = [...store.keys()].filter(key => key.startsWith(`${name}/`)).map(snapshot);
        docs = docs.filter(doc => filters.every(([field, op, value]) => op === '==' ? doc.data()[field] === value : comparable(doc.data()[field]) <= comparable(value)));
        docs.sort((a, b) => { for (const [field, direction] of orders) {
          const av = field === '__name__' ? a.id : comparable(a.data()[field]);
          const bv = field === '__name__' ? b.id : comparable(b.data()[field]);
          if (av !== bv) return (av < bv ? -1 : 1) * (direction === 'desc' ? -1 : 1);
        } return 0; });
        if (cursor) docs = docs.filter(doc => comparable(doc.data().createdAt) > comparable(cursor[0]) || (comparable(doc.data().createdAt) === comparable(cursor[0]) && doc.id > cursor[1]));
        docs = docs.slice(0, count);
        return { docs, size: docs.length, empty: !docs.length };
      },
    };
  }
  const resolve = (value, previous) => Object.fromEntries(Object.entries(value).map(([key, item]) => [key, item?.operation === 'time' ? stamp(Date.now()) : item?.operation === 'union' ? [...new Set([...(previous?.[key] || []), ...item.values])] : item]));
  const db = { collection, beforeTransaction: null, runTransaction(fn) {
    const work = queue.then(async () => {
      if (db.beforeTransaction) { const change = db.beforeTransaction; db.beforeTransaction = null; change(store); }
      const writes = [];
      const result = await fn({ get: async ref => snapshot(ref.path),
        set: (ref, value) => writes.push(['set', ref.path, value]),
        create: (ref, value) => { if (store.has(ref.path)) throw new Error('Already exists'); writes.push(['set', ref.path, value]); },
        update: (ref, value) => writes.push(['update', ref.path, value]),
        delete: ref => writes.push(['delete', ref.path]),
      });
      for (const [kind, path, value] of writes) {
        if (kind === 'delete') store.delete(path);
        else store.set(path, { ...(kind === 'update' ? store.get(path) : {}), ...resolve(value, store.get(path)) });
        ops.push([kind, path]);
      }
      return result;
    });
    queue = work.catch(() => {});
    return work;
  } };
  return { db, store, ops };
}
const base = (extra = {}) => ({ txnid: 'CMT1', userId: 'owner', name: 'Test Traveller', email: 'test@example.com', phone: '9999999999', packageId: 'p1', packageTitle: 'Test trip', travellers: 2, amount: 8498, subtotal: 9000, discount: 502, couponCode: 'SAVE', tripDate: '2026-12-01', paymentStatus: 'pending', tripStatus: 'awaiting_confirmation', createdAt: stamp(now - 3600000), ...extra });
function service(initial = { 'trips/CMT1': base() }, states = {}) {
  const databaseState = database(initial);
  const firebase = { FieldValue: { serverTimestamp: () => ({ operation: 'time' }), arrayUnion: (...values) => ({ operation: 'union', values }) }, Timestamp: { fromMillis: stamp }, FieldPath: { documentId: () => '__name__' } };
  const admin = { getAdminDb: () => databaseState.db };
  const settle = load('src/lib/firebase/serverTrips.ts', { './admin': admin, 'firebase-admin/firestore': firebase });
  let nextId = 0;
  const verifications = [];
  const helpers = load('src/lib/serverPendingPayments.ts', {
    './firebase/admin': admin, './firebase/serverTrips': settle,
    'firebase-admin/firestore': firebase, './pendingPayments': policy,
    './payu': { getPayuConfig: () => config, newTransactionId: () => `RETRY${++nextId}`, buildRequestHash: () => 'server-signed-hash' },
    './payuVerification': { verifyPayuPayments: async ids => {
      verifications.push([...ids]);
      return new Map(ids.map(id => [id, { txnid: id, state: states[id] || 'not_found', amount: '8498.00', payuPaymentId: `PAYU-${id}`, paymentMode: 'UPI', failureReason: '' }]));
    } },
  });
  return { ...databaseState, ...helpers, ...settle, verifications };
}

test('pending bookings disappear at exactly 48 hours, independently of updatedAt or travel date', () => {
  const trip = { paymentStatus: 'pending', createdAt: new Date(now - policy.PENDING_PAYMENT_TTL_MS) };
  assert.equal(policy.pendingPaymentExpired(trip, now - 1), false);
  assert.equal(policy.pendingPaymentExpired(trip, now), true);
  for (const paymentStatus of ['successful', 'failed']) assert.equal(policy.pendingPaymentExpired({ ...trip, paymentStatus }, now), false);
  assert.equal(policy.pendingPaymentExpired({ ...trip, createdAt: null }, now), false);
});

test('PayU authorization, in-progress, not-found and malformed outcomes are distinguished', () => {
  for (const unmappedstatus of ['auth', 'captured']) assert.equal(gateway.parseVerifiedPayment('CMT1', { unmappedstatus }).state, 'successful');
  assert.equal(gateway.parseVerifiedPayment('CMT1', { status: 'pending', unmappedstatus: 'in progress' }).state, 'pending');
  assert.equal(gateway.parseVerifiedPayment('CMT1', { status: 'Not Found', mihpayid: 'Not Found' }).state, 'not_found');
  assert.equal(gateway.parseVerifiedPayment('CMT1', {}).state, 'unknown');
  assert.equal(gateway.parseVerifiedPayment('CMT1', { status: 'success', txnid: 'OTHER' }).state, 'unknown');
});

test('verification signs the exact transaction IDs and refuses malformed gateway replies', async () => {
  let posted;
  const verifier = load('src/lib/payuVerification.ts', { './payu': { getPayuConfig: () => config } }, { fetch: async (url, init) => {
    posted = { url, ...init };
    return Response.json({ transaction_details: { CMT1: { status: 'Not Found', mihpayid: 'Not Found' } } });
  } });
  const result = await verifier.verifyPayuPayments(['CMT1', 'CMT1']);
  assert.equal(result.get('CMT1').state, 'not_found');
  assert.equal(posted.cache, 'no-store');
  assert.equal(posted.body.get('var1'), 'CMT1');
  assert.equal(posted.body.get('hash'), createHash('sha512').update('merchant|verify_payment|CMT1|server-secret').digest('hex'));
  assert.match(posted.url, /^https:\/\/test.payu.in\/merchant\/postservice.php\?form=2$/);
  const bad = load('src/lib/payuVerification.ts', { './payu': { getPayuConfig: () => config } }, { fetch: async () => Response.json({ error: 'invalid key' }) });
  await assert.rejects(bad.verifyPayuPayments(['CMT1']), /could not confirm/);
});

test('ownership is checked before gateway access or report writes', async () => {
  const app = service();
  for (const operation of [() => app.retryPendingPayment('CMT1', 'other', 'http://localhost:3100'), () => app.reportPendingPayment('CMT1', 'other', 'UTR123', '')]) {
    await assert.rejects(operation(), error => error.status === 404);
  }
  assert.equal(app.ops.length, 0);
  assert.equal(app.verifications.length, 0);
});

test('a retry retains the server amount, discount, travellers and booking ID and signs a new attempt', async () => {
  const app = service();
  const result = await app.retryPendingPayment('CMT1', 'owner', 'http://localhost:3100');
  assert.equal(result.fields.amount, '8498.00');
  assert.equal(result.fields.txnid, 'RETRY1');
  assert.equal(result.fields.udf4, 'CMT1');
  assert.equal(result.fields.udf5, 'owner');
  assert.equal(result.fields.udf3, 'SAVE');
  assert.equal(result.fields.udf2, '2');
  assert.equal(result.fields.surl, 'http://localhost:3100/api/payu/callback');
  assert.equal(app.store.get('trips/CMT1').tripDate, '2026-12-01');
  assert.equal(app.store.get('trips/CMT1').createdAt.toMillis(), now - 3600000);
  assert.equal(app.store.has('trips/RETRY1'), false);
});

test('pending or unknown gateway states cannot start another charge', async () => {
  for (const state of ['pending', 'unknown']) {
    const app = service(undefined, { CMT1: state });
    await assert.rejects(app.retryPendingPayment('CMT1', 'owner', 'http://localhost:3100'));
    assert.equal(app.ops.length, 0);
  }
});

test('an already-paid gateway result repairs the booking instead of charging again', async () => {
  const app = service(undefined, { CMT1: 'successful' });
  const result = await app.retryPendingPayment('CMT1', 'owner', 'http://localhost:3100');
  assert.ok(result.message);
  assert.equal(result.endpoint, undefined);
  assert.equal(app.store.get('trips/CMT1').paymentStatus, 'successful');
});

test('concurrent retry clicks reserve only one attempt', async () => {
  const app = service();
  const attempts = await Promise.allSettled([app.retryPendingPayment('CMT1', 'owner', 'http://localhost:3100'), app.retryPendingPayment('CMT1', 'owner', 'http://localhost:3100')]);
  assert.equal(attempts.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(attempts.filter(result => result.status === 'rejected').length, 1);
  assert.equal(app.store.get('trips/CMT1').paymentAttemptIds.length, 2);
});

test('expired or reported bookings cannot be repaid', async () => {
  for (const change of [{ createdAt: stamp(now - policy.PENDING_PAYMENT_TTL_MS) }, { paymentReportStatus: 'open' }]) {
    const app = service({ 'trips/CMT1': base(change) });
    await assert.rejects(app.retryPendingPayment('CMT1', 'owner', 'http://localhost:3100'));
    assert.equal(app.ops.length, 0);
  }
});

test('already-paid reports are idempotent and never mark a pending booking paid', async () => {
  const app = service();
  await app.reportPendingPayment('CMT1', 'owner', 'UTR12345', 'Paid by UPI');
  await app.reportPendingPayment('CMT1', 'owner', 'DIFFERENT', 'Duplicate');
  assert.equal(app.store.get('trips/CMT1').paymentStatus, 'pending');
  assert.equal(app.store.get('trips/CMT1').paymentReportStatus, 'open');
  assert.equal(app.store.get('paymentReports/CMT1').reference, 'UTR12345');
  assert.equal(app.store.get('paymentReports/CMT1').booking.amount, 8498);
});

test('cleanup deletes only expired pending rows, reconciles paid bookings and preserves reports', async () => {
  const old = { createdAt: stamp(now - policy.PENDING_PAYMENT_TTL_MS - 1) };
  const app = service({
    'trips/CMT1': base(old), 'trips/recent': base({ txnid: 'recent' }),
    'trips/paid': base({ ...old, txnid: 'paid', paymentStatus: 'successful' }),
    'trips/failed': base({ ...old, txnid: 'failed', paymentStatus: 'failed' }),
    'trips/recover': base({ ...old, txnid: 'recover' }),
    'trips/unknown': base({ ...old, txnid: 'unknown' }),
    'paymentReports/CMT1': { tripId: 'CMT1', userId: 'owner', status: 'open', booking: base(old) },
  }, { recover: 'successful', unknown: 'unknown' });
  const result = await app.cleanupPendingPayments();
  assert.equal(result.deleted, 1); assert.equal(result.recovered, 1); assert.equal(result.retained, 1);
  assert.equal(app.store.has('trips/CMT1'), false);
  assert.equal(app.store.has('paymentReports/CMT1'), true);
  for (const id of ['recent', 'paid', 'failed', 'unknown']) assert.equal(app.store.has(`trips/${id}`), true);
  assert.equal(app.store.get('trips/recover').paymentStatus, 'successful');
});

test('cleanup keeps custom payment references available for late callbacks', async () => {
  const app = service({ 'trips/CMT1': base({ paymentKind: 'custom', userId: '', createdAt: stamp(now - policy.PENDING_PAYMENT_TTL_MS - 1000) }) });
  const result = await app.cleanupPendingPayments();
  assert.equal(result.deleted, 0);
  assert.equal(result.retained, 1);
  assert.ok(app.store.has('trips/CMT1'));
});

test('cleanup rechecks payment state inside its deletion transaction', async () => {
  const app = service({ 'trips/CMT1': base({ createdAt: stamp(now - policy.PENDING_PAYMENT_TTL_MS) }) });
  app.db.beforeTransaction = store => store.set('trips/CMT1', base({ paymentStatus: 'successful' }));
  const result = await app.cleanupPendingPayments();
  assert.equal(result.deleted, 0);
  assert.equal(app.store.get('trips/CMT1').paymentStatus, 'successful');
});

const outcome = extra => ({ txnid: 'CMT1', paymentStatus: 'successful', payuPaymentId: 'PAYU1', paymentMode: 'UPI', reportedAmount: '8498.00', failureReason: '', ...extra });
test('late failures cannot overwrite the current retry or a paid booking', async () => {
  const app = service({ 'trips/CMT1': base({ activePaymentId: 'RETRY1' }) });
  await app.settleTrip(outcome({ paymentStatus: 'failed' }));
  assert.equal(app.store.get('trips/CMT1').paymentStatus, 'pending');
  await app.settleTrip(outcome({ txnid: 'RETRY1', tripId: 'CMT1' }));
  await app.settleTrip(outcome({ paymentStatus: 'failed' }));
  assert.equal(app.store.get('trips/CMT1').paymentStatus, 'successful');
});

test('late verified success restores a deleted reported booking and resolves its request', async () => {
  const app = service({ 'paymentReports/CMT1': { tripId: 'CMT1', userId: 'owner', status: 'open', booking: base() } });
  await app.settleTrip(outcome());
  assert.equal(app.store.get('trips/CMT1').userId, 'owner');
  assert.equal(app.store.get('trips/CMT1').amount, 8498);
  assert.equal(app.store.get('trips/CMT1').paymentStatus, 'successful');
  assert.equal(app.store.get('paymentReports/CMT1').status, 'resolved');
});

test('duplicate success is idempotent, and distinct paid attempts are flagged for admin review', async () => {
  const app = service();
  await app.settleTrip(outcome()); await app.settleTrip(outcome());
  assert.equal(app.store.get('trips/CMT1').duplicatePaymentIds, undefined);
  await app.settleTrip(outcome({ txnid: 'RETRY1', tripId: 'CMT1' }));
  assert.deepEqual(Array.from(app.store.get('trips/CMT1').duplicatePaymentIds), ['RETRY1']);
});

test('closing an admin request changes only the review, not payment status or amount', async () => {
  const app = service();
  await app.reportPendingPayment('CMT1', 'owner', 'UTR12345', '');
  await app.resolvePaymentReport('CMT1', 'The bank confirmed this payment was reversed.');
  assert.equal(app.store.get('paymentReports/CMT1').status, 'resolved');
  assert.equal(app.store.get('trips/CMT1').paymentStatus, 'pending');
  assert.equal(app.store.get('trips/CMT1').amount, 8498);
});

test('cron rejects missing/wrong credentials before any database work', async () => {
  let runs = 0;
  const route = load('src/app/api/cron/pending-payments/route.ts', { '@/lib/serverPendingPayments': { cleanupPendingPayments: async () => { runs++; return { deleted: 1 }; } } }, { process: { env: { CRON_SECRET: 'test-cron' } } });
  for (const authorization of ['', 'Bearer wrong', 'Bearer tést-cron']) {
    assert.equal((await route.GET(new Request('http://localhost/api/cron/pending-payments', { headers: { authorization } }))).status, 401);
  }
  assert.equal(runs, 0);
  assert.equal((await route.GET(new Request('http://localhost/api/cron/pending-payments', { headers: { authorization: 'Bearer test-cron' } }))).status, 200);
  assert.equal(runs, 1);
});

test('cleanup cursor moves past an old unknown batch instead of starving newer expired rows', async () => {
  const initial = {}, states = {};
  for (let i = 0; i < 51; i++) {
    const id = `P${String(i).padStart(3, '0')}`;
    initial[`trips/${id}`] = base({ txnid: id, createdAt: stamp(now - policy.PENDING_PAYMENT_TTL_MS - 1000 + i) });
    states[id] = i < 50 ? 'unknown' : 'not_found';
  }
  const app = service(initial, states);
  assert.equal((await app.cleanupPendingPayments()).retained, 50);
  assert.equal((await app.cleanupPendingPayments()).deleted, 1);
  assert.equal(app.store.has('trips/P050'), false);
  assert.equal(app.store.has('maintenance/pending-payment-cleanup'), false);
});

test('customer and admin routes reject unauthenticated requests before running actions', async () => {
  let invoked = false;
  const app = service();
  const api = load('src/lib/paymentApi.ts', { './firebase/admin': { uidFromIdToken: async () => '' }, './serverPendingPayments': app });
  const route = load('src/app/api/account/payments/[tripId]/route.ts', {
    '@/lib/serverPendingPayments': { ...app, retryPendingPayment: async () => { invoked = true; } },
    '@/lib/paymentApi': api, '@/lib/payu': { siteOrigin: () => 'http://localhost:3100' },
  });
  const response = await route.POST(new Request('http://localhost/api/account/payments/CMT1', { method: 'POST', body: JSON.stringify({ action: 'retry' }) }), { params: Promise.resolve({ tripId: 'CMT1' }) });
  assert.equal(response.status, 401); assert.equal(invoked, false);
  const admin = load('src/app/api/admin/payment-reports/route.ts', {
    '@/lib/serverPendingPayments': { ...app, listPaymentReports: async () => { invoked = true; } },
    '@/lib/paymentApi': api, '@/lib/adminApiGuard': { isFirebaseAdmin: async () => false, notFound: () => Response.json({}, { status: 404 }) },
  });
  assert.equal((await admin.GET(new Request('http://localhost/api/admin/payment-reports'))).status, 404);
  assert.equal(invoked, false);
});

test('customer report listings contain only their own reports and no stored booking snapshot', async () => {
  const app = service({
    'paymentReports/CMT1': { tripId: 'CMT1', userId: 'owner', reference: 'UTR1', status: 'open', createdAt: stamp(now), booking: base() },
    'paymentReports/CMT2': { tripId: 'CMT2', userId: 'someone-else', reference: 'UTR2', status: 'open', createdAt: stamp(now), booking: base({ userId: 'someone-else' }) },
  });
  const reports = await app.listPaymentReports('owner');
  assert.equal(reports.length, 1);
  assert.equal(reports[0].reference, 'UTR1');
  assert.equal(reports[0].booking, undefined);
});

test('the Worker runs pending cleanup even when quote cleanup fails', async () => {
  const calls = [];
  const source = fs.readFileSync('worker.mjs', 'utf8').replace(/^import .*;$/gm, '').replace(/^export \{.*;$/gm, '').replace('export default worker;', 'globalThis.result = worker;');
  const context = { Request, Response, AggregateError, handler: { fetch: async request => {
    calls.push({ url: request.url, auth: request.headers.get('authorization') });
    return new Response('', { status: request.url.includes('quote-cleanup') ? 500 : 200 });
  } } };
  vm.runInNewContext(source, context);
  await assert.rejects(context.result.scheduled({}, { CRON_SECRET: 'scheduler-secret' }, {}), /Scheduled cleanup failed/);
  assert.equal(calls.length, 2);
  assert.ok(calls.some(call => call.url === 'https://comparemytrip.internal/api/cron/pending-payments'));
  assert.ok(calls.every(call => call.auth === 'Bearer scheduler-secret'));
});

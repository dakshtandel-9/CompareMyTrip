import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(file, dependencies = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports, require: (name) => {
    assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
    return dependencies[name];
  } });
  return exports;
}

const transport = load('src/app/add-on/transport.ts');
const { SERVICES, findService, toServiceId, visibleFields, composeMessage } = load('src/app/add-on/services.ts', {
  './transport': transport,
  'lucide-react': {},
});
const { validateTransport, localDateValue, MAX_TRANSPORT_STOPS } = transport;
const service = findService('transport');
const now = new Date(2026, 8, 14, 9, 0, 0);
const base = {
  tripType: 'oneway', from: 'Mumbai', to: 'Pune',
  departDate: '2026-09-15', pickupTime: '10:00',
};
const plain = (value) => JSON.parse(JSON.stringify(value));
const fieldNames = (values) => Array.from(visibleFields(service, values), (field) => field.name);

test('Transport URL selects the new service while unknown values keep the flights fallback', () => {
  assert.equal(toServiceId('transport'), 'transport');
  assert.equal(service.id, 'transport');
  assert.equal(SERVICES[SERVICES.indexOf(service) + 1].id, 'byq');
  for (const invalid of ['cab', '', null, undefined, ['transport'], {}]) {
    assert.equal(toServiceId(invalid), 'flights');
  }
  const pickupTime = service.fields.find((field) => field.name === 'pickupTime');
  assert.equal(pickupTime.kind, 'time');
  assert.equal(pickupTime.defaultValue, '10:00');
});

test('each transport mode accepts a complete enquiry and requires its own visible fields', () => {
  for (const values of [
    base,
    { ...base, tripType: 'round', returnDate: '2026-09-16' },
    { ...base, tripType: 'airport' },
    { ...base, tripType: 'hourly', to: '', duration: '8' },
  ]) {
    assert.deepEqual(plain(validateTransport(values, now)), {});
    assert.equal(fieldNames(values).includes('travellers'), false);
  }
  assert.ok(validateTransport({ ...base, tripType: 'round' }, now).returnDate);
  assert.ok(validateTransport({ ...base, tripType: 'hourly' }, now).duration);
  assert.ok(validateTransport({ ...base, tripType: 'airport', to: '' }, now).to);
  const missing = validateTransport({}, now);
  for (const name of ['tripType', 'from', 'to', 'departDate', 'pickupTime']) assert.ok(missing[name]);
});

test('one-way messages exclude a return date and rental duration left from other modes', () => {
  const values = { ...base, returnDate: '2026-09-18', duration: '8' };
  const names = fieldNames(values);
  assert.equal(names.includes('returnDate'), false);
  assert.equal(names.includes('duration'), false);
  const message = composeMessage(service, values, '  Two suitcases  ');
  assert.match(message, /^Transport enquiry \(via Add On\)/);
  assert.match(message, /Trip type: Outstation One-Way/);
  assert.match(message, /From: Mumbai\nTo: Pune/);
  assert.match(message, /Departure: 2026-09-15\nPickup time: 10:00/);
  assert.match(message, /Notes:\nTwo suitcases$/);
  assert.doesNotMatch(message, /Return:|Rental duration:/);
});

test('airport and hourly switches exclude hidden stops and return values from validation and messages', () => {
  const stale = { ...base, stopCount: '2', stop1: 'Lonavala', stop2: '', returnDate: 'bad-date', duration: '8' };
  for (const tripType of ['airport', 'hourly']) {
    const values = { ...stale, tripType };
    assert.deepEqual(plain(validateTransport(values, now)), {});
    assert.equal(fieldNames(values).some((name) => /^stop|returnDate/.test(name)), false);
    const message = composeMessage(service, values, '');
    assert.doesNotMatch(message, /Stop [1-5]:|Return:/);
    if (tripType === 'hourly') {
      assert.equal(fieldNames(values).includes('to'), false);
      assert.doesNotMatch(message, /To:|Pune/);
      assert.match(message, /Rental duration: 8 hours/);
    } else {
      assert.match(message, /To: Pune/);
      assert.doesNotMatch(message, /Rental duration:/);
    }
  }
});

test('added outstation stops are required, ordered and removed from the message when their count decreases', () => {
  const values = { ...base, stopCount: '2', stop1: 'Lonavala', stop2: '  ', stop3: 'Old stop' };
  assert.ok(validateTransport(values, now).stop2);
  assert.deepEqual(fieldNames(values).filter((name) => /^stop\d/.test(name)), ['stop1', 'stop2']);
  const complete = { ...values, stop2: 'Khandala' };
  assert.deepEqual(plain(validateTransport(complete, now)), {});
  assert.match(composeMessage(service, complete, ''), /Stop 1: Lonavala\nStop 2: Khandala/);
  assert.doesNotMatch(composeMessage(service, complete, ''), /Old stop/);
  assert.doesNotMatch(composeMessage(service, { ...complete, stopCount: '1' }, ''), /Stop 2:|Khandala/);
  assert.equal(fieldNames({ ...base, stopCount: String(MAX_TRANSPORT_STOPS) }).filter((name) => /^stop\d/.test(name)).length, 5);
});

test('route validation rejects matching locations across case and whitespace', () => {
  for (const tripType of ['oneway', 'round', 'airport']) {
    assert.ok(validateTransport({ ...base, tripType, from: ' New Delhi ', to: 'new  delhi', returnDate: base.departDate }, now).to);
  }
  assert.equal(validateTransport({ ...base, tripType: 'hourly', to: base.from, duration: '4' }, now).to, undefined);
});

test('departure validation rejects past and impossible calendar dates while allowing a leap day', () => {
  for (const departDate of ['2026-09-13', '2026-02-30', '2026-13-01', '2026-9-15', 'not-a-date']) {
    assert.ok(validateTransport({ ...base, departDate }, now).departDate, departDate);
  }
  assert.deepEqual(plain(validateTransport({ ...base, departDate: '2028-02-29' }, now)), {});
  assert.equal(localDateValue(new Date(2026, 8, 14, 0, 5)), '2026-09-14');
});

test('pickup validation rejects malformed or past local times and allows future pickups', () => {
  for (const pickupTime of ['', '24:00', '12:60', '9:00', '10:00 AM']) {
    assert.ok(validateTransport({ ...base, pickupTime }, now).pickupTime, pickupTime);
  }
  assert.ok(validateTransport({ ...base, departDate: '2026-09-14', pickupTime: '08:59' }, now).pickupTime);
  assert.deepEqual(plain(validateTransport({ ...base, departDate: '2026-09-14', pickupTime: '09:01' }, now)), {});
  assert.deepEqual(plain(validateTransport({ ...base, pickupTime: '00:00' }, now)), {});
});

test('round trips require a valid return on or after departure', () => {
  for (const returnDate of ['', '2026-09-14', '2026-09-31', 'invalid']) {
    assert.ok(validateTransport({ ...base, tripType: 'round', returnDate }, now).returnDate, returnDate);
  }
  assert.deepEqual(plain(validateTransport({ ...base, tripType: 'round', returnDate: base.departDate }, now)), {});
});

test('unsupported trip modes and hourly packages cannot pass validation', () => {
  assert.ok(validateTransport({ ...base, tripType: 'unknown' }, now).tripType);
  assert.ok(validateTransport({ ...base, tripType: 'hourly', duration: '24' }, now).duration);
  for (const duration of ['4', '8', '12']) {
    assert.deepEqual(plain(validateTransport({ ...base, tripType: 'hourly', duration }, now)), {});
  }
});

test('transport summaries fit the CRM and hourly rentals show only their pickup location', () => {
  assert.deepEqual(plain(service.summary(base)), { destination: 'Mumbai → Pune', departure: '2026-09-15', travellers: '' });
  assert.deepEqual(plain(service.summary({ ...base, tripType: 'hourly' })), { destination: 'Mumbai', departure: '2026-09-15', travellers: '' });
  assert.equal(service.summary({ ...base, from: 'A'.repeat(200) }).destination.length, 160);
});

test('the existing contact enquiry writer saves transport details with the contact source', async () => {
  let saved;
  const { saveContactEnquiry } = load('src/lib/firebase/enquiries.ts', {
    'firebase/firestore': {
      addDoc: async (_collection, values) => { saved = values; },
      collection: (_db, name) => name,
      serverTimestamp: () => 'server-time',
    },
    'firebase/app': {},
    './client': { getFirebaseDb: () => ({}) },
  });
  const message = composeMessage(service, base, 'Large suitcase');
  await saveContactEnquiry({
    name: ' Test Traveller ', email: 'TEST@example.com', phone: '+919999999999',
    ...service.summary(base), message,
  });
  assert.equal(saved.source, 'contact');
  assert.equal(saved.status, 'not_contacted');
  assert.equal(saved.destination, 'Mumbai → Pune');
  assert.equal(saved.departure, '2026-09-15');
  assert.equal(saved.travellers, '');
  assert.equal(saved.message, message);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(file, dependencies = {}, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, URL, AbortSignal, JSON, Date, console, process: { env: {} }, ...globals, require: (name) => {
    assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`);
    return dependencies[name];
  } });
  return exports;
}

/* An in-memory Firestore with just what welcomeEmails uses. */
function fakeDb() {
  const docs = new Map();
  const ref = (path) => ({
    path,
    get: async () => ({ exists: docs.has(path), data: () => docs.get(path) }),
    update: async (value) => { docs.set(path, { ...docs.get(path), ...value }); },
  });
  return {
    docs,
    collection: (name) => ({ doc: (id) => ref(`${name}/${id}`) }),
    runTransaction: async (run) => run({
      get: (target) => target.get(),
      set: (target, value) => { docs.set(target.path, value); },
      create: (target, value) => {
        if (docs.has(target.path)) throw new Error('already exists');
        docs.set(target.path, value);
      },
    }),
  };
}

function welcome({ env = { RESEND_API_KEY: 're_test' }, user, db = fakeDb() } = {}) {
  const sent = [];
  const fetch = async (url, init) => {
    sent.push({ url, headers: init.headers, body: JSON.parse(init.body) });
    return { ok: true, text: async () => '' };
  };
  const quiet = { ...console, warn() {}, error() {} };
  const globals = { process: { env }, fetch, console: quiet };
  const legalPolicies = load('src/lib/legalPolicies.ts');
  const loaded = load('src/lib/welcomeEmails.ts', {
    'node:crypto': crypto,
    'firebase-admin/firestore': {
      FieldValue: { serverTimestamp: () => 'server-time' },
      Timestamp: { fromMillis: (ms) => ({ ms }) },
    },
    './email': load('src/lib/email.ts', { './legalPolicies': legalPolicies }, globals),
    './firebase/admin': { getAdminAuth: () => ({ getUser: async () => user }), getAdminDb: () => db },
    './legalPolicies': legalPolicies,
    './seo': { getSiteUrl: () => new URL('https://comparemytrip.in') },
  }, globals);
  return { ...loaded, sent, db };
}

const newUser = (extra = {}) => ({
  email: 'priya@example.com', displayName: 'Priya Sharma',
  metadata: { creationTime: new Date(Date.now() - 60_000).toUTCString() }, ...extra,
});

test('a new account is welcomed once, from support@', async () => {
  const { welcomeNewAccount, sent, db } = welcome({ user: newUser() });
  assert.equal(await welcomeNewAccount('uid1'), 'sent');
  assert.equal(await welcomeNewAccount('uid1'), 'skipped');
  assert.equal(sent.length, 1);
  const [{ body, headers }] = sent;
  assert.equal(body.from, 'CompareMyTrip <support@comparemytrip.in>');
  assert.equal(body.reply_to, 'support@comparemytrip.in');
  assert.deepEqual(body.to, ['priya@example.com']);
  assert.equal(body.subject, 'Welcome to CompareMyTrip, Priya!');
  assert.equal(headers['Idempotency-Key'], 'welcome-uid1');
  assert.match(body.text, /Hi Priya/);
  assert.match(body.text, /https:\/\/comparemytrip\.in\/packages/);
  assert.doesNotMatch(body.text, /set a password/);
  assert.equal(db.docs.get('welcomeEmails/uid1').state, 'sent');
});

test('an account older than an hour is an existing customer and is not welcomed', async () => {
  const { welcomeNewAccount, sent } = welcome({
    user: newUser({ metadata: { creationTime: new Date(Date.now() - 2 * 3_600_000).toUTCString() } }),
  });
  assert.equal(await welcomeNewAccount('uid1'), 'skipped');
  assert.equal(sent.length, 0);
});

test('a guest account created at checkout is told how to sign in later', async () => {
  const { welcomeNewAccount, sent } = welcome({ user: newUser() });
  assert.equal(await welcomeNewAccount('uid1', { guest: true }), 'sent');
  assert.match(sent[0].body.text, /created a CompareMyTrip account for priya@example\.com when you checked out/);
  assert.match(sent[0].body.text, /https:\/\/comparemytrip\.in\/forgot-password/);
  assert.match(sent[0].body.html, /Open my account/);
});

test('without an API key nothing is sent and nothing is claimed', async () => {
  const { welcomeNewAccount, sent, db } = welcome({ env: {}, user: newUser() });
  assert.equal(await welcomeNewAccount('uid1'), 'skipped');
  assert.equal(sent.length, 0);
  assert.equal(db.docs.size, 0);
});

test('a new newsletter subscriber is saved and welcomed; a repeat is not emailed again', async () => {
  const { subscribeToNewsletter, sent, db } = welcome();
  assert.equal(await subscribeToNewsletter(' Priya@Example.com ', '1.2.3.4'), 'subscribed');
  assert.equal(await subscribeToNewsletter('priya@example.com', '1.2.3.4'), 'already-subscribed');
  assert.deepEqual({ ...db.docs.get('newsletterSubscribers/priya%40example.com') }, { email: 'priya@example.com', subscribedAt: 'server-time' });
  assert.equal(sent.length, 1);
  const [{ body }] = sent;
  assert.equal(body.from, 'CompareMyTrip <support@comparemytrip.in>');
  assert.deepEqual(body.to, ['priya@example.com']);
  assert.equal(body.subject, "You're subscribed to CompareMyTrip travel deals");
  assert.match(body.headers['List-Unsubscribe'], /mailto:support@comparemytrip\.in/);
  assert.match(body.text, /unsubscribe/);
});

test('one connection can sign up at most ten addresses an hour', async () => {
  const { subscribeToNewsletter, sent } = welcome();
  for (let index = 0; index < 10; index += 1) {
    assert.equal(await subscribeToNewsletter(`person${index}@example.com`, '1.2.3.4'), 'subscribed');
  }
  assert.equal(await subscribeToNewsletter('person10@example.com', '1.2.3.4'), 'rate-limited');
  assert.equal(await subscribeToNewsletter('person10@example.com', '5.6.7.8'), 'subscribed');
  assert.equal(sent.length, 11);
});

test('names and addresses are escaped in the HTML', () => {
  const { buildAccountWelcomeEmail } = welcome();
  const message = buildAccountWelcomeEmail({ name: '<b>Eve</b>', email: 'eve@example.com' });
  assert.doesNotMatch(message.html, /<b>Eve<\/b>/);
  assert.match(message.html, /&lt;b&gt;Eve&lt;\/b&gt;/);
});

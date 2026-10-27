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

/* An in-memory Firestore with just what passwordResetEmails uses. */
function fakeDb() {
  const docs = new Map();
  const ref = (path) => ({ path, get: async () => ({ exists: docs.has(path), data: () => docs.get(path) }) });
  return {
    docs,
    collection: (name) => ({ doc: (id) => ref(`${name}/${id}`) }),
    runTransaction: async (run) => run({ get: (target) => target.get(), set: (target, value) => { docs.set(target.path, value); } }),
  };
}

function reset({ env = { RESEND_API_KEY: 're_test' }, users = { 'priya@example.com': { displayName: 'Priya Sharma' } }, resend = { ok: true } } = {}) {
  const sent = [];
  const db = fakeDb();
  const fetch = async (url, init) => {
    sent.push({ url, headers: init.headers, body: JSON.parse(init.body) });
    return { ...resend, text: async () => '' };
  };
  const quiet = { ...console, warn() {}, error() {} };
  const globals = { process: { env }, fetch, console: quiet };
  const auth = {
    getUserByEmail: async (email) => {
      if (!users[email]) throw Object.assign(new Error('no user'), { code: 'auth/user-not-found' });
      return { email, ...users[email] };
    },
    generatePasswordResetLink: async (email) => `https://comparemytrip.firebaseapp.com/__/auth/action?mode=resetPassword&oobCode=CODE&email=${email}`,
  };
  const legalPolicies = load('src/lib/legalPolicies.ts');
  const loaded = load('src/lib/passwordResetEmails.ts', {
    'node:crypto': crypto,
    'firebase-admin/firestore': { Timestamp: { fromMillis: (ms) => ({ ms }) } },
    './email': load('src/lib/email.ts', { './legalPolicies': legalPolicies }, globals),
    './firebase/admin': { getAdminAuth: () => auth, getAdminDb: () => db },
    './legalPolicies': legalPolicies,
  }, globals);
  return { ...loaded, sent };
}

test('the reset link goes out through Resend in the branded template', async () => {
  const { sendPasswordReset, sent } = reset();
  assert.equal(await sendPasswordReset(' Priya@Example.com ', '1.2.3.4'), 'sent');
  assert.equal(sent.length, 1);
  const [{ url, body, headers }] = sent;
  assert.equal(url, 'https://api.resend.com/emails');
  assert.equal(body.from, 'CompareMyTrip <support@comparemytrip.in>');
  assert.deepEqual(body.to, ['priya@example.com']);
  assert.equal(body.subject, 'Reset your CompareMyTrip password');
  assert.match(headers['Idempotency-Key'], /^password-reset-/);
  assert.match(body.html, /Hi Priya,/);
  assert.match(body.html, /email\/banner\.jpg/);
  assert.match(body.html, /<a href="https:\/\/comparemytrip\.firebaseapp\.com\/__\/auth\/action\?mode=resetPassword&amp;oobCode=CODE[^"]*"[^>]*>Reset Password →<\/a>/);
  assert.match(body.text, /Reset your password: https:\/\/comparemytrip\.firebaseapp\.com\/__\/auth\/action\?mode=resetPassword&oobCode=CODE/);
});

test('an unknown address sends nothing but is reported apart from a failure', async () => {
  const { sendPasswordReset, sent } = reset();
  assert.equal(await sendPasswordReset('nobody@example.com', '1.2.3.4'), 'no-account');
  assert.equal(sent.length, 0);
});

test('without an API key, or when Resend rejects it, the browser is told to fall back', async () => {
  assert.equal(await reset({ env: {} }).sendPasswordReset('priya@example.com', '1.2.3.4'), 'unavailable');
  assert.equal(await reset({ resend: { ok: false, status: 403 } }).sendPasswordReset('priya@example.com', '1.2.3.4'), 'unavailable');
});

test('one address can be sent at most three resets an hour', async () => {
  const { sendPasswordReset, sent } = reset();
  for (let index = 0; index < 3; index += 1) assert.equal(await sendPasswordReset('priya@example.com', `10.0.0.${index}`), 'sent');
  assert.equal(await sendPasswordReset('priya@example.com', '10.0.0.9'), 'rate-limited');
  assert.equal(sent.length, 3);
});

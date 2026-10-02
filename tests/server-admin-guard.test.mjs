import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(file, dependencies = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, Promise, require: (name) => {
    assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`);
    return dependencies[name];
  } });
  return exports;
}

function guard({ admins = ['admin-uid'], verify, lookup, configured = true } = {}) {
  const calls = { verified: [], read: [] };
  const auth = { verifyIdToken: verify ?? (async (token, checkRevoked) => {
    calls.verified.push([token, checkRevoked]);
    if (!token.startsWith('valid:')) throw new Error('invalid token');
    return { uid: token.slice('valid:'.length) };
  }) };
  const db = { collection: name => ({ doc: id => ({ get: lookup ?? (async () => {
    calls.read.push(`${name}/${id}`);
    return { exists: name === 'admins' && admins.includes(id) };
  }) }) }) };
  const loaded = load('src/lib/serverAdminGuard.ts', {
    './firebase/admin': { getAdminAuth: () => configured ? auth : null, getAdminDb: () => configured ? db : null },
    './adminApiGuard': { notFound: () => 'not-found' },
  });
  return { ...loaded, calls };
}
const request = token => new Request('https://comparemytrip.in/api/admin/payment-reports', token ? { headers: { authorization: `Bearer ${token}` } } : {});

test('an admin is verified with the Admin SDK, checking revocation and the admins collection', async () => {
  const app = guard();
  assert.equal(await app.isFirebaseAdmin(request('valid:admin-uid')), true);
  assert.deepEqual(app.calls.verified, [['valid:admin-uid', true]]);
  assert.deepEqual(app.calls.read, ['admins/admin-uid']);
});

test('signed-in non-admins, bad tokens and missing tokens are refused', async () => {
  const app = guard();
  assert.equal(await app.isFirebaseAdmin(request('valid:customer-uid')), false);
  assert.equal(await app.isFirebaseAdmin(request('forged')), false);
  assert.equal(await app.isFirebaseAdmin(request('')), false);
  assert.deepEqual(app.calls.read, ['admins/customer-uid']);
});

test('without Admin credentials nobody is an admin', async () => {
  assert.equal(await guard({ configured: false }).isFirebaseAdmin(request('valid:admin-uid')), false);
});

test('a storage failure or an expired deadline is a refusal, not an error', async () => {
  const failing = guard({ lookup: async () => { throw new Error('unavailable'); } });
  assert.equal(await failing.isFirebaseAdmin(request('valid:admin-uid')), false);

  const hanging = guard({ lookup: () => new Promise(() => {}) });
  const deadline = new AbortController();
  const pending = hanging.isFirebaseAdmin(request('valid:admin-uid'), deadline.signal);
  deadline.abort(new Error('timeout'));
  assert.equal(await pending, false);
  assert.equal(await hanging.isFirebaseAdmin(request('valid:admin-uid'), AbortSignal.abort()), false);
});

test('the not-found response is shared with the Edge guard', () => {
  assert.equal(guard().notFound(), 'not-found');
});

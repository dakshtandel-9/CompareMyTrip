import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function setup({ signedIn = true, commitFails = false, refreshFails = false } = {}) {
  const calls = { deleted: [], commits: 0, refreshes: 0 };
  const exports = {};
  const dependencies = {
    './client': { getFirebaseAuth: () => ({ currentUser: signedIn ? { uid: 'admin' } : null }), getFirebaseDb: () => ({}) },
    './revalidateContent': { revalidatePublicContent: async () => { calls.refreshes++; if (refreshFails) throw new Error('Refresh failed'); } },
    '@/lib/cloudflareUpload': {},
    'firebase/firestore': {
      doc: (_db, collection, id) => ({ collection, id }),
      writeBatch: () => ({
        delete: (ref) => calls.deleted.push(ref),
        commit: async () => { calls.commits++; if (commitFails) throw new Error('Permission denied'); },
      }),
    },
  };
  const code = ts.transpileModule(fs.readFileSync('src/lib/firebase/packages.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports, require: (name) => {
    assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
    return dependencies[name];
  } });
  return { remove: exports.deletePackages, calls };
}

test('bulk deletion commits unique package IDs together and refreshes once', async () => {
  const { remove, calls } = setup();
  const result = await remove(['one', 'two', 'one']);
  assert.deepEqual(calls.deleted, [{ collection: 'packages', id: 'one' }, { collection: 'packages', id: 'two' }]);
  assert.equal(calls.commits, 1);
  assert.equal(calls.refreshes, 1);
  assert.equal(result.refreshWarning, '');
});

test('failed batch propagates failure without refreshing public content', async () => {
  const { remove, calls } = setup({ commitFails: true });
  await assert.rejects(remove(['one', 'two']), /Permission denied/);
  assert.equal(calls.refreshes, 0);
});

test('refresh failure after committed deletion returns a warning rather than a deletion failure', async () => {
  const { remove, calls } = setup({ refreshFails: true });
  const result = await remove(['one']);
  assert.equal(calls.commits, 1);
  assert.match(result.refreshWarning, /were deleted/);
});

test('invalid, oversized, and unauthenticated selections cannot commit', async () => {
  for (const ids of [['_catalog'], [''], ['nested/id'], Array.from({ length: 501 }, (_, i) => String(i))]) {
    const { remove, calls } = setup();
    await assert.rejects(remove(ids));
    assert.equal(calls.commits, 0);
  }
  const { remove, calls } = setup({ signedIn: false });
  await assert.rejects(remove(['one']), /Sign in/);
  assert.equal(calls.commits, 0);
});

test('empty selection does not write or refresh', async () => {
  const { remove, calls } = setup();
  await remove([]);
  assert.equal(calls.commits, 0);
  assert.equal(calls.refreshes, 0);
});

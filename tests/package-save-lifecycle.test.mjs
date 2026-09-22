import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(file, dependencies, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, ...globals, require(name) { assert.ok(dependencies[name], name); return dependencies[name]; } });
  return exports;
}
function setupSave({ commitFails = false, refreshFails = false } = {}) {
  const calls = { sets: [], commits: 0, refreshes: 0 };
  const { savePackage } = load('src/lib/firebase/packages.ts', {
    './client': { getFirebaseAuth: () => ({ currentUser: { uid: 'admin' } }), getFirebaseDb: () => ({}) },
    './revalidateContent': { revalidatePublicContent: async () => { calls.refreshes++; if (refreshFails) throw new Error('Offline refresh'); } },
    '@/lib/cloudflareUpload': {},
    '@/lib/weekendTracks': { WEEKEND_TRACKS: [], WEEKEND_TREKS_CATEGORY: 'Weekend Treks' },
    'firebase/firestore': {
      doc: (_db, collection, id) => ({ collection, id }), serverTimestamp: () => 123,
      writeBatch: () => ({
        set: (...args) => calls.sets.push(args),
        commit: async () => { calls.commits++; if (commitFails) throw new Error('Write failed'); },
      }),
    },
  });
  return { savePackage, calls };
}

test('package and catalogue marker commit together before public refresh', async () => {
  const { savePackage, calls } = setupSave();
  const result = await savePackage({ id: 'saved-package', image: '/saved-cover.jpg', status: 'draft' });
  assert.equal(calls.commits, 1);
  assert.deepEqual(calls.sets.map(([ref]) => ref.id), ['saved-package', '_catalog']);
  assert.equal(calls.sets[0][1].package.image, '/saved-cover.jpg');
  assert.equal(calls.refreshes, 1);
  assert.equal(result.refreshWarning, '');
});

test('refresh failure remains a successful save so persisted uploads cannot be discarded', async () => {
  const { savePackage, calls } = setupSave({ refreshFails: true });
  const result = await savePackage({ id: 'saved-package' });
  assert.equal(calls.commits, 1);
  assert.match(result.refreshWarning, /was saved/);
});

test('failed persistence throws before any refresh or successful-save result', async () => {
  const { savePackage, calls } = setupSave({ commitFails: true });
  await assert.rejects(savePackage({ id: 'saved-package' }), /Write failed/);
  assert.equal(calls.refreshes, 0);
});

function setupCleanup(fetchImpl) {
  const storage = {};
  Object.defineProperties(storage, {
    getItem: { value: key => storage[key] ?? null },
    setItem: { value: (key, value) => { storage[key] = value; } },
    removeItem: { value: key => { delete storage[key]; } },
  });
  const deleted = [];
  const api = load('src/lib/cloudflareUpload.ts', {
    '@/lib/firebase/client': { getFirebaseAuth: () => ({ authStateReady: async () => {}, currentUser: { getIdToken: async () => 'test-token' } }) },
  }, { sessionStorage: storage, URL, fetch: async (_url, request) => {
    const url = JSON.parse(request.body).url;
    deleted.push(url);
    return fetchImpl ? fetchImpl(url, storage) : { ok: true, json: async () => ({}) };
  } });
  return { ...api, storage, deleted };
}

test('abandoned-image cleanup protects all saved URLs including hidden content', async () => {
  const { cleanupAbandonedPackageImages, storage, deleted, PACKAGE_DRAFT_IMAGE_KEY_PREFIX } = setupCleanup();
  storage.setItem(`${PACKAGE_DRAFT_IMAGE_KEY_PREFIX}trip`, JSON.stringify(['https://cdn.example/cover.jpg', 'https://cdn.example/hidden.jpg', 'https://cdn.example/abandoned.jpg']));
  const result = await cleanupAbandonedPackageImages(['https://cdn.example/cover.jpg', 'https://cdn.example/hidden.jpg']);
  assert.deepEqual(deleted, ['https://cdn.example/abandoned.jpg']);
  assert.equal(result.failedCount, 0);
  assert.equal(Object.keys(storage).length, 0);
});

test('failed deletion retries merge with uploads queued while cleanup was running', async () => {
  let key;
  const { cleanupAbandonedPackageImages, storage, PACKAGE_DRAFT_IMAGE_KEY_PREFIX } = setupCleanup(async (_url, current) => {
    current.setItem(key, JSON.stringify(['https://cdn.example/new-upload.jpg']));
    return { ok: false, json: async () => ({ error: 'Try later' }) };
  });
  key = `${PACKAGE_DRAFT_IMAGE_KEY_PREFIX}trip`;
  storage.setItem(key, JSON.stringify(['https://cdn.example/old-upload.jpg']));
  const result = await cleanupAbandonedPackageImages([]);
  assert.equal(result.failedCount, 1);
  assert.deepEqual(JSON.parse(storage.getItem(key)), ['https://cdn.example/new-upload.jpg', 'https://cdn.example/old-upload.jpg']);
});

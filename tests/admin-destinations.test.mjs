import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(file, dependencies = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, URLSearchParams, require: name => {
    assert.ok(dependencies[name], name);
    return dependencies[name];
  } });
  return exports;
}
const states = load('src/lib/indiaStates.ts');
const destinations = load('src/lib/destinations.ts', {
  '@/lib/indiaStates': states, '@/lib/blogData': { slugify: value => value.toLowerCase().replaceAll(' ', '-') },
});
const pkg = { destination: 'Coorg', region: 'India', price: 5000, days: 3, tags: ['Family'], image: 'package.jpg' };

test('reserved destinations appear in admin without creating empty public destinations', () => {
  const records = [{ name: 'Karnataka', region: 'India' }, { name: 'Thailand', region: 'International' }];
  const admin = destinations.buildAdminDestinations([pkg], { Thailand: 'cover.jpg' }, records);
  assert.equal(admin.length, 2);
  assert.equal(admin.find(item => item.name === 'Karnataka').count, 1);
  const empty = admin.find(item => item.name === 'Thailand');
  assert.equal(empty.count, 0);
  assert.equal(empty.image, 'cover.jpg');
  assert.equal(empty.fromPrice, 0);
  assert.equal(destinations.buildDestinations([pkg], { Thailand: 'cover.jpg' }).length, 1);
});

test('destination package shortcuts encode names and preserve region', () => {
  const url = new URL(destinations.destinationPackageCreateHref('Trinidad & Tobago', 'International'), 'https://example.com');
  assert.equal(url.pathname, '/admin/packages');
  assert.equal(url.searchParams.get('create'), '1');
  assert.equal(url.searchParams.get('destination'), 'Trinidad & Tobago');
  assert.equal(url.searchParams.get('region'), 'International');
});

test('creating a destination and changing its photo retain catalogue metadata', async () => {
  const documents = new Map();
  const writes = (ref, value, options) => documents.set(ref, options?.merge ? { ...documents.get(ref), ...value } : value);
  const api = load('src/lib/firebase/destinations.ts', {
    './revalidateContent': { revalidatePublicContent: async () => {} },
    'firebase/app': { FirebaseError: Error },
    '@/lib/cloudflareUpload': { uploadImageToCloudflare: async () => 'uploaded.jpg' },
    './client': { getFirebaseAuth: () => ({ currentUser: { uid: 'admin' } }), getFirebaseDb: () => ({}) },
    'firebase/firestore': {
      doc: (_db, _collection, id) => id, serverTimestamp: () => 123, setDoc: writes,
      runTransaction: async (_db, callback) => callback({ get: async ref => ({ data: () => documents.get(ref) }), set: writes }),
    },
  });
  await api.createDestination('Thailand', 'International');
  await api.saveDestinationCover('Thailand', 'cover.jpg');
  assert.equal(documents.get('Thailand').region, 'International');
  await api.clearDestinationCover('Thailand');
  assert.equal(documents.get('Thailand').image, '');
  assert.equal(documents.get('Thailand').name, 'Thailand');
  assert.equal(documents.get('Thailand').region, 'International');
  await assert.rejects(api.createDestination('Thailand', 'International'), /already exists/);
  await assert.rejects(api.createDestination(' ', 'India'), /name/);
});

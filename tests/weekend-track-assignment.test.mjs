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

const tracks = () => load('src/lib/weekendTracks.ts', { '@/lib/packageData': {} });

const trek = (overrides) => ({
  id: 'trek', title: 'Some Hill', location: 'Karnataka', tags: ['Weekend Treks'],
  price: 999, days: 1, image: '', ...overrides,
});

/* ---- grouping -------------------------------------------------------- */

test('a saved track wins over the keywords in the title', () => {
  const { groupWeekendTracks } = tracks();
  // "sunrise" in the title would otherwise claim this for the sunrise track.
  const groups = groupWeekendTracks([trek({ title: 'Sunrise Ridge', weekendTrack: 'monsoon' })]);
  const byId = Object.fromEntries(groups.map((group) => [group.track.id, group.items.length]));
  assert.equal(byId.monsoon, 1);
  assert.equal(byId.sunrise, 0);
});

test('an unassigned trek still falls back to keyword matching', () => {
  const { groupWeekendTracks } = tracks();
  const groups = groupWeekendTracks([trek({ title: 'Skandagiri Sunrise Trek' })]);
  assert.equal(groups.find((group) => group.track.id === 'sunrise').items.length, 1);
});

test('an assignment naming a removed track falls back rather than vanishing', () => {
  const { groupWeekendTracks } = tracks();
  const groups = groupWeekendTracks([trek({ title: 'Nandi Hills', weekendTrack: 'deleted-track' })]);
  const total = groups.reduce((sum, group) => sum + group.items.length, 0);
  assert.equal(total, 1, 'the trek is still reachable');
  assert.equal(groups.find((group) => group.track.id === 'sunrise').items.length, 1);
});

test('a package without the weekend tag is not grouped at all', () => {
  const { groupWeekendTracks, trackForTrek } = tracks();
  const plain = trek({ tags: ['Beaches'], weekendTrack: 'monsoon' });
  assert.equal(groupWeekendTracks([plain]).reduce((sum, group) => sum + group.items.length, 0), 0);
  assert.equal(trackForTrek(plain), undefined);
});

test('trackForTrek reports where a trek currently appears', () => {
  const { trackForTrek } = tracks();
  assert.equal(trackForTrek(trek({ weekendTrack: 'monsoon' })).id, 'monsoon');
  assert.equal(trackForTrek(trek({ title: 'Skandagiri' })).id, 'sunrise');
  // No keyword matches, so the catch-all track claims it.
  assert.equal(trackForTrek(trek({ title: 'Some Hill' })).id, 'escapes');
});

/* ---- the bulk write -------------------------------------------------- */

function setupWrite({ signedIn = true } = {}) {
  const calls = { writes: [], commits: 0, refreshes: 0 };
  const DELETE = { __delete: true };
  const exports = load('src/lib/firebase/packages.ts', {
    './client': { getFirebaseAuth: () => ({ currentUser: signedIn ? { uid: 'admin' } : null }), getFirebaseDb: () => ({}) },
    './revalidateContent': { revalidatePublicContent: async () => { calls.refreshes++; } },
    '@/lib/cloudflareUpload': {},
    '@/lib/weekendTracks': {
      WEEKEND_TRACKS: [{ id: 'sunrise' }, { id: 'monsoon' }, { id: 'escapes' }],
      WEEKEND_TREKS_CATEGORY: 'Weekend Treks',
    },
    'firebase/firestore': {
      doc: (_db, collection, id) => ({ collection, id }),
      deleteField: () => DELETE,
      serverTimestamp: () => 'now',
      writeBatch: () => ({
        set: (ref, data) => calls.writes.push({ id: ref.id, ...data.package }),
        commit: async () => { calls.commits++; },
      }),
    },
  });
  /* clean() round-trips through JSON inside the VM, so arrays it returns carry
     that context's Array prototype and deepStrictEqual refuses to match them
     against ours. Comparing the values sidesteps the cross-realm check. */
  const tagsOf = (index) => [...calls.writes[index].tags];
  return { assign: exports.assignWeekendTrack, calls, DELETE, tagsOf };
}

test('assigning a track writes only the track and tags, in one batch', async () => {
  const { assign, calls, tagsOf } = setupWrite();
  await assign([trek({ id: 'a' }), trek({ id: 'b' })], 'monsoon');
  assert.deepEqual(calls.writes.map((write) => [write.id, write.weekendTrack]), [
    ['a', 'monsoon'], ['b', 'monsoon'],
  ]);
  assert.deepEqual(tagsOf(0), ['Weekend Treks']);
  // Nothing else on the package is touched by a bulk move.
  assert.deepEqual(Object.keys(calls.writes[0]).sort(), ['id', 'tags', 'weekendTrack']);
  assert.equal(calls.commits, 1, 'one batch, so a failure cannot half-apply');
  assert.equal(calls.refreshes, 1);
});

test('a package missing the weekend tag gains it when filed', async () => {
  const { assign, tagsOf } = setupWrite();
  await assign([trek({ id: 'a', tags: ['Adventure'] })], 'sunrise');
  assert.deepEqual(tagsOf(0), ['Adventure', 'Weekend Treks']);
});

test('clearing a track deletes the field rather than storing undefined', async () => {
  const { assign, calls, DELETE, tagsOf } = setupWrite();
  await assign([trek({ id: 'a' })], null);
  assert.equal(calls.writes[0].weekendTrack, DELETE);
  // Clearing must not add the tag to something that never had it.
  assert.deepEqual(tagsOf(0), ['Weekend Treks']);
});

test('an unknown track is refused before anything is written', async () => {
  const { assign, calls } = setupWrite();
  await assert.rejects(assign([trek({ id: 'a' })], 'nonsense'), /Unknown weekend track/);
  assert.equal(calls.commits, 0);
});

test('signing out blocks the write', async () => {
  const { assign, calls } = setupWrite({ signedIn: false });
  await assert.rejects(assign([trek({ id: 'a' })], 'monsoon'), /Sign in/);
  assert.equal(calls.commits, 0);
});

test('an empty selection is a no-op', async () => {
  const { assign, calls } = setupWrite();
  const result = await assign([], 'monsoon');
  assert.equal(calls.commits, 0);
  assert.equal(result.refreshWarning, '');
});

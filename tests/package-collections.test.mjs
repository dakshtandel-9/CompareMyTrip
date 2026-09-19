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
  vm.runInNewContext(code, { exports, URLSearchParams, require: (name) => {
    assert.ok(dependencies[name], `Unexpected dependency: ${name}`);
    return dependencies[name];
  } });
  return exports;
}
const collections = load('src/lib/packageCollections.ts');
const content = load('src/lib/siteContent.ts', {
  '@/lib/weekendTracks': load('src/lib/weekendTracks.ts'),
  '@/lib/comingSoon': load('src/lib/comingSoon.ts'),
});
const plain = (value) => JSON.parse(JSON.stringify(value));

test('empty cruise and hotel collections each contain three distinct demo packages', () => {
  const ids = new Set();
  for (const collection of ['cruise', 'hotels']) {
    const packages = collections.packagesForCollection([], collection);
    assert.equal(packages.length, 3);
    for (const pkg of packages) {
      assert.ok(collections.isCollectionDemo(pkg.id));
      assert.ok(pkg.tags.includes(collections.PACKAGE_COLLECTIONS[collection].category));
      assert.ok(pkg.details.itinerary.length > 0);
      assert.ok(fs.existsSync(`public${pkg.image}`));
      assert.ok(!ids.has(pkg.id));
      ids.add(pkg.id);
    }
  }
});

test('real published packages replace only their collection samples; drafts never do', () => {
  const draft = { ...collections.COLLECTION_DEMO_PACKAGES[0], id: 'draft-cruise', status: 'draft' };
  const real = { ...draft, id: 'real-cruise', status: 'published' };
  assert.equal(collections.packagesForCollection([draft], 'cruise').length, 3);
  assert.deepEqual(plain(collections.packagesForCollection([draft, real], 'cruise')), plain([real]));
  assert.equal(collections.packagesForCollection([draft, real], 'hotels').length, 3);
  assert.equal(collections.isCollectionDemo('real-cruise'), false);
});

test('collection links accept expected aliases without claiming existing tracks', () => {
  for (const value of ['cruise', 'Cruise', 'cruises']) assert.equal(collections.parsePackageCollection(value), 'cruise');
  for (const value of ['Hotels', 'hotels', 'hotel']) assert.equal(collections.parsePackageCollection(value), 'hotels');
  for (const value of ['monsoon', 'india', 'Adventure', null]) assert.equal(collections.parsePackageCollection(value), null);
});

test('older CRM content inherits both banners and published edits round-trip', () => {
  const old = content.normalizeSiteContent({ banners: { items: [] } });
  for (const id of ['packages-cruise', 'packages-hotels']) {
    const banner = old.banners.items.find((item) => item.id === id);
    assert.ok(banner);
    banner.title = `Edited ${id}`;
    banner.image = '/custom/banner.jpg';
    const restored = content.normalizeSiteContent(plain(old));
    assert.deepEqual(plain(restored.banners.items.find((item) => item.id === id)), plain(banner));
  }
});

test('existing standard navigation receives collection links without duplicating a custom cruise link', () => {
  const old = plain(content.DEFAULT_SITE_CONTENT.header);
  old.items = old.items.filter((item) => !['nav-cruise', 'nav-hotels'].includes(item.id));
  old.items.push({ id: 'custom-cruise', label: 'Cruise holidays', href: '/cruise', children: [] });
  const normalized = content.normalizeSiteContent({ header: old });
  assert.equal(normalized.header.items.filter((item) => item.href.includes('cruise')).length, 1);
  assert.equal(normalized.header.items.findIndex((item) => item.id === 'nav-hotels'), normalized.header.items.findIndex((item) => item.id === 'custom-cruise') + 1);
  assert.deepEqual(plain(content.normalizeSiteContent(plain(normalized)).header), plain(normalized.header));
});


test('CRM collection lists include their drafts and exclude unrelated packages and public samples', () => {
  const cruise = { id: 'cruise-1', tags: ['Cruise'], status: 'published' };
  const draftCruise = { id: 'cruise-2', tags: ['Cruise', 'Family'], status: 'draft' };
  const hotel = { id: 'hotel-1', tags: ['Hotels'], status: 'draft' };
  const trek = { id: 'trek-1', tags: ['Treks'], status: 'published' };
  const all = [cruise, draftCruise, hotel, trek];
  assert.deepEqual(plain(collections.managedCollectionPackages(all, 'cruise')), [cruise, draftCruise]);
  assert.deepEqual(plain(collections.managedCollectionPackages(all, 'hotels')), [hotel]);
  assert.equal(collections.managedCollectionPackages(all), all);
  assert.equal(collections.managedCollectionPackages([], 'hotels').length, 0);
});

test('collection categories survive replacement edits without duplicates or losing other tags', () => {
  for (const collection of ['cruise', 'hotels']) {
    const original = { title: 'New listing', tags: ['Family'], price: '12500' };
    const scoped = collections.withPackageCollection(original, collection);
    const category = collections.PACKAGE_COLLECTIONS[collection].category;
    assert.deepEqual(plain(scoped.tags), ['Family', category]);
    assert.deepEqual(original.tags, ['Family'], 'source stays untouched for Undo');
    assert.equal(collections.withPackageCollection(scoped, collection), scoped);
    const imported = collections.withPackageCollection({ ...scoped, tags: ['Luxury'] }, collection);
    assert.deepEqual(plain(imported.tags), ['Luxury', category]);
    assert.equal(imported.price, '12500');
    assert.equal(collections.withPackageCollection(original), original);
  }
});

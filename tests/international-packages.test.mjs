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
    assert.ok(dependencies[name], `Unexpected dependency: ${name}`);
    return dependencies[name];
  }});
  return exports;
}

const data = load('src/lib/packageData.ts');
const { internationalCardPackage: resolve } = load('src/lib/internationalPackages.ts', {
  '@/lib/packageData': data,
});
const trip = (id, destination, extra = {}) => ({ id, destination, region: 'International', ...extra });
const card = (country, href = '/packages?region=international') => ({ country, href });

test('existing country cards choose a matching published package consistently', () => {
  for (const country of ['Thailand', 'Vietnam', 'Sri Lanka', 'Maldives']) {
    const selected = resolve(card(country), data.DUMMY_PACKAGES);
    assert.ok(selected, country);
    assert.equal(selected.destination, country);
    assert.equal(resolve(card(country), data.DUMMY_PACKAGES).id, selected.id);
  }
});

test('country aliases match Bali and Dubai packages', () => {
  assert.equal(resolve(card('Indonesia'), [trip('bali', 'Bali')]).id, 'bali');
  assert.equal(resolve(card('United Arab Emirates'), [trip('dubai', 'Dubai')]).id, 'dubai');
});

test('admin attachment overrides the automatic selection and survives saving', () => {
  const packages = [trip('first', 'Thailand'), trip('chosen', 'Thailand')];
  const saved = JSON.parse(JSON.stringify(card('Thailand', '/packages/chosen')));
  assert.equal(resolve(saved, packages).id, 'chosen');
});

test('missing or unpublished attachments fall back to a matching live package', () => {
  const packages = [trip('draft', 'Thailand', { status: 'draft' }), trip('live', 'Thailand')];
  assert.equal(resolve(card('Thailand', '/packages/draft'), packages).id, 'live');
  assert.equal(resolve(card('Thailand', '/packages/deleted'), packages).id, 'live');
});

test('never chooses unrelated countries, domestic trips or drafts as automatic matches', () => {
  const packages = [trip('bali', 'Bali'), trip('draft', 'Dubai', { status: 'draft' }), trip('india', 'Dubai', { region: 'India' })];
  assert.equal(resolve(card('United Arab Emirates'), packages), undefined);
});

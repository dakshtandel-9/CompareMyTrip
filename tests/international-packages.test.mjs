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
const { internationalCardTarget: target } = load('src/lib/internationalPackages.ts', {
  '@/lib/packageData': data,
});
/** Just the package a card resolves to, which is what these first cases check. */
const resolve = (card, packages) => target(card, packages).pkg;
const trip = (id, destination, extra = {}) => ({ id, title: id, destination, region: 'International', ...extra });
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

/* ---- pasted links -------------------------------------------------- */
/* The CRM field takes any link now, not just a package, so these cover
   what the card opens and which package supplies its price. */

test('the cards seeded with the catalogue link still resolve to a package', () => {
  // Every shipped card carries this href. Reading it as a deliberate
  // destination would quietly stop them all matching a country.
  const packages = [trip('live', 'Thailand')];
  const seeded = target(card('Thailand', '/packages?region=international'), packages);
  assert.equal(seeded.pkg.id, 'live');
  assert.equal(seeded.href, '/packages/live');

  const empty = target(card('Thailand', ''), packages);
  assert.equal(empty.pkg.id, 'live');
  assert.equal(empty.href, '/packages/live');
});

test('a pasted link is opened as given, and the card keeps its own price', () => {
  const packages = [trip('live', 'Thailand')];
  const pasted = target(card('Thailand', '/packages?region=international&destination=Thailand'), packages);
  assert.equal(pasted.href, '/packages?region=international&destination=Thailand');
  assert.equal(pasted.pkg, undefined, 'no single package, so the card shows its From price');

  assert.equal(target(card('Thailand', '/destinations'), packages).href, '/destinations');
});

test('an attached package still wins and supplies its live price', () => {
  const packages = [trip('first', 'Thailand'), trip('chosen', 'Thailand')];
  const attached = target(card('Thailand', '/packages/chosen'), packages);
  assert.equal(attached.pkg.id, 'chosen');
  assert.equal(attached.href, '/packages/chosen');
});

test('a dead package link degrades to the country match, not a broken card', () => {
  // Unpublishing an attached package must not leave the card pointing at a 404.
  const packages = [trip('draft', 'Thailand', { status: 'draft' }), trip('live', 'Thailand')];
  assert.equal(target(card('Thailand', '/packages/draft'), packages).href, '/packages/live');
  assert.equal(target(card('Thailand', '/packages/deleted'), packages).href, '/packages/live');
});

test('with nothing to match, the card falls back to the catalogue', () => {
  const nothing = target(card('Thailand', ''), []);
  assert.equal(nothing.pkg, undefined);
  assert.equal(nothing.href, '/packages?region=international');
});

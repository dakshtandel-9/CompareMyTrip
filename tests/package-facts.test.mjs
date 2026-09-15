import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as jsxRuntime from 'react/jsx-runtime';
import * as icons from 'lucide-react';

function load(file, dependencies = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, { exports, require: (name) => {
    assert.ok(dependencies[name], `Unexpected dependency: ${name}`);
    return dependencies[name];
  }});
  return exports;
}

const data = load('src/lib/packageData.ts');
const { defaultPackageFacts, getPackageFacts } = load('src/lib/packageFacts.ts', { '@/lib/packageData': data });
const original = data.DUMMY_PACKAGES.find((pkg) => pkg.title.includes('Discover the Best of Goa'));
const roundTrip = (pkg) => JSON.parse(JSON.stringify(pkg));
const withFacts = (facts, factsHidden = false) => roundTrip({
  ...original,
  details: { ...data.getPackageDetails(original), facts, factsHidden },
});

test('existing packages retain all six standard boxes without migration', () => {
  const facts = getPackageFacts(original);
  assert.equal(facts.length, 6);
  assert.equal(facts[0].label, 'Duration');
  assert.equal(facts[0].value, '3 nights / 4 days');
  assert.equal(facts[1].value, original.pax);
  assert.equal(facts[4].icon, 'PlateAndCup');
  assert.equal(facts[4].value, original.details.meals);
  assert.equal(getPackageFacts({ ...original, details: undefined }).length, 6);
});

test('automatic values follow package changes after saving and reopening', () => {
  const saved = withFacts(defaultPackageFacts());
  saved.nights = 6;
  saved.days = 7;
  saved.details.meals = 'All meals included';
  assert.equal(getPackageFacts(saved)[0].value, '6 nights / 7 days');
  assert.equal(getPackageFacts(saved)[4].value, 'All meals included');
});

test('custom names, icons, values and ordering persist independently of package fields', () => {
  const facts = defaultPackageFacts();
  const custom = { ...facts[0], label: 'Travel time', icon: 'Timer', value: 'One wonderful week' };
  const added = { id: 'guide', label: 'Guide', icon: 'Languages', value: 'English and Hindi', visible: true };
  const saved = withFacts([added, custom]);
  saved.days = 12;
  const resolved = getPackageFacts(saved);
  assert.equal(resolved.length, 2);
  assert.equal(resolved[0].id, 'guide');
  assert.equal(resolved[1].label, 'Travel time');
  assert.equal(resolved[1].icon, 'Timer');
  assert.equal(resolved[1].value, 'One wonderful week');
  delete saved.details.facts[1].value;
  assert.equal(getPackageFacts(roundTrip(saved))[1].value, '3 nights / 12 days');
});

test('hidden boxes retain their edits while removed boxes stay removed', () => {
  const facts = defaultPackageFacts().slice(0, 4);
  facts[1] = { ...facts[1], visible: false, value: 'Private group' };
  const saved = withFacts(facts);
  assert.equal(getPackageFacts(saved).length, 3);
  assert.equal(saved.details.facts[1].value, 'Private group');
  saved.details.facts[1].visible = true;
  assert.equal(getPackageFacts(saved)[1].value, 'Private group');
  assert.ok(!getPackageFacts(saved).some((fact) => fact.id === 'flights'));
});

test('empty and fully hidden bars never fall back to standard boxes after reopening', () => {
  assert.equal(getPackageFacts(withFacts([])).length, 0);
  assert.equal(getPackageFacts(withFacts(defaultPackageFacts().map((fact) => ({ ...fact, visible: false })))).length, 0);
  const saved = withFacts(defaultPackageFacts(), true);
  assert.equal(getPackageFacts(saved).length, 0);
  saved.details.factsHidden = false;
  assert.equal(getPackageFacts(saved).length, 6);
});

const { default: PackageFactsBar } = load('src/app/packages/_components/PackageFactsBar.tsx', {
  './PackageFactsBar.module.css': { default: {} },
  './PackageInlineEditing': { usePackageEditing: () => null, InlineText: ({ value }) => value, EditAction: () => null },
  'react/jsx-runtime': jsxRuntime,
  'lucide-react': icons,
  '@/lib/PackageGlyph': { PackageGlyph: () => null },
  '@/lib/packageFacts': load('src/lib/packageFacts.ts', { '@/lib/packageData': data }),
});
const renderFacts = (pkg) => renderToStaticMarkup(React.createElement(PackageFactsBar, {
  facts: getPackageFacts(pkg),
  permitRequired: data.getPackageDetails(pkg).permitRequired,
}));

test('required permits survive saving and render the official booking button', () => {
  const saved = roundTrip({ ...original, details: { ...data.getPackageDetails(original), permitRequired: true } });
  assert.equal(data.getPackageDetails(saved).permitRequired, true);
  const html = renderFacts(saved);
  assert.match(html, />Permit<\/p>/);
  assert.match(html, />Required<\/p>/);
  assert.match(html, /href="https:\/\/aranyavihaara.karnataka.gov.in\/"/);
  assert.match(html, /target="_blank"/);
  assert.match(html, /rel="noopener noreferrer"/);
  assert.match(html, /Book permit/);
});

test('not-required and older packages show the status without a booking link', () => {
  for (const permitRequired of [false, undefined]) {
    const pkg = roundTrip({ ...original, details: { ...data.getPackageDetails(original), permitRequired } });
    const html = renderFacts(pkg);
    assert.match(html, />Not required<\/p>/);
    assert.doesNotMatch(html, /Book permit|aranyavihaara/);
  }
});

test('turning the permit requirement off removes the booking button after reopening', () => {
  const saved = roundTrip({ ...original, details: { ...data.getPackageDetails(original), permitRequired: true } });
  saved.details.permitRequired = false;
  assert.doesNotMatch(renderFacts(roundTrip(saved)), /Book permit|aranyavihaara/);
});

test('hiding the details bar also hides the permit box', () => {
  const pkg = withFacts(defaultPackageFacts(), true);
  pkg.details.permitRequired = true;
  assert.equal(renderFacts(pkg), '');
});


test('one-day treks without a hotel do not advertise automatic starred stays', () => {
  const pkg = { ...original, nights: 1, days: 1, details: { ...data.getPackageDetails(original), stays: [] } };
  assert.equal(getPackageFacts(pkg).find((fact) => fact.source === 'duration').value, '1 night / 1 day');
  assert.equal(getPackageFacts(pkg).find((fact) => fact.source === 'stay').value, 'No accommodation');
  pkg.details.facts = [{ id: 'stay', source: 'stay', label: 'Stay', value: 'Camping available separately', visible: true }];
  assert.equal(getPackageFacts(pkg)[0].value, 'Camping available separately');
});

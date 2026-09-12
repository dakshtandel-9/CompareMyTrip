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

const { normalizeSiteContent, DEFAULT_SITE_CONTENT, SECTION_ORDER } = load('src/lib/siteContent.ts', {
  '@/lib/weekendTracks': load('src/lib/weekendTracks.ts'),
  '@/lib/comingSoon': load('src/lib/comingSoon.ts'),
});
const plain = (value) => JSON.parse(JSON.stringify(value));

test('existing CRM documents inherit separate Add On copy for every service', () => {
  const addOn = normalizeSiteContent({}).addOn;
  assert.deepEqual(plain(addOn), plain(DEFAULT_SITE_CONTENT.addOn));
  assert.ok(SECTION_ORDER.includes('addOn'));
  for (const field of ['eyebrow', 'title', 'description']) {
    assert.equal(new Set(Object.values(addOn.services).map((copy) => copy[field])).size, 4);
  }
});

test('independent service edits and intentionally cleared labels survive a publish round trip', () => {
  const addOn = plain(DEFAULT_SITE_CONTENT.addOn);
  for (const [id, copy] of Object.entries(addOn.services)) {
    copy.eyebrow = id === 'byq' ? '' : `Add On ${id}`;
    copy.title = `Custom ${id} heading`;
    copy.description = `Custom ${id} description`;
  }
  addOn.enabled = false;
  const published = normalizeSiteContent({ addOn });
  assert.deepEqual(plain(published.addOn), addOn);
  assert.deepEqual(plain(normalizeSiteContent(plain(published)).addOn), addOn);
});

test('partial or invalid service data falls back per field without overwriting valid edits', () => {
  const addOn = normalizeSiteContent({ addOn: { services: {
    flights: { title: 'Edited flight heading', eyebrow: 42 },
    hotels: null,
    visa: { description: 'Edited visa description' },
    byq: [],
  } } }).addOn;
  const expected = plain(DEFAULT_SITE_CONTENT.addOn);
  expected.services.flights.title = 'Edited flight heading';
  expected.services.visa.description = 'Edited visa description';
  assert.deepEqual(plain(addOn), expected);
});

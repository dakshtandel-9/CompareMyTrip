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
  assert.deepEqual(Object.keys(addOn.services), ['flights', 'hotels', 'visa', 'transport', 'byq']);
  for (const field of ['eyebrow', 'title', 'description']) {
    assert.equal(new Set(Object.values(addOn.services).map((copy) => copy[field])).size, 5);
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
    transport: { title: 'Your airport transfer', description: null },
    byq: [],
  } } }).addOn;
  const expected = plain(DEFAULT_SITE_CONTENT.addOn);
  expected.services.flights.title = 'Edited flight heading';
  expected.services.visa.description = 'Edited visa description';
  expected.services.transport.title = 'Your airport transfer';
  assert.deepEqual(plain(addOn), expected);
});

test('saved Add On menus receive Transport before Bring Your Quote without losing custom links', () => {
  const original = plain(DEFAULT_SITE_CONTENT.header.items.find((item) => item.id === 'nav-addon'));
  original.children = original.children.filter((child) => child.id !== 'nav-addon-5');
  original.label = 'Travel extras';
  original.children[0].label = 'Flight bookings';
  original.children.splice(2, 0, { id: 'custom', label: 'Travel insurance', href: '/contact' });
  const expected = plain(original);
  expected.children.splice(-1, 0, {
    id: 'nav-addon-5', label: 'Transport', href: '/add-on?service=transport',
  });

  const published = normalizeSiteContent({ header: { items: [original] } });
  assert.deepEqual(plain(published.header.items), [expected]);
  assert.deepEqual(plain(normalizeSiteContent(plain(published)).header.items), [expected]);
  assert.equal(original.children.some((child) => child.id === 'nav-addon-5'), false);
});

test('custom Transport menu entries keep their label and position without duplication', () => {
  for (const identity of ['id', 'href']) {
    const menu = plain(DEFAULT_SITE_CONTENT.header.items.find((item) => item.id === 'nav-addon'));
    menu.children = menu.children.filter((child) => child.id !== 'nav-addon-5');
    menu.children.unshift({
      id: identity === 'id' ? 'nav-addon-5' : 'custom-transport',
      label: 'Book a cab',
      href: identity === 'id' ? '/contact' : '/add-on?service=transport#add-on-enquiry',
    });
    const published = normalizeSiteContent({ header: { items: [menu] } });
    assert.deepEqual(plain(published.header.items), [menu]);
  }
});

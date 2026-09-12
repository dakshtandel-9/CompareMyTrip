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

const tracks = load('src/lib/weekendTracks.ts');
const { normalizeSiteContent, DEFAULT_SITE_CONTENT, SECTION_ORDER } = load('src/lib/siteContent.ts', {
  '@/lib/weekendTracks': tracks,
  '@/lib/comingSoon': load('src/lib/comingSoon.ts'),
});
const plain = (value) => JSON.parse(JSON.stringify(value));

test('older published documents inherit the gallery and expose its admin section', () => {
  assert.deepEqual(plain(normalizeSiteContent({}).gallery), plain(DEFAULT_SITE_CONTENT.gallery));
  assert.ok(SECTION_ORDER.includes('gallery'));
});

test('gallery image replacements, additions, deletions and ordering survive publishing', () => {
  const original = plain(DEFAULT_SITE_CONTENT.gallery);
  const replacement = { ...original.items[0], src: 'https://images.example.com/upload.jpg', caption: 'Updated caption', alt: 'Updated photo', wide: false };
  const added = { ...original.items[1], id: 'gallery-new', destination: 'New destination', credit: '', source: '' };
  const gallery = { ...original, header: { ...original.header, title: 'Our gallery' }, items: [added, replacement] };
  const published = normalizeSiteContent({ gallery });
  assert.deepEqual(plain(published.gallery), gallery);
  assert.deepEqual(plain(normalizeSiteContent(plain(published)).gallery), gallery);
});

test('removing all photos or hiding the section does not restore the original photos', () => {
  const gallery = normalizeSiteContent({ gallery: { enabled: false, items: [] } }).gallery;
  assert.equal(gallery.enabled, false);
  assert.equal(gallery.items.length, 0);
  assert.equal(normalizeSiteContent({ gallery }).gallery.items.length, 0);
});

test('blank images and missing optional fields are safe and invalid source links are removed', () => {
  const gallery = normalizeSiteContent({ gallery: { items: [null, { id: 'new', src: '  ', source: 'javascript:alert(1)' }] } }).gallery;
  assert.equal(gallery.items.length, 1);
  assert.equal(gallery.items[0].src, '');
  assert.equal(gallery.items[0].source, '');
  assert.equal(gallery.items[0].wide, false);
  assert.equal(gallery.items[0].credit, '');
});

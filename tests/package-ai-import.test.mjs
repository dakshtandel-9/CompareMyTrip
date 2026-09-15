import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as jsx from 'react/jsx-runtime';

function load(file, dependencies = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, URL, TextEncoder, require: name => { assert.ok(dependencies[name], name); return dependencies[name]; } });
  return exports;
}
const data = load('src/lib/packageData.ts');
const sections = load('src/lib/packageDetailSections.ts');
const names = JSON.parse(fs.readFileSync('src/lib/packageIconNames.json', 'utf8'));
const importer = load('src/lib/packageAiImport.ts', { './packageData': data, './packageDetailSections': sections, './packageIconNames.json': { default: names } });
const { parsePackageImport: parse, applyPackageImport: apply, PACKAGE_IMPORT_SCHEMA: schema } = importer;
const editor = load('src/app/admin/packages/catalogueEditorState.ts', { '@/lib/packageData': data, '@/lib/packageDetailSections': sections });
const prompt = load('src/lib/packageAiPrompt.ts', { './packageAiImport': importer }).packageAiPrompt;
const clone = value => JSON.parse(JSON.stringify(value));

// Adapt the already verified PDF fixtures to the content-only wire format.
function conform(value, definition) {
  if (definition.type === 'object') return Object.fromEntries(Object.entries(definition.properties).map(([key, child]) => [key, conform(value?.[key], child)]));
  if (definition.type === 'array') return (value ?? []).map(item => conform(item, definition.items));
  return value ?? (definition.type === 'boolean' ? true : definition.type === 'string' ? '' : 0);
}
function fixture(trek = false) {
  const pkg = JSON.parse(fs.readFileSync(`content/package-imports/${trek ? 'skandagiri-sunrise-trek-from-bangalore' : 'coorg-2-nights-3-days-holiday-package'}.json`, 'utf8'));
  const flat = { ...pkg, ...pkg.details, departureDays: [0, 6], dayZeroEnabled: trek, factsHidden: false };
  return conform({ kind: 'comparemytrip.product', version: 1, product: flat }, schema);
}
function current() {
  return {
    gallery: ['/uploaded-cover.jpg'], operator: 'Existing partner', status: 'draft', deal: true,
    pageSections: { ...sections.defaultPackagePageSections(), gallery: { enabled: false, images: ['/hidden-photo.jpg'] } },
  };
}

test('holiday and overnight trek PDFs fill the existing editor, preserving activity order and every section', () => {
  for (const trek of [false, true]) {
    const file = fixture(trek);
    const product = parse(JSON.stringify(file));
    const form = apply(current(), product);
    assert.equal(editor.packageValidationIssue(form), null);
    assert.equal(form.title, file.product.title);
    assert.equal(form.summary, file.product.summary);
    assert.equal(form.inclusions, file.product.inclusions.join('\n'));
    assert.equal(JSON.stringify(form.itinerary), JSON.stringify(file.product.itinerary));
    assert.equal(JSON.stringify(form.pageSections.sections), JSON.stringify(file.product.pageSections.sections));
    assert.equal(form.dayZeroEnabled, trek);
    assert.equal(form.itinerary[0].day, trek ? 0 : 1);
    assert.equal(form.pageSections.snapshotPlacement, trek ? 'intro' : 'about');
  }
});

test('import leaves identity, publishing, operator and uploads under editor control without mutating inputs', () => {
  const base = current();
  base.status = 'published';
  const photoLocation = { id: 'old', name: 'Airport', type: 'pickup', address: 'Terminal 1', image: '/airport.jpg', notes: '', mapUrl: '', visible: true };
  base.pageSections.locations.items = [photoLocation, { ...photoLocation, id: 'unmatched', name: 'Old hotel', image: '/hotel.jpg' }];
  const file = fixture();
  file.product.pageSections.locations = { enabled: true, items: [{ id: 'new-id', name: 'Airport', type: 'pickup', address: 'Terminal 1', notes: 'New text', mapUrl: '', visible: true }] };
  const product = parse(JSON.stringify(file));
  const before = JSON.stringify({ base, product });
  const form = apply(base, product);
  assert.equal(form.status, 'published'); assert.equal(form.operator, base.operator); assert.equal(form.deal, true);
  assert.equal(form.gallery[0], '/uploaded-cover.jpg');
  assert.equal(form.pageSections.locations.items[0].image, '/airport.jpg');
  assert.ok(form.pageSections.gallery.images.includes('/hidden-photo.jpg'));
  assert.ok(form.pageSections.gallery.images.includes('/hotel.jpg'));
  assert.equal(JSON.stringify({ base, product }), before);
});

test('rejects non-product files, privileged fields, wrong types, invalid icons and incomplete content', () => {
  for (const [change, expected] of [
    [file => { file.kind = 'comparemytrip.blog'; }, /choose one/],
    [file => { file.version = 2; }, /choose one/],
    [file => { file.product.status = 'published'; }, /unexpected field/],
    [file => { file.product.gallery = ['https://example.com/photo.jpg']; }, /unexpected field/],
    [file => { file.product.price = '₹5,000'; }, /number/],
    [file => { file.product.facts[0].icon = 'MadeUpIcon'; }, /supported list/],
    [file => { file.product.facts[0].visible = 'yes'; }, /true or false/],
    [file => { delete file.product.title; }, /missing field/],
    [file => { file.product.title = '  '; }, /characters/],
    [file => { file.product.departureDays = [9]; }, /between 0 and 6/],
    [file => { file.product.departureDays = [0, 0]; }, /duplicate/],
    [file => { file.product.facts.push(clone(file.product.facts[0])); }, /duplicate/],
    [file => { file.product.originalPrice = 1; }, /selling price/],
    [file => { file.product.price = 1; }, /discount/],
    [file => { file.product.days = 1.5; }, /whole number/],
    [file => { file.product.days = 31; }, /between 1 and 30/],
    [file => { file.product.pageSections.reviews.items = [{ id: 'r', name: 'Test', text: 'Review', rating: 6, visible: true }]; }, /between 1 and 5/],
  ]) {
    const file = fixture(); change(file);
    assert.throws(() => parse(JSON.stringify(file)), expected);
  }
});

test('rejects truncated/oversized JSON and prototype keys, accepts UTF-8 BOM', () => {
  assert.throws(() => parse('```json\n{}\n```'), /not valid JSON/);
  assert.throws(() => parse('{'), /not valid JSON/);
  assert.throws(() => parse(' '.repeat(1024 * 1024 + 1)), /1 MB/);
  assert.throws(() => parse(JSON.stringify([fixture()])), /object/);
  const file = JSON.stringify(fixture()).replace('"product":{', '"product":{"__proto__":{"polluted":true},');
  assert.throws(() => parse(file), /unexpected field/);
  assert.equal({}.polluted, undefined);
  assert.equal(parse('\uFEFF' + JSON.stringify(fixture())).title, fixture().product.title);
});

test('day zero is explicit and itinerary days must be unique, continuous and match duration', () => {
  for (const change of [
    file => { file.product.dayZeroEnabled = true; },
    file => { file.product.itinerary[1].day = 1; },
    file => { file.product.itinerary.pop(); },
  ]) {
    const file = fixture(); change(file);
    assert.throws(() => parse(JSON.stringify(file)), /Day 0|duplicate|include every day/);
  }
  const trek = fixture(true); trek.product.dayZeroEnabled = false;
  assert.throws(() => parse(JSON.stringify(trek)), /Day 1/);
});

test('real custom sections and safe locations are validated before they enter the form', () => {
  const file = fixture();
  file.product.pageSections.sections = [{ id: 'faq', title: 'FAQ', placement: 'faq', layout: 'dropdown', visible: true, body: '', items: [{ id: 'faq-1', title: 'Question', body: '', visible: true }] }];
  assert.throws(() => parse(JSON.stringify(file)), /title and text/);
  file.product.pageSections.sections[0].items[0].body = 'Answer';
  file.product.pageSections.locations = { enabled: true, items: [{ id: 'point', type: 'pickup', name: 'Airport', address: '', notes: '', mapUrl: 'javascript:alert(1)', visible: true }] };
  assert.throws(() => parse(JSON.stringify(file)), /HTTPS link/);
});

test('unpriced imports remain editable drafts and cannot pass published-price validation', () => {
  const file = fixture(); file.product.price = 0; file.product.originalPrice = 0;
  const form = apply(current(), parse(JSON.stringify(file)));
  assert.equal(form.price, ''); assert.equal(form.originalPrice, '');
  assert.equal(editor.packageValidationIssue(form), null);
  assert.match(editor.packageValidationIssue({ ...form, status: 'published' }).message, /price/);
});

test('all 1,000 prompt icons have matching SVG symbols, including existing travel icons', () => {
  assert.equal(names.length, 1000); assert.equal(new Set(names).size, 1000);
  const svg = fs.readFileSync('public/package-icons.svg', 'utf8');
  const symbols = [...svg.matchAll(/<symbol id="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(symbols, names);
  for (const name of ['Clock3', 'PlateAndCup', 'Plane', 'Users', 'Mountain', 'TreePalm']) assert.ok(names.includes(name));
  const { PackageGlyph } = load('src/lib/PackageGlyph.tsx', { './packageIconNames.json': { default: names }, 'react/jsx-runtime': jsx });
  const markup = renderToStaticMarkup(React.createElement(PackageGlyph, { name: names[800] }));
  assert.ok(markup.includes(`/package-icons.svg#${names[800]}`));
  assert.ok(renderToStaticMarkup(React.createElement(PackageGlyph, { name: '<script>' })).includes('#MapPin'));
});

test('copied prompt contains exactly the importer schema and asks questions before JSON when needed', () => {
  const text = prompt();
  assert.match(text, /DO NOT create JSON yet/); assert.match(text, /package-clarifications.pdf/);
  assert.match(text, /directly create the JSON without asking/);
  const embedded = JSON.parse(text.split('EXACT JSON SCHEMA (all objects disallow extra fields):\n')[1].split('\n\nNow read')[0]);
  delete embedded.$schema;
  assert.equal(JSON.stringify(embedded), JSON.stringify(schema));
});

// Exercise the upload/preview/apply event handlers without browser extension access.
// Hooks retain state between renders; parsing and form conversion use the real code.
function importerHarness(onApply) {
  const values = []; let cursor = 0;
  const hooks = {
    useState(initial) {
      const index = cursor++;
      if (!(index in values)) values[index] = typeof initial === 'function' ? initial() : initial;
      return [values[index], next => { values[index] = typeof next === 'function' ? next(values[index]) : next; }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in values)) values[index] = { current: initial };
      return values[index];
    },
  };
  const icons = Object.fromEntries(['Check', 'Copy', 'Download', 'FileJson', 'Sparkles', 'Upload'].map(name => [name, () => null]));
  const { default: Component } = load('src/app/admin/packages/PackageAiImporter.tsx', {
    react: hooks, 'react/jsx-runtime': jsx, 'lucide-react': icons,
    '@/lib/packageAiPrompt': { packageAiPrompt: prompt }, '@/lib/packageAiImport': importer,
  });
  let tree;
  function render(disabled = false) { cursor = 0; tree = Component({ disabled, onApply }); }
  function nodes(node) {
    if (!node || typeof node !== 'object') return [];
    if (Array.isArray(node)) return node.flatMap(nodes);
    return [node, ...nodes(node.props?.children)];
  }
  return {
    render,
    find: predicate => nodes(tree).find(predicate),
    async upload(file) {
      const input = nodes(tree).find(node => node.type === 'input');
      input.props.onChange({ target: { files: [file], value: 'selected' } });
      await new Promise(resolve => setImmediate(resolve)); render();
    },
  };
}

test('JSON upload previews first, applies only on click and clears an earlier preview on invalid upload', async () => {
  const applied = [];
  const ui = importerHarness(product => applied.push(product)); ui.render();
  const upload = data => ({ name: 'trip.json', size: 10000, text: async () => JSON.stringify(data) });
  await ui.upload(upload(fixture()));
  assert.equal(applied.length, 0);
  assert.ok(ui.find(node => node.type === 'button' && node.props.children === 'Apply to this product'));
  await ui.upload(upload({ kind: 'comparemytrip.blog' }));
  assert.ok(ui.find(node => node.props?.role === 'alert'));
  assert.equal(ui.find(node => node.type === 'button' && node.props.children === 'Apply to this product'), undefined);
  await ui.upload(upload(fixture(true)));
  ui.render(true);
  assert.equal(ui.find(node => node.type === 'button' && node.props.children === 'Apply to this product').props.disabled, true);
  ui.render();
  ui.find(node => node.type === 'button' && node.props.children === 'Apply to this product').props.onClick(); ui.render();
  assert.equal(applied.length, 1); assert.equal(applied[0].dayZeroEnabled, true);
  assert.equal(ui.find(node => node.type === 'button' && node.props.children === 'Apply to this product'), undefined);
});

test('file size and extension are checked before reading file content', async () => {
  const ui = importerHarness(() => assert.fail('must not apply')); ui.render();
  const text = () => { assert.fail('must not read'); };
  await ui.upload({ name: 'trip.pdf', size: 1, text });
  assert.match(ui.find(node => node.props?.role === 'alert').props.children, /PDFs belong in ChatGPT/);
  await ui.upload({ name: 'trip.json', size: 1024 * 1024 + 1, text });
  assert.match(ui.find(node => node.props?.role === 'alert').props.children, /1 MB/);
});

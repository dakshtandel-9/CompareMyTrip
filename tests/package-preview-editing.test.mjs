import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import * as jsx from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';

function load(file, dependencies = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    exports, URL, require: name => { assert.ok(dependencies[name], name); return dependencies[name]; },
  });
  return exports;
}
const data = load('src/lib/packageData.ts');
const sections = load('src/lib/packageDetailSections.ts');
const facts = load('src/lib/packageFacts.ts', { '@/lib/packageData': data });
const changes = load('src/lib/packagePreviewEditing.ts');
const model = load('src/app/admin/packages/packageFormModel.ts', { '@/lib/packageData': data, '@/lib/packageFacts': facts, '@/lib/packageDetailSections': sections, '@/lib/packagePreviewEditing': changes });
const { formFromPackage, packageFromForm, applyPackagePreviewChange: edit } = model;

test('section text upload stages content, applies explicitly, and rejects unsupported or oversized files', async () => {
  let cursor = 0; const slots = []; const applied = [];
  const hooks = { ...React, useId: () => 'section-content', useState(initial) {
    const i = cursor++; if (!(i in slots)) slots[i] = initial;
    return [slots[i], value => { slots[i] = value; }];
  } };
  const { default: TextEditor } = load('src/app/packages/_components/PackageSectionTextEditor.tsx', {
    react: hooks, 'react/jsx-runtime': jsx,
    './PackageInlineEditing': { usePackageEditing: () => ({ disabled: false, change: (...args) => applied.push(args) }) },
  });
  const path = ['details', 'transfers'];
  const render = () => { cursor = 0; return TextEditor({ value: 'Original', path, label: 'Transfers' }); };
  const nodes = node => !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(nodes) : [node, ...nodes(node.props?.children)];
  const input = () => nodes(render()).find(node => node.type === 'input');
  const textarea = () => nodes(render()).find(node => node.type === 'textarea');
  const button = label => nodes(render()).find(node => node.type === 'button' && node.props.children === label);
  textarea().props.onChange({ target: { value: 'Pasted copy' } });
  assert.equal(applied.length, 0);
  button('Reset text').props.onClick();
  assert.equal(textarea().props.value, 'Original');
  await input().props.onChange({ target: { files: [{ name: 'guidelines.md', size: 40, text: async () => '\uFEFF[Safety]\r\n- Carry water' }], value: 'guidelines.md' } });
  assert.equal(textarea().props.value, '[Safety]\n- Carry water');
  assert.equal(applied.length, 0);
  button('Apply text').props.onClick();
  assert.equal(applied[0][0], path);
  assert.equal(applied[0][1], '[Safety]\n- Carry water');
  let reads = 0;
  for (const file of [{ name: 'guide.pdf', size: 20 }, { name: 'guide.txt', size: 100001 }]) {
    await input().props.onChange({ target: { files: [{ ...file, text: async () => { reads++; return 'Invalid'; } }], value: file.name } });
    assert.equal(textarea().props.value, '[Safety]\n- Carry water');
  }
  assert.equal(reads, 0);
  await input().props.onChange({ target: { files: [{ name: 'guide.txt', size: 10, text: async () => { throw new Error('Read error'); } }], value: 'guide.txt' } });
  assert.match(nodes(render()).find(node => node.props?.role === 'status').props.children, /could not be read/);
  textarea().props.onChange({ target: { value: '' } });
  button('Apply text').props.onClick();
  assert.equal(applied[1][1], '');
});
const fixture = () => JSON.parse(fs.readFileSync('content/package-imports/skandagiri-sunrise-trek-from-bangalore.json', 'utf8'));

test('booking card edits survive saving, reopening and unrelated preview changes', () => {
  const pkg = fixture();
  let form = formFromPackage(pkg);
  form = edit(form, ['trekGrade'], 2, pkg);
  for (const [field, value] of Object.entries({ bookingLabel: 'Guided trek', availabilityNote: 'Permit confirmation required', quoteNote: 'Our team will confirm your pickup.', flights: '' })) {
    form = edit(form, ['details', field], value, pkg);
  }
  form = edit(form, ['departureDays'], [5, 6], pkg);
  form = edit(form, ['title'], 'Updated trek', pkg);
  const saved = JSON.parse(JSON.stringify(packageFromForm(form, pkg)));
  const reopened = formFromPackage(saved);
  assert.equal(reopened.trekGrade, 2);
  assert.equal(saved.details.bookingLabel, 'Guided trek');
  assert.equal(reopened.availabilityNote, 'Permit confirmation required');
  assert.equal(reopened.quoteNote, 'Our team will confirm your pickup.');
  assert.equal(reopened.flights, '');
  assert.deepEqual(Array.from(reopened.departureDays), [5, 6]);
  assert.equal(data.departureDaysLabel(saved), 'Fri & Sat only');
  form = edit(reopened, ['trekGrade'], 0, pkg);
  form = edit(form, ['details', 'availabilityNote'], '', pkg);
  form = edit(form, ['details', 'quoteNote'], '', pkg);
  const hidden = formFromPackage(JSON.parse(JSON.stringify(packageFromForm(form, pkg))));
  assert.equal(hidden.trekGrade, 0);
  assert.equal(hidden.availabilityNote, '');
  assert.equal(hidden.quoteNote, '');
  assert.equal(formFromPackage().trekGrade, 0);
});

test('legacy package booking fields stay unspecified until explicitly edited', () => {
  const pkg = fixture();
  const saved = packageFromForm(edit(formFromPackage(pkg), ['title'], 'Renamed trip', pkg), pkg);
  assert.equal(saved.trekGrade, undefined);
  assert.equal(saved.details.availabilityNote, undefined);
  assert.equal(saved.details.quoteNote, undefined);
});

test('edits in the preview round-trip through the saved package shape while preserving other content', () => {
  const pkg = fixture(); const form = formFromPackage(pkg); const before = JSON.stringify(form);
  let next = edit(form, ['title'], 'A revised trek', pkg);
  next = edit(next, ['details', 'itinerary', 0, 'activities', 0, 'title'], 'Revised pickup', pkg);
  next = edit(next, ['details', 'places'], 'Bengaluru, Skandagiri', pkg);
  const saved = packageFromForm(next, pkg);
  const reopened = formFromPackage(JSON.parse(JSON.stringify(saved)));
  assert.equal(reopened.title, 'A revised trek');
  assert.equal(reopened.itinerary[0].activities[0].title, 'Revised pickup');
  assert.equal(reopened.places, 'Bengaluru, Skandagiri');
  assert.equal(saved.id, pkg.id); assert.equal(saved.status, pkg.status);
  assert.equal(JSON.stringify(saved.details.pageSections.sections), JSON.stringify(form.pageSections.sections));
  assert.equal(JSON.stringify(saved.details.gallery), JSON.stringify(pkg.details.gallery));
  assert.equal(JSON.stringify(form), before);
});

test('Day 0 contents survive hiding, restoring, adding and removing regular days', () => {
  let form = formFromPackage(fixture());
  const overnight = JSON.stringify(form.itinerary[0]);
  form = edit(form, ['details', 'dayZeroEnabled'], false);
  assert.equal(JSON.stringify(form.itinerary[0]), overnight);
  form = edit(form, ['days'], 3);
  assert.equal(form.days, '3'); assert.equal(form.itinerary.length, 4);
  form = edit(form, ['details', 'dayZeroEnabled'], true);
  assert.equal(JSON.stringify(form.itinerary[0]), overnight);
  form = edit(form, ['details', 'itinerary'], form.itinerary.filter(day => day.day !== 2));
  assert.equal(form.days, '2'); assert.equal(form.itinerary.map(day => day.day).join(','), '0,1,2');
  form = edit(form, ['details', 'itinerary'], form.itinerary.filter(day => day.day !== 0));
  assert.equal(form.dayZeroEnabled, false);
});

test('new packages can add Day 0 and all edits remain draft until explicitly saved', () => {
  let form = formFromPackage();
  form = edit(form, ['details', 'dayZeroEnabled'], true);
  assert.equal(form.itinerary[0].day, 0); assert.equal(form.status, 'draft');
  assert.equal(packageFromForm(form).id, 'preview');
  form = edit(form, ['price'], 2500);
  assert.equal(form.originalPrice, '2500'); assert.equal(form.discount, '0');
  form = edit(form, ['originalPrice'], 5000);
  assert.equal(form.discount, '50'); assert.equal(form.price, '2500');
});

test('changing text does not repopulate cleared descriptions or discard hidden content', () => {
  let form = formFromPackage(fixture());
  form = edit(form, ['details', 'itinerary', 0, 'description'], '');
  form = edit(form, ['details', 'pageSections', 'hiddenSections'], ['about']);
  form = edit(form, ['title'], 'Changed title');
  assert.equal(form.itinerary[0].description, '');
  assert.equal(form.pageSections.hiddenSections[0], 'about');
  assert.ok(form.summary.length > 0);
});

test('invalid prototype paths are rejected without changing the package', () => {
  const pkg = fixture();
  assert.throws(() => changes.changePackageContent(pkg, ['__proto__', 'polluted'], true), /Invalid content path/);
  assert.equal({}.polluted, undefined);
});

const noop = () => null;
const iconMocks = Object.fromEntries(['Plus', 'Trash2', 'ArrowUp', 'ArrowDown', 'Upload'].map(name => [name, noop]));
const dependencies = { 'react/jsx-runtime': jsx, 'lucide-react': iconMocks, './PackageGallery': { default: noop }, './PackageInlineEditing.module.css': { default: {} } };
const inline = load('src/app/packages/_components/PackageInlineEditing.tsx', { ...dependencies, react: React });

test('public content contains ordinary escaped text and no editing controls', () => {
  const html = renderToStaticMarkup(React.createElement(inline.InlineText, { value: '<script>test</script>', path: ['title'], label: 'Title' }));
  assert.equal(html, '&lt;script&gt;test&lt;/script&gt;');
  assert.doesNotMatch(html, /input|textarea|role="button"/);
});

test('inline text stages changes, commits on blur and cancels with Escape', () => {
  let cursor = 0; const states = []; const changes = [];
  const context = { disabled: false, change: (...args) => changes.push(args) };
  const hooks = { ...React, useContext: () => context,
    useState(initial) { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], value => { states[i] = value; }]; },
    useRef(initial) { const i = cursor++; if (!(i in states)) states[i] = { current: initial }; return states[i]; },
  };
  const { InlineText } = load('src/app/packages/_components/PackageInlineEditing.tsx', { ...dependencies, react: hooks });
  const render = () => { cursor = 0; return InlineText({ value: 'Original title', path: ['title'], label: 'Title' }); };
  render().props.onClick({ stopPropagation() {} });
  render().props.onChange({ target: { value: 'Revised title' } });
  assert.equal(changes.length, 0);
  render().props.onBlur();
  assert.equal(changes[0][1], 'Revised title');
  render().props.onClick({ stopPropagation() {} });
  render().props.onChange({ target: { value: 'Discard this' } });
  render().props.onKeyDown({ key: 'Escape', stopPropagation() {}, preventDefault() {} });
  assert.equal(changes.length, 1);
  assert.equal(render().props.role, 'button');
});

test('admin Save uses edited preview data, keeps identity and images, and Undo restores the prior version', async () => {
  let cursor = 0; const slots = []; const saved = []; const messages = [];
  const hooks = { ...React, useEffect: () => {},
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], next => { slots[i] = typeof next === 'function' ? next(slots[i]) : next; }]; },
    useRef(initial) { const i = cursor++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i]; },
  };
  const exports = {};
  const dependencies = {
    react: hooks, 'react/jsx-runtime': jsx,
    'lucide-react': Object.fromEntries(['ArrowLeft','Save','Undo2','Eye','Pencil'].map(name => [name, noop])),
    '@/lib/packageData': data, '@/lib/packageDetailSections': sections,
    '@/lib/firebase/packages': { savePackage: async pkg => saved.push(pkg), uploadPackageImage: async () => '/uploaded.jpg' },
    '@/lib/cloudflareUpload': { PACKAGE_DRAFT_IMAGE_KEY_PREFIX: 'test-', deleteImageFromCloudflare: async () => {} },
    '@/lib/packageAiImport': { applyPackageImport: () => {} },
    '@/app/packages/[packageId]/PackageDetailClient': { default: noop },
    '@/app/packages/_components/PackageInlineEditing': inline,
    './AdminPackageBuilder.module.css': { default: {} },
    './PackageAiImporter': { default: noop }, './PackagePreviewSettings': { default: noop },
    '../_components/IconPicker': { default: noop }, '@/lib/packageIconNames.json': { default: [] }, '@/lib/PackageGlyph': { PackageGlyph: noop },
    './packageFormModel': model,
    './catalogueEditorState': load('src/app/admin/packages/catalogueEditorState.ts', { '@/lib/packageData': data, '@/lib/packageDetailSections': sections }),
    '../content/useUnsavedContentChanges': { useUnsavedContentChanges: () => {} },
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/admin/packages/AdminPackageBuilder.tsx','utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    exports, sessionStorage: { removeItem() {}, setItem() {} },
    require: name => { assert.ok(dependencies[name], name); return dependencies[name]; },
  });
  const pkg = fixture(); let tree;
  function render() { cursor = 0; tree = exports.default({ initialPackage: pkg, filedUnderOptions: { India: [], International: [] }, onCancel() {}, onSaved: text => messages.push(text) }); }
  function nodes(node) { if (!node || typeof node !== 'object') return []; if (Array.isArray(node)) return node.flatMap(nodes); return [node, ...nodes(node.props?.children)]; }
  const provider = () => nodes(tree).find(node => node.type === inline.PackageEditingContext.Provider);
  const button = label => nodes(tree).find(node => node.type === 'button' && JSON.stringify(node.props.children).includes(label));
  render(); provider().props.value.change(['title'], 'Preview change'); render();
  assert.equal(saved.length, 0); assert.equal(provider().props.value.value.title, 'Preview change');
  button('Undo').props.onClick(); render(); assert.equal(provider().props.value.value.title, pkg.title);
  provider().props.value.change(['title'], 'Final title'); render();
  button('Save package').props.onClick(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(saved.length, 1); assert.equal(saved[0].id, pkg.id); assert.equal(saved[0].title, 'Final title');
  assert.equal(saved[0].status, 'draft'); assert.equal(saved[0].image, pkg.image);
  assert.equal(messages.length, 1);
});

test('catalogue assignment and operator edits survive save and reopen', () => {
  const pkg = fixture();
  let form = formFromPackage(pkg);
  form = edit(form, ['destination'], 'Thailand', pkg);
  form = edit(form, ['region'], 'International', pkg);
  form = edit(form, ['operator'], 'Local Travel Partner', pkg);
  const reopened = formFromPackage(packageFromForm(form, pkg));
  assert.equal(reopened.destination, 'Thailand');
  assert.equal(reopened.region, 'International');
  assert.equal(reopened.operator, 'Local Travel Partner');
  assert.equal(packageFromForm(formFromPackage()).rating, 0);
});


test('permit visibility survives preview edits and save/reopen without changing the requirement', () => {
  const pkg = fixture();
  pkg.details.permitRequired = true;
  let form = edit(formFromPackage(pkg), ['details', 'permitHidden'], true, pkg);
  form = edit(form, ['title'], 'Updated trek', pkg);
  const reopened = formFromPackage(JSON.parse(JSON.stringify(packageFromForm(form, pkg))));
  assert.equal(reopened.permitHidden, true);
  assert.equal(reopened.permitRequired, true);
  const visible = edit(reopened, ['details', 'permitHidden'], false, pkg);
  assert.equal(packageFromForm(visible, pkg).details.permitHidden, false);
  assert.equal(formFromPackage().permitHidden, false);
});

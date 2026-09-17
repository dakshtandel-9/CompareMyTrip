import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import * as jsx from 'react/jsx-runtime';

function load(path, dependencies = {}) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(source, { exports, Error, crypto: { randomUUID: () => 'new-id' }, require: name => { assert.ok(dependencies[name], name); return dependencies[name]; } });
  return exports;
}
const data = load('src/lib/packageDetailSections.ts');
const plain = value => JSON.parse(JSON.stringify(value));
const tick = () => new Promise(resolve => setImmediate(resolve));
const text = node => Array.isArray(node) ? node.map(text).join('') : typeof node === 'string' || typeof node === 'number' ? String(node) : node?.props ? text(node.props.children) : '';
const visibleNodes = node => {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(visibleNodes);
  if (node.props?.hidden) return [];
  if (typeof node.type === 'function') return visibleNodes(node.type(node.props));
  return [node, ...visibleNodes(node.props?.children)];
};
const fixture = () => ({
  ...plain(data.defaultPackagePageSections()),
  sections: [
    { id: 'story', placement: 'overview', title: 'Story', layout: 'dropdown', visible: false, body: 'Original introduction', items: [{ id: 'story-item', title: 'Details', body: 'Original answer', visible: false }] },
    { id: 'extra', placement: 'extras', title: 'Other section', layout: 'box', visible: true, body: 'Unrelated content', items: [] },
  ],
  gallery: { enabled: false, images: ['/extra-one.jpg', '/extra-two.jpg'] },
  locations: { enabled: false, items: [{ id: 'pickup', name: 'Meeting point', type: 'pickup', address: 'Address', notes: 'Old instructions', mapUrl: '', image: '/pickup.jpg', visible: false }] },
  reviews: { enabled: false, items: [{ id: 'review', name: 'Traveller', rating: 4, text: 'Original review', visible: false }] },
});

function createEditor({ focus = 'gallery', value = fixture(), busy = false, upload = async files => files.map(file => `/uploaded/${file.name}`) } = {}) {
  let cursor = 0;
  const slots = [];
  const changes = [];
  const uploads = [];
  const original = plain(value);
  const hooks = {
    ...React, useId: () => 'test-id',
    useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], next => { slots[index] = next; }]; },
    useRef(initial) { const index = cursor++; if (!(index in slots)) slots[index] = { current: initial }; return slots[index]; },
  };
  const { default: Editor } = load('src/app/admin/packages/PackagePageSectionsEditor.tsx', {
    react: hooks, 'react/jsx-runtime': jsx,
    'next/image': { default: props => React.createElement('img', props) },
    'lucide-react': new Proxy({}, { get: () => () => null }),
    '@/lib/packageDetailSections': data,
    '@/app/packages/_components/PackagePageSections': { default: () => null },
    '../_components/ui': {
      FieldLabel: props => React.createElement('span', null, props.children),
      inputClass: '', Toggle: props => React.createElement('input', { 'aria-label': props.label, checked: props.checked, onChange: event => props.onChange(event.target.checked) }),
    },
    './PackageContentField': { default: props => React.createElement('textarea', { 'aria-label': props.label, value: props.value, disabled: props.disabled, onChange: event => props.onChange(event.target.value) }) },
  });
  const render = () => { cursor = 0; return Editor({ focus, value, busy, allowReviews: true, onChange: next => { changes.push(plain(next)); value = next; }, onUploadImages: async files => { uploads.push(files); return upload(files); } }); };
  const find = (tag, label) => {
    const found = visibleNodes(render()).find(node => node.type === tag && (node.props['aria-label'] === label || text(node.props.children) === label));
    assert.ok(found, `${tag}: ${label}`);
    return found;
  };
  return {
    render, find, changes, uploads, original,
    get value() { return plain(value); },
    async select(label, files) { const target = { files, value: 'selected' }; find('input', label).props.onChange({ target }); assert.equal(target.value, ''); await tick(); },
    status() { return visibleNodes(render()).filter(node => node.props?.role === 'alert' || node.props?.role === 'status').map(node => text(node.props.children)).join(' '); },
  };
}
const photo = (name = 'replacement.jpg') => ({ name, type: 'image/jpeg', size: 100 });

test('gallery focus shows only the optional gallery and keeps hidden photos editable', async () => {
  const editor = createEditor();
  const visible = visibleNodes(editor.render());
  assert.ok(visible.some(node => node.type === 'h2' && text(node.props.children) === 'Photo gallery'));
  assert.equal(visible.filter(node => node.type === 'textarea').length, 0);
  assert.equal(editor.find('input', 'Show extra photo gallery').props.checked, false);
  await editor.select('Replace gallery photo 1', [photo()]);
  assert.deepEqual(editor.value.gallery, { enabled: false, images: ['/uploaded/replacement.jpg', '/extra-two.jpg'] });
  assert.deepEqual(editor.value.sections, editor.original.sections);
  assert.deepEqual(editor.value.locations, editor.original.locations);
  assert.deepEqual(editor.value.reviews, editor.original.reviews);
});

test('hidden locations support text imports and direct photo replacement without enabling the section', async () => {
  const editor = createEditor({ focus: 'locations' });
  editor.find('textarea', 'Meeting time & instructions (optional)').props.onChange({ target: { value: 'Imported\ninstructions' } });
  await editor.select('Replace photo for location 1', [photo('location.jpg')]);
  assert.equal(editor.value.locations.enabled, false);
  assert.equal(editor.value.locations.items[0].visible, false);
  assert.equal(editor.value.locations.items[0].notes, 'Imported\ninstructions');
  assert.equal(editor.value.locations.items[0].image, '/uploaded/location.jpg');
  assert.deepEqual(editor.value.gallery, editor.original.gallery);
});

test('hidden traveller reviews remain editable with a clear visibility label', () => {
  const editor = createEditor({ focus: 'reviews' });
  assert.equal(editor.find('input', 'Show traveller reviews').props.checked, false);
  editor.find('textarea', 'Review text').props.onChange({ target: { value: 'A traveller\nreview' } });
  assert.equal(editor.value.reviews.enabled, false);
  assert.equal(editor.value.reviews.items[0].visible, false);
  assert.equal(editor.value.reviews.items[0].text, 'A traveller\nreview');
  assert.equal(editor.value.reviews.items[0].name, 'Traveller');
  assert.equal(editor.value.reviews.items[0].rating, 4);
});

test('section and nested item content fields update only their own bodies, including hidden entries', () => {
  const editor = createEditor({ focus: 'overview' });
  editor.find('textarea', 'Introduction (optional)').props.onChange({ target: { value: '[Heading]\nNew introduction' } });
  editor.find('textarea', 'Details or answer').props.onChange({ target: { value: '- Imported answer' } });
  assert.equal(editor.value.sections[0].body, '[Heading]\nNew introduction');
  assert.equal(editor.value.sections[0].items[0].body, '- Imported answer');
  assert.equal(editor.value.sections[0].visible, false);
  assert.equal(editor.value.sections[0].items[0].visible, false);
  assert.deepEqual(editor.value.sections[1], editor.original.sections[1]);
});

test('scoped sections can move to every placement without losing content and point to the matching editor area', () => {
  const destinations = {
    highlights: 'Highlights', transfers: 'Transfers & trek details', carry: 'Transfers & trek details',
    guidelines: 'Transfers & trek details', practical: 'Transfers & trek details', faq: 'FAQs', extras: 'Additional sections',
  };
  for (const [placement, label] of Object.entries(destinations)) {
    const editor = createEditor({ focus: 'overview' });
    const select = editor.find('select', 'Position for section 1');
    assert.deepEqual(select.props.children.map(option => option.props.value), data.PACKAGE_SECTION_PLACEMENTS.map(option => option.id));
    select.props.onChange({ target: { value: placement } });
    assert.deepEqual(editor.value.sections[0], { ...editor.original.sections[0], placement });
    assert.deepEqual(editor.value.sections[1], editor.original.sections[1]);
    assert.equal(visibleNodes(editor.render()).filter(node => node.type === 'textarea').length, 0);
    assert.equal(editor.status(), `Section moved to ${label}. Open that section in the editor to continue.`);
  }
  const extras = createEditor({ focus: 'extras' });
  extras.find('select', 'Position for section 1').props.onChange({ target: { value: 'overview' } });
  assert.deepEqual(extras.value.sections[1], { ...extras.original.sections[1], placement: 'overview' });
  assert.match(extras.status(), /Section moved to Overview & story/);
});

test('full galleries allow replacement without dropping images or changing their order', async () => {
  const value = fixture();
  value.gallery.images = Array.from({ length: 20 }, (_, index) => `/image-${index}.jpg`);
  const editor = createEditor({ value });
  await editor.select('Upload gallery photos (20/20)', [photo()]);
  assert.equal(editor.uploads.length, 0);
  await editor.select('Replace gallery photo 10', [photo()]);
  assert.equal(editor.value.gallery.images.length, 20);
  assert.equal(editor.value.gallery.images[9], '/uploaded/replacement.jpg');
  assert.deepEqual(editor.value.gallery.images.slice(10), editor.original.gallery.images.slice(10));
  assert.equal(editor.value.gallery.enabled, false);
});

test('failed or overlapping replacement uploads preserve the previous image and release the lock', async () => {
  const failed = createEditor({ upload: async () => { throw new Error('Upload unavailable'); } });
  await failed.select('Replace gallery photo 1', [photo()]);
  assert.equal(failed.changes.length, 0);
  assert.match(failed.status(), /Upload unavailable/);
  let finish;
  const pending = createEditor({ upload: () => new Promise(resolve => { finish = resolve; }) });
  await pending.select('Replace gallery photo 1', [photo()]);
  await pending.select('Replace gallery photo 2', [photo('another.jpg')]);
  assert.equal(pending.uploads.length, 1);
  assert.deepEqual(pending.value.gallery, pending.original.gallery);
  finish(['/replacement.jpg']);
  await tick();
  assert.deepEqual(pending.value.gallery.images, ['/replacement.jpg', '/extra-two.jpg']);
  assert.equal(pending.find('input', 'Replace gallery photo 1').props.disabled, false);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import * as jsx from 'react/jsx-runtime';

const source = ts.transpileModule(fs.readFileSync('src/app/admin/packages/PackageImagesEditor.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const plain = value => JSON.parse(JSON.stringify(value));
const tick = () => new Promise(resolve => setImmediate(resolve));
const text = node => Array.isArray(node) ? node.map(text).join('') : typeof node === 'string' || typeof node === 'number' ? String(node) : node?.props ? text(node.props.children) : '';
const nodes = node => !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(nodes) : [node, ...nodes(node.props?.children)];
const photo = (name = 'photo.jpg', type = 'image/jpeg', size = 100) => ({ name, type, size });

function createEditor({ gallery = ['/one.jpg', '/two.jpg'], image = '/separate-cover.jpg', disabled = false, upload = async files => files.map(file => `/uploaded/${file.name}`) } = {}) {
  let cursor = 0;
  const slots = [];
  const changes = [];
  const uploads = [];
  let pkg = { id: 'test-trip', image, details: { gallery, pageSections: { gallery: { enabled: false, images: ['/hidden.jpg'] } } } };
  const original = plain(pkg);
  const hooks = {
    ...React,
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
  };
  const dependencies = {
    react: hooks,
    'react/jsx-runtime': jsx,
    'next/image': { default: () => null },
    'lucide-react': new Proxy({}, { get: () => () => null }),
    '@/components/Modal': { default: () => null },
    '@/lib/packageData': { getPackageDetails: value => value.details },
  };
  const exports = {};
  vm.runInNewContext(source, { exports, Error, require: name => { assert.ok(dependencies[name], name); return dependencies[name]; } });
  const render = () => {
    cursor = 0;
    return exports.default({
      pkg, disabled, change: () => assert.fail('image mutations must be atomic'),
      onUploadImages: async files => { uploads.push(files); return upload(files); },
      onChangeImages: value => {
        changes.push(plain(value));
        pkg = { ...pkg, image: value.image, details: { ...pkg.details, gallery: value.gallery } };
      },
    });
  };
  const find = (tag, label) => {
    const result = nodes(render()).find(node => node.type === tag && (node.props['aria-label'] === label || text(node.props.children) === label));
    assert.ok(result, `${tag}: ${label}`);
    return result;
  };
  return {
    render, find, changes, uploads, original,
    get pkg() { return pkg; },
    click(label) { find('button', label).props.onClick(); },
    async select(label, files) {
      const target = { files, value: 'selected-files' };
      find('input', label).props.onChange({ target });
      assert.equal(target.value, '');
      await tick();
    },
    status() { return nodes(render()).filter(node => node.props?.role === 'status' || node.props?.role === 'alert').map(node => text(node.props.children)).join(' '); },
  };
}

test('cover selection and gallery reordering are independent and keep unrelated hidden images', () => {
  const editor = createEditor();
  assert.equal(editor.changes.length, 0);
  assert.equal(editor.find('button', 'Preview cover image').props.children.props.src, '/separate-cover.jpg');
  editor.click('Use gallery photo 2 as cover');
  assert.deepEqual(editor.changes.at(-1), { image: '/two.jpg', gallery: ['/one.jpg', '/two.jpg'] });
  editor.click('Move gallery photo 2 earlier');
  assert.deepEqual(editor.changes.at(-1), { image: '/two.jpg', gallery: ['/two.jpg', '/one.jpg'] });
  editor.click('Remove gallery photo 1');
  assert.deepEqual(editor.changes.at(-1), { image: '/two.jpg', gallery: ['/one.jpg'] });
  editor.click('Remove gallery photo 1');
  assert.deepEqual(editor.changes.at(-1), { image: '/two.jpg', gallery: [] });
  assert.match(text(editor.render()), /No gallery photos yet/);
  assert.deepEqual(plain(editor.pkg.details.pageSections.gallery), { enabled: false, images: ['/hidden.jpg'] });
  assert.deepEqual(editor.original.details.gallery, ['/one.jpg', '/two.jpg']);
});

test('batch upload appends every successful file in order and replacement keeps the separate cover', async () => {
  const editor = createEditor();
  await editor.select('Upload top gallery photos', [photo('three.jpg'), photo('four.webp', 'image/webp')]);
  assert.deepEqual(editor.changes.at(-1), { image: '/separate-cover.jpg', gallery: ['/one.jpg', '/two.jpg', '/uploaded/three.jpg', '/uploaded/four.webp'] });
  editor.click('Replace gallery photo 2');
  await editor.select('Upload replacement gallery photo', [photo('replacement.png', 'image/png')]);
  assert.deepEqual(editor.changes.at(-1), { image: '/separate-cover.jpg', gallery: ['/one.jpg', '/uploaded/replacement.png', '/uploaded/three.jpg', '/uploaded/four.webp'] });
  assert.equal(editor.uploads.length, 2);
});

test('cover replacement and removal preserve all gallery photos', async () => {
  const editor = createEditor();
  await editor.select('Upload cover image', [photo('cover.jpg')]);
  assert.deepEqual(editor.changes.at(-1), { image: '/uploaded/cover.jpg', gallery: ['/one.jpg', '/two.jpg'] });
  editor.click('Remove cover');
  assert.deepEqual(editor.changes.at(-1), { image: '', gallery: ['/one.jpg', '/two.jpg'] });
});

test('invalid files and over-capacity selections never upload or change the draft', async () => {
  const editor = createEditor({ gallery: Array.from({ length: 9 }, (_, index) => `/photo-${index}.jpg`) });
  await editor.select('Upload top gallery photos', [photo('large.jpg', 'image/jpeg', 5_000_001)]);
  assert.match(editor.status(), /5 MB/);
  await editor.select('Upload cover image', [photo('notes.pdf', 'application/pdf')]);
  assert.match(editor.status(), /JPG, PNG or WebP/);
  await editor.select('Upload top gallery photos', [photo('one.jpg'), photo('two.jpg')]);
  assert.match(editor.status(), /1 more photo/);
  assert.equal(editor.uploads.length, 0);
  assert.equal(editor.changes.length, 0);
});

test('failed uploads leave saved images intact; partial uploads retain successes and show a retry message', async () => {
  const failed = createEditor({ upload: async () => { throw new Error('Upload unavailable'); } });
  await failed.select('Upload top gallery photos', [photo()]);
  assert.equal(failed.changes.length, 0);
  assert.match(failed.status(), /Upload unavailable/);
  assert.equal(failed.find('button', 'Add gallery photos').props.disabled, false);
  const partial = createEditor({ upload: async () => ['/success.jpg'] });
  await partial.select('Upload top gallery photos', [photo('one.jpg'), photo('two.jpg')]);
  assert.deepEqual(partial.changes.at(-1).gallery, ['/one.jpg', '/two.jpg', '/success.jpg']);
  assert.match(partial.status(), /Some files did not upload/);
});

test('disabled or in-flight editors block mutations and overlapping uploads', async () => {
  const disabled = createEditor({ disabled: true });
  disabled.click('Remove cover');
  disabled.click('Use gallery photo 2 as cover');
  await disabled.select('Upload top gallery photos', [photo()]);
  assert.equal(disabled.changes.length, 0);
  assert.equal(disabled.uploads.length, 0);
  let finish;
  const busy = createEditor({ upload: () => new Promise(resolve => { finish = resolve; }) });
  await busy.select('Upload top gallery photos', [photo()]);
  assert.equal(busy.find('button', 'Add gallery photos').props.disabled, true);
  busy.click('Remove cover');
  await busy.select('Upload cover image', [photo('another.jpg')]);
  assert.equal(busy.uploads.length, 1);
  assert.equal(busy.changes.length, 0);
  finish(['/success.jpg']);
  await tick();
  assert.equal(busy.changes.length, 1);
});

test('legacy galleries over the limit remain fully visible and are not silently truncated', () => {
  const gallery = Array.from({ length: 12 }, (_, index) => `/photo-${index}.jpg`);
  const editor = createEditor({ gallery });
  assert.ok(editor.find('button', 'Preview gallery photo 12'));
  assert.equal(editor.find('button', 'Add gallery photos').props.disabled, true);
  assert.equal(editor.changes.length, 0);
  editor.click('Remove gallery photo 2');
  assert.equal(editor.changes.at(-1).gallery.length, 11);
  assert.equal(editor.changes.at(-1).gallery.at(-1), '/photo-11.jpg');
});

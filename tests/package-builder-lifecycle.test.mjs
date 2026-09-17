import { richTextDependencies } from "./helpers/package-rich-text.mjs";
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as jsx from 'react/jsx-runtime';

function load(file, dependencies = {}, globals = {}) {
  dependencies = { ...richTextDependencies, ...dependencies };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, URL, Error, ...globals, require(name) { assert.ok(dependencies[name], name); return dependencies[name]; } });
  return exports;
}
const data = load('src/lib/packageData.ts');
const sections = load('src/lib/packageDetailSections.ts');
const facts = load('src/lib/packageFacts.ts', { '@/lib/packageData': data });
const changes = load('src/lib/packagePreviewEditing.ts');
const model = load('src/app/admin/packages/packageFormModel.ts', {
  '@/lib/packageData': data, '@/lib/packageFacts': facts,
  '@/lib/packageDetailSections': sections, '@/lib/packagePreviewEditing': changes,
});
const validation = load('src/app/admin/packages/catalogueEditorState.ts', { '@/lib/packageData': data, '@/lib/packageDetailSections': sections });
const noop = () => null;
const DetailEditor = noop;
const nodes = node => !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(nodes) : [node, ...nodes(node.props?.children)];
const text = node => node === null || node === undefined || typeof node === 'boolean' ? '' : typeof node !== 'object' ? String(node) : Array.isArray(node) ? node.map(text).join('') : text(node.props?.children);
const clone = value => JSON.parse(JSON.stringify(value));
const settle = () => new Promise(resolve => setImmediate(resolve));

function fixture() {
  const pkg = JSON.parse(fs.readFileSync('content/package-imports/skandagiri-sunrise-trek-from-bangalore.json', 'utf8'));
  Object.assign(pkg, { status: 'published', price: 799, originalPrice: 999, discount: 20 });
  pkg.image = 'https://cdn.example/saved-cover.jpg';
  pkg.details.gallery = ['https://cdn.example/shared-hero.jpg'];
  pkg.details.pageSections.gallery = { enabled: false, images: ['https://cdn.example/hidden-gallery.jpg'] };
  pkg.details.pageSections.locations = { enabled: false, items: [{ id: 'saved-location', type: 'pickup', name: 'Saved pickup', address: '', notes: '', mapUrl: '', image: 'https://cdn.example/hidden-location.jpg', visible: false }] };
  return pkg;
}

function harness({ saveError, refreshWarning = '', uploadFails = [], uploadBarrier, cleanupFails = [], pending = [], protectedImages = [] } = {}) {
  const pkg = fixture();
  const key = `cmt:package-draft-images:${pkg.id}`;
  const storage = { [key]: JSON.stringify(pending) };
  const sessionStorage = {
    getItem: key => storage[key] ?? null,
    setItem: (key, value) => { storage[key] = value; },
    removeItem: key => { delete storage[key]; },
  };
  const calls = { saved: [], deleted: [], uploaded: [], success: [], cancelled: 0, confirmations: 0 };
  const slots = [];
  let cursor = 0;
  let effects = [];
  const hooks = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], next => { slots[index] = typeof next === 'function' ? next(slots[index]) : next; }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
    useEffect(callback, dependencies) {
      const index = cursor++;
      if (!(index in slots) || dependencies.some((value, item) => value !== slots[index][item])) effects.push(callback);
      slots[index] = dependencies;
    },
  };
  const { default: Builder } = load('src/app/admin/packages/AdminPackageBuilder.tsx', {
    react: hooks, 'react/jsx-runtime': jsx,
    'lucide-react': Object.fromEntries(['ArrowLeft', 'Save', 'Undo2', 'Eye', 'Pencil'].map(name => [name, noop])),
    '@/lib/packageData': data, '@/lib/packageDetailSections': sections,
    '@/lib/firebase/packages': {
      savePackage: async value => { calls.saved.push(clone(value)); if (saveError) throw new Error(saveError); return { refreshWarning }; },
      uploadPackageImage: async file => { calls.uploaded.push(file.name); if (uploadBarrier) await uploadBarrier; if (uploadFails.includes(file.name)) throw new Error('Upload failed'); return `https://cdn.example/${file.name}`; },
    },
    '@/lib/cloudflareUpload': {
      PACKAGE_DRAFT_IMAGE_KEY_PREFIX: 'cmt:package-draft-images:',
      deleteImageFromCloudflare: async url => { calls.deleted.push(url); if (cleanupFails.includes(url)) throw new Error('Cleanup failed'); },
    },
    '@/lib/packageAiImport': { applyPackageImport: noop },
    '@/app/packages/[packageId]/PackageDetailClient': { default: noop },
    '@/app/packages/[packageId]/BookingCard': { default: noop },
    './AdminPackageBuilder.module.css': { default: new Proxy({}, { get: (_, key) => key }) },
    './PackageVisualEditor': { default: noop },
    './PackageAiImporter': { default: noop },
    './PackageDetailEditor': { default: DetailEditor },
    './PackageContentField': { PackageContentIOContext: { Provider: 'content-io-context' } },
    './packageFormModel': model, './catalogueEditorState': validation,
    '../content/useUnsavedContentChanges': { useUnsavedContentChanges: noop },
  }, {
    sessionStorage,
    window: { confirm: () => { calls.confirmations++; return true; }, requestAnimationFrame: callback => callback() },
    document: { getElementById: () => null },
  });
  const render = () => {
    cursor = 0; effects = [];
    const result = Builder({ initialPackage: pkg, protectedImages, filedUnderOptions: { India: ['Karnataka'], International: [] }, onCancel: () => { calls.cancelled++; }, onSaved: message => calls.success.push(message) });
    effects.forEach(callback => callback());
    return result;
  };
  const find = predicate => { const match = nodes(render()).find(predicate); assert.ok(match, 'Expected builder element'); return match; };
  render();
  return {
    calls, storage, key, render, pkg,
    get editor() { return find(node => node.type === DetailEditor && node.props.form).props; },
    get visual() { return find(node => node.props?.page && node.props?.onSelect && node.props?.pkg).props; },
    button: label => find(node => node.type === 'button' && text(node) === label),
    reportReading: delta => find(node => node.type === 'content-io-context').props.value(delta),
    messages: () => nodes(render()).filter(node => node.props?.role === 'alert' || node.props?.role === 'status').map(text),
    async upload(names) { return this.editor.onUploadImages(names.map(name => ({ name, type: 'image/jpeg', size: 1000 }))); },
    async click(label) { this.button(label).props.onClick(); await settle(); },
  };
}

test('builder successful Save keeps hidden and shared assets and reports a refresh warning as saved', async () => {
  const oldCover = 'https://cdn.example/saved-cover.jpg';
  const editor = harness({ refreshWarning: 'Package was saved; refresh is delayed.', protectedImages: [oldCover, 'https://cdn.example/shared-hero.jpg'] });
  const uploaded = await editor.upload(['new-cover.jpg', 'new-hero.jpg']);
  editor.editor.onChange({ ...editor.editor.form, image: uploaded[0], gallery: [uploaded[1]] });
  await editor.click('Save package');
  assert.equal(editor.calls.saved.length, 1);
  assert.equal(editor.calls.saved[0].image, uploaded[0]);
  assert.equal(editor.calls.saved[0].details.pageSections.gallery.images[0], 'https://cdn.example/hidden-gallery.jpg');
  assert.equal(editor.calls.saved[0].details.pageSections.locations.items[0].image, 'https://cdn.example/hidden-location.jpg');
  assert.equal(editor.calls.deleted.length, 0);
  assert.equal(editor.storage[editor.key], undefined);
  assert.equal(editor.calls.success.length, 1);
  assert.match(editor.calls.success[0], /refresh is delayed/);
});

test('builder failed Save leaves the draft and upload queue intact for retry or Cancel', async () => {
  const editor = harness({ saveError: 'Database unavailable' });
  const uploaded = await editor.upload(['new.jpg']);
  editor.editor.onChange({ ...editor.editor.form, gallery: uploaded });
  await editor.click('Save package');
  assert.equal(editor.calls.saved.length, 1);
  assert.equal(editor.calls.success.length, 0);
  assert.equal(editor.calls.deleted.length, 0);
  assert.deepEqual(JSON.parse(editor.storage[editor.key]), clone(uploaded));
  assert.deepEqual(clone(editor.editor.form.gallery), clone(uploaded));
  assert.ok(editor.messages().includes('Database unavailable'));
  await editor.click('Back to packages');
  assert.deepEqual(editor.calls.deleted, clone(uploaded));
  assert.equal(editor.calls.cancelled, 1);
});

test('builder tracks partial image uploads and Cancel deletes only unsaved uploads', async () => {
  const editor = harness({ uploadFails: ['bad.jpg'], pending: ['https://cdn.example/saved-cover.jpg', 'https://cdn.example/abandoned.jpg'] });
  const uploaded = await editor.upload(['good.jpg', 'bad.jpg']);
  assert.deepEqual(clone(uploaded), ['https://cdn.example/good.jpg']);
  assert.ok(editor.messages().some(message => /1 image uploaded/.test(message)));
  await editor.click('Back to packages');
  assert.deepEqual(editor.calls.deleted, ['https://cdn.example/abandoned.jpg', 'https://cdn.example/good.jpg']);
  assert.equal(editor.storage[editor.key], undefined);
  assert.equal(editor.calls.saved.length, 0);
});

test('builder keeps failed cleanup queued after a successful save', async () => {
  const oldCover = 'https://cdn.example/saved-cover.jpg';
  const editor = harness({ cleanupFails: [oldCover] });
  editor.editor.onChange({ ...editor.editor.form, image: 'https://cdn.example/shared-hero.jpg' });
  await editor.click('Save package');
  assert.equal(editor.calls.success.length, 1);
  assert.match(editor.calls.success[0], /cleanup will retry/);
  assert.deepEqual(JSON.parse(editor.storage[editor.key]), [oldCover]);
});

test('builder Cancel protects recovered queued images already used by other packages', async () => {
  const shared = 'https://cdn.example/another-package-cover.jpg';
  const abandoned = 'https://cdn.example/abandoned.jpg';
  const editor = harness({ pending: [shared, abandoned], protectedImages: [shared] });
  await editor.click('Back to packages');
  assert.deepEqual(editor.calls.deleted, [abandoned]);
  assert.equal(editor.storage[editor.key], undefined);
});

test('builder prevents Save and competing edits until pending image and text imports finish', async () => {
  let finishUpload;
  const uploadBarrier = new Promise(resolve => { finishUpload = resolve; });
  const editor = harness({ uploadBarrier });
  const uploading = editor.upload(['pending.jpg']);
  assert.equal(editor.button('Save package').props.disabled, true);
  assert.equal(editor.editor.disabled, true);
  await editor.click('Save package');
  assert.equal(editor.calls.saved.length, 0);
  finishUpload();
  const uploaded = await uploading;
  editor.editor.onChange({ ...editor.editor.form, gallery: uploaded });
  editor.reportReading(1);
  assert.equal(editor.button('Save package').props.disabled, true);
  await editor.click('Save package');
  assert.equal(editor.calls.saved.length, 0);
  editor.reportReading(-1);
  assert.equal(editor.button('Save package').props.disabled, false);
  await editor.click('Save package');
  assert.equal(editor.calls.saved.length, 1);
  assert.deepEqual(editor.calls.saved[0].details.gallery, clone(uploaded));
});


test('builder opens on the live page, selects editor sections and preserves drafts in clean preview', async () => {
  const editor = harness();
  assert.equal(editor.visual.editing, true);
  assert.equal(editor.visual.open, false);
  assert.equal(editor.visual.page.props.publicPreview, true);
  editor.visual.onSelect('images');
  assert.equal(editor.visual.open, true);
  assert.equal(editor.editor.section, 'images');
  assert.equal(editor.editor.compact, true);
  editor.editor.change(['title'], 'Visual edit');
  assert.equal(editor.visual.page.props.initialPackage.title, 'Visual edit');
  await editor.click('Preview page');
  assert.equal(editor.visual.editing, false);
  await editor.click('Back to editor');
  assert.equal(editor.editor.form.title, 'Visual edit');
  editor.visual.onClose();
  assert.equal(editor.visual.open, false);
});

test('validation opens the relevant side panel without losing the draft', async () => {
  const editor = harness();
  editor.editor.onChange({ ...editor.editor.form, status: 'published', image: '' });
  await editor.click('Save package');
  assert.equal(editor.calls.saved.length, 0);
  assert.equal(editor.visual.editing, true);
  assert.equal(editor.visual.open, true);
  assert.equal(editor.editor.section, 'images');
  assert.match(editor.visual.error, /cover image/i);
});

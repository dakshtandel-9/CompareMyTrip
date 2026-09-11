import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const code = ts.transpileModule(fs.readFileSync('src/lib/lockPageScroll.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function setup(phone = true) {
  const body = { style: { overflow: '', position: '', top: '', left: '', right: '', width: '' } };
  const root = { style: { overflow: 'clip', overscrollBehavior: 'auto' } };
  const exports = {};
  const viewport = { phone };
  const scrolls = [];
  vm.runInNewContext(code, {
    exports,
    document: { body, documentElement: root },
    window: {
      matchMedia: () => ({ matches: viewport.phone }),
      scrollX: 0,
      scrollY: 640,
      scrollTo: (position) => scrolls.push({ ...position }),
    },
  });
  return { body, root, viewport, scrolls, lock: exports.lockPageScroll };
}

for (const closeOuterFirst of [false, true]) {
  test(`phone overlays restore scrolling when closed ${closeOuterFirst ? 'out of' : 'in'} stack order`, () => {
    const { body, root, scrolls, lock } = setup();
    const menu = lock();
    const prompt = lock({ root: true });
    const [first, last] = closeOuterFirst ? [menu, prompt] : [prompt, menu];
    first();
    assert.equal(body.style.position, 'fixed');
    assert.equal(body.style.top, '-640px');
    assert.equal(body.style.overflow, 'clip');
    assert.equal(root.style.overflow, 'clip');
    assert.equal(scrolls.length, 0);
    last();
    assert.equal(body.style.overflow, '');
    assert.equal(root.style.overflow, 'clip');
    assert.equal(root.style.overscrollBehavior, 'auto');
    assert.equal(body.style.position, '');
    assert.equal(body.style.top, '');
    assert.deepEqual(scrolls, [{ left: 0, top: 640, behavior: 'instant' }]);
  });
}

test('repeated cleanup cannot release another open phone overlay', () => {
  const { body, lock } = setup();
  const first = lock();
  first();
  const second = lock();
  first();
  assert.equal(body.style.position, 'fixed');
  second();
  assert.equal(body.style.overflow, '');
});

test('rotating across the breakpoint keeps active phone locks coordinated', () => {
  const { body, viewport, lock } = setup();
  const first = lock();
  viewport.phone = false;
  const second = lock();
  first();
  assert.equal(body.style.position, 'fixed');
  second();
  assert.equal(body.style.overflow, '');
});

test('phone unlock restores existing body layout styles', () => {
  const { body, lock } = setup();
  Object.assign(body.style, { position: 'relative', top: '4px', left: '2px', right: 'auto', width: '95%', overflow: 'visible' });
  const before = { ...body.style };
  const unlock = lock();
  assert.equal(body.style.width, '100%');
  unlock();
  assert.deepEqual(body.style, before);
});

test('desktop retains body-only locking and the prompt root-lock option', () => {
  const { body, root, scrolls, lock } = setup(false);
  const menu = lock();
  assert.equal(body.style.overflow, 'hidden');
  assert.equal(root.style.overflow, 'clip');
  menu();
  const prompt = lock({ root: true });
  assert.equal(root.style.overflow, 'hidden');
  prompt();
  assert.equal(body.style.overflow, '');
  assert.equal(root.style.overflow, 'clip');
  assert.equal(body.style.position, '');
  assert.equal(scrolls.length, 0);
});

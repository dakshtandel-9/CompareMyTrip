import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const code = ts.transpileModule(fs.readFileSync('src/lib/lockPageScroll.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function setup(phone = true) {
  const body = { style: { overflow: '' } };
  const root = { style: { overflow: 'clip', overscrollBehavior: 'auto' } };
  const exports = {};
  const viewport = { phone };
  vm.runInNewContext(code, {
    exports,
    document: { body, documentElement: root },
    window: { matchMedia: () => ({ matches: viewport.phone }) },
  });
  return { body, root, viewport, lock: exports.lockPageScroll };
}

for (const closeOuterFirst of [false, true]) {
  test(`phone overlays restore scrolling when closed ${closeOuterFirst ? 'out of' : 'in'} stack order`, () => {
    const { body, root, lock } = setup();
    const menu = lock();
    const prompt = lock({ root: true });
    const [first, last] = closeOuterFirst ? [menu, prompt] : [prompt, menu];
    first();
    assert.equal(body.style.overflow, 'hidden');
    assert.equal(root.style.overflow, 'hidden');
    last();
    assert.equal(body.style.overflow, '');
    assert.equal(root.style.overflow, 'clip');
    assert.equal(root.style.overscrollBehavior, 'auto');
  });
}

test('repeated cleanup cannot release another open phone overlay', () => {
  const { body, lock } = setup();
  const first = lock();
  first();
  const second = lock();
  first();
  assert.equal(body.style.overflow, 'hidden');
  second();
  assert.equal(body.style.overflow, '');
});

test('rotating across the breakpoint keeps active phone locks coordinated', () => {
  const { body, viewport, lock } = setup();
  const first = lock();
  viewport.phone = false;
  const second = lock();
  first();
  assert.equal(body.style.overflow, 'hidden');
  second();
  assert.equal(body.style.overflow, '');
});

test('desktop retains body-only locking and the prompt root-lock option', () => {
  const { body, root, lock } = setup(false);
  const menu = lock();
  assert.equal(body.style.overflow, 'hidden');
  assert.equal(root.style.overflow, 'clip');
  menu();
  const prompt = lock({ root: true });
  assert.equal(root.style.overflow, 'hidden');
  prompt();
  assert.equal(body.style.overflow, '');
  assert.equal(root.style.overflow, 'clip');
});

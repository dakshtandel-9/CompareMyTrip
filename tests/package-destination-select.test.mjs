import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as jsx from 'react/jsx-runtime';

function harness(options = ['Karnataka', 'Kerala', ' kerala '], initial = '') {
  const slots = [];
  let cursor = 0, value = initial, tree, disabled = false;
  const exports = {};
  const deps = {
    react: { useId: () => 'destination', useRef: () => ({ current: null }), useState: initial => {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], next => { slots[index] = next; }];
    } },
    'react/jsx-runtime': jsx, 'lucide-react': { ChevronDown: () => null }, '../_components/ui': { inputClass: 'input' },
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/admin/packages/PackageDestinationSelect.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require: key => deps[key], requestAnimationFrame: callback => callback(), document: { getElementById: () => null } });
  const nodes = node => !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(nodes) : [node, ...nodes(node.props?.children)];
  const render = () => { cursor = 0; tree = exports.default({ options, value, disabled, onChange: next => { value = next; } }); };
  const input = () => nodes(tree).find(node => node.type === 'input');
  render();
  return {
    get value() { return value; },
    get expanded() { return input().props['aria-expanded']; },
    get options() { return nodes(tree).filter(node => node.props?.role === 'option'); },
    focus() { input().props.onFocus(); render(); },
    type(text) { input().props.onChange({ target: { value: text } }); render(); },
    choose(index) { this.options[index].props.onClick(); render(); },
    disable() { disabled = true; render(); },
    key(key) { const event = { key, preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; } }; input().props.onKeyDown(event); render(); return event; },
  };
}

test('dropdown shows and filters existing destinations and selects with keyboard', () => {
  const editor = harness();
  editor.focus();
  assert.equal(editor.expanded, true);
  assert.equal(editor.options.length, 2);
  editor.type('Karn');
  assert.equal(editor.options[0].props.children, 'Karnataka');
  editor.key('ArrowDown');
  editor.key('Enter');
  assert.equal(editor.value, 'Karnataka');
  assert.equal(editor.expanded, false);
});

test('new destination can be added and is selectable when returned by the saved catalogue', () => {
  const editor = harness([]);
  editor.type('  New Valley  ');
  assert.equal(editor.options[0].props.children, '+ Add “New Valley”');
  editor.choose(0);
  assert.equal(editor.value, 'New Valley');
  const reopened = harness([editor.value]);
  reopened.focus();
  assert.equal(reopened.options[0].props.children, 'New Valley');
  reopened.choose(0);
  assert.equal(reopened.value, 'New Valley');
});

test('case-insensitive matches avoid duplicates; Escape closes only the dropdown; busy state hides it', () => {
  const editor = harness();
  editor.type('KERALA');
  assert.equal(editor.options.length, 1);
  editor.key('Enter');
  assert.equal(editor.value.toLowerCase(), 'kerala');
  editor.focus();
  assert.equal(editor.key('Escape').stopped, true);
  assert.equal(editor.expanded, false);
  editor.focus();
  editor.disable();
  assert.equal(editor.expanded, false);
  assert.equal(editor.options.length, 0);
});

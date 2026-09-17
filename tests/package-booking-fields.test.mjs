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
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require: name => { assert.ok(dependencies[name], name); return dependencies[name]; } });
  return exports;
}

const data = load('src/lib/packageData.ts');
const { default: BookingFields } = load('src/app/admin/packages/PackageBookingFields.tsx', {
  'react/jsx-runtime': jsx,
  '@/lib/packageData': data,
});
const fixture = () => JSON.parse(fs.readFileSync('content/package-imports/skandagiri-sunrise-trek-from-bangalore.json', 'utf8'));
const nodes = node => !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(nodes) : [node, ...nodes(node.props?.children)];

function setup(pkg = fixture(), extra = {}) {
  const changes = [];
  const props = { pkg, disabled: false, change: (path, value) => changes.push({ path: path.join('.'), value }), ...extra };
  const tree = BookingFields(props);
  return {
    changes,
    tree,
    get: id => {
      const node = nodes(tree).find(node => node.props?.id === id);
      assert.ok(node, `Missing field: ${id}`);
      return node;
    },
    weekday: day => nodes(tree).find(node => node.props?.['aria-label'] === `Departs on ${day}`),
    html: () => renderToStaticMarkup(React.createElement(BookingFields, props)),
  };
}

test('booking text and numeric fields write to the shared draft immediately and preserve typed text', () => {
  const editor = setup();
  const fields = [
    ['price', 'price', '799.50'],
    ['original-price', 'originalPrice', '999.00'],
    ['label', 'details.bookingLabel', 'Guided mountain trek '],
    ['flights', 'details.flights', 'Flights not included '],
    ['availability-note', 'details.availabilityNote', 'Permit confirmation\nrequired '],
    ['quote-note', 'details.quoteNote', 'Ask our team '],
  ];
  for (const [id, path, value] of fields) {
    editor.get(`package-booking-${id}`).props.onChange({ target: { value } });
    assert.deepEqual(editor.changes.at(-1), { path, value });
  }
  editor.get('package-booking-difficulty').props.onChange({ target: { value: '3' } });
  assert.deepEqual(editor.changes.at(-1), { path: 'trekGrade', value: 3 });
  editor.get('package-booking-hotel-stars').props.onChange({ target: { value: '4' } });
  assert.deepEqual(editor.changes.at(-1), { path: 'hotelStars', value: 4 });
  const featured = nodes(editor.tree).find(node => node.type === 'input' && node.props.type === 'checkbox' && !node.props['aria-label']);
  featured.props.onChange({ target: { checked: true } });
  assert.deepEqual(editor.changes.at(-1), { path: 'deal', value: true });
  assert.doesNotMatch(editor.html(), /Apply text|Click text to edit/);
});

test('empty notes stay intentionally hidden while missing notes retain the public defaults', () => {
  const pkg = fixture();
  delete pkg.details.availabilityNote;
  delete pkg.details.quoteNote;
  const legacy = setup(pkg);
  assert.equal(legacy.get('package-booking-availability-note').props.value, 'Availability confirmed with your quote');
  assert.equal(legacy.get('package-booking-quote-note').props.value, 'Compare quotes from 3 verified agents · best price');
  pkg.details.availabilityNote = '';
  pkg.details.quoteNote = '';
  pkg.details.bookingLabel = '';
  pkg.details.stays = [];
  const cleared = setup(pkg);
  assert.equal(cleared.get('package-booking-availability-note').props.value, '');
  assert.equal(cleared.get('package-booking-quote-note').props.value, '');
  assert.equal(cleared.get('package-booking-label').props.value, '');
  assert.equal(cleared.get('package-booking-label').props.placeholder, 'Trip package');
  cleared.get('package-booking-availability-note').props.onChange({ target: { value: '' } });
  assert.deepEqual(cleared.changes.at(-1), { path: 'details.availabilityNote', value: '' });
});

test('raw pricing strings remain editable while financial summaries follow package values', () => {
  const pkg = { ...fixture(), price: 799.5, originalPrice: 999, discount: 20 };
  const editor = setup(pkg, { pricing: { price: '799.50', originalPrice: '' } });
  assert.equal(editor.get('package-booking-price').props.value, '799.50');
  assert.equal(editor.get('package-booking-original-price').props.value, '');
  editor.get('package-booking-price').props.onChange({ target: { value: '' } });
  assert.deepEqual(editor.changes.at(-1), { path: 'price', value: '' });
  const html = editor.html();
  assert.match(html, /aria-label="Discount shown on website"[^>]*>20%/);
  assert.match(html, /₹1,599/);
  const invalid = setup({ ...pkg, originalPrice: 500 });
  assert.equal(invalid.get('package-booking-original-price').props['aria-invalid'], true);
  assert.match(invalid.html(), /role="alert"[^>]*>Original price must be at least the selling price/);
});

test('departure controls respect unrestricted packages, normalize all days, and prevent removing the final day', () => {
  const daily = setup({ ...fixture(), departureDays: [] });
  for (const day of ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']) assert.equal(daily.weekday(day).props.checked, true);
  daily.weekday('Monday').props.onChange({ target: { checked: false } });
  assert.equal(daily.changes.at(-1).path, 'departureDays');
  assert.equal(JSON.stringify(daily.changes.at(-1).value), '[0,2,3,4,5,6]');
  const partial = setup({ ...fixture(), departureDays: [0, 2, 3, 4, 5, 6] });
  partial.weekday('Monday').props.onChange({ target: { checked: true } });
  assert.equal(JSON.stringify(partial.changes.at(-1).value), '[]');
  const single = setup({ ...fixture(), departureDays: [5] });
  assert.equal(single.weekday('Friday').props.disabled, true);
  single.weekday('Friday').props.onChange({ target: { checked: false } });
  assert.equal(single.changes.length, 0);
  const everyDay = nodes(single.tree).find(node => node.type === 'button' && node.props.children === 'Select every day');
  everyDay.props.onClick();
  assert.equal(JSON.stringify(single.changes.at(-1).value), '[]');
});

test('disabled booking fields cannot change the draft while the editor saves or uploads', () => {
  const editor = setup(fixture(), { disabled: true });
  assert.equal(editor.tree.props.disabled, true);
  editor.get('package-booking-price').props.onChange({ target: { value: '899' } });
  editor.get('package-booking-quote-note').props.onChange({ target: { value: 'Changed' } });
  editor.get('package-booking-difficulty').props.onChange({ target: { value: '2' } });
  editor.weekday('Monday').props.onChange({ target: { checked: false } });
  assert.equal(editor.changes.length, 0);
  assert.match(editor.html(), /<fieldset disabled=""/);
});

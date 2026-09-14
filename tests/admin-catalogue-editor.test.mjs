import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const exports = {};
const code = ts.transpileModule(fs.readFileSync('src/app/admin/packages/catalogueEditorState.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
vm.runInNewContext(code, { exports, URLSearchParams });
const { packageValidationIssue: validate, catalogueEditorMode: mode, catalogueListHref: listHref } = exports;

const validPackage = () => ({
  title: 'Kerala Backwaters', location: 'Kochi · Alleppey',
  gallery: ['cover.jpg', 'stay.jpg', 'experience.jpg'],
  summary: 'Explore the backwaters at a relaxed pace.', places: 'Kochi, Alleppey',
  itinerary: [{ day: 1, title: 'Arrival' }, { day: 2, title: 'Backwaters' }],
  stays: [{ name: 'Lakeview Hotel', nights: 1 }], tags: ['Family'],
  factsHidden: false, facts: [{ label: 'Duration', source: 'duration' }],
  departureDays: [0, 6], nights: '1', days: '2', price: '9000', originalPrice: '10000', discount: '10',
});

test('complete packages can be saved as drafts or published without mutation', () => {
  for (const status of ['draft', 'published']) {
    const form = { ...validPackage(), status };
    const before = JSON.stringify(form);
    assert.equal(validate(form), null);
    assert.equal(JSON.stringify(form), before);
  }
});

test('missing required content sends the editor to the section that can fix it', () => {
  for (const [patch, step, message] of [
    [{ title: '  ' }, 0, /title/i],
    [{ location: '' }, 0, /route/i],
    [{ tags: [] }, 0, /category/i],
    [{ gallery: ['one.jpg', 'two.jpg'] }, 2, /images/i],
    [{ summary: ' ' }, 3, /overview/i],
    [{ places: ' , · ' }, 3, /place/i],
    [{ itinerary: [{ day: 1, title: '' }] }, 4, /itinerary/i],
    [{ stays: [{ name: ' ', nights: 1 }] }, 4, /hotel|stay/i],
    [{ departureDays: [] }, 1, /departure/i],
    [{ facts: [{ label: 'Trip type', value: ' ' }] }, 5, /details box/i],
  ]) {
    const result = validate({ ...validPackage(), ...patch });
    assert.equal(result?.step, step, JSON.stringify(patch));
    assert.match(result.message, message);
  }
});

test('duration, pricing and stay constraints still apply across hidden steps', () => {
  for (const [patch, step] of [
    [{ nights: '0' }, 0], [{ nights: '1.5' }, 0],
    [{ days: '31' }, 0], [{ days: 'two' }, 0],
    [{ price: '0' }, 1], [{ price: 'Infinity' }, 1],
    [{ originalPrice: '8000' }, 1], [{ discount: '91' }, 1],
    [{ discount: '-1' }, 1], [{ stays: [{ name: 'Hotel', nights: 0 }] }, 4],
    [{ gallery: Array(11).fill('photo.jpg') }, 2],
  ]) assert.equal(validate({ ...validPackage(), ...patch })?.step, step, JSON.stringify(patch));
});

test('automatic and hidden facts remain valid while visible custom facts need a value', () => {
  assert.equal(validate({ ...validPackage(), facts: [{ label: 'Meals', source: 'meals' }] }), null);
  assert.equal(validate({ ...validPackage(), facts: [{ label: '', value: '', visible: false }] }), null);
  assert.equal(validate({ ...validPackage(), factsHidden: true, facts: [{ label: '', value: '' }] }), null);
  assert.equal(validate({ ...validPackage(), facts: [{ label: 'Custom' }] })?.step, 5);
  assert.equal(validate({ ...validPackage(), facts: [{ label: 'Meals', source: 'meals', value: '' }] })?.step, 5);
});

test('create shortcuts wait for the catalogue and only recognize create=1', () => {
  assert.equal(mode(null, '1', false), null);
  assert.equal(mode(null, '1', true), 'new');
  for (const value of [null, '', '0', 'true']) assert.equal(mode(null, value, true), null);
  const existing = { id: 'saved-package' };
  assert.equal(mode(existing, '1', true), existing);
});

test('browser Back leaves create mode and Forward can intentionally reopen it', () => {
  const search = ['?create=1', '', '?create=1'];
  assert.deepEqual(search.map((query) => mode(null, new URLSearchParams(query).get('create'), true)), ['new', null, 'new']);
});

test('save and cancel URLs remove creation intent while preserving other parameters', () => {
  for (const pathname of ['/admin/packages', '/admin/blog']) {
    const href = listHref(pathname, 'create=1&status=draft&search=Kerala+trip&create=1');
    const url = new URL(href, 'https://example.com');
    assert.equal(url.pathname, pathname);
    assert.equal(url.searchParams.get('status'), 'draft');
    assert.equal(url.searchParams.get('search'), 'Kerala trip');
    assert.equal(url.searchParams.has('create'), false);
    assert.equal(mode(null, url.searchParams.get('create'), true), null);
    assert.equal(listHref(pathname, 'create=1'), pathname);
  }
});

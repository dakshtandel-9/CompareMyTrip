import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const exports = {};
const sectionExports = {};
const dataExports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync("src/lib/packageData.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports: dataExports });
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/packageDetailSections.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: sectionExports, URL });
const code = ts.transpileModule(fs.readFileSync('src/app/admin/packages/catalogueEditorState.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
vm.runInNewContext(code, { exports, URLSearchParams, require: (name) => {
  if (name === '@/lib/packageData') return dataExports;
  assert.equal(name, '@/lib/packageDetailSections');
  return sectionExports;
} });
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
    [{ gallery: [] }, 0, /images/i],
    [{ summary: ' ' }, 1, /overview/i],
    [{ places: ' , · ' }, 1, /place/i],
    [{ itinerary: [{ day: 1, title: '' }] }, 3, /itinerary/i],
    [{ stays: [{ name: ' ', nights: 1 }] }, 4, /hotel|stay/i],
    [{ departureDays: [] }, 11, /departure/i],
    [{ facts: [{ label: 'Trip type', value: ' ' }] }, 0, /details box/i],
  ]) {
    const result = validate({ ...validPackage(), ...patch });
    assert.equal(result?.step, step, JSON.stringify(patch));
    assert.match(result.message, message);
  }
});

test('duration, pricing and stay constraints still apply across hidden steps', () => {
  for (const [patch, step] of [
    [{ nights: '-1' }, 0], [{ nights: '1.5' }, 0],
    [{ days: '31' }, 0], [{ days: 'two' }, 0],
    [{ price: '0' }, 11], [{ price: 'Infinity' }, 11],
    [{ originalPrice: '8000' }, 11], [{ discount: '91' }, 11],
    [{ discount: '-1' }, 11], [{ stays: [{ name: 'Hotel', nights: 0 }] }, 4],
    [{ gallery: Array(11).fill('photo.jpg') }, 0],
  ]) assert.equal(validate({ ...validPackage(), ...patch })?.step, step, JSON.stringify(patch));
});

test('automatic and hidden facts remain valid while visible custom facts need a value', () => {
  assert.equal(validate({ ...validPackage(), facts: [{ label: 'Meals', source: 'meals' }] }), null);
  assert.equal(validate({ ...validPackage(), facts: [{ label: '', value: '', visible: false }] }), null);
  assert.equal(validate({ ...validPackage(), factsHidden: true, facts: [{ label: '', value: '' }] }), null);
  assert.equal(validate({ ...validPackage(), facts: [{ label: 'Custom' }] })?.step, 0);
  assert.equal(validate({ ...validPackage(), facts: [{ label: 'Meals', source: 'meals', value: '' }] })?.step, 0);
});

test('hidden standard sections can be saved empty and require content again when shown', () => {
  const pageSections = sectionExports.defaultPackagePageSections();
  pageSections.hiddenSections = ['about', 'itinerary', 'stays'];
  const form = { ...validPackage(), pageSections, summary: '', places: '', itinerary: [], stays: [] };
  assert.equal(validate(form), null);
  pageSections.hiddenSections = ['about', 'stays'];
  assert.equal(validate(form)?.step, 3);
});

test('optional page content validates in the page sections step and survives hiding', () => {
  const pageSections = sectionExports.defaultPackagePageSections();
  pageSections.sections = [{ id: 'packing', title: 'Packing list', layout: 'box', body: '', visible: true, items: [] }];
  const form = { ...validPackage(), pageSections };
  assert.equal(validate(form)?.step, 12);
  pageSections.sections[0].visible = false;
  assert.equal(validate(form), null);
  pageSections.sections[0].body = 'Bring walking shoes.';
  pageSections.sections[0].visible = true;
  pageSections.gallery.enabled = true;
  assert.equal(validate(form), null);
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


test('one-day and overnight treks can be saved without a hotel', () => {
  for (const nights of ['0', '1']) {
    const trek = { ...validPackage(), days: '1', nights, stays: [], itinerary: [
      ...(nights === '1' ? [{ day: 0, title: 'Bangalore pickup' }] : []),
      { day: 1, title: 'Sunrise trek', activities: [{ time: 'Sunrise', title: 'Reach the summit', description: 'Enjoy the view.' }] },
    ] };
    assert.equal(validate(trek), null);
  }
  for (const patch of [{ nights: '' }, { days: '' }, { days: '0' }, { days: '1.5' }]) {
    assert.equal(validate({ ...validPackage(), ...patch })?.step, 0);
  }
  assert.equal(validate({ ...validPackage(), itinerary: [{ day: 1, title: 'Trek', activities: [{ time: 'Morning', title: ' ', description: '' }] }] })?.step, 3);
});


test('holiday and trek editors follow the two reference document orders', () => {
  const ids = (tags) => Array.from(exports.packageEditorSteps(tags), (step) => step.id);
  const ending = ['locations', 'inclusions', 'exclusions', 'faq', 'reviews', 'booking', 'extras', 'save'];
  assert.deepEqual(ids(['Family']), ['intro', 'about', 'highlights', 'itinerary', 'stays', 'transfers', ...ending]);
  assert.deepEqual(ids(['Treks']), ['intro', 'about', 'highlights', 'itinerary', 'carry', 'guidelines', ...ending]);
});

test('missing prices can be saved only as drafts', () => {
  for (const price of ['', '0']) {
    assert.equal(validate({ ...validPackage(), status: 'draft', price, originalPrice: price }), null);
    assert.equal(validate({ ...validPackage(), status: 'published', price, originalPrice: price })?.step, 11);
  }
});

test('each scoped content error returns to the step containing the field', () => {
  for (const [placement, expected] of [['overview', 1], ['highlights', 2], ['carry', 4], ['guidelines', 5], ['faq', 9], ['extras', 12]]) {
    const pageSections = sectionExports.defaultPackagePageSections();
    pageSections.sections = [{ id: placement, title: 'Section', placement, layout: 'box', body: '', items: [], visible: true }];
    assert.equal(validate({ ...validPackage(), tags: ['Treks'], pageSections })?.step, expected);
  }
});

test('both PDF package imports survive the actual editor validation', () => {
  for (const file of fs.readdirSync('content/package-imports').filter((file) => file.endsWith('.json'))) {
    const pkg = JSON.parse(fs.readFileSync(`content/package-imports/${file}`, 'utf8'));
    const d = pkg.details;
    const form = { ...pkg, ...d, nights: String(pkg.nights), days: String(pkg.days), price: String(pkg.price), originalPrice: String(pkg.originalPrice), discount: String(pkg.discount), places: d.places.join(', '), pageSections: sectionExports.getPackagePageSections(d), departureDays: pkg.departureDays.length ? pkg.departureDays : [0,1,2,3,4,5,6] };
    assert.equal(validate(form), null, file);
    for (const photo of d.gallery) assert.ok(fs.existsSync(`public${photo}`));
    assert.equal(pkg.rating, 0);
    assert.equal(pkg.reviews, 0);
    assert.deepEqual(d.pageSections.reviews.items, []);
    assert.doesNotMatch(JSON.stringify(pkg), /₹X|DD MMM|sample testimonials|SEO Page Elements|Website recommendation/);
  }
});

test('Day 0 toggle survives save/reopen and restores the original content without renumbering days', () => {
  const original = { itinerary: [{ day: 1, title: 'Arrival', activities: [] }, { day: 2, title: 'Sightseeing' }] };
  const enabled = dataExports.setPackageDayZero(original, true);
  enabled.itinerary[0].description = 'Meet at 10:30 PM';
  enabled.itinerary[0].activities = [{ time: '10:30 PM', title: 'Pickup', description: 'Hotel lobby' }];
  const off = JSON.parse(JSON.stringify(dataExports.setPackageDayZero(enabled, false)));
  assert.deepEqual(Array.from(dataExports.getPackageItinerary(off), (day) => day.day), [1, 2]);
  assert.equal(off.itinerary[0].description, 'Meet at 10:30 PM');
  const restored = JSON.parse(JSON.stringify(dataExports.setPackageDayZero(off, true)));
  assert.deepEqual(Array.from(dataExports.getPackageItinerary(restored), (day) => day.day), [0, 1, 2]);
  assert.equal(restored.itinerary[0].activities[0].description, 'Hotel lobby');
  assert.equal(dataExports.setPackageDayZero(restored, true).itinerary.length, 3);
  assert.equal(original.itinerary.length, 2);
});

test('hidden Day 0 drafts do not block saving, but enabled Day 0 requires valid content', () => {
  const form = { ...validPackage(), dayZeroEnabled: false, itinerary: [{ day: 0, title: '', activities: [{ title: '' }] }, ...validPackage().itinerary] };
  assert.equal(validate(form), null);
  assert.equal(validate({ ...form, dayZeroEnabled: true })?.step, 3);
  assert.equal(dataExports.isPackageDayZeroEnabled({ itinerary: [{ day: 0 }] }), true);
  assert.equal(dataExports.isPackageDayZeroEnabled({ itinerary: [{ day: 1 }] }), false);
});

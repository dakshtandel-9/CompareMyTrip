import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import * as jsx from 'react/jsx-runtime';

function load(file, dependencies = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, URL, require: name => { assert.ok(dependencies[name], name); return dependencies[name]; } });
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
const noop = () => null;
const publicSections = load('src/app/packages/_components/PackagePageSections.tsx', {
  'react/jsx-runtime': jsx, 'next/image': { default: noop },
  'lucide-react': Object.fromEntries(['ArrowUpRight', 'Backpack', 'Bus', 'ChevronDown', 'MapPin', 'ShieldCheck', 'Star'].map(name => [name, noop])),
  '@/lib/packageDetailSections': sections,
  './PackageInlineEditing': { InlineText: noop, EditableGallery: noop, EditAction: noop, usePackageEditing: () => null },
  './PackageSectionTextEditor': { default: noop },
});
const TextField = ({ label, value, onChange }) => React.createElement('label', null, label, React.createElement('input', { value, onChange: event => onChange(event.target.value) }));
const ContentField = ({ label, value, onChange, disabled }) => React.createElement('fieldset', { disabled }, React.createElement('label', null, label, React.createElement('textarea', { value, onChange: event => onChange(event.target.value) })));
const BookingFields = () => React.createElement('input', { 'aria-label': 'Delegated booking field', readOnly: true, value: '' });
const ImagesEditor = () => React.createElement('input', { type: 'file', 'aria-label': 'Delegated image field' });
const FactsEditor = () => React.createElement('button', { type: 'button' }, 'Delegated fact action');
const SectionsEditor = () => React.createElement('textarea', { 'aria-label': 'Delegated section field', readOnly: true, value: '' });
const { default: Editor, PACKAGE_EDITOR_AREAS } = load('src/app/admin/packages/PackageDetailEditor.tsx', {
  'react/jsx-runtime': jsx,
  'lucide-react': { ArrowDown: noop, ArrowUp: noop, Plus: noop, Trash2: noop },
  '@/lib/packageData': data,
  '@/lib/packageDetailSections': sections,
  '@/app/packages/_components/PackagePageSections': publicSections,
  '../_components/ui': { FieldLabel: ({ children }) => React.createElement('span', null, children), inputClass: 'input', TextField },
  './PackageBookingFields': { default: BookingFields },
  './PackageImagesEditor': { default: ImagesEditor },
  './PackageFactsEditor': { default: FactsEditor },
  './PackagePageSectionsEditor': { default: SectionsEditor },
  './PackageContentField': { default: ContentField },
  './AdminPackageBuilder.module.css': { default: new Proxy({}, { get: (_, key) => key }) },
});
const clone = value => JSON.parse(JSON.stringify(value));
const nodes = node => !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(nodes) : [node, ...nodes(node.props?.children)];
const text = node => node === null || node === undefined || typeof node === 'boolean' ? '' : typeof node !== 'object' ? String(node) : Array.isArray(node) ? node.map(text).join('') : text(node.props?.children);

function fixture() {
  const pkg = JSON.parse(fs.readFileSync('content/package-imports/skandagiri-sunrise-trek-from-bangalore.json', 'utf8'));
  pkg.details.itinerary = [
    { day: 0, title: 'Night departure', route: 'City to base', description: 'Keep overnight content.', meals: 'Not included', activities: [{ time: '23:00', title: 'Board coach', description: 'Meet at the gate.' }] },
    { day: 1, title: 'Summit day', route: 'Base to summit', description: 'Keep day content.', meals: 'Breakfast', activities: [{ time: '04:00', title: 'Start walk', description: 'Follow the guide.' }, { time: '06:00', title: 'Summit', description: 'Watch the sunrise.' }] },
  ];
  pkg.details.dayZeroEnabled = true;
  pkg.details.stays = [
    { name: 'First stay', nights: 1, place: 'Base village', comfort: 'Simple lodge', roomType: 'Twin', mealPlan: 'Breakfast', checkIn: '14:00', checkOut: '11:00' },
    { name: 'Second stay', nights: 2, place: 'Town', comfort: 'Town hotel', roomType: 'Double', mealPlan: 'Half board', checkIn: '15:00', checkOut: '10:00' },
  ];
  pkg.details.pageSections = {
    ...sections.getPackagePageSections(pkg.details),
    bookingNote: 'Stored legacy note',
    gallery: { enabled: false, images: ['/saved-extra.jpg'] },
    locations: { enabled: false, items: [{ id: 'pickup-kept', type: 'pickup', name: 'Saved pickup', address: 'Gate', notes: 'Arrive early', mapUrl: '', image: '', visible: false }] },
    reviews: { enabled: false, items: [{ id: 'review-kept', name: 'Traveller', rating: 4, text: 'Saved review', visible: false }] },
  };
  return pkg;
}

function setup(initialSection = 'basics', disabled = false) {
  const original = fixture();
  let form = model.formFromPackage(original);
  let section = initialSection;
  const render = () => Editor({
    form, pkg: model.packageFromForm(form, original, { normalize: false }), section, disabled,
    onSectionChange: next => { section = next; },
    onChange: next => { form = next; },
    change: (path, value) => { form = model.applyPackagePreviewChange(form, path, value, original); },
    onUploadImages: async () => ['/uploaded.jpg'],
    filedUnderOptions: { India: ['Karnataka'], International: ['Bali'] },
  });
  const find = (predicate, tree = render()) => { const node = nodes(tree).find(predicate); assert.ok(node, 'Expected editor control to exist'); return node; };
  return {
    get form() { return form; }, get section() { return section; }, original, render,
    area: next => { section = next; },
    field: label => find(node => (node.type === TextField || node.type === ContentField) && node.props.label === label),
    component: (type, focus) => find(node => node.type === type && (focus === undefined || node.props.focus === focus)),
    button: (label, tree) => find(node => node.type === 'button' && (node.props['aria-label'] === label || text(node) === label), tree),
    input: label => {
      const wrapper = find(node => node.type === 'label' && text(node).startsWith(label));
      return find(node => ['input', 'select'].includes(node.type), wrapper);
    },
    visibility: (index = 0) => nodes(render()).filter(node => node.type === 'label' && text(node).startsWith('Show this section on the website'))[index].props.children[0],
    day: number => find(node => node.type === 'details' && text(node.props.children[0]).startsWith(`Day ${number} ·`)),
  };
}

test('all fifteen page-editor areas are reachable and preserve the current draft during navigation', () => {
  const editor = setup();
  assert.equal(PACKAGE_EDITOR_AREAS.length, 15);
  editor.field('Package title').props.onChange('A renamed package ');
  for (const area of PACKAGE_EDITOR_AREAS) {
    editor.button(area.label).props.onClick();
    assert.equal(editor.section, area.id);
    assert.equal(editor.form.title, 'A renamed package ');
    assert.equal(editor.button(area.label).props['aria-current'], 'page');
  }
});

test('basic package fields update the draft without trimming or losing unrelated saved content', () => {
  const editor = setup();
  const retained = clone(editor.form.pageSections);
  for (const [label, key, value] of [
    ['Package title', 'title', 'Mountain journey '],
    ['Destination / route shown on the page', 'location', 'City · Hills '],
    ['Group size', 'pax', '10–15 people '],
    ['Operator (internal)', 'operator', 'Operator name '],
  ]) { editor.field(label).props.onChange(value); assert.equal(editor.form[key], value); }
  editor.input('Region').props.onChange({ target: { value: 'International' } });
  editor.input('Filed under destination').props.onChange({ target: { value: 'Bali ' } });
  editor.input('Nights').props.onChange({ target: { value: '3' } });
  assert.equal(editor.form.region, 'International');
  assert.equal(editor.form.destination, 'Bali ');
  assert.equal(editor.form.nights, '3');
  assert.deepEqual(clone(editor.form.pageSections), retained);
});

test('image, booking and quick-fact editors receive working shared-draft callbacks', () => {
  const editor = setup('images');
  const preserved = clone(editor.form.pageSections);
  editor.component(ImagesEditor).props.onChangeImages({ image: '/new-cover.jpg', gallery: ['/new-cover.jpg', '/second.jpg'] });
  assert.equal(editor.form.image, '/new-cover.jpg');
  assert.deepEqual(clone(editor.form.gallery), ['/new-cover.jpg', '/second.jpg']);
  assert.equal(editor.component(SectionsEditor, 'gallery').props.value.gallery.images[0], '/saved-extra.jpg');
  editor.area('booking');
  const booking = editor.component(BookingFields);
  assert.equal(booking.props.pricing.price, editor.form.price);
  booking.props.change(['details', 'quoteNote'], 'Quote draft ');
  assert.equal(editor.form.quoteNote, 'Quote draft ');
  editor.area('facts');
  editor.field('Meals').props.onChange('Breakfast and tea ');
  editor.component(FactsEditor).props.onChange([...editor.form.facts, { id: 'height', icon: 'Mountain', label: 'Altitude', value: '1,450 m', visible: true }]);
  editor.component(FactsEditor).props.onHiddenChange(true);
  editor.component(FactsEditor).props.onPermitRequiredChange(true);
  editor.input('Show permit status and booking link').props.onChange({ target: { checked: false } });
  assert.equal(editor.form.meals, 'Breakfast and tea ');
  assert.equal(editor.form.facts.at(-1).value, '1,450 m');
  assert.equal(editor.form.factsHidden, true);
  assert.equal(editor.form.permitRequired, true);
  assert.equal(editor.form.permitHidden, true);
  assert.deepEqual(clone(editor.form.pageSections), preserved);
});

test('every long-form content group and note writes directly to the shared draft', () => {
  const editor = setup();
  for (const [area, label, key] of [
    ['overview', 'About this trip', 'summary'], ['overview', 'Places visited', 'places'],
    ['highlights', 'Trip highlights', 'highlights'], ['practical', 'Transport summary', 'transfers'],
    ['coverage', 'Included', 'inclusions'], ['coverage', 'Not included', 'exclusions'],
    ['policy', 'Cancellation policy', 'cancellationPolicy'],
  ]) {
    editor.area(area);
    const value = `${label}\n\n[Details]\n- Exact content `;
    editor.field(label).props.onChange(value);
    assert.equal(editor.form[key], value);
  }
  for (const [area, label, key] of [
    ['overview', 'Tagline (optional)', 'tagline'], ['overview', 'Introduction (optional)', 'introduction'],
    ['itinerary', 'Itinerary note (optional)', 'itineraryNote'], ['stays', 'Stay note (optional)', 'stayNote'],
    ['coverage', 'Inclusions note (optional)', 'inclusionNote'],
  ]) {
    editor.area(area); editor.field(label).props.onChange(`${key} draft `);
    assert.equal(editor.form.pageSections[key], `${key} draft `);
  }
  assert.equal(editor.form.pageSections.bookingNote, 'Stored legacy note');
});

test('quick-fact placement and legacy review summaries save without replacing written reviews', () => {
  const editor = setup('facts');
  editor.input('Quick facts position').props.onChange({ target: { value: 'about' } });
  assert.equal(editor.form.pageSections.snapshotPlacement, 'about');
  editor.area('reviews');
  const written = clone(editor.form.pageSections.reviews);
  editor.input('Average rating (0–5)').props.onChange({ target: { value: '4.6' } });
  editor.input('Number of reviews').props.onChange({ target: { value: '51' } });
  const saved = model.packageFromForm(editor.form, editor.original);
  assert.equal(saved.rating, 4.6);
  assert.equal(saved.reviews, 51);
  assert.equal(saved.details.pageSections.snapshotPlacement, 'about');
  assert.deepEqual(clone(saved.details.pageSections.reviews), written);
  const reviews = editor.component(SectionsEditor, 'reviews');
  reviews.props.onChange({ ...reviews.props.value, reviews: { ...written, enabled: true, items: written.items.map(item => ({ ...item, visible: true })) } });
  assert.match(text(editor.render()), /rating and review count beside the package title are calculated from your visible traveller reviews/);
  assert.ok(!nodes(editor.render()).some(node => node.type === 'label' && text(node).startsWith('Average rating')));
  assert.equal(editor.form.rating, '4.6');
  assert.equal(editor.form.reviews, '51');
});

test('custom content, pickups, reviews and extra gallery each remain editable without replacing other groups', () => {
  const editor = setup();
  for (const [area, focus] of [
    ['overview', 'overview'], ['highlights', 'highlights'], ['practical', 'transfers'],
    ['practical', 'carry'], ['practical', 'guidelines'], ['practical', 'practical'],
    ['faq', 'faq'], ['extras', 'extras'], ['locations', 'locations'], ['reviews', 'reviews'], ['images', 'gallery'],
  ]) {
    editor.area(area);
    const component = editor.component(SectionsEditor, focus);
    assert.equal(component.props.allowReviews, true);
    const previous = clone(editor.form.pageSections);
    const next = { ...editor.form.pageSections, tagline: `Draft from ${focus}` };
    component.props.onChange(next);
    assert.equal(editor.form.pageSections.tagline, `Draft from ${focus}`);
    assert.deepEqual(clone(editor.form.pageSections.locations), previous.locations);
    assert.deepEqual(clone(editor.form.pageSections.reviews), previous.reviews);
    assert.deepEqual(clone(editor.form.pageSections.gallery), previous.gallery);
    assert.deepEqual(clone(editor.form.pageSections.sections), previous.sections);
  }
});

test('hiding built-in sections keeps all saved content and can be reversed', () => {
  const editor = setup();
  const initial = clone(editor.form);
  for (const [area, id, index = 0] of [
    ['overview', 'about'], ['highlights', 'highlights'], ['itinerary', 'itinerary'],
    ['stays', 'stays'], ['practical', 'transfers'], ['coverage', 'inclusions'],
    ['coverage', 'exclusions', 1], ['policy', 'cancellation'],
  ]) {
    editor.area(area);
    const wasHidden = editor.form.pageSections.hiddenSections.includes(id);
    editor.visibility(index).props.onChange({ target: { checked: wasHidden } });
    assert.equal(editor.form.pageSections.hiddenSections.includes(id), !wasHidden);
    editor.visibility(index).props.onChange({ target: { checked: !wasHidden } });
    assert.equal(editor.form.pageSections.hiddenSections.includes(id), wasHidden);
  }
  assert.deepEqual(clone(editor.form), initial);
});

test('itinerary edits, additions, reordering and removals preserve other days and activity data', () => {
  const editor = setup('itinerary');
  const overnight = clone(editor.form.itinerary[0]);
  editor.field('Day 1, activity 1: description').props.onChange('Updated meeting instructions ');
  assert.equal(editor.form.itinerary[1].activities[0].description, 'Updated meeting instructions ');
  editor.button('Move activity 1 down in Day 1').props.onClick();
  assert.equal(editor.form.itinerary[1].activities[0].title, 'Summit');
  assert.equal(editor.form.itinerary[1].activities[1].description, 'Updated meeting instructions ');
  editor.button('Add timed activity', editor.day(1)).props.onClick();
  assert.equal(editor.form.itinerary[1].activities.length, 3);
  editor.button('Remove activity 3', editor.day(1)).props.onClick();
  assert.equal(editor.form.itinerary[1].activities.length, 2);
  editor.input('Include Day 0 / overnight departure').props.onChange({ target: { checked: false } });
  assert.equal(editor.form.dayZeroEnabled, false);
  assert.deepEqual(clone(editor.form.itinerary[0]), overnight);
  editor.button('Add itinerary day').props.onClick();
  assert.equal(editor.form.itinerary.length, 3);
  assert.equal(editor.form.itinerary[2].day, 2);
  editor.button('Remove Day 2').props.onClick();
  assert.equal(editor.form.itinerary.length, 2);
  assert.deepEqual(clone(editor.form.itinerary[0]), overnight);
});

test('stay fields, ordering and removal preserve the complete neighbouring stay', () => {
  const editor = setup('stays');
  const second = clone(editor.form.stays[1]);
  for (const [label, key] of [['Name', 'name'], ['Location', 'place'], ['Room type', 'roomType'], ['Meal plan', 'mealPlan'], ['Check-in', 'checkIn'], ['Check-out', 'checkOut']]) {
    editor.field(`Stay 1: ${label}`).props.onChange(`${label} updated `);
    assert.equal(editor.form.stays[0][key], `${label} updated `);
  }
  editor.field('Stay 1: description').props.onChange('A complete stay description ');
  editor.button('Move stay 1 down').props.onClick();
  assert.deepEqual(clone(editor.form.stays[0]), second);
  assert.equal(editor.form.stays[1].comfort, 'A complete stay description ');
  editor.button('Remove stay').props.onClick();
  assert.equal(editor.form.stays.length, 1);
  assert.equal(editor.form.stays[0].comfort, 'A complete stay description ');
  editor.button('Add hotel / stay').props.onClick();
  assert.equal(editor.form.stays.length, 2);
  assert.equal(editor.form.stays[0].comfort, 'A complete stay description ');
  assert.deepEqual(clone(editor.form.stays[1]), { name: '', nights: 1, place: '', comfort: '' });
});

test('saving or uploading disables all form controls and section navigation through native fieldsets', () => {
  const checkControls = (node, inherited = false) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach(child => checkControls(child, inherited)); return; }
    if (typeof node.type === 'function') { checkControls(node.type(node.props), inherited); return; }
    const disabled = inherited || (node.type === 'fieldset' && node.props.disabled === true);
    if (['input', 'select', 'textarea', 'button'].includes(node.type)) assert.ok(disabled || node.props.disabled, `Enabled ${node.type}: ${node.props['aria-label'] || text(node)}`);
    checkControls(node.props?.children, disabled);
  };
  for (const area of PACKAGE_EDITOR_AREAS) {
    const editor = setup(area.id, true);
    checkControls(editor.render());
    for (const node of nodes(editor.render())) {
      if (node.type === BookingFields || node.type === ImagesEditor) assert.equal(node.props.disabled, true);
      if (node.type === SectionsEditor) assert.equal(node.props.busy, true);
    }
  }
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(file, dependencies = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, URL, require(name) { assert.ok(dependencies[name], name); return dependencies[name]; } });
  return exports;
}
const data = load('src/lib/packageData.ts');
const sections = load('src/lib/packageDetailSections.ts');
const facts = load('src/lib/packageFacts.ts', { '@/lib/packageData': data });
const changes = load('src/lib/packagePreviewEditing.ts');
const { packageValidationIssue } = load('src/app/admin/packages/catalogueEditorState.ts', {
  '@/lib/packageData': data, '@/lib/packageDetailSections': sections,
});
const { formFromPackage, packageFromForm, applyPackagePreviewChange: edit } = load('src/app/admin/packages/packageFormModel.ts', {
  '@/lib/packageData': data, '@/lib/packageDetailSections': sections,
  '@/lib/packageFacts': facts, '@/lib/packagePreviewEditing': changes,
});
const fixture = () => JSON.parse(fs.readFileSync('content/package-imports/skandagiri-sunrise-trek-from-bangalore.json', 'utf8'));
const plain = value => JSON.parse(JSON.stringify(value));

test('controlled draft fields retain spaces, blank lines and place separators until Save', () => {
  const pkg = fixture();
  let form = formFromPackage(pkg);
  form = edit(form, ['title'], 'A mountain ', pkg);
  form = edit(form, ['details', 'summary'], 'First paragraph.\n\n', pkg);
  form = edit(form, ['details', 'places'], 'Bengaluru, ', pkg);
  form = edit(form, ['details', 'availabilityNote'], 'Permit confirmation ', pkg);
  form = edit(form, ['details', 'itinerary', 0, 'title'], 'Overnight ', pkg);
  form = edit(form, ['details', 'facts', 0, 'label'], 'Trip duration ', pkg);
  form = edit(form, ['details', 'quoteNote'], 'Ask our team.\n', pkg);
  assert.equal(form.title, 'A mountain ');
  assert.equal(form.summary, 'First paragraph.\n\n');
  assert.equal(form.places, 'Bengaluru, ');
  assert.equal(form.availabilityNote, 'Permit confirmation ');
  assert.equal(form.itinerary[0].title, 'Overnight ');
  assert.equal(form.facts[0].label, 'Trip duration ');
  const draft = packageFromForm(form, pkg, { normalize: false });
  assert.equal(draft.title, 'A mountain ');
  assert.equal(draft.details.summary, 'First paragraph.\n\n');
  const saved = packageFromForm(form, pkg);
  assert.equal(saved.title, 'A mountain');
  assert.equal(saved.details.summary, 'First paragraph.');
  assert.deepEqual(plain(saved.details.places), ['Bengaluru']);
  assert.equal(saved.details.itinerary[0].title, 'Overnight');
});

test('raw numeric fields survive controlled edits and unrelated changes', () => {
  const pkg = fixture();
  for (const value of ['', '12.', '12.00']) {
    let form = edit(formFromPackage(pkg), ['price'], value, pkg);
    assert.equal(form.price, value);
    form = edit(form, ['details', 'quoteNote'], 'Updated note', pkg);
    assert.equal(form.price, value);
    assert.equal(packageFromForm(form, pkg).price, Number(value));
    if (value === '') assert.equal(form.discount, String(pkg.discount));
  }
  let form = edit(formFromPackage(pkg), ['originalPrice'], '', pkg);
  form = edit(form, ['nights'], '', pkg);
  form = edit(form, ['title'], 'New title', pkg);
  assert.equal(form.originalPrice, '');
  assert.equal(form.nights, '');
});

test('legacy review summary fields can be edited and survive save and reopen', () => {
  const pkg = fixture();
  let form = edit(formFromPackage(pkg), ['rating'], '4.5', pkg);
  form = edit(form, ['reviews'], '37', pkg);
  form = edit(form, ['title'], 'Changed title', pkg);
  const saved = packageFromForm(form, pkg);
  assert.equal(saved.rating, 4.5);
  assert.equal(saved.reviews, 37);
  assert.equal(formFromPackage(saved).rating, '4.5');
  assert.equal(formFromPackage(saved).reviews, '37');
});

test('published cover and legacy review summary values are validated before saving', () => {
  const form = formFromPackage(fixture());
  form.status = 'published';
  form.price = '799'; form.originalPrice = '999'; form.discount = '20';
  assert.equal(packageValidationIssue(form), null);
  assert.match(packageValidationIssue({ ...form, image: '' }).message, /cover image/);
  assert.equal(packageValidationIssue({ ...form, status: 'draft', image: '' }), null);
  for (const rating of ['-1', '5.1', 'bad']) assert.match(packageValidationIssue({ ...form, rating }).message, /overall rating/);
  for (const reviews of ['-1', '1.5', 'bad']) assert.match(packageValidationIssue({ ...form, reviews }).message, /review count/);
  assert.equal(packageValidationIssue({ ...form, rating: '4.8', reviews: '21' }), null);
});

test('typing or reducing duration never removes authored itinerary days', () => {
  const pkg = fixture();
  pkg.details.itinerary = [
    { day: 0, title: 'Overnight', route: '', description: 'Meet at night.', meals: '' },
    { day: 1, title: 'First day', route: '', description: 'Keep first day.', meals: '' },
    { day: 2, title: 'Second day', route: '', description: 'Keep second day.', meals: '' },
  ];
  let form = formFromPackage(pkg);
  const original = JSON.stringify(form.itinerary);
  for (const value of ['', '1', 'invalid']) {
    form = edit(form, ['days'], value, pkg);
    assert.equal(form.days, value);
    assert.equal(JSON.stringify(form.itinerary), original);
  }
  form = edit(form, ['days'], '3', pkg);
  assert.equal(form.itinerary.length, 4);
  assert.equal(form.itinerary[2].description, 'Keep second day.');
  form = edit(form, ['details', 'itinerary'], form.itinerary.filter(day => day.day !== 2), pkg);
  assert.equal(form.days, '2');
  assert.deepEqual(Array.from(form.itinerary, day => day.day), [0, 1, 2]);
  assert.equal(JSON.stringify(pkg.details.itinerary), original);
});

test('independent cover, explicit cover removal, existing URL and snapshot placement survive save', () => {
  const pkg = fixture();
  pkg.image = '/separate-cover.jpg';
  pkg.href = '/special-existing-package-route';
  pkg.details.gallery = ['/hero.jpg', '/second.jpg'];
  pkg.details.pageSections.snapshotPlacement = 'about';
  let form = edit(formFromPackage(pkg), ['title'], 'New title', pkg);
  let saved = packageFromForm(form, pkg);
  assert.equal(saved.image, '/separate-cover.jpg');
  assert.deepEqual(plain(saved.details.gallery), ['/hero.jpg', '/second.jpg']);
  assert.equal(saved.href, pkg.href);
  assert.equal(saved.details.pageSections.snapshotPlacement, 'about');
  form = edit(form, ['image'], '', pkg);
  saved = packageFromForm(form, pkg);
  assert.equal(saved.image, '');
  assert.equal(formFromPackage(saved).image, '');
  assert.deepEqual(plain(saved.details.gallery), ['/hero.jpg', '/second.jpg']);
});

test('hidden content and its images remain owned by the package after unrelated edits', () => {
  const pkg = fixture();
  pkg.details.pageSections.gallery = { enabled: false, images: ['/hidden-gallery.jpg'] };
  pkg.details.pageSections.locations = { enabled: false, items: [{ id: 'pickup', name: '', type: 'pickup', address: '', notes: 'Draft note.', mapUrl: '', image: '/hidden-pickup.jpg', visible: false }] };
  pkg.details.pageSections.hiddenSections = ['about', 'transfers'];
  const saved = packageFromForm(edit(formFromPackage(pkg), ['price'], '1200', pkg), pkg);
  assert.deepEqual(plain(saved.details.pageSections.gallery), pkg.details.pageSections.gallery);
  assert.deepEqual(plain(saved.details.pageSections.locations), pkg.details.pageSections.locations);
  assert.deepEqual(plain(saved.details.pageSections.hiddenSections), ['about', 'transfers']);
  assert.ok(saved.details.summary);
});


test('badge icons, custom text and hidden state survive preview, JSON storage and reopening', () => {
  const pkg = fixture();
  let form = formFromPackage(pkg);
  assert.equal(packageFromForm(form, pkg).details.bookingBadges, undefined);
  const badges = data.getPackageBookingBadges(pkg).map((badge, index) => ({ ...badge, icon: ['Tag', 'Bus', 'Utensils'][index], text: `Badge ${index + 1} `, visible: index !== 1 }));
  form = edit(form, ['details', 'bookingBadges'], badges, pkg);
  assert.equal(form.bookingBadges[0].text, 'Badge 1 ');
  form = edit(form, ['title'], 'Updated title', pkg);
  const saved = plain(packageFromForm(form, pkg));
  const reopened = formFromPackage(saved);
  assert.deepEqual(plain(reopened.bookingBadges), plain(badges.map(b => ({ ...b, text: b.text.trim() }))));
  assert.equal(reopened.bookingBadges[1].visible, false);
  const cleared = edit(reopened, ['details', 'bookingBadges'], [], saved);
  assert.deepEqual(plain(data.getPackageBookingBadges(packageFromForm(cleared, saved))), plain(data.getPackageBookingBadges(pkg)));
});

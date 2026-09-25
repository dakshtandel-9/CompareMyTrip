import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(file) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports, URL });
  return exports;
}

const {
  BUILTIN_PACKAGE_SECTIONS,
  defaultPackagePageSections,
  getPackagePageSections,
  safeMapUrl,
  locationMapLink,
  locationEmbedUrl,
  packagePageSectionsIssue,
  packagePageSectionImages,
} = load('src/lib/packageDetailSections.ts');
const { getPackageDetails } = load('src/lib/packageData.ts');
const { DUMMY_PACKAGES } = load('src/lib/packageSeed.ts');
const plain = (value) => JSON.parse(JSON.stringify(value));
const reopen = (pageSections) => getPackagePageSections(plain({ pageSections }));

const box = (extra = {}) => ({ id: 'packing', title: 'What to pack', layout: 'box', visible: true, body: 'Bring a raincoat.', items: [], ...extra });
const location = (extra = {}) => ({ id: 'airport', type: 'pickup', name: 'Airport pickup', address: 'Kempegowda Airport, Bengaluru', notes: 'Meet at exit 2.', mapUrl: '', image: '', visible: true, ...extra });
const review = (extra = {}) => ({ id: 'review-1', name: 'Guest', rating: 5, text: 'A lovely trip.', visible: true, ...extra });

test('all existing packages retain their standard sections and default extras to off', () => {
  assert.equal(BUILTIN_PACKAGE_SECTIONS.length, 8);
  for (const pkg of DUMMY_PACKAGES) {
    const config = getPackagePageSections(getPackageDetails(pkg));
    assert.equal(config.hiddenSections.length, 0);
    assert.equal(config.sections.length, 0);
    assert.equal(config.gallery.enabled, false);
    assert.equal(config.locations.enabled, false);
    assert.equal(config.reviews.enabled, false);
    assert.equal(packagePageSectionsIssue(config), null);
  }
});

test('defaults and normalized data use fresh arrays, so editing one package cannot edit another', () => {
  const first = defaultPackagePageSections();
  const second = defaultPackagePageSections();
  first.gallery.images.push('/gallery/new.jpg');
  first.sections.push(box());
  assert.equal(second.gallery.images.length, 0);
  assert.equal(second.sections.length, 0);
  const reopened = getPackagePageSections({ pageSections: first });
  reopened.sections[0].title = 'Changed';
  reopened.gallery.images.push('/gallery/second.jpg');
  assert.equal(first.sections[0].title, 'What to pack');
  assert.equal(first.gallery.images.length, 1);
});

test('partial or malformed stored documents are normalized without crashing', () => {
  const config = getPackagePageSections({ pageSections: {
    hiddenSections: ['inclusions', 'inclusions', 'unknown'],
    sections: [null, false, { title: 'Saved section', items: [null, { title: 'Saved item' }] }],
    gallery: { images: [null, '/gallery/saved.jpg'], enabled: true },
    locations: { items: [null, { name: 'Saved stop' }] },
    reviews: { items: [{ name: 'Guest' }] },
  } });
  assert.deepEqual(plain(config.hiddenSections), ['inclusions']);
  assert.equal(config.sections.length, 1);
  assert.equal(config.sections[0].layout, 'box');
  assert.equal(config.sections[0].visible, true);
  assert.equal(config.sections[0].items[0].title, 'Saved item');
  assert.deepEqual(plain(config.gallery.images), ['/gallery/saved.jpg']);
  assert.equal(config.locations.items[0].visible, true);
  assert.equal(config.locations.items[0].address, '');
  assert.equal(config.reviews.items[0].rating, 5);
  assert.deepEqual(plain(getPackagePageSections({ pageSections: null })), plain(defaultPackagePageSections()));
});

test('all custom layouts, order, hidden content, and per-package settings survive saving and reopening', () => {
  const config = defaultPackagePageSections();
  config.hiddenSections = ['itinerary', 'inclusions'];
  config.sections = [
    box({ id: 'faq', title: 'Questions', layout: 'dropdown', body: 'Kept for switching layout', items: [{ id: 'faq-1', title: 'Can children join?', body: 'Yes, ages 8 and up.' }] }),
    box({ id: 'tips', layout: 'boxes', visible: false, items: [{ id: 'tips-1', title: 'Packing', body: 'Travel light.' }] }),
    box(),
  ];
  config.gallery = { enabled: false, images: ['/gallery/saved.jpg'] };
  config.locations = { enabled: false, items: [location({ image: '/pickup.jpg', visible: false }), location({ id: 'drop', type: 'drop', name: 'Hotel drop' })] };
  config.reviews = { enabled: false, items: [review({ visible: false })] };
  const saved = reopen(config);
  assert.deepEqual(plain(saved), plain(config));
  saved.gallery.enabled = true;
  saved.locations.enabled = true;
  saved.locations.items[0].visible = true;
  saved.reviews.enabled = true;
  saved.reviews.items[0].visible = true;
  saved.sections[1].visible = true;
  saved.hiddenSections = [];
  const restored = reopen(saved);
  assert.equal(restored.gallery.images[0], '/gallery/saved.jpg');
  assert.equal(restored.locations.items[0].notes, 'Meet at exit 2.');
  assert.equal(restored.reviews.items[0].text, 'A lovely trip.');
  assert.equal(restored.sections[1].items[0].body, 'Travel light.');
  assert.equal(packagePageSectionsIssue(restored), null);
});

test('removing custom sections and all extra content persists without resurrecting defaults', () => {
  const config = defaultPackagePageSections();
  config.gallery.enabled = true;
  config.locations.enabled = true;
  config.reviews.enabled = true;
  assert.deepEqual(plain(reopen(config)), plain(config));
  assert.equal(packagePageSectionsIssue(config), null);
});

test('visible custom boxes require text and grouped/dropdown sections require complete items', () => {
  const config = defaultPackagePageSections();
  for (const section of [box({ title: ' ' }), box({ body: ' ' }), box({ layout: 'boxes' }), box({ layout: 'dropdown' }), box({ layout: 'boxes', items: [{ id: 'one', title: ' ' , body: 'Text' }] })]) {
    config.sections = [section];
    assert.equal(typeof packagePageSectionsIssue(config), 'string');
    config.sections[0].visible = false;
    assert.equal(packagePageSectionsIssue(config), null);
  }
});

test('optional gallery validates image sources and its limit only while enabled', () => {
  const config = defaultPackagePageSections();
  config.gallery = { enabled: true, images: ['/gallery/photo.jpg', 'https://cdn.example.com/photo.jpg', 'data:image/png;base64,aGVsbG8='] };
  assert.equal(packagePageSectionsIssue(config), null);
  for (const source of ['javascript:alert(1)', '//example.com/a.jpg', '/\\example.com/a.jpg', 'data:text/html;base64,aA==']) {
    config.gallery.images = [source];
    assert.match(packagePageSectionsIssue(config), /image/i);
  }
  config.gallery.images = Array.from({ length: 21 }, (_, index) => `/gallery/${index}.jpg`);
  assert.match(packagePageSectionsIssue(config), /20/);
  config.gallery.enabled = false;
  assert.equal(packagePageSectionsIssue(config), null);
});

test('pickup and drop locations require a name and destination, while hidden drafts are retained', () => {
  const config = defaultPackagePageSections();
  config.locations = { enabled: true, items: [location(), location({ id: 'drop', type: 'drop', address: '', mapUrl: 'https://maps.app.goo.gl/abc123' })] };
  assert.equal(packagePageSectionsIssue(config), null);
  for (const invalid of [location({ name: '' }), location({ address: '' }), location({ mapUrl: 'https://evil.example/maps' }), location({ image: 'javascript:alert(1)' })]) {
    config.locations.items = [invalid];
    assert.equal(typeof packagePageSectionsIssue(config), 'string');
    config.locations.items[0].visible = false;
    assert.equal(packagePageSectionsIssue(config), null);
    assert.equal(reopen(config).locations.items.length, 1);
  }
});

test('reviews validate names, text, and whole-star ratings only when enabled and visible', () => {
  const config = defaultPackagePageSections();
  config.reviews = { enabled: true, items: [review()] };
  assert.equal(packagePageSectionsIssue(config), null);
  for (const invalid of [review({ name: '' }), review({ text: ' ' }), ...[0, 6, 3.5, NaN].map((rating) => review({ rating }))]) {
    config.reviews.items = [invalid];
    assert.equal(typeof packagePageSectionsIssue(config), 'string');
    config.reviews.items[0].visible = false;
    assert.equal(packagePageSectionsIssue(config), null);
  }
  config.reviews.items[0].visible = true;
  config.reviews.enabled = false;
  assert.equal(packagePageSectionsIssue(config), null);
});

test('map links accept supported HTTPS map providers and reject scripts, lookalikes, redirects, and iframe markup', () => {
  for (const url of ['https://www.google.com/maps/search/?api=1&query=Bengaluru', 'https://maps.google.com/?q=Goa', 'https://www.google.co.in/maps/place/Goa', 'https://maps.app.goo.gl/abc123', 'https://goo.gl/maps/abc123', 'https://maps.apple.com/?q=Goa', 'https://www.openstreetmap.org/#map=15/15.3/73.9']) {
    assert.equal(safeMapUrl(url), new URL(url).href);
  }
  for (const url of ['', 'javascript:alert(1)', 'data:text/html,a', 'http://maps.google.com/?q=Goa', '//maps.google.com', 'https://www.google.com.evil.example/maps', 'https://www.google.com/url?q=https://evil.example', 'https://evil.example/maps', 'https://user:password@maps.google.com/', 'https://maps.google.com:444/', 'https://maps.google.com/\\evil.example', '<iframe src="https://maps.google.com/"></iframe>']) {
    assert.equal(safeMapUrl(url), null, url);
  }
});

test('map search and embed destinations encode the address and never use an arbitrary URL', () => {
  const stop = location({ address: 'Exit 2 & Main Road? foo=bar', mapUrl: 'javascript:alert(1)' });
  const link = new URL(locationMapLink(stop));
  assert.equal(link.origin, 'https://www.google.com');
  assert.equal(link.searchParams.get('query'), stop.address);
  const embed = new URL(locationEmbedUrl(stop));
  assert.equal(embed.origin, 'https://www.google.com');
  assert.equal(embed.searchParams.get('q'), stop.address);
  assert.equal(embed.searchParams.get('output'), 'embed');
  assert.equal(locationMapLink(location({ mapUrl: 'https://maps.apple.com/?q=Goa' })), 'https://maps.apple.com/?q=Goa');
  assert.equal(locationEmbedUrl(location({ address: '', mapUrl: 'https://maps.apple.com/?q=Goa' })), null);
  assert.equal(new URL(locationMapLink(location({ address: '', name: 'Airport' }))).searchParams.get('query'), 'Airport');
  assert.equal(locationMapLink(location({ address: '', name: '' })), null);
});

test('upload persistence includes gallery and location images even with both toggles off', () => {
  const config = defaultPackagePageSections();
  config.gallery.images = ['/saved-gallery.jpg'];
  config.locations.items = [location({ image: '/saved-pickup.jpg', visible: false }), location({ id: 'drop', image: '/saved-gallery.jpg' }), location({ id: 'empty' })];
  assert.deepEqual(plain(packagePageSectionImages(reopen(config))), ['/saved-gallery.jpg', '/saved-pickup.jpg']);
});


test('individual boxes retain their text and visibility when hidden and reopened', () => {
  const config = defaultPackagePageSections();
  config.sections = [box({ layout: 'boxes', items: [{ id: 'one', title: 'Packing', body: '', visible: false }] })];
  const saved = reopen(config);
  assert.equal(saved.sections[0].items[0].visible, false);
  assert.equal(saved.sections[0].items[0].title, 'Packing');
  assert.equal(packagePageSectionsIssue(saved), null);
  saved.sections[0].items[0].visible = true;
  assert.equal(typeof packagePageSectionsIssue(saved), 'string');
  saved.sections[0].items[0].body = 'Walking shoes';
  assert.equal(packagePageSectionsIssue(saved), null);
});


test('brochure text and section positions survive saving and reopening', () => {
  const config = defaultPackagePageSections();
  config.tagline = 'Walk above the clouds.';
  config.introduction = 'An overnight escape.\nReturn the next afternoon.';
  config.itineraryNote = 'Timings depend on weather.';
  config.stayNote = 'Similar-category hotel subject to availability.';
  config.inclusionNote = 'Entry tickets excluded.';
  config.bookingNote = 'Double sharing.';
  config.sections = ['overview', 'highlights', 'practical', 'faq', 'extras'].map((placement) => box({ id: placement, placement }));
  assert.deepEqual(plain(reopen(config)), plain(config));
  assert.equal(reopen({ sections: [box({ placement: 'invalid' })] }).sections[0].placement, undefined);
  assert.equal(reopen({ tagline: 42 }).tagline, undefined);
});

test('moving sections keeps the PDF steps fixed and only changes order inside their step', () => {
  const { movePackageSection } = load('src/lib/packageDetailSections.ts');
  const sections = [box({ id: 'why', placement: 'overview' }), box({ id: 'faq-a', placement: 'faq' }), box({ id: 'packing', placement: 'carry' }), box({ id: 'faq-b', placement: 'faq' })];
  const moved = movePackageSection(sections, 'faq-b', -1);
  assert.deepEqual(plain(moved.map((section) => section.id)), ['why', 'faq-b', 'packing', 'faq-a']);
  assert.deepEqual(plain(sections.map((section) => section.id)), ['why', 'faq-a', 'packing', 'faq-b']);
  assert.equal(movePackageSection(sections, 'why', 1), sections);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const modules = new Map();
function load(file) {
  if (modules.has(file)) return modules.get(file);
  const exports = {};
  modules.set(file, exports);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports, URLSearchParams, require(name) {
    assert.ok(name.startsWith('@/lib/'), `Unexpected import: ${name}`);
    return load(`src/${name.slice(2)}.ts`);
  } });
  return exports;
}

const { normalizeSiteContent } = load('src/lib/siteContent.ts');
const { destinationForPlace, destinationIntroduction } = load('src/lib/destinationContent.ts');
const { internationalFromPrice } = load('src/lib/internationalPackages.ts');

test('retired copy upgrades without replacing custom copy, clearing fields or rewriting reviews', () => {
  const raw = {
    hero: { copy: [
      { id: 'hero-1', titleLine1: 'Smart travel packages.', titleLine2: 'A custom heading', body: '' },
      { id: 'my-slide', titleLine1: 'Our own message', titleLine2: '', body: 'Custom copy stays intact.' },
    ] },
    reviews: { items: [{ id: 'real-review', verified: true, name: 'Traveller', quote: 'No hidden costs.', rating: 4 }] },
    featured: { header: { title: 'Featured packages' } },
    contact: { title: 'Where Will You Go Next?' },
    newsletter: { titleLine1: '', titleLine2: 'Keep this', points: [] },
  };
  const content = normalizeSiteContent(raw);
  assert.equal(content.hero.copy[0].titleLine1, 'Smart travel plans.');
  assert.equal(content.hero.copy[0].titleLine2, 'A custom heading');
  assert.equal(content.hero.copy[0].body, '');
  assert.equal(content.hero.copy[1].id, 'my-slide');
  assert.equal(content.hero.copy[1].body, 'Custom copy stays intact.');
  assert.equal(content.reviews.items[0].quote, 'No hidden costs.');
  assert.equal(content.featured.header.title, 'Explore Our Travel Plans');
  assert.equal(content.contact.title, 'Plan Your Next Trip With CompareMyTrip');
  assert.equal(content.newsletter.titleLine1, '');
  assert.equal(JSON.stringify(normalizeSiteContent(content)), JSON.stringify(content));
});

test('original visa examples retire while separately authored visa guidance stays intact', () => {
  const original = { id: 'intl-thailand', visa: 'Visa free', visaNote: 'Up to 60 days for Indian passports', flightHours: '4h 15m' };
  const old = normalizeSiteContent({ international: { items: [original] } }).international.items[0];
  assert.equal(old.visa, 'Check requirements');
  assert.equal(old.flightHours, 'Depends on your route');
  const edited = normalizeSiteContent({ international: { items: [{ ...original, visaNote: 'Our separately reviewed guidance', flightHours: 'Check your ticket' }] } }).international.items[0];
  assert.equal(edited.visa, 'Visa free');
  assert.equal(edited.visaNote, 'Our separately reviewed guidance');
  assert.equal(edited.flightHours, 'Check your ticket');
});

test('guide links resolve existing state hubs without inventing destinations or guessing ambiguous regions', () => {
  const destinations = [
    { name: 'Himachal Pradesh', region: 'India' },
    { name: 'Kerala', region: 'India' },
    { name: 'Meghalaya', region: 'India' },
  ];
  assert.equal(destinationForPlace(destinations, 'Spiti Valley')?.name, 'Himachal Pradesh');
  assert.equal(destinationForPlace(destinations, 'Munnar')?.name, 'Kerala');
  assert.equal(destinationForPlace(destinations, 'Shillong')?.name, 'Meghalaya');
  assert.equal(destinationForPlace(destinations, 'Northeast India'), undefined);
  assert.equal(destinationForPlace(destinations, 'Goa'), undefined);
  const exact = { name: 'Munnar', region: 'India' };
  assert.equal(destinationForPlace([...destinations, exact], 'Munnar'), exact);
  assert.match(destinationIntroduction('An unlisted destination'), /An unlisted destination/);
});

test('country prices come from published matching inventory, excluding drafts and invalid prices', () => {
  const trip = (id, destination, price, extra = {}) => ({ id, title: id, destination, price, region: 'International', ...extra });
  const packages = [
    trip('sri-lanka', 'Srilanka', 24000),
    trip('sri-lanka-draft', 'Sri Lanka', 100, { status: 'draft' }),
    trip('bali', 'Bali', 31000),
    trip('dubai', 'UAE', 19000),
    trip('bad-price', 'Sri Lanka', 0),
    trip('wrong-region', 'Sri Lanka', 20, { region: 'India' }),
  ];
  assert.equal(internationalFromPrice('Sri Lanka', packages), 24000);
  assert.equal(internationalFromPrice('Indonesia', packages), 31000);
  assert.equal(internationalFromPrice('United Arab Emirates', packages), 19000);
  assert.equal(internationalFromPrice('Thailand', packages), undefined);
});

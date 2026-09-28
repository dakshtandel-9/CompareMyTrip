import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(file, dependencies = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports, URLSearchParams, require: name => {
    assert.ok(dependencies[name], `Unexpected dependency: ${name}`);
    return dependencies[name];
  } });
  return exports;
}
const data = load('src/lib/packageData.ts');
const richText = value => 'cmt-rich:v1:' + JSON.stringify({ type: 'paragraph', content: [{ type: 'text', text: value }] });
const { getPlanComparison } = load('src/lib/planComparison.ts', {
  '@/lib/packageData': data,
  '@/lib/packageRichText': load('src/lib/packageRichText.ts'),
});
const { normalizeSiteContent, DEFAULT_SITE_CONTENT } = load('src/lib/siteContent.ts', {
  '@/lib/weekendTracks': load('src/lib/weekendTracks.ts'),
  '@/lib/comingSoon': load('src/lib/comingSoon.ts'),
});
const plain = value => JSON.parse(JSON.stringify(value));
const pkg = { id: 'test-plan', title: 'Coorg escape', location: 'Coorg', destination: 'Coorg', image: '', tags: ['Family'], hotelStars: 0, nights: 2, days: 3 };

test('comparison does not turn unspecified flights, stays or dates into promises', () => {
  const compared = getPlanComparison(pkg);
  assert.match(compared.flights, /Confirm/);
  assert.match(compared.accommodation, /Confirm/);
  assert.match(compared.activities, /Confirm/);
  assert.match(compared.inclusions, /Confirm/);
  assert.match(compared.itinerary, /Confirm/);
  assert.match(compared.dates, /Confirm your preferred dates/);
  assert.doesNotMatch(compared.dates, /daily|available every day/i);
  assert.equal(compared.destinations, 'Coorg');
});

test('comparison uses saved stays, terms, inclusions and visible itinerary activities', () => {
  const plan = { ...pkg, departureDays: [0, 6], details: {
    ...data.getPackageDetails(pkg),
    places: ['Madikeri', 'Abbey Falls'],
    stays: [{ name: 'Hill Hotel', place: 'Madikeri', comfort: 'Deluxe', nights: 2 }],
    inclusions: [richText('Breakfast'), 'Airport transfer'],
    transfers: richText('Private cab'), flights: 'Not included',
    cancellationPolicy: 'Free cancellation up to 30 days before departure',
    dayZeroEnabled: false,
    itinerary: [
      { day: 1, title: 'Arrival', route: 'Bengaluru to Coorg', activities: [{ title: 'Coffee estate walk' }] },
      { day: 0, title: 'Hidden pickup', route: '', activities: [{ title: 'Hidden activity' }] },
      { day: 2, title: 'Sightseeing', route: '', activities: [{ title: 'Coffee estate walk' }, { title: 'Abbey Falls' }] },
    ],
  } };
  const compared = getPlanComparison(plan);
  assert.match(compared.accommodation, /Hill Hotel.*Madikeri.*Deluxe.*2 nights/);
  assert.equal(compared.inclusions, 'Breakfast\nAirport transfer');
  assert.equal(compared.transfers, 'Private cab');
  assert.equal(compared.flights, 'Not included');
  assert.match(compared.cancellation, /30 days/);
  assert.equal(compared.activities, 'Coffee estate walk\nAbbey Falls');
  assert.equal(compared.itinerary, 'Day 1: Arrival · Bengaluru to Coorg\nDay 2: Sightseeing');
  assert.match(compared.dates, /Weekends only/);
  assert.match(compared.dates, /Confirm/);
});

test('old CMS marketplace wording upgrades without mutating the stored document', () => {
  const saved = {
    featured: { header: { description: 'Every package here comes from a GST-verified operator, with the full itinerary, inclusions and exclusions published before you enquire.' } },
    auth: { login: { imageSubcopy: 'Compare flights, hotels and holiday packages from 500+ partners and get the best deals instantly.' } },
    faq: { items: [{ id: 'faq-1', question: 'Do you sell the packages yourself?', answer: 'CompareMyTrip is a comparison platform. Every package is delivered by a GST-verified tour operator that we check before it is listed. We put the packages side by side, publish the full inclusions and exclusions, and confirm who will be operating your trip once you book.' }] },
    whyUs: { points: [{ id: 'why-4', value: 'Verified', label: 'Local partners', description: 'Trusted operators with checked credentials and destination expertise.' }] },
  };
  const original = plain(saved);
  const normalized = normalizeSiteContent(saved);
  assert.equal(normalized.featured.header.description, DEFAULT_SITE_CONTENT.featured.header.description);
  assert.equal(normalized.auth.login.imageSubcopy, DEFAULT_SITE_CONTENT.auth.login.imageSubcopy);
  assert.equal(normalized.faq.items[0].answer, DEFAULT_SITE_CONTENT.faq.items[0].answer);
  assert.equal(normalized.whyUs.points[0].value, 'Your choice');
  assert.deepEqual(saved, original);
  const roundTrip = normalizeSiteContent(plain(normalized));
  for (const key of Object.keys(saved)) assert.deepEqual(plain(roundTrip[key]), plain(normalized[key]));
});

test('custom CMS copy, intentionally empty text and traveller quotes are preserved', () => {
  const saved = {
    compare: { header: { title: 'Choose your family holiday', description: '', actionLabel: '' } },
    faq: { items: [{ id: 'custom', question: 'Can I customise a plan?', answer: 'Ask our team about a private trip.' }] },
    reviews: { items: [{ id: 'review', quote: 'Better choices.', name: 'Traveller' }] },
  };
  const normalized = normalizeSiteContent(saved);
  assert.equal(normalized.compare.header.title, saved.compare.header.title);
  assert.equal(normalized.compare.header.description, '');
  assert.equal(normalized.compare.header.actionLabel, '');
  assert.equal(normalized.faq.items[0].answer, saved.faq.items[0].answer);
  assert.equal(normalized.reviews.items[0].quote, 'Better choices.');
});

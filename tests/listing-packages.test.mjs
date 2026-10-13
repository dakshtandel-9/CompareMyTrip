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
  vm.runInNewContext(code, { exports, URLSearchParams, Intl, require: name => {
    assert.ok(dependencies[name], `Unexpected dependency: ${name}`);
    return dependencies[name];
  } });
  return exports;
}
const data = load('src/lib/packageData.ts');
const richText = load('src/lib/packageRichText.ts');
const travel = load('src/lib/bengaluruTravel.ts', { '@/lib/packageData': data, '@/lib/packageRichText': richText });
const { getPlanComparison } = load('src/lib/planComparison.ts', { '@/lib/packageData': data, '@/lib/packageRichText': richText });
const { toListingPackage } = load('src/lib/listingPackages.ts', {
  '@/lib/bengaluruTravel': travel, '@/lib/packageData': data, '@/lib/packageRichText': richText,
});
// Values built inside the sandbox have its own Array/Object prototypes.
const plain = value => JSON.parse(JSON.stringify(value));
const rich = (...paragraphs) => paragraphs.map(text => 'cmt-rich:v1:' + JSON.stringify({ type: 'paragraph', content: [{ type: 'text', text, marks: [{ type: 'bold' }] }] })).join('\n');

const pkg = {
  id: 'coorg', title: 'Coorg escape', location: 'Coorg', destination: 'Coorg', image: '/coorg.jpg', tags: ['Family', 'Weekend Treks'],
  hotelStars: 0, nights: 2, days: 3, price: 4800, departureDays: [0, 6],
  details: {
    ...data.getPackageDetails({ title: 'Coorg escape', location: 'Coorg', image: '/coorg.jpg', nights: 2, days: 3 }),
    summary: rich('A long write-up only the detail page shows.'),
    gallery: ['/one.jpg', '/two.jpg'],
    places: [rich('Madikeri'), 'Abbey Falls'],
    stays: [{ name: rich('Hill Hotel'), place: 'Madikeri', comfort: rich('Deluxe'), nights: 2, roomType: 'Twin sharing', image: '/stay.jpg' }],
    inclusions: [rich('Transport from Bengaluru by AC tempo traveller'), 'Breakfast'],
    meals: rich('Breakfast and dinner'),
    transfers: rich('Pickup included', 'Seats are allotted on arrival'),
    flights: rich('Not included'),
    cancellationPolicy: rich('Full refund up to 30 days before departure', 'No refund after that'),
    availabilityNote: 'Weekend departures fill quickly',
    bookingTitle: 'Reserve your seat', bookingHeading: 'Coorg weekend', bookingLabel: 'Trip package', quoteNote: 'Ask for group rates',
    bookingBadges: [{ id: 'package', text: 'Trip package', icon: '', visible: true }],
    facts: [
      { id: 'duration', icon: 'CalendarClock', label: 'Duration', value: '2 Nights / 3 Days', visible: true },
      { id: 'best-for', icon: 'Users', label: 'Best for', value: rich('Couples and friends'), visible: true },
      { id: 'hidden', icon: 'Users', label: 'Suitable for', value: 'Families', visible: false },
    ],
    itinerary: [
      { day: 1, title: rich('Bengaluru to Coorg'), route: 'Bengaluru → Madikeri', description: rich('Long day write-up'), meals: 'Dinner',
        activities: [{ time: 'Morning', title: rich('Coffee estate walk'), description: rich('Guided walk'), images: ['/walk.jpg'] }] },
      { day: 2, title: 'Sightseeing', route: '', description: '', meals: 'Breakfast', activities: [{ time: 'Noon', title: 'Abbey Falls', description: '' }] },
    ],
    pageSections: {
      hiddenSections: [], sections: [{ id: 'x', title: 'Extra', body: rich('Detail page only') }], gallery: { enabled: true, images: ['/g.jpg'] },
      reviews: { enabled: true, items: [{ id: 'r', name: 'A', text: 'Great', rating: 5, visible: true }] },
      locations: { enabled: true, items: [
        { id: 'p', name: 'Majestic', type: 'pickup', address: 'Kempegowda Bus Station, Bengaluru', notes: rich('Gate 3'), mapUrl: 'https://maps.example/p', image: '/p.jpg', visible: true },
      ] },
    },
  },
};

test('every listing surface reads the same answers from the trimmed package as from the full one', () => {
  const listed = toListingPackage(pkg);
  assert.deepEqual(getPlanComparison(listed), getPlanComparison(pkg));
  assert.equal(travel.startsInBengaluru(listed), travel.startsInBengaluru(pkg));
  assert.equal(travel.startsInBengaluru(listed), true);
  assert.equal(travel.transportIncluded(listed), travel.transportIncluded(pkg));
  assert.deepEqual(travel.packageLogistics(listed), travel.packageLogistics(pkg));
  for (const audience of travel.TRAVELLER_TYPES.map(type => type.value)) {
    assert.equal(travel.matchesTraveller(listed, audience), travel.matchesTraveller(pkg, audience), audience);
  }
  assert.equal(travel.matchesTraveller(listed, 'couples'), true);
  assert.equal(data.getPackageAccommodationLabel(listed), data.getPackageAccommodationLabel(pkg));
});

test('listing packages carry no formatting markup and none of the detail page\'s own content', () => {
  const listed = plain(toListingPackage(pkg));
  assert.doesNotMatch(JSON.stringify(listed), /cmt-rich:v1/);
  assert.equal(listed.details.summary, '');
  assert.deepEqual(listed.details.gallery, []);
  assert.equal(listed.details.itinerary[0].description, '');
  assert.equal(listed.details.itinerary[0].activities[0].images, undefined);
  for (const field of ['bookingBadges', 'bookingTitle', 'bookingHeading', 'bookingLabel', 'quoteNote']) assert.equal(field in listed.details, false, field);
  assert.deepEqual(listed.details.facts.map(fact => fact.id), ['best-for']);
  assert.deepEqual(listed.details.pageSections.sections, []);
  assert.deepEqual(listed.details.pageSections.locations.items[0], { ...pkg.details.pageSections.locations.items[0], notes: '', mapUrl: '', image: '' });
  assert.equal(listed.details.availabilityNote, pkg.details.availabilityNote, 'comparison dates still read the availability note');
  assert.equal(pkg.details.bookingTitle, 'Reserve your seat', 'the full package is left untouched');
});

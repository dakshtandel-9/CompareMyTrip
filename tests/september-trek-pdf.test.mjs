import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const directory = 'content/package-imports/september-treks';
const manifest = JSON.parse(fs.readFileSync(`${directory}/manifest.json`, 'utf8'));
const packages = manifest.map(({ file }) => JSON.parse(fs.readFileSync(`${directory}/${file}`, 'utf8')));

test('all seven PDF treks preserve their prices, departure days and complete timed itineraries', () => {
  const expected = {
    'uttari-betta-sunrise-trek': [765, [9, 10], 9],
    'kunti-betta-sunrise-trek': [799, [2, 9], 9],
    'shivagange-sunrise-trek': [799, [2, 9], 9],
    'madhugiri-trek': [799, [2, 4], 8],
    'anthargange-trek': [799, [2, 5], 8],
    'netravati-peak-monsoon-trek': [3399, [2, 9, 9], 12],
    'gudibande-fort-sunrise-trek': [799, [1, 5], 9],
  };
  assert.equal(packages.length, 7);
  for (const p of packages) {
    const [price, activityCounts, pickupCount] = expected[p.id];
    assert.equal(p.price, price);
    assert.equal(p.originalPrice, price);
    assert.equal(p.discount, 0);
    assert.deepEqual(p.departureDays, p.id.startsWith('netravati') ? [5] : [5, 6]);
    assert.deepEqual(p.details.itinerary.map(d => d.activities.length), activityCounts);
    assert.equal(p.details.pageSections.locations.items.length, pickupCount);
    assert.ok(p.details.itinerary.every(d => d.activities.every(a => a.title && a.description)));
    assert.ok(p.details.pageSections.sections.some(s => s.placement === 'carry'));
    assert.ok(p.details.pageSections.sections.some(s => s.placement === 'guidelines'));
    assert.ok(fs.existsSync(`public${p.image}`));
  }
});

test('Netravati retains its dormitory, meals, extra permit cost and next-morning arrival', () => {
  const p = packages.find(p => p.id.startsWith('netravati'));
  assert.equal(p.nights, 3);
  assert.equal(p.days, 2);
  assert.match(p.details.stays[0].roomType, /Dormitory/);
  assert.match(p.details.meals, /2 Breakfasts/);
  assert.match(p.details.exclusions.join(' '), /510 per person/);
  assert.equal(p.details.itinerary.at(-1).activities.at(-1).time, '2:00 AM');
});

test('only supplied reviews are shown and Gudibande has no invented cancellation terms', () => {
  for (const p of packages) {
    const reviews = p.details.pageSections.reviews;
    assert.equal(reviews.items.length, p.id === 'anthargange-trek' ? 4 : 0);
    assert.equal(reviews.enabled, p.id === 'anthargange-trek');
    assert.doesNotMatch(JSON.stringify(p.details), /will be added here|should be confirmed before publishing|can be updated with verified/);
  }
  const gudibande = packages.find(p => p.id.startsWith('gudibande'));
  assert.equal(gudibande.details.cancellationPolicy, '');
  assert.ok(gudibande.details.pageSections.hiddenSections.includes('cancellation'));
});

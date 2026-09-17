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
const tracks = load('src/lib/weekendTracks.ts');
const legacyTreks = [{ id: 'skandagiri', name: 'Skandagiri', grade: 1 }];
const { default: Badge } = load('src/components/TrekGradeBadge.tsx', {
  'react/jsx-runtime': jsx,
  '@/lib/weekendTracks': tracks,
  '@/lib/useSiteContent': { useSiteContent: () => ({ weekendTreks: { items: legacyTreks } }) },
});
const noop = () => null;
const { default: BookingCard } = load('src/app/packages/[packageId]/BookingCard.tsx', {
  'react/jsx-runtime': jsx,
  'next/image': { default: noop },
  'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) },
  'lucide-react': Object.fromEntries(['BadgePercent', 'BedDouble', 'Check', 'Flame', 'GitCompareArrows', 'Minus', 'Plane', 'Plus', 'ShieldCheck'].map(name => [name, noop])),
  '@/lib/packageData': data,
  '@/components/DepartureDatePicker': { default: ({ allowedDays }) => React.createElement('span', { 'data-allowed-days': allowedDays.join(',') }) },
  '@/lib/useCompare': { useCompare: () => ({ toggle: noop, isCompared: () => false }) },
  '@/components/TrekGradeBadge': { default: Badge },
});
const fixture = () => JSON.parse(fs.readFileSync('content/package-imports/skandagiri-sunrise-trek-from-bangalore.json', 'utf8'));
const render = pkg => renderToStaticMarkup(React.createElement(BookingCard, {
  pkg, details: data.getPackageDetails(pkg), travelDate: '', travellers: 2,
  onTravelDateChange: noop, onTravellersChange: noop, onRequestQuote: noop,
}));

test('saved package difficulty overrides the legacy grade for both trek categories and other packages', () => {
  const pkg = fixture();
  pkg.tags = ['Weekend Treks'];
  assert.match(render(pkg), />Easy</);
  for (const tags of [['Weekend Treks'], ['Treks'], ['Adventure']]) {
    for (const [grade, label] of [[1, 'Easy'], [2, 'Moderate'], [3, 'Difficult']]) {
      const html = render({ ...pkg, tags, trekGrade: grade });
      assert.match(html, new RegExp(`>${label}<`));
    }
  }
  assert.doesNotMatch(render({ ...pkg, trekGrade: 0 }), />Easy<|>Moderate<|>Difficult</);
});

test('public booking card uses edited badges, notes, flights and departure restrictions', () => {
  const pkg = fixture();
  pkg.departureDays = [5, 6];
  Object.assign(pkg.details, { bookingLabel: 'Guided mountain trek', availabilityNote: 'Permit confirmation required', quoteNote: 'Pickup arranged with your guide', flights: 'Land only' });
  const html = render(pkg);
  for (const text of ['Guided mountain trek', 'Permit confirmation required', 'Pickup arranged with your guide', 'Land only', 'Fri &amp; Sat only', 'data-allowed-days="5,6"']) assert.ok(html.includes(text), text);
  assert.doesNotMatch(html, /Availability confirmed with your quote|Compare quotes from 3 verified agents/);
  Object.assign(pkg.details, { bookingLabel: '', availabilityNote: '', quoteNote: '', flights: '' });
  const hidden = render(pkg);
  assert.doesNotMatch(hidden, /Permit confirmation required|Availability confirmed with your quote|Pickup arranged with your guide|Land only|Compare quotes from 3 verified agents/);
  assert.match(hidden, /Trip package/);
});

test('older packages retain their default booking text', () => {
  const html = render(fixture());
  assert.match(html, /Availability confirmed with your quote/);
  assert.match(html, /Compare quotes from 3 verified agents/);
});

test('hiding the cancellation section also hides its booking-card link without deleting policy text', () => {
  const pkg = fixture();
  pkg.details.cancellationPolicy = 'Refund terms retained in the draft';
  pkg.details.pageSections = { ...pkg.details.pageSections, hiddenSections: [] };
  assert.match(render(pkg), /View cancellation policy/);
  pkg.details.pageSections = { ...pkg.details.pageSections, hiddenSections: ['cancellation'] };
  assert.doesNotMatch(render(pkg), /View cancellation policy/);
  assert.equal(pkg.details.cancellationPolicy, 'Refund terms retained in the draft');
});

test('admin exposes package-owned booking fields and disables controls while saving', () => {
  const { default: Settings } = load('src/app/admin/packages/PackagePreviewSettings.tsx', {
    'react/jsx-runtime': jsx, '@/lib/packageData': data,
    '@/components/TrekGradeBadge': { default: Badge },
    '@/app/packages/_components/PackageInlineEditing': { InlineText: ({ value, label }) => React.createElement('span', { 'data-edit-field': label }, value) },
  });
  const pkg = { ...fixture(), trekGrade: 2 };
  const changes = [];
  const props = { pkg, editing: true, disabled: false, change: (...args) => changes.push(args), filedUnderOptions: { India: [], International: [] } };
  const html = renderToStaticMarkup(React.createElement(Settings, props));
  assert.match(html, /Booking card details/);
  assert.match(html, /<option value="2" selected="">Moderate/);
  for (const label of ['Package badge', 'Availability note', 'Quote note', 'Flights']) assert.ok(html.includes(`data-edit-field="${label}"`), label);
  const nodes = node => !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(nodes) : [node, ...nodes(node.props?.children)];
  const select = nodes(Settings(props)).find(node => node.type === 'select' && node.props.value === 2);
  select.props.onChange({ target: { value: '3' } });
  assert.equal(changes[0][0].join('.'), 'trekGrade');
  assert.equal(changes[0][1], 3);
  const disabled = renderToStaticMarkup(React.createElement(Settings, { ...props, disabled: true }));
  assert.match(disabled, /<fieldset disabled=""/);
  const preview = renderToStaticMarkup(React.createElement(Settings, { ...props, editing: false }));
  assert.doesNotMatch(preview, /<select|<fieldset/);
  assert.match(preview, />Moderate</);
});

test('unrated trek stays use their authored accommodation type without inventing hotel stars', () => {
  const netravati = JSON.parse(fs.readFileSync('content/package-imports/september-treks/netravati-peak-monsoon-trek.json', 'utf8'));
  assert.equal(data.getPackageAccommodationLabel(netravati), 'Dormitory');
  assert.match(render(netravati), /Dormitory/);
  assert.doesNotMatch(render(netravati), /0★ hotels/);
  assert.equal(data.getPackageAccommodationLabel(fixture()), 'No accommodation');
  assert.equal(data.getPackageAccommodationLabel({ ...netravati, hotelStars: 3 }), '3★ hotels');
  assert.equal(data.getPackageAccommodationLabel({ ...netravati, details: { ...netravati.details, stays: [{ name: 'Unrated stay' }] } }), 'Stay included');
});

import { richTextDependencies } from "./helpers/package-rich-text.mjs";
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as jsxRuntime from 'react/jsx-runtime';
import * as icons from 'lucide-react';

function load(file, dependencies = {}) {
  dependencies = { ...richTextDependencies, ...dependencies };
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, { exports, URL, require: (name) => {
    assert.ok(dependencies[name], `Unexpected dependency: ${name}`);
    return dependencies[name];
  }});
  return exports;
}

const model = load('src/lib/packageDetailSections.ts');
const noOp = () => null;
const galleryMock = ({ images }) => React.createElement('div', { 'data-gallery-images': JSON.stringify(images) });
const imageMock = (props) => {
  const imageProps = { ...props };
  delete imageProps.unoptimized;
  delete imageProps.fill;
  return React.createElement('img', imageProps);
};
const inlineEditing = load('src/app/packages/_components/PackageInlineEditing.tsx', {
  react: React, 'react/jsx-runtime': jsxRuntime, 'lucide-react': icons,
  './PackageInlineEditing.module.css': { default: {} }, './PackageGallery': { default: galleryMock },
});
const pageSectionComponents = load('src/app/packages/_components/PackagePageSections.tsx', {
  'react/jsx-runtime': jsxRuntime,
  'next/image': { default: imageMock },
  'lucide-react': icons,
  '@/lib/packageDetailSections': model,
  './PackageGallery': { default: galleryMock },
  './PackageInlineEditing': inlineEditing,
  './PackageSectionTextEditor': { default: ({ value, label }) => React.createElement('textarea', { 'aria-label': label, defaultValue: value }) },
});
const { default: PackagePageSections } = pageSectionComponents;
const renderSections = (pageSections) => renderToStaticMarkup(React.createElement(PackagePageSections, {
  value: model.getPackagePageSections({ pageSections }),
}));
const section = (overrides = {}) => ({ id: 'packing', title: 'Packing guide', layout: 'box', body: 'Bring walking shoes.', items: [], visible: true, ...overrides });
const location = (overrides = {}) => ({ id: 'airport', name: 'Airport terminal', type: 'pickup', address: 'Bengaluru airport', notes: 'Meet at gate 4.', image: '', mapUrl: '', visible: true, ...overrides });
const review = (overrides = {}) => ({ id: 'review-1', name: 'Maya', rating: 4, text: 'A lovely trip.', visible: true, ...overrides });

test('older packages and disabled optional content produce no bottom sections', () => {
  assert.equal(renderSections(undefined), '');
  assert.equal(renderSections({
    gallery: { enabled: false, images: ['/gallery.jpg'] },
    locations: { enabled: false, items: [location()] },
    reviews: { enabled: false, items: [review()] },
  }), '');
});

test('custom sections render in saved order and escape text while preserving paragraphs', () => {
  const html = renderSections({ sections: [
    section({ id: 'first', title: 'Before travelling', body: '<script>alert(1)</script>\nBring a passport.' }),
    section({ id: 'second', title: 'Second section' }),
    section({ id: 'hidden', title: 'Hidden section', visible: false }),
    section({ id: 'empty', title: 'Empty section', body: '' }),
  ] });
  assert.ok(html.indexOf('Before travelling') < html.indexOf('Second section'));
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;\nBring a passport\./);
  assert.match(html, /whitespace-pre-wrap/);
  assert.doesNotMatch(html, /<script>|Hidden section|Empty section/);
});

test('multiple boxes and dropdowns use cards and keyboard-accessible native disclosure', () => {
  const items = [{ id: 'one', title: 'What to pack', body: 'Walking shoes' }, { id: 'two', title: 'Weather', body: 'Bring a raincoat' }];
  const cards = renderSections({ sections: [section({ layout: 'boxes', body: '', items })] });
  assert.equal((cards.match(/<article /g) || []).length, 2);
  assert.match(cards, /sm:grid-cols-2/);
  assert.doesNotMatch(cards, /<details/);
  const dropdowns = renderSections({ sections: [section({ layout: 'dropdown', body: '', items })] });
  assert.equal((dropdowns.match(/<details /g) || []).length, 2);
  assert.equal((dropdowns.match(/<summary /g) || []).length, 2);
  assert.match(dropdowns, /What to pack/);
  assert.match(dropdowns, /Bring a raincoat/);
});

test('packing text becomes accessible lists without losing prose or rendering authored HTML', () => {
  const html = renderSections({ sections: [section({
    placement: 'carry',
    body: 'Bring the essentials.\nKeep your bag light.\n\n[Must Carry]\n• Water\n• Shoes\n\n[During Monsoon]\n- Raincoat\n- <script>unsafe</script>\n\nReturn with all your belongings.',
  })] });
  assert.match(html, /Bring the essentials\.\nKeep your bag light\./);
  assert.match(html, /<h3>Must Carry<\/h3><ul><li>Water<\/li><li>Shoes<\/li><\/ul>/);
  assert.match(html, /<h3>During Monsoon<\/h3><ul><li>Raincoat<\/li>/);
  assert.match(html, /&lt;script&gt;unsafe&lt;\/script&gt;/);
  assert.match(html, /Return with all your belongings\./);
  assert.doesNotMatch(html, /<script>/);
});

test('practical cards start closed and keep their complete content in native disclosures', () => {
  for (const placement of ['transfers', 'carry', 'guidelines', 'practical']) {
    const html = renderSections({ sections: [section({ placement })] });
    assert.match(html, /class="cmt-practical-disclosure"/);
    assert.match(html, /<summary>/);
    assert.match(html, /View details/);
    assert.match(html, /Bring walking shoes/);
    assert.doesNotMatch(html, /<details[^>]*open/);
  }
  const html = renderSections({ locations: { enabled: true, items: [location()] } });
  assert.match(html, /id="package-locations"/);
  assert.match(html, /class="cmt-practical-disclosure"/);
  assert.doesNotMatch(html, /<details[^>]*open/);
});

test('CRM keeps practical cards open with an easy content editor while traveller preview starts closed', () => {
  const value = model.getPackagePageSections({ pageSections: { sections: [section({ placement: 'guidelines' })] } });
  const html = renderToStaticMarkup(React.createElement(inlineEditing.PackageEditingContext.Provider, {
    value: { value: { details: { pageSections: value } }, disabled: false, change: noOp, upload: noOp },
  }, React.createElement(PackagePageSections, { value, area: 'guidelines' })));
  assert.match(html, /<details[^>]*open=""[^>]*class="cmt-practical-disclosure"/);
  assert.match(html, /<textarea aria-label="Section text">Bring walking shoes/);
  assert.match(html, /Edit Section title/);
});

test('switching to an empty single box does not publish retained multiple-box drafts', () => {
  assert.equal(renderSections({ sections: [section({ body: '', items: [{ id: 'old', title: 'Old card', body: 'Draft' }] })] }), '');
});

test('gallery requires enabled nonempty photos and passes only selected photos to its viewer', () => {
  assert.equal(renderSections({ gallery: { enabled: true, images: ['', ' '] } }), '');
  const html = renderSections({ gallery: { enabled: true, images: ['/one.jpg', '/two.jpg'] } });
  assert.match(html, /Trip gallery/);
  assert.match(html, /one\.jpg/);
  assert.match(html, /two\.jpg/);
});

// Open the real gallery viewer to inspect every navigable photo, including the
// thumbnails beyond the three images that fit in the closed mosaic.
const { default: RealPackageGallery } = load('src/app/packages/_components/PackageGallery.tsx', {
  'react/jsx-runtime': jsxRuntime,
  react: { ...React, useState: () => [0, noOp], useEffect: noOp },
  'next/image': { default: imageMock },
  'lucide-react': icons,
  './PackageGallery.module.css': { default: {} },
  '@/components/Modal': { default: ({ children }) => children },
});
const { default: SectionsWithRealGallery } = load('src/app/packages/_components/PackagePageSections.tsx', {
  'react/jsx-runtime': jsxRuntime,
  'next/image': { default: imageMock },
  'lucide-react': icons,
  '@/lib/packageDetailSections': model,
  './PackageInlineEditing': { ...inlineEditing, EditableGallery: RealPackageGallery },
  './PackageSectionTextEditor': { default: noOp },
});

test('optional trip gallery exposes all 20 uploaded photos in the real viewer', () => {
  const images = Array.from({ length: 20 }, (_, index) => `/trip-${index + 1}.jpg`);
  const html = renderToStaticMarkup(React.createElement(SectionsWithRealGallery, {
    value: model.getPackagePageSections({ pageSections: { gallery: { enabled: true, images } } }),
  }));
  assert.equal((html.match(/aria-label="View image \d+"/g) || []).length, 20);
  assert.match(html, /aria-label="View image 20"/);
  assert.match(html, /src="\/trip-20.jpg"/);
  assert.match(html, /1 of 20/);
});

test('the existing hero gallery retains its default limit of 10 photos', () => {
  const images = Array.from({ length: 20 }, (_, index) => `/hero-${index + 1}.jpg`);
  const html = renderToStaticMarkup(React.createElement(RealPackageGallery, { images }));
  assert.equal((html.match(/aria-label="View image \d+"/g) || []).length, 10);
  assert.match(html, /src="\/hero-10.jpg"/);
  assert.doesNotMatch(html, /hero-11.jpg|View image 11/);
  assert.match(html, /1 of 10/);
});

test('pickup and drop locations render safe map cards while hidden and incomplete entries stay private', () => {
  const html = renderSections({ locations: { enabled: true, items: [
    location({ image: '/pickup.jpg' }),
    location({ id: 'hotel', type: 'drop', name: 'Hotel lobby', address: 'MG Road Bengaluru', mapUrl: 'https://maps.app.goo.gl/example' }),
    location({ id: 'hidden', name: 'Hidden location', visible: false }),
    location({ id: 'empty', name: '', address: 'Do not publish' }),
  ] } });
  assert.match(html, /Pickup location/);
  assert.match(html, /Drop location/);
  assert.match(html, /pickup\.jpg/);
  assert.match(html, /Meet at gate 4/);
  assert.equal((html.match(/<iframe /g) || []).length, 2);
  assert.match(html, /loading="lazy"/);
  assert.match(html, /https:\/\/www.google.com\/maps/);
  assert.match(html, /rel="noopener noreferrer"/);
  assert.doesNotMatch(html, /Hidden location|Do not publish/);
});

test('untrusted location map links are never used as links or iframe sources', () => {
  const html = renderSections({ locations: { enabled: true, items: [location({ mapUrl: 'javascript:alert(1)', address: '' })] } });
  assert.doesNotMatch(html, /javascript:|alert\(1\)/);
  assert.match(html, /Airport terminal/);
});

test('enabled reviews show complete visible testimonials without a public writing form', () => {
  const html = renderSections({ reviews: { enabled: true, items: [
    review(),
    review({ id: 'hidden', name: 'Hidden author', visible: false }),
    review({ id: 'empty', name: 'Draft author', text: '' }),
    review({ id: 'invalid-rating', name: 'Invalid author', rating: 9 }),
    review({ id: 'fractional-rating', name: 'Fractional author', rating: 3.5 }),
  ] } });
  assert.match(html, /Traveller reviews/);
  assert.match(html, /Maya/);
  assert.match(html, /A lovely trip/);
  assert.match(html, /aria-label="4 out of 5 stars"/);
  assert.doesNotMatch(html, /Hidden author|Draft author|Invalid author|Fractional author|<form|<textarea|<input|Write reviews/);
});

const data = { ...load('src/lib/packageData.ts'), ...load('src/lib/packageSeed.ts') };
const { getSimilarPackages } = load('src/lib/similarPackages.ts');
const original = data.DUMMY_PACKAGES.find((pkg) => pkg.details?.itinerary?.length && pkg.details?.inclusions?.length && pkg.details?.exclusions?.length && pkg.details?.stays?.length && pkg.details?.highlights?.length);
let activePackage;
let relatedCatalogue = [];
let catalogueLoading = false;
const { default: PackageDetailClient } = load('src/app/packages/[packageId]/PackageDetailClient.tsx', {
  'next/image': { default: imageMock },
  '@/lib/displayableImage': load('src/lib/displayableImage.ts'),
  'react/jsx-runtime': jsxRuntime,
  react: React,
  'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) },
  'next/navigation': { useParams: () => ({ packageId: activePackage.id }), useRouter: () => ({ push: noOp }) },
  'lucide-react': icons,
  '@/lib/packageData': data,
  '@/lib/similarPackages': load('src/lib/similarPackages.ts'),
  '@/app/home/_components/PackageCard': { default: ({ pkg }) => React.createElement('article', { 'data-related-package': pkg.id }, pkg.title) },
  '@/lib/packageFacts': { getPackageFacts: () => [] },
  '@/lib/packageDetailSections': model,
  '../_components/PackageFactsBar': { default: noOp },
  '../_components/PackageInlineEditing': inlineEditing,
  '../_components/SimplePackagePage.module.css': { default: {} },
  '../_components/ProductDetailPresentation.module.css': { default: {} },
  '../_components/PackagePageSections': pageSectionComponents,
  '../_components/PackageShareButton': { default: noOp },
  '../_components/ItineraryDownloadButton': { default: noOp },
  '@/components/CompareButton': { default: noOp },
  './BookingCard': { default: noOp },
  './QuoteModal': { default: noOp },
  '@/lib/firebase/useAuthUser': { useAuthUser: () => null },
  '@/lib/usePackages': { usePackagesState: () => ({ packages: [activePackage, ...relatedCatalogue], loading: catalogueLoading, error: null }) },
});
const renderDetail = (pageSections, detailsPatch = {}) => {
  activePackage = { ...original, details: { ...data.getPackageDetails(original), ...detailsPatch, pageSections } };
  return renderToStaticMarkup(React.createElement(PackageDetailClient, { initialPackage: activePackage }));
};

test('similar packages exclude the current package and drafts, rank relevance, and cap the list', () => {
  const current = { ...original, id: 'current', destination: 'Coorg', tags: ['Family'], days: 3 };
  const candidate = (id, patch = {}) => ({ ...current, id, destination: 'Elsewhere', tags: [], status: 'published', ...patch });
  const catalogue = [current, candidate('draft', { destination: 'Coorg', status: 'draft' }), candidate('fallback'), candidate('category', { tags: ['Family'] }), candidate('destination', { destination: 'coorg' }), candidate('longer', { days: 8 }), candidate('last', { days: 10 })];
  const before = catalogue.map(pkg => pkg.id);
  assert.deepEqual(Array.from(getSimilarPackages(current, catalogue), pkg => pkg.id), ['destination', 'category', 'fallback', 'longer']);
  assert.deepEqual(catalogue.map(pkg => pkg.id), before);
  assert.equal(getSimilarPackages(current, [current, catalogue[1]]).length, 0);
});

test('similar package cards appear last and the section is hidden when there are no alternatives', () => {
  assert.doesNotMatch(renderDetail({}), /similar-packages-title/);
  relatedCatalogue = [{ ...original, id: 'related-trip', title: 'Another holiday', status: 'published' }];
  try {
    const html = renderDetail({});
    assert.match(html, /You may also like/);
    assert.match(html, /Similar packages/);
    assert.match(html, /data-related-package="related-trip"/);
    assert.ok(html.indexOf('similar-packages-title') > html.indexOf('id="booking-options"'));
    const preview = renderToStaticMarkup(React.createElement(PackageDetailClient, { initialPackage: activePackage, preview: true }));
    assert.doesNotMatch(preview, /similar-packages-title/);
  } finally {
    relatedCatalogue = [];
  }
});

test('server-provided similar packages render before the live catalogue has loaded', () => {
  activePackage = original;
  catalogueLoading = true;
  try {
    const html = renderToStaticMarkup(React.createElement(PackageDetailClient, {
      initialPackage: original,
      initialSimilarPackages: [{ ...original, id: 'server-related', status: 'published' }],
    }));
    assert.match(html, /data-related-package="server-related"/);
  } finally {
    catalogueLoading = false;
  }
});

test('existing detail sections remain visible by default and each can be hidden independently', () => {
  const sections = [
    ['about', 'About this trip'], ['highlights', 'Trip highlights'], ['itinerary', 'Day-by-day itinerary'],
    ['stays', 'Stay and meal plan'], ['transfers', 'Transfers'], ['inclusions', 'Included'], ['exclusions', 'Not included'], ['cancellation', 'Cancellation policy'],
  ];
  for (const [hiddenId, hiddenTitle] of sections) {
    const html = renderDetail({ hiddenSections: [hiddenId] });
    for (const [id, title] of sections) {
      const heading = new RegExp(`<h2[^>]*>${title}</h2>`);
      if (id === hiddenId) assert.doesNotMatch(html, heading, hiddenTitle);
      else assert.match(html, heading, title);
    }
  }
  const defaults = renderDetail(undefined);
  for (const [, title] of sections) assert.match(defaults, new RegExp(`<h2[^>]*>${title}</h2>`));
});

test('a lone inclusion/exclusion card fills its row and all hidden sections leave no empty pair', () => {
  assert.match(renderDetail(undefined), /class="grid gap-6 sm:grid-cols-2"/);
  const one = renderDetail({ hiddenSections: ['inclusions'] });
  assert.match(one, /class="grid gap-6 "/);
  assert.doesNotMatch(one, /class="grid gap-6 sm:grid-cols-2"/);
  const both = renderDetail({ hiddenSections: ['inclusions', 'exclusions'] });
  assert.doesNotMatch(both, /class="grid gap-6/);
});

test('custom content is appended after the cancellation policy on the public detail page', () => {
  const html = renderDetail({ sections: [section()] });
  assert.ok(html.indexOf('Cancellation policy') < html.indexOf('Packing guide'));
  assert.match(html, /Bring walking shoes/);
});

test('the package heading reflects the count and mean of visible written reviews', () => {
  const html = renderDetail({ reviews: { enabled: true, items: [
    review({ rating: 5 }),
    review({ id: 'review-2', rating: 4 }),
    review({ id: 'hidden-review', rating: 1, visible: false }),
    review({ id: 'draft-review', text: '', rating: 1 }),
  ] } });
  assert.match(html, /<b class="text-cmt-neutral-900">4.5<\/b> 2 traveller reviews/);
  assert.doesNotMatch(html, /no traveller reviews yet/);
  const single = renderDetail({ reviews: { enabled: true, items: [review()] } });
  assert.match(single, /<b class="text-cmt-neutral-900">4<\/b> 1 traveller review<\/span>/);
});


test('individual grouped boxes and dropdown items can be hidden without losing their contents', () => {
  const items = [{ id: 'one', title: 'Shown item', body: 'Walking shoes' }, { id: 'two', title: 'Hidden item', body: 'Retained instructions', visible: false }];
  for (const layout of ['boxes', 'dropdown']) {
    const html = renderSections({ sections: [section({ layout, body: '', items })] });
    assert.match(html, /Shown item/);
    assert.doesNotMatch(html, /Hidden item|Retained instructions/);
    assert.equal(renderSections({ sections: [section({ layout, body: '', items: items.map((item) => ({ ...item, visible: false })) })] }), '');
  }
});


test('brochure sections follow overview, highlights, itinerary, practical details, pickup, coverage, FAQs and reviews', () => {
  const html = renderDetail({
    tagline: 'Walk above the clouds.', introduction: 'An overnight escape.',
    sections: [
      section({ id: 'faq', title: 'Frequently asked questions', placement: 'faq', layout: 'dropdown', body: '', items: [{ id: 'weather', title: 'Is sunrise guaranteed?', body: 'Visibility depends on the weather.' }] }),
      section({ id: 'packing', title: 'Things to carry', placement: 'practical' }),
      section({ id: 'why', title: 'Why choose this trip?', placement: 'overview' }),
      section({ id: 'experiences', title: 'Experience highlights', placement: 'highlights' }),
      section({ id: 'hidden', title: 'Private draft', placement: 'faq', visible: false }),
    ],
    locations: { enabled: true, items: [location()] },
    reviews: { enabled: true, items: [review()] },
  });
  const ids = ['package-about', 'package-section-why', 'package-highlights', 'package-section-experiences', 'package-itinerary', 'package-stays', 'package-transfers', 'package-section-packing', 'package-locations', 'package-inclusions', 'package-exclusions', 'package-section-faq', 'package-reviews'];
  for (let i = 1; i < ids.length; i++) assert.ok(html.indexOf(`id="${ids[i - 1]}"`) < html.indexOf(`id="${ids[i]}"`), ids[i]);
  for (const id of ids) {
    assert.match(html, new RegExp(`href="#${id}"`));
    assert.equal(html.split(`id="${id}"`).length - 1, 1);
  }
  assert.doesNotMatch(html, /Private draft|href="#package-section-hidden"/);
  assert.match(html, /Walk above the clouds/);
  assert.match(html, /An overnight escape/);
  assert.match(html, /Visibility depends on the weather/);
});

test('Day 0 opens first, timed activities preserve paragraphs, and hotel fields render without inventing data', () => {
  const html = renderDetail({ itineraryNote: 'Timings may vary.', stayNote: 'Subject to availability.', inclusionNote: 'Entry tickets excluded.', bookingNote: 'Double sharing.' }, {
    itinerary: [
      { day: 0, title: 'Overnight pickup', route: 'Bangalore', meals: '', description: 'Meet your group.\nBoard the bus.', activities: [{ time: '10:30 PM', title: 'Bangalore pickup', description: 'Meet at the designated stop.' }] },
      { day: 1, title: 'Trek', route: '', meals: '', description: 'Sunrise trek.' },
    ],
    stays: [{ name: 'Hotel Madikeri Heritage', place: 'Coorg', nights: 2, comfort: '3-star hotel', roomType: 'Double sharing', mealPlan: 'Breakfast', checkIn: 'Day 1', checkOut: 'Day 3' }],
  });
  assert.match(html, /<details open=""[^>]*><summary[^>]*>.*?Day 0/s);
  assert.match(html, /10:30 PM/);
  assert.match(html, /Meet your group.\nBoard the bus/);
  for (const text of ['Hotel Madikeri Heritage', 'Double sharing', 'Breakfast', 'Check-in', 'Check-out', 'Timings may vary.', 'Subject to availability.', 'Entry tickets excluded.']) assert.ok(html.includes(text), text);
  const noHotel = renderDetail(undefined, { stays: [] });
  assert.doesNotMatch(noHotel, /id="package-stays"|href="#package-stays"/);
});


test('the two imported packages render their PDF sections in order without sample testimonials', () => {
  for (const [file, expected] of [
    ['coorg-2-nights-3-days-holiday-package', ['package-about','package-section-why-coorg','package-section-coorg-highlights','package-itinerary','package-stays','package-section-coorg-transfers','package-inclusions','package-exclusions','package-section-coorg-faqs']],
    ['skandagiri-sunrise-trek-from-bangalore', ['package-about','package-section-skandagiri-story','package-section-why-skandagiri','package-section-skandagiri-highlights','package-itinerary','package-section-skandagiri-packing','package-section-skandagiri-trail','package-locations','package-inclusions','package-exclusions','package-section-skandagiri-faqs']],
  ]) {
    activePackage = JSON.parse(fs.readFileSync(`content/package-imports/${file}.json`, 'utf8'));
    const html = renderToStaticMarkup(React.createElement(PackageDetailClient, { initialPackage: activePackage }));
    let previous = -1;
    for (const id of expected) {
      const position = html.indexOf(`id="${id}"`);
      assert.ok(position > previous, `${file}: ${id} must follow the previous section`);
      previous = position;
    }
    assert.doesNotMatch(html, /Beautiful Weekend Escape|An Amazing Sunrise Experience|A Great First Trek/);
    if (file.startsWith('coorg')) assert.match(html, /5,643/);
    else assert.match(html, /Day 0/);
  }
});

test('saved Day 0 switch controls the first visible and expanded day on the website', () => {
  const itinerary = [
    { day: 1, title: 'Daytime sightseeing', route: '', meals: '', description: 'Visit Coorg.' },
    { day: 0, title: 'Overnight pickup', route: '', meals: '', description: 'Meet at 10:30 PM.' },
  ];
  const enabled = renderDetail(undefined, { itinerary, dayZeroEnabled: true });
  assert.ok(enabled.indexOf('Overnight pickup') < enabled.indexOf('Daytime sightseeing'));
  assert.match(enabled, /<details open=""[^>]*><summary[^>]*>.*?Day 0/s);
  const disabled = renderDetail(undefined, { itinerary, dayZeroEnabled: false });
  assert.doesNotMatch(disabled, /Day 0|Overnight pickup|Meet at 10:30 PM/);
  assert.match(disabled, /<details open=""[^>]*><summary[^>]*>.*?Day 1/s);
});

test('public detail sections render saved formatting without exposing storage syntax', () => {
  const formatted = richTextDependencies['@/lib/packageRichText'].serializeRichText({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Explore coffee estates', marks: [{ type: 'bold' }, { type: 'italic' }, { type: 'textStyle', attrs: { fontFamily: 'Georgia, serif', fontSize: '20px' } }] }] }] });
  const html = renderDetail({}, { summary: formatted, highlights: [formatted, 'A second highlight'], transfers: formatted, cancellationPolicy: formatted, inclusions: [formatted] });
  assert.ok((html.match(/<strong>/g) ?? []).length >= 5);
  assert.match(html, /font-family:Georgia, serif;font-size:20px/);
  assert.match(html, /A second highlight/);
  assert.doesNotMatch(html, /cmt-rich:v1:|&quot;marks&quot;/);
});

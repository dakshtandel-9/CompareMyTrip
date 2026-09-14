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
const pageSectionComponents = load('src/app/packages/_components/PackagePageSections.tsx', {
  'react/jsx-runtime': jsxRuntime,
  'next/image': { default: imageMock },
  'lucide-react': icons,
  '@/lib/packageDetailSections': model,
  './PackageGallery': { default: galleryMock },
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
  '@/components/Modal': { default: ({ children }) => children },
});
const { default: SectionsWithRealGallery } = load('src/app/packages/_components/PackagePageSections.tsx', {
  'react/jsx-runtime': jsxRuntime,
  'next/image': { default: imageMock },
  'lucide-react': icons,
  '@/lib/packageDetailSections': model,
  './PackageGallery': { default: RealPackageGallery },
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

const data = load('src/lib/packageData.ts');
const original = data.DUMMY_PACKAGES.find((pkg) => pkg.details?.itinerary?.length && pkg.details?.inclusions?.length && pkg.details?.exclusions?.length && pkg.details?.stays?.length && pkg.details?.highlights?.length);
let activePackage;
const { default: PackageDetailClient } = load('src/app/packages/[packageId]/PackageDetailClient.tsx', {
  'react/jsx-runtime': jsxRuntime,
  react: React,
  'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) },
  'next/navigation': { useParams: () => ({ packageId: activePackage.id }), useRouter: () => ({ push: noOp }) },
  'lucide-react': icons,
  '@/lib/packageData': data,
  '@/lib/packageFacts': { getPackageFacts: () => [] },
  '@/lib/packageDetailSections': model,
  '../_components/PackageFactsBar': { default: noOp },
  '../_components/PackageGallery': { default: galleryMock },
  '../_components/PackagePageSections': pageSectionComponents,
  '../_components/PackageShareButton': { default: noOp },
  '../_components/ItineraryDownloadButton': { default: noOp },
  '@/components/CompareButton': { default: noOp },
  './BookingCard': { default: noOp },
  './QuoteModal': { default: noOp },
  '@/lib/firebase/useAuthUser': { useAuthUser: () => null },
  '@/lib/usePackages': { usePackagesState: () => ({ packages: [activePackage], loading: false, error: null }) },
});
const renderDetail = (pageSections) => {
  activePackage = { ...original, details: { ...data.getPackageDetails(original), pageSections } };
  return renderToStaticMarkup(React.createElement(PackageDetailClient, { initialPackage: activePackage }));
};

test('existing detail sections remain visible by default and each can be hidden independently', () => {
  const sections = [
    ['about', 'About this trip'], ['highlights', 'Trip highlights'], ['itinerary', 'Day-by-day itinerary'],
    ['stays', 'Comfort stays'], ['inclusions', 'Included'], ['exclusions', 'Not included'], ['cancellation', 'Cancellation policy'],
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

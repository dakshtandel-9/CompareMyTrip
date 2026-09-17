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
  vm.runInNewContext(code, { exports, URLSearchParams, require: (name) => {
    assert.ok(dependencies[name], `Unexpected dependency: ${name}`);
    return dependencies[name];
  } });
  return exports;
}

const tracks = load('src/lib/weekendTracks.ts');
const { normalizeSiteContent, DEFAULT_SITE_CONTENT, SECTION_ORDER } = load('src/lib/siteContent.ts', {
  '@/lib/weekendTracks': tracks,
  '@/lib/comingSoon': load('src/lib/comingSoon.ts'),
});
const plain = (value) => JSON.parse(JSON.stringify(value));

test('existing site content keeps all original footer badges', () => {
  assert.deepEqual(plain(normalizeSiteContent({}).footerBadges), plain(DEFAULT_SITE_CONTENT.footerBadges));
  assert.ok(SECTION_ORDER.includes('footerBadges'));
  assert.equal(Object.keys(DEFAULT_SITE_CONTENT.footerBadges.paymentImages).length, 7);
  assert.equal(Object.keys(DEFAULT_SITE_CONTENT.footerBadges.accreditationImages).length, 5);
});

test('uploaded payment and accreditation images survive publishing and reloading', () => {
  const footerBadges = plain(DEFAULT_SITE_CONTENT.footerBadges);
  footerBadges.paymentImages.visa = 'https://images.example.com/homepage/visa.png';
  footerBadges.accreditationImages.iata = 'https://images.example.com/homepage/iata.webp';
  const published = normalizeSiteContent({ footerBadges });
  assert.deepEqual(plain(published.footerBadges), footerBadges);
  assert.deepEqual(plain(normalizeSiteContent(plain(published)).footerBadges), footerBadges);
});

test('restoring an original image and hiding the strip persist', () => {
  const footerBadges = normalizeSiteContent({ footerBadges: {
    enabled: false,
    paymentImages: { visa: '' },
    accreditationImages: { iata: '' },
  } }).footerBadges;
  assert.equal(footerBadges.enabled, false);
  assert.equal(footerBadges.paymentImages.visa, '');
  assert.equal(footerBadges.accreditationImages.iata, '');
  assert.deepEqual(plain(normalizeSiteContent({ footerBadges }).footerBadges), plain(footerBadges));
});

test('partial or invalid image data retains defaults and rejects unsafe image URLs', () => {
  const footerBadges = normalizeSiteContent({ footerBadges: {
    paymentImages: { visa: '  /payments/visa.svg  ', amex: 42, mastercard: 'javascript:alert(1)', upi: '//other.example.com/x.png' },
    accreditationImages: null,
  } }).footerBadges;
  assert.equal(footerBadges.paymentImages.visa, '/payments/visa.svg');
  assert.equal(footerBadges.paymentImages.amex, '');
  assert.equal(footerBadges.paymentImages.mastercard, '');
  assert.equal(footerBadges.paymentImages.upi, '');
  assert.equal(footerBadges.paymentImages.paytm, '');
  assert.deepEqual(plain(footerBadges.accreditationImages), plain(DEFAULT_SITE_CONTENT.footerBadges.accreditationImages));
});

let renderedContent = DEFAULT_SITE_CONTENT;
const { default: PartnerMarquee } = load('src/components/PartnerMarquee.tsx', {
  'react/jsx-runtime': jsxRuntime,
  'next/image': { default: ({ fill, ...props }) => { void fill; return React.createElement('img', props); } },
  '@/lib/useSiteContent': { useSiteContent: () => renderedContent },
});

test('original scrolling logos return for legacy content and the new visibility setting survives reload', () => {
  renderedContent = normalizeSiteContent({ footerBadges: { tourismPartnersVerified: false } });
  const html = renderToStaticMarkup(React.createElement(PartnerMarquee));
  assert.match(html, /animate-cmt-marquee/);
  assert.equal((html.match(/<img /g) ?? []).length, 36);
  assert.match(html, /\/partners\/karnataka-tourism.png/);
  renderedContent = normalizeSiteContent(plain(normalizeSiteContent({ footerBadges: { tourismLogosEnabled: false } })));
  assert.equal(renderToStaticMarkup(React.createElement(PartnerMarquee)), '');
});

const { default: TrustStrip } = load('src/components/TrustStrip.tsx', {
  'react/jsx-runtime': jsxRuntime,
  'lucide-react': icons,
  'next/image': { default: ({ unoptimized, ...props }) => { void unoptimized; return React.createElement('img', props); } },
  '@/lib/useSiteContent': { useSiteContent: () => renderedContent },
});

test('the live footer renders published replacements and keeps other original marks', () => {
  renderedContent = normalizeSiteContent({ footerBadges: {
    paymentImages: { visa: 'https://images.example.com/custom-visa.png' },
    accreditationImages: { iata: 'https://images.example.com/custom-iata.png' },
    verifiedAccreditations: ['iata', 'iso'],
  } });
  const html = renderToStaticMarkup(React.createElement(TrustStrip));
  assert.match(html, /src="https:\/\/images.example.com\/custom-visa.png"/);
  assert.match(html, /src="https:\/\/images.example.com\/custom-iata.png"/);
  assert.match(html, /src="\/payments\/mastercard.svg"/);
  assert.match(html, /ISO 9001:2015/);
  assert.doesNotMatch(html, /src="\/payments\/visa.svg"/);
});

test('the live footer restores original marks and respects the visibility setting', () => {
  renderedContent = normalizeSiteContent({ footerBadges: { paymentImages: { visa: '' } } });
  const html = renderToStaticMarkup(React.createElement(TrustStrip));
  assert.match(html, /src="\/payments\/visa.svg"/);
  assert.doesNotMatch(html, /IATA/);
  renderedContent = normalizeSiteContent({ footerBadges: { enabled: false } });
  assert.equal(renderToStaticMarkup(React.createElement(TrustStrip)), '');
});

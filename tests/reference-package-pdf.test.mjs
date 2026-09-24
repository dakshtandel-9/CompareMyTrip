import { richTextDependencies } from "./helpers/package-rich-text.mjs";
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(file, dependencies = {}) {
  dependencies = { ...richTextDependencies, ...dependencies };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, URL, require: (name) => {
    assert.ok(dependencies[name], name);
    return dependencies[name];
  }});
  return exports;
}
// Capture authored PDF text without making a file or depending on font internals.
// Drawing calls (shapes, images, links) are accepted and ignored.
function PdfText() {
  const texts = [];
  const target = {
    texts,
    text(value) { texts.push(String(value)); return proxy; },
    textWithLink(value) { texts.push(String(value)); return proxy; },
    splitTextToSize(value) { return String(value).split('\n'); },
    getTextWidth(value) { return String(value).length; },
    getNumberOfPages() { return 1; },
  };
  const proxy = new Proxy(target, { get: (object, key) => key in object ? object[key] : () => proxy });
  return proxy;
}
const data = load('src/lib/packageData.ts');
const sections = load('src/lib/packageDetailSections.ts');
const facts = load('src/lib/packageFacts.ts', { '@/lib/packageData': data });
const { createPackageItineraryPdf } = load('src/lib/packageItineraryPdf.ts', {
  jspdf: { jsPDF: PdfText }, './packageData': data, './packageDetailSections': sections, './packageFacts': facts,
});

test('reference package downloads preserve the same content order and exclude unpublished sample claims', () => {
  for (const [id, headings] of [
    ['coorg-2-nights-3-days-holiday-package', ['Trip overview', 'About this trip', 'Why choose this Coorg package?', 'Trip snapshot', 'Highlights', 'Hotels', 'Itinerary', 'Private AC transportation throughout your trip', 'Inclusions', 'Exclusions', 'Frequently asked questions', 'Thank you for choosing CompareMyTrip. Have a safe journey']],
    ['skandagiri-sunrise-trek-from-bangalore', ['Trip overview', 'Trip snapshot', 'About this trip', 'Skandagiri trek highlights', 'Itinerary', 'Things to carry', 'Skandagiri trek trail guidelines', 'Pickup & Drop Locations', 'Inclusions', 'Exclusions', 'Skandagiri trek FAQs', 'Thank you for choosing CompareMyTrip. Have a safe journey']],
  ]) {
    const pkg = JSON.parse(fs.readFileSync(`content/package-imports/${id}.json`, 'utf8'));
    const doc = createPackageItineraryPdf(pkg, `https://example.com/packages/${id}`);
    let previous = -1;
    for (const heading of headings) {
      const position = doc.texts.indexOf(heading);
      assert.ok(position > previous, `${id}: ${heading}`);
      previous = position;
    }
    const text = doc.texts.join('\n');
    assert.doesNotMatch(text, /sample testimonials|SEO Page Elements|DD MMM|INR 0 per person|\p{Extended_Pictographic}/u);
    if (id.startsWith('skandagiri')) {
      assert.match(text, /Day 0: Bangalore to Skandagiri/);
      assert.match(text, /10:30 PM onwards/);
      assert.match(text, /On request\nStarting Price:/);
    } else {
      assert.match(text, /INR 5,643 per person/);
      assert.match(text, /Day 3\nCheck out -/);
    }
  }
});

test('PDF respects Day 0 visibility without deleting the saved itinerary', () => {
  const pkg = JSON.parse(fs.readFileSync('content/package-imports/skandagiri-sunrise-trek-from-bangalore.json', 'utf8'));
  pkg.details.dayZeroEnabled = false;
  const disabled = createPackageItineraryPdf(pkg, 'https://example.com/trek').texts.join('\n');
  assert.doesNotMatch(disabled, /Day 0:|10:30 PM onwards/);
  assert.match(disabled, /Day 1: Skandagiri sunrise trek/);
  pkg.details.dayZeroEnabled = true;
  const enabled = createPackageItineraryPdf(pkg, 'https://example.com/trek').texts.join('\n');
  assert.match(enabled, /Day 0: Bangalore to Skandagiri/);
  assert.equal(pkg.details.itinerary.length, 2);
});

test('PDF downloads print formatted package copy as readable text', () => {
  const pkg = JSON.parse(fs.readFileSync('content/package-imports/skandagiri-sunrise-trek-from-bangalore.json', 'utf8'));
  const formatted = richTextDependencies['@/lib/packageRichText'].serializeRichText({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Formatted trek instructions', marks: [{ type: 'bold' }] }] }] });
  pkg.details.summary = formatted;
  pkg.details.highlights = [formatted];
  pkg.details.pageSections.hiddenSections = pkg.details.pageSections.hiddenSections.filter(section => section !== 'highlights');
  const pdf = createPackageItineraryPdf(pkg, 'https://example.com/trip');
  assert.ok(pdf.texts.join('\n').includes('Formatted trek instructions'));
  assert.equal(pdf.texts.filter(line => line === 'Formatted trek instructions').length, 2);
  assert.doesNotMatch(pdf.texts.join('\n'), /cmt-rich:|"marks"/);
});

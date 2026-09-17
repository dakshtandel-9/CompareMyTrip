import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(file, dependencies = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText, { exports, require: name => { assert.ok(dependencies[name], name); return dependencies[name]; } });
  return exports;
}
const { packageVisualSectionArea } = load('src/app/admin/packages/packageVisualTargets.ts');
test('every built-in page section opens its matching admin controls', () => {
  const expected = { about: 'overview', highlights: 'highlights', itinerary: 'itinerary', stays: 'stays', transfers: 'practical', locations: 'locations', inclusions: 'coverage', exclusions: 'coverage', policy: 'policy', reviews: 'reviews', gallery: 'images' };
  for (const [id, area] of Object.entries(expected)) assert.equal(packageVisualSectionArea(`package-${id}`, { sections: [] }), area);
  assert.equal(packageVisualSectionArea('booking-options', { sections: [] }), 'booking');
  assert.equal(packageVisualSectionArea('not-a-package-section', { sections: [] }), undefined);
});
test('custom sections use their saved placement, including moved FAQs and pickup text', () => {
  const page = { sections: [
    { id: 'pickup-copy', title: 'Pickup and drop locations', placement: 'transfers' },
    { id: 'faq', placement: 'faq' }, { id: 'carry', placement: 'carry' }, { id: 'extra' },
  ] };
  assert.equal(packageVisualSectionArea('package-section-pickup-copy', page), 'practical');
  assert.equal(packageVisualSectionArea('package-section-faq', page), 'faq');
  assert.equal(packageVisualSectionArea('package-section-carry', page), 'practical');
  assert.equal(packageVisualSectionArea('package-section-extra', page), 'extras');
  page.sections[1].placement = 'overview';
  assert.equal(packageVisualSectionArea('package-section-faq', page), 'overview');
  assert.equal(packageVisualSectionArea('package-section-deleted', page), undefined);
});

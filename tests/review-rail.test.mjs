import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const code = ts.transpileModule(fs.readFileSync('src/lib/reviewRail.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exports = {};
vm.runInNewContext(code, { exports });
const { getReviewScrollTarget } = exports;

test('two-review arrows reveal the other review instead of wrapping to the same card', () => {
  for (const cardStep of [324, 384]) {
    const period = cardStep * 2;
    assert.equal(getReviewScrollTarget(0, period, 2, 1).left, cardStep);
    assert.equal(getReviewScrollTarget(0, period, 2, -1).left, cardStep);
    assert.equal(getReviewScrollTarget(cardStep, period, 2, 1).left, 0);
  }
});

test('longer review lists move two cards and wrap precisely in both directions', () => {
  const period = 384 * 6;
  const next = getReviewScrollTarget(0, period, 6, 1);
  assert.equal(next.left, 768);
  assert.equal(next.wrapped, false);
  const previous = getReviewScrollTarget(0, period, 6, -1);
  assert.equal(previous.left, 1536);
  assert.equal(previous.wrapped, true);
  assert.equal(getReviewScrollTarget(1536, period, 6, 1).left, 0);
});

test('empty and unmeasured review rails do not request a scroll', () => {
  assert.equal(getReviewScrollTarget(0, 0, 2, 1), null);
  assert.equal(getReviewScrollTarget(0, 768, 0, 1), null);
});

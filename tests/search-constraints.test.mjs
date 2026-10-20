import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const exports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/searchConstraints.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports });
const { parseSearch, meetsConstraints } = exports;

const pick = (query) => {
  const { remainder, generic, ...limits } = parseSearch(query);
  return { limits: { ...limits }, remainder, generic };
};

test('reads a price ceiling however it is written', () => {
  for (const query of ['trip under 1k', 'trip under 1K', 'trip below ₹1,000', 'trips less than 1000', 'trip upto rs 1000', 'trip under 1000rs', 'trip within 1 thousand']) {
    const { limits, generic } = pick(query);
    assert.deepEqual({ limits, generic }, { limits: { maxPrice: 1000 }, generic: true }, query);
  }
});

test('keeps the descriptive part for Jev', () => {
  assert.deepEqual(pick('beach trip under 10k'), { limits: { maxPrice: 10000 }, remainder: 'beach trip', generic: false });
  assert.deepEqual(pick('trek under 1k'), { limits: { maxPrice: 1000 }, remainder: 'trek', generic: false });
  assert.deepEqual(pick('honeymoon abroad under 1.5 lakh'), { limits: { maxPrice: 150000 }, remainder: 'honeymoon abroad', generic: false });
});

test('reads ranges, floors and rough budgets', () => {
  assert.deepEqual(pick('trips between 5k and 10k').limits, { minPrice: 5000, maxPrice: 10000 });
  assert.deepEqual(pick('5-10k trip').limits, { minPrice: 5000, maxPrice: 10000 });
  assert.deepEqual(pick('luxury above 1 lakh'), { limits: { minPrice: 100000 }, remainder: 'luxury', generic: false });
  assert.deepEqual(pick('trip around 10k').limits, { minPrice: 7500, maxPrice: 12500 });
  assert.deepEqual(pick('5k trip').limits, { maxPrice: 5000 });
});

test('reads trip lengths without mistaking them for prices', () => {
  assert.deepEqual(pick('3 day trip under 5000').limits, { minSpan: 3, maxSpan: 3, maxPrice: 5000 });
  assert.deepEqual(pick('2 nights').limits, { nights: 2 });
  assert.deepEqual(pick('2-3 days trip').limits, { minSpan: 2, maxSpan: 3 });
  assert.deepEqual(pick('under 4 days').limits, { maxSpan: 4 });
  assert.deepEqual(pick('3n/4d bali'), { limits: { nights: 3, minSpan: 4, maxSpan: 4 }, remainder: 'bali', generic: false });
  assert.deepEqual(pick('two day trek').limits, { minSpan: 2, maxSpan: 2 });
});

test('leaves head counts and plain searches alone', () => {
  assert.deepEqual(pick('trip for 2 people'), { limits: {}, remainder: 'trip for 2 people', generic: false });
  assert.deepEqual(pick('goa'), { limits: {}, remainder: 'goa', generic: false });
  assert.deepEqual(pick('weekend trek near bangalore').limits, {});
});

test('an overnight 3N / 2D weekend counts as three days away', () => {
  const weekend = { price: 2999, nights: 3, days: 2 };
  assert.equal(meetsConstraints(weekend, parseSearch('3 day trip under 5000')), true);
  assert.equal(meetsConstraints(weekend, parseSearch('trip under 2k')), false);
});

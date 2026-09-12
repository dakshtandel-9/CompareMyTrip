import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const exports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/accountTrips.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports });
const { accountTripGroup } = exports;
const statuses = ['awaiting_confirmation', 'accepted', 'completed', 'rejected', 'refunded'];

test('failed payments never appear as active or completed trips', () => {
  for (const tripStatus of statuses) {
    assert.equal(accountTripGroup({ paymentStatus: 'failed', tripStatus }), 'unsuccessful');
  }
});

test('pending payments remain active regardless of unconfirmed travel status', () => {
  for (const tripStatus of statuses) {
    assert.equal(accountTripGroup({ paymentStatus: 'pending', tripStatus }), 'active');
  }
});

test('paid bookings appear in exactly the appropriate travel group', () => {
  const expected = ['active', 'active', 'completed', 'unsuccessful', 'unsuccessful'];
  statuses.forEach((tripStatus, index) => {
    assert.equal(accountTripGroup({ paymentStatus: 'successful', tripStatus }), expected[index]);
  });
});

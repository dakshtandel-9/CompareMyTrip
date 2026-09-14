import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const exports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/admin/enquiries/csv.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports });
const { csvCell } = exports;

test('admin exports preserve commas, quotes and multiline customer details', () => {
  assert.equal(csvCell('Daksh, Tandel'), '"Daksh, Tandel"');
  assert.equal(csvCell('A "special" trip'), '"A ""special"" trip"');
  assert.equal(csvCell('First line\nSecond line'), '"First line\nSecond line"');
  assert.equal(csvCell('traveller@example.com'), '"traveller@example.com"');
  assert.equal(csvCell(''), '""');
});

test('admin exports treat potential spreadsheet formulas and phone numbers as text', () => {
  for (const value of ['=1+1', '+919876543210', '-2+3', '@SUM(A1:A2)', '\t=1+1', '\r=1+1', '\n=1+1', '  =1+1', ' \t+1', '\u0000=1+1']) {
    assert.ok(csvCell(value).startsWith('"\''), `Unsafe spreadsheet prefix: ${JSON.stringify(value)}`);
  }
});

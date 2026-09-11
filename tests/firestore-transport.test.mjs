import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const exports = {};
vm.runInNewContext(ts.transpileModule(readFileSync('src/lib/firebase/prepareTransport.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports, require, fetch });

test('Firestore REST converters and error decoding work with request-time code generation disabled', () => {
  exports.prepareFirestoreTransport();
  exports.prepareFirestoreTransport();
  const { v1 } = require('@google-cloud/firestore');
  const { GoogleError } = require('google-gax/fallback');
  const OriginalFunction = globalThis.Function;
  globalThis.Function = function () { throw new Error('Request-time code generation forbidden'); };
  try {
    const client = new v1.FirestoreClient({ fallback: true });
    const document = client._protos.lookupType('google.firestore.v1.Document');
    const message = document.fromObject({ name: 'projects/test/databases/(default)/documents/test/one', fields: { total: { integerValue: '42' } } });
    const decoded = document.decode(document.encode(message).finish());
    assert.equal(document.toObject(decoded, { longs: String }).fields.total.integerValue, '42');
    const error = GoogleError.parseHttpError({ error: { code: 404, status: 'NOT_FOUND', message: 'Missing test resource' } });
    assert.match(error.message, /Missing test resource/);
    assert.equal(GoogleError.parseGRPCStatusDetails(error), error);
  } finally {
    globalThis.Function = OriginalFunction;
  }
});

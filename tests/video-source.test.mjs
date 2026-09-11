import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const code = ts.transpileModule(fs.readFileSync('src/lib/videoSource.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function policy({ desktop = false, reducedMotion = false, reducedData = false, connection = {} } = {}) {
  const exports = {};
  vm.runInNewContext(code, {
    exports, navigator: { connection },
    window: { matchMedia: query => ({ matches: {
      '(min-width: 768px)': desktop,
      '(prefers-reduced-motion: no-preference)': !reducedMotion,
      '(prefers-reduced-data: reduce)': reducedData,
    }[query] ?? false }) },
  });
  return exports.shouldLoadVideo;
}

test('hero explicitly enables phone video while other video defaults stay unchanged', () => {
  assert.equal(policy()(), false);
  assert.equal(policy()({ allowMobile: true }), true);
  assert.equal(policy({ desktop: true })(), true);
});

test('phone hero still respects reduced motion, data saving and slow connections', () => {
  for (const preferences of [
    { reducedMotion: true }, { reducedData: true }, { connection: { saveData: true } },
    ...['slow-2g', '2g', '3g'].map(effectiveType => ({ connection: { effectiveType } })),
  ]) {
    assert.equal(policy(preferences)({ allowMobile: true }), false);
  }
});

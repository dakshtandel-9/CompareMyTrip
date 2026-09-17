import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as React from 'react';
import * as jsx from 'react/jsx-runtime';
function load(file, deps = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText, { exports, require: name => { if (!deps[name]) throw new Error(name); return deps[name]; } });
  return exports;
}
export const rich = load('src/lib/packageRichText.ts');
export const richComponent = load('src/components/PackageRichText.tsx', { react: React, 'react/jsx-runtime': jsx, '@/lib/packageRichText': rich });
export const richTextDependencies = { '@/lib/packageRichText': rich, '@/components/PackageRichText': richComponent };

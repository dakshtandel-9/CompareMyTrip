import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { icons } from 'lucide-react';

// Keep every existing travel icon, then fill the fixed catalogue with canonical
// Lucide names. SVG symbols avoid shipping 1,000 React components to travellers.
const exports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/adminIcons.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText, { exports, require: createRequire(import.meta.url) });
const library = exports.ICON_LIBRARY;
const names = [...new Set([...Object.keys(library), ...Object.keys(icons).filter(name => icons[name].displayName === name).sort()])].slice(0, 1000).sort();
if (names.length !== 1000) throw new Error('Expected exactly 1,000 package icons');
const symbols = names.map(name => {
  const svg = renderToStaticMarkup(React.createElement(library[name] ?? icons[name]));
  return `<symbol id="${name}" viewBox="0 0 24 24">${svg.replace(/^<svg[^>]*>|<\/svg>$/g, '')}</symbol>`;
});
fs.writeFileSync('src/lib/packageIconNames.json', JSON.stringify(names, null, 2) + '\n');
fs.writeFileSync('public/package-icons.svg', `<svg xmlns="http://www.w3.org/2000/svg">\n${symbols.join('\n')}\n</svg>\n`);
fs.writeFileSync('public/package-icons-LICENSE.txt', fs.readFileSync('node_modules/lucide-react/LICENSE'));

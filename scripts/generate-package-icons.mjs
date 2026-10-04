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
// One small file per icon: a package page draws a handful, and a single
// 1,000-symbol sprite (~260 KB, ~48 KB compressed) cost every visitor the lot.
fs.rmSync('public/package-icons', { recursive: true, force: true });
fs.mkdirSync('public/package-icons');
symbols.forEach((symbol, index) => fs.writeFileSync(
  `public/package-icons/${names[index]}.svg`,
  `<svg xmlns="http://www.w3.org/2000/svg">${symbol.replace(/<symbol id="[^"]+"/, '<symbol id="i"')}</svg>\n`,
));
fs.writeFileSync('public/package-icons-LICENSE.txt', fs.readFileSync('node_modules/lucide-react/LICENSE'));

import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { rich, richComponent } from './helpers/package-rich-text.mjs';
const { richTextDocument, serializeRichText, plainPackageText, safeRichLink, cleanRichNode } = rich;
const text = (value, marks = []) => ({ type: 'text', text: value, marks });
const paragraph = (...content) => ({ type: 'paragraph', content });
const doc = (...content) => ({ type: 'doc', content });
const render = value => renderToStaticMarkup(React.createElement(richComponent.default, { value }));
const plain = value => JSON.parse(JSON.stringify(value));

test('old plain copy is unchanged; old headings and bullets open as visual content', () => {
  assert.equal(serializeRichText(richTextDocument('First line\n\nSecond line')), 'First line\n\nSecond line');
  const converted = serializeRichText(richTextDocument('[What to bring]\n- Water\n- Shoes'));
  assert.match(render(converted), /role="heading"/);
  assert.match(render(converted), /role="listitem"/);
  assert.equal(plainPackageText(converted), 'What to bring\nWater\nShoes');
  assert.equal(render('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;');
});
test('bold, italic, font, size, color, links and alignment survive a JSON storage round trip', () => {
  const node = paragraph(text('Coffee ', [{ type: 'bold' }, { type: 'italic' }]), text('plantations', [{ type: 'textStyle', attrs: { fontFamily: 'Georgia, serif', fontSize: '24px', color: '#334455' } }, { type: 'link', attrs: { href: 'https://example.com' } }]));
  node.attrs = { textAlign: 'center' };
  const stored = JSON.parse(JSON.stringify(serializeRichText(doc(node))));
  assert.deepEqual(plain(richTextDocument(stored)), plain(cleanRichNode(doc(node))));
  const html = render(stored);
  for (const pattern of [/strong/, /<em>/, /font-family:Georgia, serif/, /font-size:24px/, /color:#334455/, /text-align:center/, /href="https:\/\/example.com"/]) assert.match(html, pattern);
  assert.equal(plainPackageText(stored), 'Coffee plantations');
  assert.equal(plainPackageText(`- ${stored}`), '- Coffee plantations');
});
test('formatted highlights stay separate line items, including pasted lists', () => {
  const saved = serializeRichText(doc(paragraph(text('One', [{ type: 'bold' }])), paragraph(text('Two', [{ type: 'italic' }]))), true);
  assert.equal(saved.split('\n').length, 2);
  assert.deepEqual(saved.split('\n').map(plainPackageText), ['One', 'Two']);
  assert.equal(serializeRichText(doc({ type: 'bulletList', content: [{ type: 'listItem', content: [paragraph(text('One'))] }, { type: 'listItem', content: [paragraph(text('Two'))] }] }), true), 'One\nTwo');
  assert.equal(serializeRichText(doc(paragraph())), '');
});
test('unsafe URLs, unsupported attributes, HTML nodes and arbitrary CSS cannot reach the page', () => {
  for (const href of ['javascript:alert(1)', 'data:text/html,x', '//evil.test', 'https://ok.test\nscript']) assert.equal(safeRichLink(href), undefined);
  const saved = serializeRichText(doc(paragraph(text('<img src=x onerror=alert(1)>', [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }, { type: 'textStyle', attrs: { fontSize: '900px', fontFamily: 'evil', color: 'url(x)', onClick: 'bad' } }])), { type: 'script', text: 'alert(1)' }));
  const html = render(saved);
  assert.doesNotMatch(html, /<img|<script|href=|900px|font-family:evil|color:url|onClick=/);
  assert.match(html, /&lt;img/);
});

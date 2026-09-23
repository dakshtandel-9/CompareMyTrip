import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

/* The India holidays panels take a pasted link rather than a package picked
   from a list, so the value reaches an href straight from the CRM. These
   cover what may be pasted there and what happens to the rest. */

function load(file, dependencies = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports, URLSearchParams, require: (name) => {
    assert.ok(dependencies[name], `Unexpected dependency: ${name}`);
    return dependencies[name];
  } });
  return exports;
}

const tracks = load('src/lib/weekendTracks.ts');
const { normalizeSiteContent, DEFAULT_SITE_CONTENT, isPastedLink } = load('src/lib/siteContent.ts', {
  '@/lib/weekendTracks': tracks,
  '@/lib/comingSoon': load('src/lib/comingSoon.ts'),
});

const shipped = DEFAULT_SITE_CONTENT.domestic.items[0];

/** The first India panel, saved with `link` set to the given value. */
const savedLink = (link) => {
  const items = [{ ...shipped, ...(link === undefined ? {} : { link }) }];
  return normalizeSiteContent({ domestic: { items } }).domestic.items[0].link;
};

test('a pasted site path is kept exactly as typed', () => {
  assert.equal(savedLink('/packages/ladakh-land-of-lamas-e6ff'), '/packages/ladakh-land-of-lamas-e6ff');
  // The point of the change: a filtered catalogue, which no package list offers.
  assert.equal(savedLink('/packages?region=india&destination=Ladakh'), '/packages?region=india&destination=Ladakh');
  assert.equal(savedLink('/destinations'), '/destinations');
});

test('surrounding whitespace from a paste is trimmed', () => {
  assert.equal(savedLink('  /destinations  '), '/destinations');
});

test('a full https address is allowed', () => {
  assert.equal(savedLink('https://comparemytrip.in/packages'), 'https://comparemytrip.in/packages');
});

test('a link that would run code or leave the site is dropped', () => {
  // The value lands in an href, so these are the ones that matter.
  for (const link of [
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    '//evil.example.com',          // protocol-relative: silently off-site
    'packages/ladakh',             // no leading slash, resolves unpredictably
  ]) {
    assert.equal(savedLink(link), '', `${link} must not be saved`);
  }
});

test('clearing the field means the photo opens nothing', () => {
  assert.equal(savedLink(''), '');
  assert.equal(savedLink('   '), '');
});

test('a panel saved before the field existed keeps the link it shipped with', () => {
  assert.equal(savedLink(undefined), shipped.link);
});

test('a saved link survives a second publish unchanged', () => {
  const once = normalizeSiteContent({ domestic: { items: [{ ...shipped, link: '/destinations' }] } });
  const twice = normalizeSiteContent(JSON.parse(JSON.stringify(once)));
  assert.equal(twice.domestic.items[0].link, '/destinations');
});

test('the CRM warns by the same rule that decides what is saved', () => {
  for (const link of ['/packages', '/packages?a=b', 'https://example.com/x', 'http://example.com']) {
    assert.equal(isPastedLink(link), true, `${link} should be accepted`);
    assert.equal(savedLink(link), link.trim());
  }
  for (const link of ['javascript:alert(1)', '//evil.example.com', 'packages', '']) {
    assert.equal(isPastedLink(link), false, `${link} should be rejected`);
  }
});

/* ---- International country cards ------------------------------------ */
/* The same pasted-link field, so the same rule about what may reach an href. */

const shippedCountry = DEFAULT_SITE_CONTENT.international.items[0];

const savedHref = (href) => {
  const items = [{ ...shippedCountry, ...(href === undefined ? {} : { href }) }];
  return normalizeSiteContent({ international: { items } }).international.items[0].href;
};

test('a country card keeps a pasted site path or https address', () => {
  assert.equal(savedHref('/packages?region=international&destination=Thailand'), '/packages?region=international&destination=Thailand');
  assert.equal(savedHref('/destinations'), '/destinations');
  assert.equal(savedHref('https://comparemytrip.in/packages'), 'https://comparemytrip.in/packages');
});

test('an empty country link is kept, since it means match the country', () => {
  assert.equal(savedHref(''), '');
  assert.equal(savedHref('   '), '');
});

test('an unsafe country link is dropped back to automatic', () => {
  for (const href of ['javascript:alert(1)', 'data:text/html,<script>', '//evil.example.com', 'packages']) {
    assert.equal(savedHref(href), '', `${href} must not be saved`);
  }
});

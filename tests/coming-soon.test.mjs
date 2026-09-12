import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const { NextRequest, NextResponse } = require('next/server');
function load(file, dependencies = {}, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, { exports, URL, URLSearchParams, AbortSignal, ...globals, require: (name) => {
    assert.ok(dependencies[name], `Unexpected dependency: ${name}`);
    return dependencies[name];
  } });
  return exports;
}
const settings = load('src/lib/comingSoon.ts');
const normalize = load('src/lib/siteContent.ts', {
  '@/lib/comingSoon': settings,
  '@/lib/weekendTracks': load('src/lib/weekendTracks.ts'),
}).normalizeSiteContent;

test('coming-soon defaults to off and survives the existing publish workflow', () => {
  assert.equal(normalize({}).comingSoon.enabled, false);
  assert.equal(normalize({ comingSoon: { enabled: 'true' } }).comingSoon.enabled, false);
  const edited = { ...settings.DEFAULT_COMING_SOON, enabled: true, title: 'Launching soon', message: 'See you soon', image: '/custom.jpg' };
  const saved = JSON.parse(JSON.stringify(normalize({ comingSoon: edited })));
  assert.deepEqual(JSON.parse(JSON.stringify(normalize(saved).comingSoon)), edited);
  assert.equal(normalize({ comingSoon: { ...edited, enabled: false } }).comingSoon.enabled, false);
});

test('public routes redirect while sign-in, admin, assets, and payment returns remain reachable', async () => {
  let reads = 0;
  const { middleware } = load('src/middleware.ts', {
    'next/server': { NextResponse },
    '@/lib/comingSoon': settings,
    '@/lib/comingSoonServer': { readComingSoonEnabled: async () => { reads++; return true; } },
  });
  for (const path of ['/', '/packages/bali', '/destinations', '/blog/a-guide', '/compare', '/contact', '/checkout', '/administer']) {
    const response = await middleware(new NextRequest(`https://example.com${path}?tracking=demo`));
    assert.equal(response.status, 307, path);
    assert.equal(response.headers.get('location'), 'https://example.com/coming-soon');
    assert.match(response.headers.get('cache-control'), /no-store/);
  }
  const publicReads = reads;
  for (const path of ['/admin', '/admin/content', '/login', '/forgot-password', '/account', '/checkout/status', '/api/payu/callback', '/api/uploads/image', '/_next/static/app.js', '/destinations/ladakh.jpg', '/privacy', '/404']) {
    const response = await middleware(new NextRequest(`https://example.com${path}`));
    assert.equal(response.headers.get('x-middleware-next'), '1', path);
  }
  assert.equal(reads, publicReads, 'bypass routes do not depend on settings availability');
});

test('turning mode off restores public requests immediately; POST actions are not redirected', async () => {
  let enabled = true;
  const { middleware } = load('src/middleware.ts', {
    'next/server': { NextResponse },
    '@/lib/comingSoon': settings,
    '@/lib/comingSoonServer': { readComingSoonEnabled: async () => enabled },
  });
  assert.equal((await middleware(new NextRequest('https://example.com/'))).status, 307);
  assert.equal((await middleware(new NextRequest('https://example.com/coming-soon'))).headers.get('x-middleware-next'), '1');
  enabled = false;
  assert.equal((await middleware(new NextRequest('https://example.com/'))).headers.get('x-middleware-next'), '1');
  for (const method of ['GET', 'HEAD']) {
    const response = await middleware(new NextRequest('https://example.com/coming-soon', { method }));
    assert.equal(response.status, 404);
    assert.equal(response.headers.get('x-middleware-rewrite'), 'https://example.com/404');
    assert.match(response.headers.get('cache-control'), /no-store/);
  }
  enabled = true;
  assert.equal((await middleware(new NextRequest('https://example.com/checkout', { method: 'POST' }))).headers.get('x-middleware-next'), '1');
});

test('settings read is uncached, requests only the switch, and tolerates unavailable settings', async () => {
  let fetchCalls = 0;
  let available = true;
  const { readComingSoonEnabled } = load('src/lib/comingSoonServer.ts', {}, {
    process: { env: { NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'test-project' } },
    fetch: async (url, options) => {
      fetchCalls++;
      assert.equal(url.searchParams.get('mask.fieldPaths'), 'content.comingSoon.enabled');
      assert.equal(options.cache, 'no-store');
      if (!available) throw new Error('offline');
      return { ok: true, json: async () => ({ fields: { content: { mapValue: { fields: { comingSoon: { mapValue: { fields: { enabled: { booleanValue: true } } } } } } } } }) };
    },
  });
  assert.equal(await readComingSoonEnabled(), true);
  assert.equal(await readComingSoonEnabled(), true);
  assert.equal(fetchCalls, 2);
  available = false;
  assert.equal(await readComingSoonEnabled(), false);
});

test('coming-soon page renders only while enabled and becomes not-found again after switching off', async () => {
  let enabled = false;
  const notFoundError = new Error('NEXT_HTTP_ERROR_FALLBACK;404');
  const screen = () => null;
  const { default: page } = load('src/app/coming-soon/page.tsx', {
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }) },
    'next/navigation': { notFound: () => { throw notFoundError; } },
    '@/components/ComingSoonScreen': { default: screen },
    '@/lib/comingSoonServer': { readComingSoonEnabled: async () => enabled },
  });
  await assert.rejects(page, (error) => error === notFoundError);
  enabled = true;
  assert.equal((await page()).type, screen);
  enabled = false;
  await assert.rejects(page, (error) => error === notFoundError);
});

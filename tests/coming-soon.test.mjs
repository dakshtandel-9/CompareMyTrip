import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(file, dependencies = {}, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, { exports, Headers, URL, URLSearchParams, AbortSignal, ...globals, require: (name) => {
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

test('coming-soon page renders only while the published switch is on, and an unreadable switch keeps the site open', async () => {
  let enabled = false;
  let available = true;
  const redirectError = new Error('NEXT_REDIRECT');
  let target;
  const screen = () => null;
  const { default: page } = load('src/app/coming-soon/page.tsx', {
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }) },
    'next/navigation': { redirect: (to) => { target = to; throw redirectError; } },
    '@/components/ComingSoonScreen': { default: screen },
    '@/lib/serverSiteContent': {
      SITE_WIDE_SECTIONS: ['comingSoon'],
      getPublishedSiteSections: async (sections) => {
        assert.ok(sections.includes('comingSoon'));
        if (!available) throw new Error('offline');
        return { content: { comingSoon: { ...settings.DEFAULT_COMING_SOON, enabled } }, exists: true };
      },
    },
  });
  await assert.rejects(page, (error) => error === redirectError);
  assert.equal(target, '/');
  enabled = true;
  assert.equal((await page()).type, screen);
  available = false;
  target = undefined;
  await assert.rejects(page, (error) => error === redirectError);
  assert.equal(target, '/', 'an outage never closes the website');
});

test('the switch is read from the content published into the page, without a request', () => {
  let context = null;
  const { useComingSoonStatus } = load('src/lib/comingSoonStatus.ts', {
    react: { useContext: () => context },
    '@/lib/useSiteContent': { SiteContentContext: {} },
  }, { fetch: () => assert.fail('no request is made') });
  assert.equal(useComingSoonStatus(), undefined, 'a page rendered without the server copy stays open');
  context = { content: { comingSoon: { enabled: true } } };
  assert.equal(useComingSoonStatus(), true);
  context = { content: { comingSoon: { enabled: false } } };
  assert.equal(useComingSoonStatus(), false);
});

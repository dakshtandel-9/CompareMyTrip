import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function harness() {
  let now = 1_000_000;
  let context = null;
  let options;
  const requests = [];
  const events = new Map();
  const exports = {};
  const state = { packages: [{ id: 'published' }], posts: [] };
  const react = {
    createContext: () => ({}), useContext: () => context,
    useSyncExternalStore: (subscribe, snapshot, serverSnapshot) => {
      options = { subscribe, snapshot, serverSnapshot };
      return snapshot();
    },
  };
  const code = ts.transpileModule(fs.readFileSync('src/lib/usePublicContent.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, {
    exports, require: name => { assert.equal(name, 'react'); return react; },
    Date: { now: () => now }, AbortController, queueMicrotask,
    document: { visibilityState: 'visible', addEventListener: (name, cb) => events.set(name, cb), removeEventListener: name => events.delete(name) },
    window: { setInterval: () => assert.fail('Idle polling must not restart') },
    fetch: async (url, init) => { requests.push({ url, init }); return { ok: true, json: async () => state }; },
  });
  return { ...exports, requests, events, state,
    options: () => options,
    advance: ms => { now += ms; },
    seedContext: value => { context = value; },
    settle: async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); },
  };
}

test('public content shares one request, stays idle and refreshes only when a stale tab returns', async () => {
  const h = harness();
  h.usePublicContent();
  const a = h.options().subscribe(() => {});
  const b = h.options().subscribe(() => {});
  await h.settle();
  assert.equal(h.requests.length, 1);
  assert.equal(h.options().snapshot().packages[0].id, 'published');
  h.events.get('visibilitychange')();
  await h.settle();
  assert.equal(h.requests.length, 1);
  h.advance(300_000);
  h.events.get('visibilitychange')();
  await h.settle();
  assert.equal(h.requests.length, 2);
  a(); b();
  assert.equal(h.events.size, 0);
});

test('server content is the hydration snapshot and also seeds shared layout consumers without another download', async () => {
  const h = harness();
  const seed = { ...h.state, loading: false, error: '' };
  h.seedContext(seed);
  assert.equal(h.usePublicContent(), seed);
  assert.equal(h.options().serverSnapshot(), seed);
  h.options().subscribe(() => {});
  await h.settle();
  assert.equal(h.requests.length, 0);
  h.seedContext(null);
  h.usePublicContent();
  const stop = h.options().subscribe(() => {});
  h.seedPublicContent(seed);
  await h.settle();
  assert.equal(h.requests.length, 0);
  assert.equal(h.options().snapshot(), seed);
  stop();
});

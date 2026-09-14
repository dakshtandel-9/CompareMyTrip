import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const code = ts.transpileModule(fs.readFileSync('src/lib/visibleAnimation.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function createAnimation({ mobile = false, options } = {}) {
  const frames = new Map(), draws = [];
  let next = 0, intersect, changeMotion, changeVisibility, disconnected = false;
  let mediaQuery;
  const media = {
    width: mobile ? 390 : 1280,
    hover: mobile ? 'none' : 'hover',
    pointer: mobile ? 'coarse' : 'fine',
    'prefers-reduced-motion': 'no-preference',
  };
  const matches = query => query.split(',').some(branch => {
    const conditions = [...branch.matchAll(/\(([\w-]+):\s*([^)]+)\)/g)];
    assert.ok(conditions.length, `Expected media conditions in ${branch}`);
    return conditions.every(([, feature, value]) => {
      if (feature === 'max-width') return media.width <= parseFloat(value);
      assert.ok(feature in media, `Unexpected media feature: ${feature}`);
      return media[feature] === value;
    });
  });
  const motion = { matches: false, addEventListener: (_e, fn) => changeMotion = fn, removeEventListener() {} };
  const document = { hidden: false, addEventListener: (_e, fn) => changeVisibility = fn, removeEventListener() {} };
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    window: {
      matchMedia(query) {
        mediaQuery = query;
        motion.matches = matches(query);
        return motion;
      },
    },
    document,
    requestAnimationFrame(fn) { frames.set(++next, fn); return next; },
    cancelAnimationFrame(id) { frames.delete(id); },
    IntersectionObserver: class {
      constructor(fn) { intersect = fn; }
      observe() {}
      disconnect() { disconnected = true; }
    },
  });
  const flush = now => { const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn(now)); };
  const stop = exports.startVisibleAnimation({}, (now, delta) => draws.push([now, delta]), options);
  return {
    frames,
    draws,
    flush,
    stop,
    get disconnected() { return disconnected; },
    intersect(visible) { intersect([{ isIntersecting: visible }]); },
    setHidden(hidden) { document.hidden = hidden; changeVisibility(); },
    setMedia(values) {
      Object.assign(media, values);
      const nextMatch = matches(mediaQuery);
      if (motion.matches !== nextMatch) {
        motion.matches = nextMatch;
        changeMotion();
      }
    },
  };
}

test('decorative rails stop offscreen, on touch/reduced motion, and in background tabs', () => {
  const animation = createAnimation();
  const { frames, draws, flush, stop, intersect, setHidden, setMedia } = animation;
  assert.equal(frames.size, 0);
  intersect(true); flush(100); flush(116);
  assert.deepEqual(draws, [[100, 0], [116, 16]]);
  intersect(false);
  assert.equal(frames.size, 0);
  intersect(true); flush(10000);
  assert.deepEqual(draws.at(-1), [10000, 0]);
  setHidden(true);
  assert.equal(frames.size, 0);
  setHidden(false);
  assert.equal(frames.size, 1);
  setMedia({ 'prefers-reduced-motion': 'reduce' });
  assert.equal(frames.size, 0);
  setMedia({ 'prefers-reduced-motion': 'no-preference' }); flush(10100); flush(11000);
  assert.deepEqual(draws.at(-1), [11000, 64]);
  setMedia({ width: 390, hover: 'none', pointer: 'coarse' });
  assert.equal(frames.size, 0);
  stop();
  assert.equal(frames.size, 0);
  assert.equal(animation.disconnected, true);
});

test('phone animation stays disabled unless the rail opts in', () => {
  const animation = createAnimation({ mobile: true });
  animation.intersect(true);
  animation.flush(100);
  assert.equal(animation.frames.size, 0);
  assert.deepEqual(animation.draws, []);
  animation.stop();
});

test('mobile opt in preserves visibility and reduced-motion controls', () => {
  const animation = createAnimation({ mobile: true, options: { allowMobile: true } });
  const { frames, draws, flush, intersect, setHidden, setMedia } = animation;
  assert.equal(frames.size, 0);
  intersect(true); flush(100); flush(116);
  assert.deepEqual(draws, [[100, 0], [116, 16]]);

  setMedia({ 'prefers-reduced-motion': 'reduce' });
  assert.equal(frames.size, 0);
  setMedia({ 'prefers-reduced-motion': 'no-preference' });
  flush(10000);
  assert.deepEqual(draws.at(-1), [10000, 0]);

  setHidden(true);
  assert.equal(frames.size, 0);
  setHidden(false);
  flush(20000);
  assert.deepEqual(draws.at(-1), [20000, 0]);
  intersect(false);
  assert.equal(frames.size, 0);
  intersect(true);
  assert.equal(frames.size, 1);

  // Opting in adds phone layouts without enabling touch-only tablet motion.
  setMedia({ width: 768 });
  assert.equal(frames.size, 0);
  setMedia({ width: 767 });
  assert.equal(frames.size, 1);
  setMedia({ width: 1280, hover: 'hover', pointer: 'fine' });
  assert.equal(frames.size, 1);
  setMedia({ 'prefers-reduced-motion': 'reduce' });
  assert.equal(frames.size, 0);

  animation.stop();
  assert.equal(frames.size, 0);
  assert.equal(animation.disconnected, true);
});

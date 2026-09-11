import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const code = ts.transpileModule(fs.readFileSync('src/lib/scrollVideo.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function setup({ coarse = false, blockFirstPlay = false, ...options } = {}) {
  const listeners = new Map(), touches = new Map(), times = [], progress = [];
  let plays = 0, pauses = 0;
  let position, config, currentTime = 0, killed = 0, refresh, refreshed = 0, disconnected = false;
  const video = {
    style: {}, readyState: 0, duration: NaN, seeking: false,
    pause() { pauses++; }, load() {},
    play() { plays++; return blockFirstPlay && plays === 1 ? Promise.reject(new Error('Gesture required')) : Promise.resolve(); },
    get currentTime() { return currentTime; },
    set currentTime(value) { times.push(value); currentTime = value; this.seeking = true; },
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: name => listeners.delete(name),
    removeAttribute(name) { delete this[name]; },
  };
  const exports = {};
  vm.runInNewContext(code, {
    exports, window: { innerHeight: 1000, matchMedia: () => ({ matches: coarse }) },
    ResizeObserver: class {
      constructor(callback) { refresh = callback; }
      observe() {}
      disconnect() { disconnected = true; }
    },
    require: id => id === 'gsap' ? { gsap: {
      registerPlugin() {}, to(target, options) {
        position = target; config = options;
        return { kill: () => killed++, scrollTrigger: { kill: () => killed++, refresh: () => refreshed++ } };
      },
    } } : { ScrollTrigger: {} },
  });
  const stop = exports.startScrollVideo({ wrapper: {
    offsetHeight: 4500,
    addEventListener: (name, fn) => touches.set(name, fn),
    removeEventListener: name => touches.delete(name),
  }, video, src: '/videos/1-scroll.mp4', onProgress: p => progress.push(p), ...options });
  return { video, times, progress, listeners, stop, get killed() { return killed; }, get config() { return config; },
    resize() { refresh(); }, get refreshed() { return refreshed; }, get disconnected() { return disconnected; },
    touches, get plays() { return plays; }, get pauses() { return pauses; },
    update(p) { position.progress = p; config.onUpdate(); },
    metadata() { video.duration = 40; video.readyState = 2; listeners.get('loadedmetadata')?.(); },
    seeked() { video.seeking = false; listeners.get('seeked')?.(); },
  };
}

test('metadata arrival seeks to the latest restored scroll position', () => {
  const h = setup(); h.update(0.5);
  assert.equal(h.times.length, 0);
  h.metadata();
  assert.ok(Math.abs(h.times.at(-1) - 20) < 0.04);
  assert.equal(h.config.scrollTrigger.scrub, 0.35);
  assert.equal(h.config.scrollTrigger.end(), '+=3045');
  h.stop();
});
test('coalesces scroll updates during a seek, including reversing direction', () => {
  const h = setup(); h.metadata(); h.update(0.8);
  h.update(0.9); h.update(0.2);
  assert.equal(h.times.length, 1);
  h.seeked();
  assert.equal(h.times.length, 2);
  assert.ok(h.times[1] < h.times[0]);
  assert.equal(h.progress.at(-1), 0.2);
  h.stop();
});
test('reaches the beginning and holds inside the final video frame', () => {
  const h = setup(); h.metadata(); h.update(1);
  assert.ok(h.times.at(-1) < 40 && h.times.at(-1) > 39.9);
  h.seeked(); h.update(0);
  assert.equal(h.times.at(-1), 0);
  h.stop();
});
test('load errors leave the poster visible and stop further seeking', () => {
  const h = setup(); h.metadata(); h.listeners.get('loadeddata')();
  assert.equal(h.video.style.opacity, '1');
  h.listeners.get('error')(); h.update(0.5);
  assert.equal(h.video.style.opacity, '0');
  assert.equal(h.times.length, 0);
  h.stop();
});
test('cleanup removes triggers, listeners, video source and stale background', () => {
  const h = setup(); h.metadata(); h.stop();
  assert.equal(h.killed, 2);
  assert.equal(h.listeners.size, 0);
  assert.equal(h.video.src, undefined);
  assert.equal(h.video.preload, 'none');
  assert.equal(h.video.style.opacity, '0');
  assert.equal(h.disconnected, true);
});

test('phone scrub uses the measured panel distance and refreshes after layout settles', () => {
  let distance = 1300;
  const h = setup({ scrollDistance: () => distance });
  assert.equal(h.config.scrollTrigger.end(), '+=1131');
  distance = 1500;
  h.resize();
  assert.equal(h.refreshed, 1);
  assert.equal(h.config.scrollTrigger.end(), '+=1305');
  h.stop();
});

test('a phone tap retries video decoding if the first muted play was blocked', async () => {
  const h = setup({ coarse: true, blockFirstPlay: true });
  h.metadata(); h.listeners.get('loadeddata')();
  await new Promise(setImmediate);
  assert.equal(h.plays, 1);
  h.touches.get('pointerdown')();
  await new Promise(setImmediate);
  assert.equal(h.plays, 2);
  assert.equal(h.pauses, 2);
  h.stop();
  assert.equal(h.touches.size, 0);
});

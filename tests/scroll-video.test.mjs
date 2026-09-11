import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const code = ts.transpileModule(fs.readFileSync('src/lib/scrollVideo.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function setup() {
  const listeners = new Map(), times = [], progress = [];
  let position, config, currentTime = 0, killed = 0;
  const video = {
    style: {}, readyState: 0, duration: NaN, seeking: false,
    pause() {}, load() {},
    get currentTime() { return currentTime; },
    set currentTime(value) { times.push(value); currentTime = value; this.seeking = true; },
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: name => listeners.delete(name),
    removeAttribute(name) { delete this[name]; },
  };
  const exports = {};
  vm.runInNewContext(code, {
    exports, window: { innerHeight: 1000 },
    require: id => id === 'gsap' ? { gsap: {
      registerPlugin() {}, to(target, options) {
        position = target; config = options;
        return { kill: () => killed++, scrollTrigger: { kill: () => killed++ } };
      },
    } } : { ScrollTrigger: {} },
  });
  const stop = exports.startScrollVideo({ wrapper: { offsetHeight: 4500 }, video, src: '/videos/1-scroll.mp4', onProgress: p => progress.push(p) });
  return { video, times, progress, listeners, stop, get killed() { return killed; }, get config() { return config; },
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
});

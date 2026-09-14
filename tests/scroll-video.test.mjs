import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const code = ts.transpileModule(fs.readFileSync('src/lib/scrollVideo.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function setup({ coarse = false, blockFirstPlay = false, frameCallbacks = false, ...options } = {}) {
  const listeners = new Map(), touches = new Map(), events = new Map(), visibilityEvents = new Map();
  const frames = new Map(), timers = new Map(), times = [], progress = [];
  let plays = 0, pauses = 0, currentTime = 0, nextFrame = 0, nextTimer = 0, clock = 0, resize, disconnected = false, reads = 0;
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
  let present;
  if (frameCallbacks) {
    video.requestVideoFrameCallback = fn => { present = fn; return 1; };
    video.cancelVideoFrameCallback = () => { present = undefined; };
  }
  const window = {
    innerHeight: 1000, scrollY: 0, matchMedia: () => ({ matches: coarse }),
    addEventListener: (name, fn) => events.set(name, fn),
    removeEventListener: name => events.delete(name),
  };
  const document = {
    hidden: false,
    addEventListener: (name, fn) => visibilityEvents.set(name, fn),
    removeEventListener: name => visibilityEvents.delete(name),
  };
  const exports = {};
  vm.runInNewContext(code, {
    exports, window, document,
    requestAnimationFrame(fn) { frames.set(++nextFrame, fn); return nextFrame; },
    cancelAnimationFrame(id) { frames.delete(id); },
    setTimeout(fn) { timers.set(++nextTimer, fn); return nextTimer; },
    clearTimeout(id) { timers.delete(id); },
    ResizeObserver: class {
      constructor(callback) { resize = callback; }
      observe() {}
      disconnect() { disconnected = true; }
    },
  });
  const flush = () => { clock += 1000 / 60; const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn(clock)); };
  const stop = exports.startScrollVideo({ wrapper: {
    offsetHeight: 4500,
    getBoundingClientRect() { reads++; return { top: -window.scrollY }; },
    addEventListener: (name, fn) => touches.set(name, fn),
    removeEventListener: name => touches.delete(name),
  }, video, src: '/videos/1-scroll.mp4', scrubDuration: 0, onProgress: p => progress.push(p), ...options });
  flush();
  return {
    video, times, progress, listeners, events, visibilityEvents, stop, touches, flush, frames, timers,
    get reads() { return reads; }, get plays() { return plays; }, get pauses() { return pauses; },
    get disconnected() { return disconnected; },
    resize() { resize(); flush(); },
    scroll(y) { window.scrollY = y; events.get('scroll')?.(); },
    update(p) { this.scroll(p * (options.scrollDistance?.() ?? 3500) * 0.87); flush(); },
    metadata(readyState = 2) { video.duration = 40; video.readyState = readyState; listeners.get('loadedmetadata')?.(); flush(); },
    seeked() { video.seeking = false; listeners.get('seeked')?.(); flush(); },
    present() { present?.(); flush(); },
    get pendingPresentation() { return Boolean(present); },
    visibility(hidden) { document.hidden = hidden; visibilityEvents.get('visibilitychange')?.(); flush(); },
    timeout() { const pending = [...timers.values()]; timers.clear(); pending.forEach(fn => fn()); },
  };
}

test('metadata arrival seeks to the latest restored scroll position', () => {
  const h = setup(); h.update(0.5);
  assert.equal(h.times.length, 0);
  h.metadata();
  assert.ok(Math.abs(h.times.at(-1) - 20) < 0.05);
  h.stop();
});

test('scroll bursts ease through frames, settle exactly, and leave no idle loop', () => {
  const h = setup({ scrubDuration: 0.1 });
  h.metadata(); h.update(0.8);
  assert.ok(h.times.at(-1) > 0 && h.times.at(-1) < 10, 'first seek must not jump to 32 seconds');
  for (let frame = 0; frame < 100 && (h.video.seeking || h.frames.size); frame++) {
    if (h.video.seeking) h.seeked();
    else h.flush();
  }
  assert.ok(Math.abs(h.video.currentTime - 32) < 0.05);
  assert.equal(h.frames.size, 0);
  assert.equal(h.video.seeking, false);
  assert.equal(h.reads, 1);
  h.stop();
});

test('eased scrolling reverses towards the latest target while a seek is in flight', () => {
  const h = setup({ scrubDuration: 0.1 });
  h.metadata(); h.update(0.9);
  const first = h.times.at(-1);
  h.update(0);
  assert.equal(h.times.length, 1);
  h.seeked();
  assert.ok(h.times.at(-1) < first, 'must reverse without finishing the old journey');
  for (let frame = 0; frame < 100 && (h.video.seeking || h.frames.size); frame++) {
    if (h.video.seeking) h.seeked();
    else h.flush();
  }
  assert.equal(h.video.currentTime, 0);
  assert.equal(h.frames.size, 0);
  h.stop();
});

test('copy follows completed video frames instead of running ahead during a slow seek', () => {
  const displayed = [];
  const h = setup({ scrubDuration: 0.1, onFrame: p => displayed.push(p) });
  h.metadata(); h.update(0.9);
  assert.equal(displayed.at(-1), 0);
  const sought = h.video.currentTime;
  h.update(0.95);
  assert.equal(displayed.at(-1), 0);
  h.seeked();
  assert.ok(Math.abs(displayed.at(-1) - sought / (40 - 1 / 24)) < 0.001);
  h.stop();
});

test('easing starts at the restored position when metadata arrives late', () => {
  const h = setup({ scrubDuration: 0.1 });
  h.update(0.6); h.metadata(1);
  assert.ok(Math.abs(h.video.currentTime - 24) < 0.05);
  h.stop();
});

test('continuous scroll waits for the decoded frame to paint before seeking again', () => {
  const shown = [];
  const h = setup({ frameCallbacks: true, onFrame: p => shown.push(p) });
  h.metadata(); h.update(0.4); h.update(0.8); h.seeked();
  assert.equal(h.times.length, 1, 'seeked alone must not replace an unpainted frame');
  assert.equal(shown.at(-1), 0);
  h.present();
  assert.equal(h.times.length, 2);
  assert.ok(Math.abs(shown.at(-1) - 0.4) < 0.002);
  h.seeked(); h.present();
  assert.equal(h.frames.size, 0);
  assert.equal(h.timers.size, 0);
  h.stop();
});

test('missing paused-video frame callbacks recover and pending callbacks are cleaned up', () => {
  const h = setup({ frameCallbacks: true });
  h.metadata(); h.update(0.4); h.seeked(); h.update(0.8);
  assert.equal(h.times.length, 1);
  h.timeout(); h.flush();
  assert.equal(h.times.length, 2);
  h.visibility(true);
  assert.equal(h.pendingPresentation, false);
  assert.equal(h.timers.size, 0);
  h.visibility(false); h.seeked(); h.update(0.2);
  assert.equal(h.pendingPresentation, true);
  h.stop();
  assert.equal(h.pendingPresentation, false);
  assert.equal(h.timers.size, 0);
});

test('coalesces scroll updates during a seek, including reversing direction', () => {
  const h = setup(); h.metadata(); h.update(0.8);
  h.update(0.9); h.update(0.2);
  assert.equal(h.times.length, 1);
  h.seeked();
  assert.equal(h.times.length, 2);
  assert.ok(h.times[1] < h.times[0]);
  assert.ok(Math.abs(h.progress.at(-1) - 0.2) < 0.001);
  h.stop();
});

test('reaches the beginning and holds inside the final video frame', () => {
  const h = setup(); h.metadata(); h.update(1.2);
  assert.ok(h.times.at(-1) < 40 && h.times.at(-1) > 39.9);
  assert.equal(h.progress.at(-1), 1);
  h.seeked(); h.update(-0.1);
  assert.equal(h.times.at(-1), 0);
  h.stop();
});

test('load errors preserve the poster and notify the layout to release the sticky section', () => {
  let errors = 0;
  const h = setup({ onError: () => errors++ }); h.metadata(); h.listeners.get('loadeddata')();
  assert.equal(h.video.style.opacity, '1');
  h.listeners.get('error')(); h.update(0.5);
  assert.equal(h.video.style.opacity, '0');
  assert.equal(h.times.length, 0);
  assert.equal(errors, 1);
  assert.equal(h.frames.size, 0);
  assert.equal(h.timers.size, 0);
  h.stop();
});

test('cleanup removes pending work, listeners and video source', () => {
  const h = setup(); h.metadata(); h.scroll(500); h.stop(); h.flush();
  assert.equal(h.listeners.size, 0);
  assert.equal(h.events.size, 0);
  assert.equal(h.visibilityEvents.size, 0);
  assert.equal(h.frames.size, 0);
  assert.equal(h.video.src, undefined);
  assert.equal(h.video.preload, 'none');
  assert.equal(h.video.style.opacity, '0');
  assert.equal(h.disconnected, true);
});

test('phone scrub follows resized panel distance without layout reads during scrolling', () => {
  let distance = 1300;
  const h = setup({ scrollDistance: () => distance });
  h.scroll(565.5); h.flush();
  assert.equal(h.progress.at(-1), 0.5);
  assert.equal(h.reads, 1);
  distance = 2600;
  h.resize();
  assert.equal(h.progress.at(-1), 0.25);
  assert.equal(h.reads, 2);
  h.stop();
});

test('scroll bursts schedule one update and no animation runs while idle or hidden', () => {
  const h = setup();
  h.scroll(100); h.scroll(200); h.scroll(300);
  assert.equal(h.frames.size, 1);
  h.flush();
  assert.equal(h.frames.size, 0);
  h.visibility(true); h.scroll(600);
  assert.equal(h.frames.size, 0);
  h.visibility(false);
  assert.ok(Math.abs(h.progress.at(-1) - 600 / 3045) < 0.001);
  h.stop();
});

test('a phone tap retries decoding after a blocked muted play at metadata', async () => {
  const h = setup({ coarse: true, blockFirstPlay: true });
  h.metadata(1);
  await new Promise(setImmediate);
  assert.equal(h.plays, 1);
  h.listeners.get('canplay')();
  await new Promise(setImmediate);
  assert.equal(h.plays, 1, 'blocked automatic priming must wait for a real gesture');
  h.touches.get('touchend')();
  await new Promise(setImmediate);
  assert.equal(h.plays, 2);
  assert.equal(h.pauses, 2);
  h.stop();
  assert.equal(h.touches.size, 0);
});

test('metadata-only loading can request the restored frame before loadeddata', () => {
  const h = setup();
  h.update(0.6); h.metadata(1);
  assert.ok(Math.abs(h.times.at(-1) - 24) < 0.05);
  assert.equal(h.video.style.opacity, '0');
  h.video.readyState = 2;
  h.seeked();
  assert.equal(h.video.style.opacity, '1');
  assert.equal(h.timers.size, 0);
  h.stop();
});

test('canplay recovers a buffered frame without another scroll or loadeddata', () => {
  const h = setup();
  h.metadata(1);
  assert.equal(h.video.style.opacity, '0');
  h.video.readyState = 3;
  h.listeners.get('canplay')(); h.flush();
  assert.equal(h.video.style.opacity, '1');
  assert.equal(h.timers.size, 0);
  h.stop();
});

test('a hanging load or seek releases the scroll section and cancels the download', () => {
  for (const hangDuringSeek of [false, true]) {
    let errors = 0;
    const h = setup({ onError: () => errors++ });
    if (hangDuringSeek) { h.metadata(); h.update(0.75); }
    assert.equal(h.timers.size, 1);
    h.timeout(); h.scroll(1500); h.flush();
    assert.equal(errors, 1);
    assert.equal(h.video.src, undefined);
    assert.equal(h.video.preload, 'none');
    assert.equal(h.video.style.opacity, '0');
    assert.equal(h.frames.size, 0);
    h.stop();
  }
});

test('hidden tabs do not expire the load timeout or prime playback', async () => {
  const h = setup({ coarse: true });
  h.visibility(true); h.metadata(1);
  await new Promise(setImmediate);
  assert.equal(h.timers.size, 0);
  assert.equal(h.plays, 0);
  h.visibility(false);
  await new Promise(setImmediate);
  assert.equal(h.timers.size, 1);
  assert.equal(h.plays, 1);
  h.stop();
  assert.equal(h.timers.size, 0);
});

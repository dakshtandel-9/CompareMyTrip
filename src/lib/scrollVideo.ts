"use client";

type ScrollVideoOptions = {
  wrapper: HTMLElement;
  video: HTMLVideoElement;
  src: string;
  tailHold?: number;
  onProgress?: (progress: number) => void;
  onFrame?: (progress: number) => void;
  onError?: () => void;
  scrollDistance?: () => number;
  scrubDuration?: number;
};

/** Native scrolling owns the page; one frame callback coalesces video seeks.
 * Geometry is measured only on resize, never while scrolling. */
export function startScrollVideo({ wrapper, video, src, tailHold = 0.13, onProgress, onFrame, onError, scrollDistance, scrubDuration = 0.1 }: ScrollVideoOptions) {
  const hold = Math.max(0, Math.min(tailHold, 0.9));
  const frameDuration = 1 / 24;
  let disposed = false;
  let failed = false;
  let frame = 0;
  let start = 0;
  let distance = 1;
  let progress = -1;
  let playhead = 0;
  let lastUpdate = 0;
  let initialized = false;
  let presentation: number | undefined;
  let presentationFallback: ReturnType<typeof setTimeout> | undefined;
  let needsMeasure = true;
  let waiting: ReturnType<typeof setTimeout> | undefined;

  const clearWaiting = () => {
    clearTimeout(waiting);
    waiting = undefined;
  };
  const clearPresentation = () => {
    if (presentation !== undefined) video.cancelVideoFrameCallback(presentation);
    presentation = undefined;
    clearTimeout(presentationFallback);
    presentationFallback = undefined;
  };
  const showFrame = () => {
    if (disposed || failed || video.seeking || video.readyState < 2) return;
    video.style.opacity = "1";
    const end = Math.max(frameDuration, video.duration - frameDuration);
    onFrame?.(Math.max(0, Math.min(1, video.currentTime / end)));
  };
  const presented = () => {
    clearPresentation();
    showFrame();
    schedule();
  };
  const releaseSource = () => {
    video.pause();
    video.style.opacity = "0";
    video.removeAttribute("src");
    video.preload = "none";
    video.load();
  };
  const hide = () => {
    if (disposed || failed) return;
    failed = true;
    clearWaiting();
    clearPresentation();
    cancelAnimationFrame(frame);
    frame = 0;
    // A stalled request may never produce an error event. Cancel the request
    // as well as the animation, then release the otherwise empty scroll run.
    releaseSource();
    onError?.();
  };
  const watchWaiting = () => {
    if (!waiting && !disposed && !failed && !document.hidden) {
      waiting = setTimeout(hide, 12_000);
    }
  };

  const seek = () => {
    if (disposed || failed || video.seeking || presentation !== undefined || video.readyState < 1 || !Number.isFinite(video.duration) || video.duration <= 0) return;
    // Metadata is sufficient to request a frame. Waiting for loadeddata here
    // can strand restored scroll positions on browsers that defer preloading.
    const end = Math.max(0, video.duration - frameDuration);
    const target = Math.min(end, Math.round(playhead * end / frameDuration) * frameDuration);
    if (Math.abs(video.currentTime - target) > frameDuration / 2) {
      try {
        // Decoding and painting are separate. Let the browser present this
        // frame before another seek can replace it during continuous scrolling.
        if (typeof video.requestVideoFrameCallback === "function") {
          presentation = video.requestVideoFrameCallback(presented);
        }
        video.currentTime = target;
        watchWaiting();
      } catch {
        hide();
      }
    }
  };

  const update = (time: number) => {
    frame = 0;
    if (disposed || failed || document.hidden) return;
    if (needsMeasure) {
      start = wrapper.getBoundingClientRect().top + window.scrollY;
      distance = Math.max(1, (scrollDistance?.() ?? wrapper.offsetHeight - window.innerHeight) * (1 - hold));
      needsMeasure = false;
    }
    const next = Math.max(0, Math.min(1, (window.scrollY - start) / distance));
    if (next !== progress) {
      progress = next;
      onProgress?.(progress);
    }
    // Ease the playhead, not the page. A wheel burst should not cut straight
    // across several scenes, and a reversal should replace the old target.
    // Restored positions start on the correct frame without a long catch-up.
    const delta = lastUpdate ? Math.max(0, time - lastUpdate) / 1000 : 1 / 60;
    lastUpdate = time;
    const end = Math.max(frameDuration, (video.duration || 0) - frameDuration);
    if (!initialized || scrubDuration <= 0) {
      playhead = progress;
      initialized = video.readyState >= 1;
    } else {
      playhead += (progress - playhead) * (1 - Math.exp(-delta / scrubDuration));
      if (Math.abs(progress - playhead) * end < frameDuration / 2) playhead = progress;
    }
    seek();
    // Seek completion wakes the controller when decoding is busy. Otherwise
    // continue only until the eased playhead settles; there is no idle loop.
    if (playhead !== progress && !video.seeking && presentation === undefined && video.readyState >= 2) schedule();
    else if (playhead === progress) lastUpdate = 0;
  };
  const schedule = () => {
    if (!frame && !disposed && !failed && !document.hidden) frame = requestAnimationFrame(update);
  };
  const measure = () => {
    needsMeasure = true;
    schedule();
  };

  // Some phone browsers need a muted play before paused seeking paints.
  // Prime as soon as metadata exists: loadeddata itself may require a gesture.
  let primed = !window.matchMedia("(pointer: coarse)").matches;
  let attemptedPrime = false;
  const prime = () => {
    if (primed || disposed || failed || document.hidden) return;
    primed = true;
    video.play().then(() => {
      if (disposed || failed) return;
      video.pause();
      schedule();
    }).catch(() => { primed = false; });
  };
  const ready = () => {
    if (disposed || failed) return;
    if (!attemptedPrime && !document.hidden) {
      attemptedPrime = true;
      prime();
    }
    if (video.readyState >= 2 && !video.seeking) {
      clearWaiting();
      if (presentation === undefined) showFrame();
      // Some engines omit frame callbacks for paused or offscreen video.
      // Never let that strand an otherwise successfully decoded seek.
      else if (presentationFallback === undefined) presentationFallback = setTimeout(presented, 100);
    }
    schedule();
  };
  const visibility = () => {
    if (document.hidden) {
      clearWaiting();
      clearPresentation();
      cancelAnimationFrame(frame);
      frame = 0;
      video.pause();
      lastUpdate = 0;
    } else {
      if (video.readyState < 2 || video.seeking) watchWaiting();
      ready();
      measure();
    }
  };

  video.pause();
  video.muted = true;
  video.style.opacity = "0";
  video.addEventListener("loadedmetadata", ready);
  video.addEventListener("loadeddata", ready);
  video.addEventListener("canplay", ready);
  video.addEventListener("seeked", ready);
  video.addEventListener("error", hide);
  // Touch activation occurs at touchend/click, not at pointerdown.
  if (!primed) {
    wrapper.addEventListener("touchend", prime, { passive: true });
    wrapper.addEventListener("click", prime, { passive: true });
  }
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", measure, { passive: true });
  document.addEventListener("visibilitychange", visibility);
  const sizeObserver = new ResizeObserver(measure);
  sizeObserver.observe(wrapper);
  video.preload = "auto";
  video.src = src;
  video.load();
  watchWaiting();
  schedule();

  return () => {
    disposed = true;
    clearWaiting();
    clearPresentation();
    cancelAnimationFrame(frame);
    sizeObserver.disconnect();
    wrapper.removeEventListener("touchend", prime);
    wrapper.removeEventListener("click", prime);
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", measure);
    document.removeEventListener("visibilitychange", visibility);
    video.removeEventListener("loadedmetadata", ready);
    video.removeEventListener("loadeddata", ready);
    video.removeEventListener("canplay", ready);
    video.removeEventListener("seeked", ready);
    video.removeEventListener("error", hide);
    releaseSource();
  };
}

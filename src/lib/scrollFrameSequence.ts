"use client";

/* ------------------------------------------------------------------ */
/* Scroll-scrubbed frame sequence, shared by the banner bands.          */
/*                                                                       */
/* The naive version of this — request every frame on mount, then run a  */
/* rAF loop for the life of the page redrawing a full-screen canvas each */
/* tick — costs the whole page, not just the band that owns it. Three    */
/* banners doing that were repainting 3.6 megapixels each, every frame,  */
/* while the hero above them was the thing actually on screen.           */
/*                                                                       */
/* So this controller: loads nothing until the band is near the viewport, */
/* runs its loop only while the band is on screen, keeps a handful of     */
/* requests in flight instead of hundreds, decodes each frame before      */
/* counting it ready (an undecoded image decodes on the thread that draws */
/* it — mid-scrub), sizes the canvas to the footage rather than to the    */
/* display, and skips any redraw that would put the same frame back.      */
/* ------------------------------------------------------------------ */

type Options = {
  wrapper: HTMLElement;
  canvas: HTMLCanvasElement;
  /** Public path holding frame_0001.jpg …, no trailing slash. */
  dir: string;
  count: number;
};

/** Requests allowed in flight at once. */
const MAX_PARALLEL_LOADS = 6;

/** Seconds for the scrub to settle onto the scroll position. */
const SCRUB_SETTLE = 0.1;

/** How early the frames start downloading, in px of scroll. */
const PRELOAD_MARGIN = "1200px 0px";

/** How early the loop wakes up, so the first frame is never a blank box. */
const RUN_MARGIN = "300px 0px";

const frameSrc = (dir: string, index: number) =>
  `${dir}/frame_${String(index + 1).padStart(4, "0")}.jpg`;

const isReady = (img: HTMLImageElement | undefined) =>
  !!img && img.complete && img.naturalWidth > 0 && img.dataset.decoded === "1";

export function startScrollFrameSequence({ wrapper, canvas, dir, count }: Options) {
  // Opaque: the frame covers the whole box, so there is nothing behind it
  // worth blending against.
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return () => {};

  const images: HTMLImageElement[] = new Array(count);

  let currentFrame = 0;
  let rafId = 0;
  let cancelled = false;
  let running = false;
  let lastTime = 0;

  let lastDrawnFrame = -1;
  let needsRedraw = true;

  /* Cached on resize: reading it per frame forces a layout per frame. */
  let scrollableHeight = 0;
  /* Learned from the first frame that arrives, so the canvas is never
     given more pixels than the footage actually has. */
  let sourceWidth = 0;

  const nearestReady = (frameIndex: number) => {
    for (let offset = 1; offset < count; offset++) {
      const before = images[frameIndex - offset];
      if (isReady(before)) return before;
      const after = images[frameIndex + offset];
      if (isReady(after)) return after;
    }
    return undefined;
  };

  const drawFrame = (frameIndex: number) => {
    if (!needsRedraw && frameIndex === lastDrawnFrame) return;

    const exact = images[frameIndex];
    const img = isReady(exact) ? exact : nearestReady(frameIndex);
    if (!img) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const imageAspect = img.naturalWidth / img.naturalHeight;
    const canvasAspect = canvasWidth / canvasHeight;

    let drawWidth: number;
    let drawHeight: number;

    if (imageAspect > canvasAspect) {
      drawHeight = canvasHeight;
      drawWidth = drawHeight * imageAspect;
    } else {
      drawWidth = canvasWidth;
      drawHeight = drawWidth / imageAspect;
    }

    ctx.drawImage(
      img,
      (canvasWidth - drawWidth) / 2,
      (canvasHeight - drawHeight) / 2,
      drawWidth,
      drawHeight,
    );

    lastDrawnFrame = frameIndex;
    needsRedraw = false;
  };

  const resize = () => {
    const box = canvas.parentElement;
    const width = box?.clientWidth ?? window.innerWidth;
    const height = box?.clientHeight ?? window.innerHeight;

    // Match the display, but never ask for more pixels than the footage has.
    const cap = sourceWidth > 0 ? Math.max(1, sourceWidth / Math.max(width, 1)) : 2;
    const scale = Math.min(window.devicePixelRatio || 1, cap);

    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    canvas.style.width = "100%";
    canvas.style.height = "100%";

    scrollableHeight = wrapper.offsetHeight - window.innerHeight;

    // Resizing the backing store clears it.
    needsRedraw = true;
    drawFrame(Math.round(currentFrame));
  };

  /* ---------------- loading ---------------- */

  const queue: number[] = [];
  let inFlight = 0;
  let loadStarted = false;

  const startLoad = (frameIndex: number) => {
    const img = new window.Image();
    img.decoding = "async";
    images[frameIndex] = img;

    const settled = () => {
      inFlight -= 1;
      if (Math.abs(frameIndex - Math.round(currentFrame)) <= 1) needsRedraw = true;
      pump();
    };

    const decoded = () => {
      img.dataset.decoded = "1";

      if (sourceWidth === 0 && img.naturalWidth > 0) {
        sourceWidth = img.naturalWidth;
        // First frame in: re-size now that the footage's own size is known.
        resize();
      }

      settled();
    };

    img.onload = () => {
      if (typeof img.decode === "function") img.decode().then(decoded, decoded);
      else decoded();
    };
    img.onerror = settled;

    inFlight += 1;
    img.src = frameSrc(dir, frameIndex);
  };

  function pump() {
    while (inFlight < MAX_PARALLEL_LOADS && queue.length > 0) {
      startLoad(queue.shift()!);
    }
  }

  const beginLoading = () => {
    if (loadStarted) return;
    loadStarted = true;
    for (let i = 0; i < count; i++) queue.push(i);
    pump();
  };

  /* ---------------- loop ---------------- */

  const targetFrame = () => {
    if (scrollableHeight <= 0) return 0;
    const progress = -wrapper.getBoundingClientRect().top / scrollableHeight;
    return Math.min(Math.max(progress, 0), 1) * (count - 1);
  };

  const tick = (time: number) => {
    if (cancelled || !running) return;

    const delta = lastTime === 0 ? 1 / 60 : Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;

    const target = targetFrame();
    // Eased against elapsed time, so the settle feels the same whatever the
    // display refreshes at.
    currentFrame += (target - currentFrame) * (1 - Math.exp(-delta / SCRUB_SETTLE));
    if (Math.abs(target - currentFrame) < 0.25) currentFrame = target;

    drawFrame(Math.round(currentFrame));
    rafId = requestAnimationFrame(tick);
  };

  const start = () => {
    if (running || cancelled) return;
    running = true;
    lastTime = 0;
    rafId = requestAnimationFrame(tick);
  };

  const stop = () => {
    running = false;
    cancelAnimationFrame(rafId);
  };

  let resizeScheduled = false;
  const onResize = () => {
    if (resizeScheduled) return;
    resizeScheduled = true;
    requestAnimationFrame(() => {
      resizeScheduled = false;
      resize();
    });
  };

  const preloadObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      beginLoading();
      preloadObserver.disconnect();
    },
    { rootMargin: PRELOAD_MARGIN },
  );

  const runObserver = new IntersectionObserver(
    ([entry]) => (entry.isIntersecting ? start() : stop()),
    { rootMargin: RUN_MARGIN },
  );

  resize();
  preloadObserver.observe(wrapper);
  runObserver.observe(wrapper);
  window.addEventListener("resize", onResize);

  return () => {
    cancelled = true;
    stop();
    preloadObserver.disconnect();
    runObserver.disconnect();
    window.removeEventListener("resize", onResize);
  };
}

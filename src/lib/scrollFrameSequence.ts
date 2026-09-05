"use client";

/* ------------------------------------------------------------------ */
/* Scroll-scrubbed frame sequence — shared by the hero and the banners.  */
/*                                                                       */
/* The version this replaces asked the browser for every frame of the    */
/* sequence, held an <img> for each one, and called decode() on all of   */
/* them. For the hero that is 1191 frames: ~95MB over the wire, and      */
/* ~4.4GB of decoded 1280x720 bitmaps pinned in memory, because an       */
/* explicitly decoded image the page still references is an image the    */
/* browser may not throw away. On a phone the tab is killed long before  */
/* the sequence finishes arriving; on a desktop it stalls, and either    */
/* way the scrub is left near the opening frames while the section       */
/* scrolls past. Locally the frames come off disk fast enough to hide    */
/* all of it, which is why it only shows up once deployed.               */
/*                                                                       */
/* So this controller works to two budgets instead:                      */
/*                                                                       */
/*   Bytes.  Only a stride of the source frames is used, chosen from the */
/*     device tier, and sequences that publish more than one cut are      */
/*     matched to the pixels the canvas will really be given — a phone    */
/*     fetches the 1280-wide frames, not the 2560-wide ones.              */
/*                                                                       */
/*   Memory.  At most RESIDENT frame images are alive at once, and        */
/*     decode() is called only inside a window around the playhead,       */
/*     biased the way the scroll is travelling. That window is sized in   */
/*     megabytes rather than frames, because a decoded frame costs        */
/*     w x h x 4 — 3.7MB at 720p against 14.7MB at 1440p. Frames are      */
/*     stored `immutable, max-age=1y`, so re-creating a dropped one is an */
/*     HTTP-cache read rather than a download.                            */
/*                                                                       */
/* What stays resident is a coarse skeleton spread across the whole clip  */
/* plus a dense window that travels with the playhead. That is what       */
/* makes a jump to any point in the scroll land on a picture: the         */
/* skeleton is always there to draw while the detail arrives behind it.   */
/*                                                                       */
/* Loading follows the same shape — a dozen frames spanning the clip      */
/* first, so it is scrubbable end to end almost immediately, then the     */
/* detail where the viewer actually is, then the rest of the skeleton.    */
/* ------------------------------------------------------------------ */

/** How much the device is asked to carry. */
type Tier = "high" | "medium" | "low";

export type ScrollFrameSequenceOptions = {
  wrapper: HTMLElement;
  canvas: HTMLCanvasElement;
  /** Base path holding frame_0001.<ext> …, no trailing slash. */
  dir: string;
  /** A lower-resolution cut of the same sequence, same frame count and
      numbering. Used when the canvas can never be wide enough to show the
      full one — a phone gets a quarter of the bytes for a picture it cannot
      tell apart. */
  smallDir?: string;
  /** Frame file extension, no dot. */
  ext?: string;
  /** How many frames the sequence has on the CDN. */
  count: number;
  /** Fraction of the wrapper's scroll left over after the clip's last
      frame, holding that frame on screen before the section unpins. */
  tailHold?: number;
  /** Progress through the clip, 0 → 1, every frame the loop runs. Stays at
      1 for the whole of the tail hold. */
  onProgress?: (progress: number) => void;
  /** Frames to actually use, per tier. Sequences whose frames are unusually
      heavy should pass their own; the defaults suit ~80KB frames. */
  maxFrames?: Partial<Record<Tier, number>>;
};

/** Requests in flight while streaming frames in around the playhead. The
    decoder is the bottleneck well before the socket is, so this stays short
    of what HTTP/2 would happily allow. */
const PARALLEL: Record<Tier, number> = { high: 8, medium: 6, low: 4 };

/** Frame images alive at once — the memory ceiling. Eviction will not touch
    the skeleton or the travelling window, so the real figure sits a handful
    over this rather than exactly on it. */
const RESIDENT: Record<Tier, number> = { high: 80, medium: 44, low: 26 };

/** Memory allowed for decoded frames, in MB. An undecoded image decodes on
    the thread that draws it — mid-scrub, for 10ms, as a dropped frame — so a
    window either side of the playhead is decoded in advance. How many frames
    that buys is not a constant: a decoded frame costs width x height x 4,
    which is 3.7MB at 1280x720 but 14.7MB at 2560x1440. Fixing the frame
    count instead of the bytes is what makes a sharper sequence quietly cost
    four times the memory, so the count is derived from the real frame size
    once the first one has landed. */
const DECODE_BUDGET_MB: Record<Tier, number> = { high: 130, medium: 80, low: 45 };

/** Share of that window that sits ahead of the playhead, the way the scroll
    is travelling. The rest sits behind it, for scrubbing back up. */
const DECODE_AHEAD_SHARE = 0.75;

/** Until the first frame lands and the real cost per frame is known. */
const DECODE_AHEAD_FALLBACK = 6;
const DECODE_BEHIND_FALLBACK = 2;

/** Frames of the source sequence actually used. */
const DEFAULT_MAX_FRAMES: Record<Tier, number> = { high: 400, medium: 200, low: 110 };

/** Widest canvas the small cut is allowed to fill. Above this the full-size
    frames are fetched; below it they would only be downscaled away. Set from
    the small cut's own width, so it is never asked to fill more pixels than
    it has — a phone at 390 CSS px and 3x asks for 780 and stays under it,
    while the narrowest laptop clears it and gets the full cut. */
const SMALL_CUT_MAX_WIDTH = 1000;

/** Load passes that stay resident for the life of the page: every 16th of
    the frames in play, spread across the whole clip. */
const SKELETON_PASS = 2;

/** And the pass fetched before anything else — roughly a dozen frames, which
    is a scrubbable clip end to end for about the weight of one photograph. */
const BOOTSTRAP_PASS = 1;

/** Slack either side of the travelling window before a frame is dropped, so
    a scrub that reverses does not immediately re-request what it just had. */
const EVICT_MARGIN = 6;

/** Seconds for the scrub to settle onto the scroll position. Short enough
    that the frame under the cursor is the frame being looked at, long enough
    to absorb a coarse wheel notch. */
const SCRUB_SETTLE = 0.075;

/** Decodes running at once, kept clear of the fetches. */
const MAX_DECODES = 4;

/** Requests before a frame is written off — a 404 must not be retried for
    the life of the page. */
const MAX_ATTEMPTS = 3;

/** The canvas is never given more pixels than this, whatever the display
    claims: past 2x we upscale the source at four times the fill cost. */
const MAX_PIXEL_RATIO = 2;

/** How early frames start arriving, in px of scroll. */
const PRELOAD_MARGIN = "1400px 0px";

/** How early the loop wakes up, so the first frame is never a blank box. */
const RUN_MARGIN = "300px 0px";

/** Rescheduling walks the sequence, so it waits for the playhead to move or
    for a beat to pass rather than running on every animation frame. */
const SCHEDULE_INTERVAL_MS = 200;

const IDLE = 0;
const LOADING = 1;
const READY = 2;
const FAILED = 3;

const clamp01 = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value);

const frameSrc = (dir: string, sourceIndex: number, ext: string) =>
  `${dir}/frame_${String(sourceIndex + 1).padStart(4, "0")}.${ext}`;

/* What the device is asked to carry. deviceMemory is Chromium-only, so its
   absence reads as "desktop unless the pointer says otherwise" rather than
   as a low-memory machine — Safari on a MacBook is not a budget phone. */
function deviceTier(): Tier {
  if (typeof navigator === "undefined") return "medium";

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };

  const connection = nav.connection;
  if (connection?.saveData) return "low";
  if (connection?.effectiveType && /^(slow-)?2g$/.test(connection.effectiveType)) {
    return "low";
  }

  const coarse =
    typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
  const memory = nav.deviceMemory ?? (coarse ? 4 : 8);
  const cores = navigator.hardwareConcurrency ?? (coarse ? 4 : 8);

  if (memory <= 2 || cores <= 2) return "low";
  if (memory <= 4 || cores <= 4 || coarse) return "medium";
  return "high";
}

export function startScrollFrameSequence({
  wrapper,
  canvas,
  dir,
  smallDir,
  ext = "jpg",
  count,
  tailHold = 0,
  onProgress,
  maxFrames,
}: ScrollFrameSequenceOptions) {
  // Opaque: the frame covers the whole box, so there is nothing behind it
  // worth blending each pixel against.
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return () => {};

  const tier = deviceTier();
  const parallel = PARALLEL[tier];

  /* Which cut of the sequence this display can actually show. The canvas is
     never given more pixels than the box it fills, capped at MAX_PIXEL_RATIO
     — so on a phone the full-size frames would be downloaded only to be
     thrown away in the downscale. Decided once, up front, because it picks
     the URL every frame is then fetched from. */
  const boxWidth = canvas.parentElement?.clientWidth ?? window.innerWidth;
  const wantedWidth =
    boxWidth * Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
  const activeDir =
    smallDir && wantedWidth <= SMALL_CUT_MAX_WIDTH ? smallDir : dir;

  const resident = RESIDENT[tier];

  /* Rewritten from the real frame dimensions once the first one lands. */
  let decodeAhead = DECODE_AHEAD_FALLBACK;
  let decodeBehind = DECODE_BEHIND_FALLBACK;

  // A hold of the entire section would leave nothing to scrub through.
  const hold = Math.min(Math.max(tailHold, 0), 0.9);

  /* Which of the source frames this device actually scrubs. The last one is
     always in, so the clip ends on the image it was cut to end on. */
  const budget = Math.max(2, Math.floor(maxFrames?.[tier] ?? DEFAULT_MAX_FRAMES[tier]));
  const stride = Math.max(1, Math.ceil(count / budget));
  const total = Math.max(2, Math.min(count, Math.floor((count - 1) / stride) + 1));
  const lastIndex = total - 1;
  const sourceOf = (index: number) => (index >= lastIndex ? count - 1 : index * stride);

  /* Parallel arrays rather than objects: this is walked on every scheduling
     pass, and 400 small objects is 400 pointer chases. */
  const status = new Uint8Array(total);
  const attempts = new Uint8Array(total);
  const pass = new Uint8Array(total);
  const decodeAsked = new Uint8Array(total);
  const images: (HTMLImageElement | undefined)[] = new Array(total);

  /* Load order, coarse to fine: the two ends, then every 64th frame, then
     every 32nd, down to every one. */
  const UNASSIGNED = 255;
  pass.fill(UNASSIGNED);
  pass[0] = 0;
  pass[lastIndex] = 0;
  let passNumber = 0;
  for (let step = 64; step >= 1; step >>= 1) {
    for (let i = 0; i < total; i += step) {
      if (pass[i] === UNASSIGNED) pass[i] = passNumber;
    }
    passNumber += 1;
  }
  for (let i = 0; i < total; i++) if (pass[i] === UNASSIGNED) pass[i] = passNumber;

  const isSkeleton = (index: number) => pass[index] <= SKELETON_PASS;

  let skeletonCount = 0;
  for (let i = 0; i < total; i++) if (isSkeleton(i)) skeletonCount += 1;

  /* Whatever the skeleton does not occupy is the dense window that travels
     with the playhead, weighted ahead of it because that is where the scroll
     is going. */
  const windowSlots = Math.max(8, resident - skeletonCount);
  const aheadSpan = Math.max(4, Math.round(windowSlots * 0.72));
  const behindSpan = Math.max(2, windowSlots - aheadSpan);

  let currentFrame = 0;
  let playhead = 0;
  let direction = 1;
  let rafId = 0;
  let cancelled = false;
  let running = false;
  let loadStarted = false;
  let lastTime = 0;

  let lastDrawnFrame = -1;
  let needsRedraw = true;

  let inFlight = 0;
  let decoding = 0;
  let liveImages = 0;

  /* Cached in measure(): reading either per frame forces a layout per frame. */
  let scrollableHeight = 0;
  let wrapperTop = 0;

  /* Learned from the first frame that lands, so the canvas is never given
     more pixels than the footage has to fill them with. */
  let sourceWidth = 0;


  const windowStart = () => playhead - (direction >= 0 ? behindSpan : aheadSpan);
  const windowEnd = () => playhead + (direction >= 0 ? aheadSpan : behindSpan);

  /* ---------------- drawing ---------------- */

  const drawable = (index: number) => {
    const img = images[index];
    return img && img.complete && img.naturalWidth > 0 ? img : undefined;
  };

  /* While the sequence is still filling in, fall back to the closest frame
     that has arrived so the canvas never blanks out mid-scrub. Bounded: with
     a skeleton down, a hit is never far, and an unbounded scan of the whole
     sequence is not something the loop can repeat every frame. */
  const nearestDrawable = (index: number) => {
    const reach = Math.min(total, Math.max(96, aheadSpan * 2));
    for (let offset = 1; offset <= reach; offset++) {
      const before = index - offset;
      if (before >= 0) {
        const img = drawable(before);
        if (img) return img;
      }
      const after = index + offset;
      if (after < total) {
        const img = drawable(after);
        if (img) return img;
      }
    }
    return undefined;
  };

  const drawFrame = (index: number) => {
    if (!needsRedraw && index === lastDrawnFrame) return;

    const img = drawable(index) ?? nearestDrawable(index);
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

    lastDrawnFrame = index;
    needsRedraw = false;
  };

  /* ---------------- geometry ---------------- */

  const measure = () => {
    const box = canvas.parentElement;
    const width = box?.clientWidth ?? window.innerWidth;
    const height = box?.clientHeight ?? window.innerHeight;

    // Match the display, but never ask for more pixels than the footage has.
    const cap = sourceWidth > 0 ? Math.max(1, sourceWidth / Math.max(width, 1)) : 2;
    const scale = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO, cap);

    const nextWidth = Math.max(1, Math.round(width * scale));
    const nextHeight = Math.max(1, Math.round(height * scale));

    // Assigning either clears the backing store, so only do it on a change.
    if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
      canvas.width = nextWidth;
      canvas.height = nextHeight;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      needsRedraw = true;
    }

    scrollableHeight = wrapper.offsetHeight - window.innerHeight;
    wrapperTop = wrapper.getBoundingClientRect().top + window.scrollY;
  };

  /* Progress through the clip. The tail is the slice of the scroll after the
     last frame, where progress stays pinned at 1 — without it the sequence
     lands on its final frame at the exact pixel the section unpins, so the
     end of the clip is never actually seen. */
  const clipProgress = () => {
    if (scrollableHeight <= 0) return 0;
    const scrolled = window.scrollY - wrapperTop;
    return clamp01(clamp01(scrolled / scrollableHeight) / (1 - hold));
  };

  /* ---------------- loading ---------------- */

  const release = (index: number) => {
    const img = images[index];
    if (!img) return;

    img.onload = null;
    img.onerror = null;
    // Aborts a request still in flight and lets the decoded bitmap go. The
    // bytes stay in the HTTP cache, so coming back costs a decode, not a
    // round trip. removeAttribute rather than src="", which some browsers
    // read as a request for the page's own URL.
    img.removeAttribute("src");

    images[index] = undefined;
    decodeAsked[index] = 0;
    liveImages -= 1;
    if (status[index] === LOADING) inFlight -= 1;
    status[index] = IDLE;
    if (lastDrawnFrame === index) needsRedraw = true;
  };

  /* Drops the frames furthest from the playhead until the sequence is back
     inside its budget. The skeleton and the travelling window are off
     limits — between them they are sized to fit, so there is always
     something else to give up. */
  const evict = () => {
    const protectedFrom = windowStart() - EVICT_MARGIN;
    const protectedTo = windowEnd() + EVICT_MARGIN;

    while (liveImages > resident) {
      let worst = -1;
      let worstDistance = -1;

      for (let i = 0; i < total; i++) {
        if (!images[i] || status[i] === LOADING || isSkeleton(i)) continue;
        if (i >= protectedFrom && i <= protectedTo) continue;

        const distance = Math.abs(i - playhead);
        if (distance > worstDistance) {
          worstDistance = distance;
          worst = i;
        }
      }

      if (worst < 0) return;
      release(worst);
    }
  };

  const startLoad = (index: number) => {
    const img = new window.Image();
    img.decoding = "async";
    images[index] = img;
    status[index] = LOADING;
    liveImages += 1;
    inFlight += 1;

    const settled = (ok: boolean) => {
      // Released mid-flight: release() has already done the accounting.
      if (cancelled || images[index] !== img) return;

      inFlight -= 1;
      status[index] = READY;

      if (ok) {
        if (sourceWidth === 0 && img.naturalWidth > 0) {
          sourceWidth = img.naturalWidth;

          /* Now the real frame size is known, spend the decode budget in
             bytes rather than guessing at a frame count. */
          const frameMb = (img.naturalWidth * img.naturalHeight * 4) / 1048576;
          const affordable = Math.max(4, Math.floor(DECODE_BUDGET_MB[tier] / frameMb));
          decodeAhead = Math.max(3, Math.round(affordable * DECODE_AHEAD_SHARE));
          decodeBehind = Math.max(2, affordable - decodeAhead);

          // First frame in: re-measure now the footage's size is known.
          measure();
        }
        // Only the frame on screen right now is worth a repaint.
        if (Math.abs(index - playhead) <= 1) needsRedraw = true;
      } else {
        attempts[index] += 1;
        release(index);
        // Back to IDLE unless it has failed too often, so a dropped
        // connection costs a retry rather than the frame.
        if (attempts[index] >= MAX_ATTEMPTS) status[index] = FAILED;
      }

      pump();
    };

    img.onload = () => settled(true);
    img.onerror = () => settled(false);
    img.src = frameSrc(activeDir, sourceOf(index), ext);
  };

  /* Worth requesting next, in this order: the coarsest pass, so the clip is
     scrubbable end to end; then the travelling window, nearest the playhead
     first; then the rest of the skeleton. Everything else waits for the
     window to reach it. */
  const nextToLoad = () => {
    const from = windowStart();
    const to = windowEnd();

    let best = -1;
    let bestScore = Infinity;

    for (let i = 0; i < total; i++) {
      if (status[i] !== IDLE) continue;

      let score: number;
      if (pass[i] <= BOOTSTRAP_PASS) {
        score = pass[i] * 4096 + Math.abs(i - playhead);
      } else if (i >= from && i <= to) {
        score = 1e6 + Math.abs(i - playhead);
      } else if (isSkeleton(i)) {
        score = 2e6 + pass[i] * 4096 + Math.abs(i - playhead);
      } else {
        continue;
      }

      if (score < bestScore) {
        bestScore = score;
        best = i;
      }
    }

    return best;
  };

  function pump() {
    if (cancelled || !loadStarted) return;
    while (inFlight < parallel) {
      const index = nextToLoad();
      if (index < 0) return;
      startLoad(index);
    }
  }

  /* Decoding is what makes the scrub smooth: an image drawn before it is
     decoded decodes synchronously, on the frame it first appears in. So the
     window either side of the playhead is decoded up front, weighted the way
     the scroll is travelling. */
  const decodeWindow = () => {
    const from = playhead - (direction >= 0 ? decodeBehind : decodeAhead);
    const to = playhead + (direction >= 0 ? decodeAhead : decodeBehind);

    for (let i = from; i <= to && decoding < MAX_DECODES; i++) {
      if (i < 0 || i >= total) continue;
      if (status[i] !== READY || decodeAsked[i]) continue;

      const img = images[i];
      if (!img) continue;

      decodeAsked[i] = 1;

      if (typeof img.decode !== "function") continue;

      decoding += 1;
      const done = () => {
        decoding -= 1;
      };
      img.decode().then(done, done);
    }
  };

  const beginLoading = () => {
    if (loadStarted) return;
    loadStarted = true;
    pump();
  };

  /* ---------------- loop ---------------- */

  let lastScheduled = 0;
  let lastScheduledFrame = -1;

  const tick = (time: number) => {
    if (cancelled || !running) return;
    rafId = requestAnimationFrame(tick);

    const delta = lastTime === 0 ? 1 / 60 : Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;

    const progress = clipProgress();
    const target = progress * lastIndex;

    // Eased against elapsed time, so the settle feels the same whatever the
    // display refreshes at.
    const previous = currentFrame;
    currentFrame += (target - currentFrame) * (1 - Math.exp(-delta / SCRUB_SETTLE));
    if (Math.abs(target - currentFrame) < 0.25) currentFrame = target;
    if (currentFrame !== previous) direction = currentFrame > previous ? 1 : -1;

    playhead = Math.round(currentFrame);

    drawFrame(playhead);
    onProgress?.(progress);

    if (playhead !== lastScheduledFrame || time - lastScheduled > SCHEDULE_INTERVAL_MS) {
      lastScheduledFrame = playhead;
      lastScheduled = time;
      evict();
      pump();
      decodeWindow();
    }
  };

  const start = () => {
    if (running || cancelled) return;
    running = true;
    lastTime = 0;
    rafId = requestAnimationFrame(tick);
  };

  /* Scrolled past the band, the loop has nothing to say — and every frame it
     keeps taking is a frame the sections below it do not get. */
  const stop = () => {
    running = false;
    cancelAnimationFrame(rafId);
  };

  /* ---------------- wiring ---------------- */

  let measureScheduled = false;
  const remeasure = () => {
    if (measureScheduled || cancelled) return;
    measureScheduled = true;
    requestAnimationFrame(() => {
      measureScheduled = false;
      if (cancelled) return;
      measure();
      drawFrame(playhead);
      onProgress?.(clipProgress());
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

  // The wrapper is sized in vh, so its height moves with the viewport — and
  // on mobile the viewport moves whenever the URL bar does.
  const resizeObserver = new ResizeObserver(remeasure);

  measure();
  preloadObserver.observe(wrapper);
  runObserver.observe(wrapper);
  resizeObserver.observe(wrapper);
  window.addEventListener("resize", remeasure, { passive: true });
  window.addEventListener("orientationchange", remeasure, { passive: true });

  return () => {
    cancelled = true;
    stop();
    preloadObserver.disconnect();
    runObserver.disconnect();
    resizeObserver.disconnect();
    window.removeEventListener("resize", remeasure);
    window.removeEventListener("orientationchange", remeasure);
    for (let i = 0; i < total; i++) release(i);
  };
}

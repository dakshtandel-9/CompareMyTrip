"use client";

import { useEffect, useRef } from "react";
import ContentImage from "../_components/ContentImage";
import HeroSearch from "../_components/HeroSearch";
import { frameSequenceDir } from "@/lib/frameSequenceSource";
import { useSiteContent } from "@/lib/useSiteContent";

// One continuous clip — finalHeroVideo.mp4 exported to a 30fps frame
// sequence — scrubbed end to end by scroll. The frames are served from R2
// rather than /public; see frameSequenceSource.
const SEQUENCES = [{ dir: frameSequenceDir("hero-frames"), count: 1191 }];

const getFrameSrc = (dir: string, index: number) =>
  `${dir}/frame_${String(index + 1).padStart(4, "0")}.jpg`;

// Native width of the source frames. The canvas is never given a backing
// store bigger than this: past it we would only be upscaling 1280×720
// source, at four times the fill cost on a 2× display.
const FRAME_WIDTH = 1280;

// How many frame requests are allowed in flight. Firing the whole sequence
// at once starves the decoder exactly while the first scroll is happening.
const MAX_PARALLEL_LOADS = 8;

// Seconds for the scrub to settle onto the scroll position. Applied against
// real elapsed time, so 60Hz and 120Hz displays ease identically.
const SCRUB_SETTLE = 0.1;

// Blocks of copy in the site's voice, and the social-proof row under them,
// are both edited in /admin/homepage — DEFAULT_SITE_CONTENT in
// src/lib/siteContent.ts holds what ships. The scroll through the sequence is
// split into equal windows, one per block, so they hand over as you scrub:
// the flight out, the room you booked, the town you came to see, and the trip
// you can hold now and pay for later.

// Fraction of a copy window spent fading between one block and the next.
const COPY_FADE = 0.12;

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

const smoothstep = (t: number) => t * t * (3 - 2 * t);

// Decoded, not merely downloaded: drawing an image the browser has not
// decoded yet blocks the frame it first appears in, which is the frame the
// viewer is scrubbing through.
const isReady = (img: HTMLImageElement | undefined) =>
  !!img && img.complete && img.naturalWidth > 0 && img.dataset.decoded === "1";

export default function ScrollFrameSequence() {
  const { hero } = useSiteContent();
  const heroCopy = hero.copy;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const copyRefs = useRef<(HTMLDivElement | null)[]>([]);

  // The scrub loop downloads 1191 frames; it must not restart because an
  // editor renamed a headline. The copy reaches it through a ref instead,
  // written after commit — and the same effect marks the blocks dirty, since
  // a re-render hands the loop fresh DOM nodes with their inline styles gone.
  const heroCopyRef = useRef(heroCopy);
  const copyDirtyRef = useRef(true);

  useEffect(() => {
    heroCopyRef.current = heroCopy;
    copyDirtyRef.current = true;
  }, [heroCopy]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    // Opaque: every frame covers the whole box, so blending each pixel
    // against a transparent backdrop is work that is never used.
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const images: HTMLImageElement[][] = SEQUENCES.map(
      (sequence) => new Array(sequence.count),
    );
    const loadStarted = SEQUENCES.map(() => false);
    const settledCount = SEQUENCES.map(() => 0);

    // The sequence is a single continuous clip; index 0 is the only one.
    const activeSequence = 0;
    let currentFrame = 0;
    let rafId = 0;
    let cancelled = false;
    let running = false;
    let lastTime = 0;

    // Nothing is redrawn unless the frame, the canvas size, or the arrival of
    // the exact image being shown actually changed something.
    let lastDrawnSequence = -1;
    let lastDrawnFrame = -1;
    let needsRedraw = true;

    // Cached on resize: reading it per frame forces a layout every frame.
    let scrollableHeight = 0;

    // Last values written to the DOM, so the copy only touches style when it
    // has really moved. Rebuilt whenever the blocks themselves change.
    let lastCopyShown: number[] = [];

    // While a clip is still downloading, fall back to the closest frame that
    // has arrived so the canvas never blanks out mid-scroll.
    const nearestReady = (sequenceIndex: number, frameIndex: number) => {
      const frames = images[sequenceIndex];
      for (let offset = 1; offset < frames.length; offset++) {
        const before = frames[frameIndex - offset];
        if (isReady(before)) return before;
        const after = frames[frameIndex + offset];
        if (isReady(after)) return after;
      }
      return undefined;
    };

    const drawFrame = (sequenceIndex: number, frameIndex: number) => {
      if (
        !needsRedraw &&
        sequenceIndex === lastDrawnSequence &&
        frameIndex === lastDrawnFrame
      ) {
        return;
      }

      const exact = images[sequenceIndex]?.[frameIndex];
      const img = isReady(exact) ? exact : nearestReady(sequenceIndex, frameIndex);
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

      const offsetX = (canvasWidth - drawWidth) / 2;
      const offsetY = (canvasHeight - drawHeight) / 2;

      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

      lastDrawnSequence = sequenceIndex;
      lastDrawnFrame = frameIndex;
      needsRedraw = false;
    };

    // Frames download in order from the top of the sequence, so the opening
    // is usable straight away. Requests go out a few at a time and each frame
    // is decoded before it counts as ready, which keeps the decode work off
    // the scrubbing frames.
    const queue: Array<[number, number]> = [];
    let inFlight = 0;

    const startLoad = ([sequenceIndex, frameIndex]: [number, number]) => {
      const img = new window.Image();
      img.decoding = "async";
      images[sequenceIndex][frameIndex] = img;

      const settled = () => {
        inFlight -= 1;
        settledCount[sequenceIndex] += 1;

        // Only the frame on screen right now is worth a repaint.
        if (
          sequenceIndex === activeSequence &&
          Math.abs(frameIndex - Math.round(currentFrame)) <= 1
        ) {
          needsRedraw = true;
        }

        if (settledCount[sequenceIndex] === SEQUENCES[sequenceIndex].count) {
          enqueueSequence(sequenceIndex + 1, false);
        }

        pump();
      };

      const decoded = () => {
        img.dataset.decoded = "1";
        settled();
      };

      img.onload = () => {
        if (typeof img.decode === "function") img.decode().then(decoded, decoded);
        else decoded();
      };
      img.onerror = settled;

      inFlight += 1;
      img.src = getFrameSrc(SEQUENCES[sequenceIndex].dir, frameIndex);
    };

    const pump = () => {
      while (inFlight < MAX_PARALLEL_LOADS && queue.length > 0) {
        startLoad(queue.shift()!);
      }
    };

    function enqueueSequence(index: number, priority: boolean) {
      const sequence = SEQUENCES[index];
      if (!sequence || loadStarted[index]) return;
      loadStarted[index] = true;

      const entries: Array<[number, number]> = [];
      for (let i = 0; i < sequence.count; i++) entries.push([index, i]);

      if (priority) queue.unshift(...entries);
      else queue.push(...entries);

      pump();
    }

    // Progress is split into one equal window per copy block. Blocks cross
    // over at each window boundary: the outgoing one is fully gone before the
    // incoming one arrives, so the two never overlap mid-fade.
    const drawCopy = (copyProgress: number) => {
      const count = heroCopyRef.current.length;
      const lastIndex = count - 1;

      if (copyDirtyRef.current || lastCopyShown.length !== count) {
        lastCopyShown = new Array(count).fill(-1);
        copyDirtyRef.current = false;
      }

      copyRefs.current.slice(0, count).forEach((block, index) => {
        if (!block) return;

        const local = copyProgress - index;
        const fadeIn = index === 0 ? 1 : smoothstep(clamp01(local / COPY_FADE));
        const fadeOut =
          index === lastIndex
            ? 1
            : smoothstep(clamp01((1 - local) / COPY_FADE));
        const shown = Math.min(fadeIn, fadeOut);

        if (Math.abs(shown - lastCopyShown[index]) < 0.002) return;
        lastCopyShown[index] = shown;

        block.style.opacity = String(shown);
        block.style.transform = `translate3d(0, ${
          (local > 0.5 ? -1 : 1) * (1 - shown) * 14
        }px, 0)`;
      });
    };

    // Scroll progress through the sequence, 0 at the top of the hero to 1 at
    // the point it unpins.
    const getScaledProgress = () => {
      if (scrollableHeight <= 0) return 0;
      const rect = wrapper.getBoundingClientRect();
      return clamp01(-rect.top / scrollableHeight) * SEQUENCES.length;
    };

    const resize = () => {
      const box = canvas.parentElement;
      const width = box?.clientWidth ?? window.innerWidth;
      const height = box?.clientHeight ?? window.innerHeight;

      // Match the display, but never ask for more pixels than the source has.
      const scale = Math.min(
        window.devicePixelRatio || 1,
        Math.max(1, FRAME_WIDTH / Math.max(width, 1)),
      );

      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      canvas.style.width = "100%";
      canvas.style.height = "100%";

      scrollableHeight = wrapper.offsetHeight - window.innerHeight;

      // Resizing the backing store clears it.
      needsRedraw = true;
      const scaled = getScaledProgress();
      drawFrame(activeSequence, Math.round(currentFrame));
      drawCopy(scaled * heroCopyRef.current.length);
    };

    // Driven every animation frame off live scroll position, rather than
    // only on "scroll" events — avoids the tracker ever getting stuck if a
    // scroll event is missed (e.g. effect re-mount, tab throttling).
    const tick = (time: number) => {
      if (cancelled || !running) return;

      const delta = lastTime === 0 ? 1 / 60 : Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const scaled = getScaledProgress();
      const target = clamp01(scaled) * (SEQUENCES[activeSequence].count - 1);

      // Eased against elapsed time, so the settle feels the same whatever the
      // display is running at.
      currentFrame += (target - currentFrame) * (1 - Math.exp(-delta / SCRUB_SETTLE));
      if (Math.abs(target - currentFrame) < 0.25) {
        currentFrame = target;
      }

      drawFrame(activeSequence, Math.round(currentFrame));
      drawCopy(scaled * heroCopyRef.current.length);
      rafId = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running || cancelled) return;
      running = true;
      lastTime = 0;
      needsRedraw = true;
      rafId = requestAnimationFrame(tick);
    };

    // Scrolled past the hero, the loop has nothing to say — and every frame
    // it keeps taking is a frame the sections below do not get.
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

    const observer = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { rootMargin: "300px 0px" },
    );

    resize();
    enqueueSequence(0, false);
    observer.observe(wrapper);

    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  /* After the frame-loading effect, never before — an early bail would
     change the hook order between an enabled and a disabled hero. */
  if (!hero.enabled) return null;

  return (
    // Tall on purpose: ~9 viewports of scroll drive the sequence, roughly
    // double the earlier hero, so each frame lingers and the scrub reads as
    // long and smooth rather than a quick flick.
    <div ref={wrapperRef} className="relative h-[1000vh] bg-white">
      <div className="sticky top-0 flex h-screen w-full items-center justify-center p-3 sm:p-4 md:p-6">
        <div className="relative h-full w-full overflow-hidden rounded-2xl bg-cmt-secondary-900 sm:rounded-3xl">
          <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />

          {/* Weighted to the bottom so the glass search panel keeps its
              contrast over the brightest frames of the sequence. */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-black/10 to-black/70" />

          {/* The sticky site header takes 64px of flow above this box, so at
              rest its last 64px sit under the fold — the symmetric vertical
              padding keeps the search panel and picks clear of both edges. */}
          <div className="relative z-10 flex h-full flex-col px-4 py-[72px] sm:px-6 lg:px-10 [@media(max-height:820px)]:py-14">
            <div className="flex min-h-0 flex-1 flex-col justify-center">
              {/* Every block shares one grid cell, so the cell is as tall as
                  the longest of them and the search panel below never shifts
                  as the copy swaps. */}
              <div className="grid w-full max-w-[640px]">
                {heroCopy.map((copy, index) => {
                  const Heading = index === 0 ? "h1" : "p";
                  return (
                    <div
                      key={copy.id}
                      ref={(el) => {
                        copyRefs.current[index] = el;
                      }}
                      /* The scrub loop owns these styles from the first
                         animation frame on; this is only what they look like
                         before it gets there, and after a content edit
                         remounts them. */
                      style={{ opacity: index === 0 ? 1 : 0 }}
                      className="col-start-1 row-start-1 flex flex-col items-start text-left will-change-transform"
                    >
                      <Heading className="font-display text-3xl font-semibold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-[56px]">
                        {copy.titleLine1}
                        {copy.titleLine2 && (
                          <>
                            <br />
                            {copy.titleLine2}
                          </>
                        )}
                      </Heading>

                      <p className="mt-4 max-w-xl font-body text-sm font-normal leading-relaxed text-white/85 sm:mt-5 sm:text-base md:text-lg">
                        {copy.body}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Static under the rotating copy — it's true of every clip. */}
              {hero.trust.enabled && (
                <div className="mt-5 flex items-center gap-3 sm:mt-6">
                  <div className="flex -space-x-2">
                    {hero.trust.faces.map((face, index) => (
                      <span
                        key={index}
                        className="relative size-8 overflow-hidden rounded-cmt-full bg-white/10 ring-2 ring-white/70"
                      >
                        <ContentImage src={face} alt="" fill sizes="32px" className="object-cover" />
                      </span>
                    ))}
                  </div>
                  <p className="font-body text-sm text-white/80">
                    {hero.trust.prefix}{" "}
                    <span className="font-semibold text-cmt-primary-500">
                      {hero.trust.highlight}
                    </span>{" "}
                    {hero.trust.suffix}
                  </p>
                </div>
              )}
            </div>

            {/* Deliberately outside the clip-change fade: the search stays put
                and stays usable while the background hands over. */}
            <div className="w-full">
              <HeroSearch />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

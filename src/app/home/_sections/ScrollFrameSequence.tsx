"use client";

import { useEffect, useRef } from "react";
import ContentImage from "../_components/ContentImage";
import HeroSearch from "../_components/HeroSearch";
import { frameSequenceDir } from "@/lib/frameSequenceSource";
import { startScrollFrameSequence } from "@/lib/scrollFrameSequence";
import { useSiteContent } from "@/lib/useSiteContent";

// One continuous clip — final_video.mp4 exported to a 24fps frame sequence —
// scrubbed end to end by scroll. The frames are served from R2 rather than
// /public; see frameSequenceSource.
//
// Two cuts of the same 362 frames are published: 1920x1080 (~54KB a frame)
// and 960x540 (~23KB). The controller picks between them from how many
// pixels the canvas is actually going to be given, so a phone is never made
// to download a picture it has no way of showing.
//
// 1920 rather than anything larger because the canvas is capped at 2x DPR:
// on a retina laptop it lands on 1920 exactly and draws these 1:1. A 2560
// cut measured 65% heavier for pixels that never survive the downscale.
// Encoded at WebP q64 with -sharp_yuv, which came in a quarter smaller than
// q78 with no difference visible at 1:1.
const FRAME_COUNT = 362;
const FRAMES_DIR = frameSequenceDir("hero-frames-v3");
const FRAMES_DIR_SMALL = frameSequenceDir("hero-frames-v3-sm");

// How many of the 362 are actually fetched. Not all of them, and the reason
// is latency rather than bytes: the frames come from R2's public
// pub-*.r2.dev endpoint, which speaks only http/1.1 — so a browser keeps six
// requests to it in the air and queues the rest — and is not CDN-cached,
// ~790ms to first byte against ~170ms for cloudflare.com. Frames therefore
// arrive at roughly a dozen a second whatever we do, and the sequence is
// filling in while it is being scrolled through. Asking for fewer is what
// makes the ones you are actually looking at show up in time.
//
// Put a custom domain in front of the bucket and this stops being true:
// http/2 multiplexing and a real cache edge, at which point high can go back
// to the full 362 for the smoothest scrub the footage can give.
const MAX_FRAMES = { high: 240, medium: 160, low: 100 };


// The slice of the hero's scroll that comes after the clip's last frame,
// holding it on screen before the section unpins. Without it the sequence
// finishes at the exact pixel the hero lets go, so its ending is never
// actually seen: the second section arrives over the top of it.
const TAIL_HOLD = 0.13;

// Blocks of copy in the site's voice, and the social-proof row under them,
// are both edited in /admin/content — DEFAULT_SITE_CONTENT in
// src/lib/siteContent.ts holds what ships. The scroll through the sequence is
// split into equal windows, one per block, so they hand over as you scrub:
// the flight out, the room you booked, the town you came to see, and the trip
// you can hold now and pay for later.

// Fraction of a copy window spent fading between one block and the next.
const COPY_FADE = 0.12;

const clamp01 = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value);


const smoothstep = (t: number) => t * t * (3 - 2 * t);

export default function ScrollFrameSequence() {
  const { hero } = useSiteContent();
  const heroCopy = hero.copy;


  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const copyRefs = useRef<(HTMLDivElement | null)[]>([]);

  // The scrub loop owns the frame sequence; it must not be torn down and
  // rebuilt because an editor renamed a headline. The copy reaches it through
  // a ref instead, written after commit — and the same effect marks the
  // blocks dirty, since a re-render hands the loop fresh DOM nodes with their
  // inline styles gone.
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

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Last values written to the DOM, so the copy only touches style when it
    // has really moved. Rebuilt whenever the blocks themselves change.
    let lastShown: number[] = [];

    // Progress is split into one equal window per copy block. Blocks cross
    // over at each window boundary: the outgoing one is fully gone before the
    // incoming one arrives, so the two never overlap mid-fade.
    const drawCopy = (progress: number) => {
      const blocks = heroCopyRef.current;
      const count = blocks.length;
      if (count === 0) return;

      const lastBlock = count - 1;
      const copyProgress = progress * count;

      if (copyDirtyRef.current || lastShown.length !== count) {
        lastShown = new Array(count).fill(-1);
        copyDirtyRef.current = false;
      }

      for (let index = 0; index < count; index++) {
        const block = copyRefs.current[index];
        if (!block) continue;

        const local = copyProgress - index;
        const fadeIn = index === 0 ? 1 : smoothstep(clamp01(local / COPY_FADE));
        const fadeOut =
          index === lastBlock ? 1 : smoothstep(clamp01((1 - local) / COPY_FADE));
        const shown = Math.min(fadeIn, fadeOut);

        if (Math.abs(shown - lastShown[index]) < 0.002) continue;
        lastShown[index] = shown;

        block.style.opacity = String(shown);
        block.style.transform = `translate3d(0, ${
          (local > 0.5 ? -1 : 1) * (1 - shown) * 14
        }px, 0)`;
      }
    };

    return startScrollFrameSequence({
      wrapper,
      canvas,
      dir: FRAMES_DIR,
      smallDir: FRAMES_DIR_SMALL,
      ext: "webp",
      count: FRAME_COUNT,
      tailHold: TAIL_HOLD,
      maxFrames: MAX_FRAMES,
      onProgress: drawCopy,
    });
  }, []);

  /* After the frame-loading effect, never before — an early bail would
     change the hook order between an enabled and a disabled hero. */
  if (!hero.enabled) return null;

  return (
    // Tall on purpose, but no taller than the scrub needs: ~5 viewports drive
    // the sequence and the last of them holds its closing frame. The clip is
    // shorter than the one this replaced, but it is also no longer strided
    // down on a laptop, so the scroll per drawn frame is about what it was.
    <div ref={wrapperRef} className="relative h-[600vh] bg-white">
      <div className="sticky top-0 flex h-screen w-full items-center justify-center p-3 sm:p-4 md:p-6">
        <div className="relative h-full w-full overflow-hidden rounded-2xl bg-cmt-secondary-900 sm:rounded-3xl">
          <ContentImage
            src="/images/destinations-header-banner.jpg"
            alt=""
            fill
            fetchPriority="high"
            sizes="100vw"
            className="object-cover"
          />
          <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full" />

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

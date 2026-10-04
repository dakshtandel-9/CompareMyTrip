"use client";

import { shouldLoadVideo } from "@/lib/videoSource";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import ContentImage from "../_components/ContentImage";
import HeroSearch from "../_components/HeroSearch";
import { startScrollVideo } from "@/lib/scrollVideo";
import { onSiteReady } from "@/lib/siteReady";
import { useSiteContent } from "@/lib/useSiteContent";

// Versioned, fast-start encodes with a keyframe every two frames. Phones
// download the smaller rendition; both retain the full original sequence.
const DESKTOP_VIDEO_SRC = "/videos/hero-scroll-desktop-v3.mp4";
const MOBILE_VIDEO_SRC = "/videos/hero-scroll-mobile-v4.mp4";
const POSTER_SRC = "/videos/hero-combined-poster.jpg";

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

const PHONE_QUERY = "(max-width: 767px)";
const subscribePhone = (notify: () => void) => {
  const query = window.matchMedia(PHONE_QUERY);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
const isPhone = () => window.matchMedia(PHONE_QUERY).matches;
const serverPhone = () => false;

export default function ScrollFrameSequence() {
  const phoneLayout = useSyncExternalStore(subscribePhone, isPhone, serverPhone);
  const [phonePicksTarget, setPhonePicksTarget] = useState<HTMLDivElement | null>(null);
  const { hero } = useSiteContent();
  const heroCopy = hero.copy;


  const wrapperRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const copyRefs = useRef<(HTMLDivElement | null)[]>([]);

  // The scrub controller owns the video; it must not be torn down and
  // rebuilt because an editor renamed a headline. The copy reaches it through
  // a ref instead, written after commit — and the same effect marks the
  // blocks dirty, since a re-render hands the loop fresh DOM nodes with their
  // inline styles gone.
  const heroCopyRef = useRef(heroCopy);
  const copyDirtyRef = useRef(true);
  const refreshCopyRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    heroCopyRef.current = heroCopy;
    copyDirtyRef.current = true;
    refreshCopyRef.current?.();
  }, [heroCopy]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const video = videoRef.current;
    const stage = stageRef.current;
    if (!wrapper || !video || !stage) return;

    const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
    const phone = window.matchMedia(PHONE_QUERY);
    const reducedData = window.matchMedia("(prefers-reduced-data: reduce)");
    const connection = (navigator as Navigator & { connection?: EventTarget }).connection;
    // Last values written to the DOM, so the copy only touches style when it
    // has really moved. Rebuilt whenever the blocks themselves change.
    let lastShown: number[] = [];
    let lastProgress = 0;

    // Progress is split into one equal window per copy block. Blocks cross
    // over at each window boundary: the outgoing one is fully gone before the
    // incoming one arrives, so the two never overlap mid-fade.
    const drawCopy = (progress: number) => {
      lastProgress = progress;
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
    refreshCopyRef.current = () => drawCopy(lastProgress);

    let stopSequence: (() => void) | undefined;
    let stopPhoneLayout: (() => void) | undefined;
    let stopDownload: (() => void) | undefined;
    let openingInset = 0;
    let activeLayout: string | undefined;
    const syncLayout = () => {
      // Try the video on estimated 3G; the controller handles actual stalls.
      const enabled = shouldLoadVideo({ allowMobile: true, allow3g: true });
      const nextLayout = `${enabled}:${phone.matches}`;
      // Network estimates can change frequently without changing the policy.
      // Preserve the decoded video unless its rendition or eligibility changes.
      if (activeLayout === nextLayout) return;
      activeLayout = nextLayout;
      stopSequence?.();
      stopDownload?.();
      stopPhoneLayout?.();
      stopSequence = undefined;
      stopDownload = undefined;
      stopPhoneLayout = undefined;
      openingInset = 0;
      copyDirtyRef.current = true;
      wrapper.classList.toggle("cmt-hero-static", !enabled);
      {
        let start = 0;
        let frame = 0;
        const fit = () => {
          frame = 0;
          // Only the opening view includes the header in document flow.
          // Expand to the full pinned height as that space scrolls away.
          const inset = Math.max(0, start - window.scrollY);
          if (inset === openingInset && wrapper.style.getPropertyValue("--cmt-phone-opening-inset")) return;
          openingInset = inset;
          wrapper.style.setProperty("--cmt-phone-opening-inset", `${inset}px`);
        };
        const scheduleFit = () => {
          if (!frame) frame = requestAnimationFrame(fit);
        };
        const measure = () => {
          cancelAnimationFrame(frame);
          start = wrapper.getBoundingClientRect().top + window.scrollY;
          fit();
        };
        measure();
        window.addEventListener("scroll", scheduleFit, { passive: true });
        window.addEventListener("resize", measure);
        const header = document.querySelector(".cmt-header");
        const observer = new ResizeObserver(measure);
        if (header) observer.observe(header);
        stopPhoneLayout = () => {
          cancelAnimationFrame(frame);
          window.removeEventListener("scroll", scheduleFit);
          window.removeEventListener("resize", measure);
          observer.disconnect();
          wrapper.style.removeProperty("--cmt-phone-opening-inset");
        };
      }
      if (!enabled) { drawCopy(0); return; }

      const networkSrc = phone.matches ? MOBILE_VIDEO_SRC : DESKTOP_VIDEO_SRC;
      const start = (src: string) => {
        stopSequence = startScrollVideo({
          wrapper,
          video,
          src,
          tailHold: TAIL_HOLD,
          scrubDuration: phone.matches ? 0.18 : 0.1,
          // Both layouts follow the decoded frame, including reverse scrolling.
          onFrame: drawCopy,
          onError: () => {
            wrapper.classList.add("cmt-hero-static");
            drawCopy(0);
          },
          // Keep the video timeline independent of the opening resize.
          scrollDistance: () => wrapper.offsetHeight - stage.offsetHeight - openingInset,
        });
      };

      // Download the whole clip at full network speed, then scrub it from
      // memory. Left to itself, a paused video only buffers at about playback
      // speed, so scrolling ahead of that stalls on range requests. The file
      // is immutable, so a repeat visit reads it straight from the HTTP cache.
      // If the download fails, stream it the ordinary way instead. It waits
      // for the page itself to finish loading, so the clip never shares the
      // connection with the poster, fonts and scripts of the first paint; the
      // poster stands in until then.
      const download = new AbortController();
      let objectUrl: string | undefined;
      const stopWaiting = onSiteReady(() => {
        fetch(networkSrc, { signal: download.signal })
          .then((response) => {
            if (!response.ok) throw new Error(`Hero video request failed: ${response.status}`);
            return response.blob();
          })
          .then((blob) => {
            if (download.signal.aborted) return;
            objectUrl = URL.createObjectURL(blob);
            start(objectUrl);
          })
          .catch(() => {
            if (!download.signal.aborted) start(networkSrc);
          });
      });
      stopDownload = () => {
        stopWaiting();
        download.abort();
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        objectUrl = undefined;
      };
    };
    syncLayout();
    const queries = [motion, phone, reducedData];
    queries.forEach(query => query.addEventListener("change", syncLayout));
    connection?.addEventListener("change", syncLayout);
    return () => {
      refreshCopyRef.current = undefined;
      stopSequence?.();
      stopDownload?.();
      stopPhoneLayout?.();
      queries.forEach(query => query.removeEventListener("change", syncLayout));
      connection?.removeEventListener("change", syncLayout);
    };
  }, [hero.enabled]);

  /* After the video effect, never before — an early bail would
     change the hook order between an enabled and a disabled hero. */
  if (!hero.enabled) return null;

  return (
    <>
    <div ref={wrapperRef} className="cmt-hero relative h-[450vh] bg-white">
      <div ref={stageRef} className="cmt-hero-stage sticky top-0 flex h-screen w-full items-center justify-center p-3 sm:p-4 md:p-6">
        <div className="cmt-hero-surface relative h-full w-full overflow-hidden rounded-2xl bg-cmt-secondary-900 sm:rounded-3xl">
          <ContentImage
            src={POSTER_SRC}
            alt=""
            fill
            preload
            /* Phones crop this 16:9 still to a tall card, filling its height,
               so it renders about 16/9 of the viewport height wide. */
            sizes="(max-width: 767px) 180vh, 100vw"
            className="cmt-hero-poster object-cover"
          />
          <video
            ref={videoRef}
            muted
            playsInline
            preload="none"
            /* No poster attribute: the video stays transparent until it has
               a real frame, so the still beneath it shows, and a poster
               would only download the full-size JPEG a second time. */
            aria-hidden="true"
            tabIndex={-1}
            style={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          />

          {/* Weighted to the bottom so the glass search panel keeps its
              contrast over the brightest frames of the sequence. */}
          <div className="cmt-hero-overlay pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-black/10 to-black/70" />

          {/* The desktop stage fills the viewport once pinned. A minimum
              gap keeps booking controls clear of every copy block. */}
          <div className="cmt-hero-content relative z-10 flex h-full flex-col px-4 py-[72px] sm:px-6 lg:px-10 [@media(max-height:820px)]:py-14">
            <div className="cmt-hero-intro flex min-h-0 flex-1 flex-col justify-center">
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
                      className="cmt-hero-copy col-start-1 row-start-1 flex flex-col items-start text-left will-change-transform"
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

              <p className="cmt-hero-scroll-hint hidden" aria-hidden="true"><span /> Scroll to discover your next trip</p>

              {/* Static under the rotating copy — it's true of every clip. */}
              {hero.trust.enabled && hero.trust.verified === true && (
                <div className="cmt-hero-proof mt-5 flex items-center gap-3 sm:mt-6">
                  <div className="flex shrink-0 -space-x-2">
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
            {!phoneLayout && (
              <div className="cmt-hero-desktop-booking w-full">
                <HeroSearch />
              </div>
            )}
          </div>
        </div>
        {phoneLayout && <div ref={setPhonePicksTarget} className="cmt-hero-phone-picks" />}
      </div>
    </div>
    {phoneLayout && (
      <div className="cmt-hero-mobile-booking">
        <HeroSearch picksTarget={phonePicksTarget} />
      </div>
    )}
    </>
  );
}

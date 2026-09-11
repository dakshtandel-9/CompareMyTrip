"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type ScrollVideoOptions = {
  wrapper: HTMLElement;
  video: HTMLVideoElement;
  src: string;
  tailHold?: number;
  onProgress?: (progress: number) => void;
  scrollDistance?: () => number;
};

/** Seek a paused video from scroll progress. Never queue overlapping seeks. */
export function startScrollVideo({ wrapper, video, src, tailHold = 0.13, onProgress, scrollDistance }: ScrollVideoOptions) {
  gsap.registerPlugin(ScrollTrigger);
  const position = { progress: 0 };
  let disposed = false;
  let failed = false;
  const hold = Math.max(0, Math.min(tailHold, 0.9));

  const seek = () => {
    if (disposed || failed || video.seeking || video.readyState < 1 || !Number.isFinite(video.duration) || video.duration <= 0) return;
    // Stay inside the last decodable frame instead of seeking past the clip.
    const end = Math.max(0, video.duration - 1 / 30);
    const target = position.progress * end;
    const tolerance = position.progress === 0 || position.progress === 1 ? 0.001 : 1 / 30;
    if (Math.abs(video.currentTime - target) > tolerance) video.currentTime = target;
  };
  // Mobile Safari treats a video that has never played as having nothing to
  // paint: it holds the poster and ignores currentTime until the element has
  // run at least once. One muted play(), paused again on the next tick, is
  // what gets a frame on screen — after which seeking behaves normally.
  // Desktop needs none of this and is left alone, hence the pointer check.
  let primed = !window.matchMedia("(pointer: coarse)").matches;
  const prime = () => {
    if (primed || disposed || failed) return;
    primed = true;
    const started = video.play();
    if (started && typeof started.then === "function") {
      started.then(() => { video.pause(); seek(); }).catch(() => { primed = false; });
    } else {
      video.pause();
    }
  };
  // If Safari declines the first muted play (for example in low-power mode),
  // the next real tap can unlock decoding instead of leaving a permanent poster.
  if (!primed) wrapper.addEventListener("pointerdown", prime, { passive: true });

  const reveal = () => {
    if (disposed || failed) return;
    prime();
    video.style.opacity = "1";
    seek();
  };
  const hide = () => {
    failed = true;
    video.style.opacity = "0";
  };

  video.pause();
  video.muted = true;
  video.style.opacity = "0";
  video.addEventListener("loadedmetadata", seek);
  video.addEventListener("loadeddata", reveal);
  video.addEventListener("seeked", seek);
  video.addEventListener("error", hide);
  video.preload = "auto";
  video.src = src;
  video.load();

  const tween = gsap.to(position, {
    progress: 1,
    ease: "none",
    onUpdate: () => {
      onProgress?.(position.progress);
      seek();
    },
    scrollTrigger: {
      trigger: wrapper,
      start: "top top",
      end: () => `+=${Math.max(1, (scrollDistance?.() ?? wrapper.offsetHeight - window.innerHeight) * (1 - hold))}`,
      scrub: 0.35,
      invalidateOnRefresh: true,
    },
  });
  // Mobile copy, font loading and the measured search panel can settle after
  // the trigger is created. Refresh its distance when the section changes,
  // otherwise the entire clip can finish on the first swipe.
  const sizeObserver = new ResizeObserver(() => tween.scrollTrigger?.refresh());
  sizeObserver.observe(wrapper);
  // Metadata may arrive after scroll restoration; seek() uses the latest
  // tween position rather than restarting at the opening frame.
  onProgress?.(position.progress);
  seek();

  return () => {
    disposed = true;
    sizeObserver.disconnect();
    wrapper.removeEventListener("pointerdown", prime);
    tween.scrollTrigger?.kill();
    tween.kill();
    video.removeEventListener("loadedmetadata", seek);
    video.removeEventListener("loadeddata", reveal);
    video.removeEventListener("seeked", seek);
    video.removeEventListener("error", hide);
    video.pause();
    video.style.opacity = "0";
    video.removeAttribute("src");
    video.preload = "none";
    video.load();
  };
}

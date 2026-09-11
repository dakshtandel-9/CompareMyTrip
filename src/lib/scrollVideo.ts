"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type ScrollVideoOptions = {
  wrapper: HTMLElement;
  video: HTMLVideoElement;
  src: string;
  tailHold?: number;
  onProgress?: (progress: number) => void;
};

/** Seek a paused video from scroll progress. Never queue overlapping seeks. */
export function startScrollVideo({ wrapper, video, src, tailHold = 0.13, onProgress }: ScrollVideoOptions) {
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
      started.then(() => video.pause()).catch(() => {});
    } else {
      video.pause();
    }
  };

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
      end: () => `+=${Math.max(1, (wrapper.offsetHeight - window.innerHeight) * (1 - hold))}`,
      scrub: 0.35,
      invalidateOnRefresh: true,
    },
  });
  // Metadata may arrive after scroll restoration; seek() uses the latest
  // tween position rather than restarting at the opening frame.
  onProgress?.(position.progress);
  seek();

  return () => {
    disposed = true;
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

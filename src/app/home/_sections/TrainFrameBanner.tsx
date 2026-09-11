"use client";

import { useEffect, useRef, useState } from "react";
import { shouldLoadVideo, videoSource } from "@/lib/videoSource";
import { Sparkles } from "lucide-react";

import { Glyph } from "@/lib/adminIcons";
import { useSiteContent } from "@/lib/useSiteContent";

export default function TrainFrameBanner() {
  const { trainBanner } = useSiteContent();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loadVideo, setLoadVideo] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || loadVideo) return;
    if (!shouldLoadVideo()) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setLoadVideo(true);
        observer.disconnect();
      },
      { rootMargin: "800px 0px" },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [loadVideo, trainBanner.enabled]);

  // The run is one-shot, so hold it back until the banner is actually on
  // screen — buffering starts 800px early, but a visitor who scrolls slowly
  // should still catch the train from the first frame rather than arrive
  // after it has already parked.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !loadVideo) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        video.play().catch(() => {});
      },
      { threshold: 0.25 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [loadVideo]);

  if (!trainBanner.enabled) return null;

  return (
    <section className="flex w-full justify-center bg-white p-3 sm:p-4 md:p-6">
      <div className="relative h-auto min-h-0 w-full max-w-[1440px] overflow-hidden rounded-2xl bg-cmt-secondary-900 sm:h-[58vh] sm:max-h-[500px] sm:min-h-[360px] sm:rounded-3xl">
        {/* No `loop`: the clip runs once and holds on its final frame. */}
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          muted
          playsInline
          preload={loadVideo ? "auto" : "none"}
          poster="/videos/trainvideo1-poster.jpg"
          aria-hidden="true"
          tabIndex={-1}
        >
          {loadVideo ? <source src={videoSource("/videos/train.mp4")} type="video/mp4" /> : null}
        </video>

        {/* The wide layout darkens left-to-right, because the copy sits in
            the left third and the train should stay visible on the right. A
            phone has no left third — the copy runs the full width, and the
            same horizontal ramp leaves its right-hand half sitting on bare
            snow. Below sm the ramp turns vertical and keeps a floor under
            every line of it. */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/70 to-black/90 sm:bg-gradient-to-r sm:from-black/95 sm:via-black/45 sm:to-transparent" />

        <div className="relative flex flex-col justify-center sm:absolute sm:inset-0 px-6 py-8 sm:px-12 sm:py-10 md:px-16">
          <div className="flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-[0.14em] text-cmt-primary-400 sm:text-xs">
            <Sparkles className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
            {trainBanner.eyebrow}
          </div>

          <h2 className="mt-3.5 max-w-4xl font-display text-[26px] font-bold leading-[1.12] tracking-tight text-white [text-shadow:0_4px_24px_rgba(0,0,0,0.45)] sm:mt-4 sm:text-[32px] md:text-[40px] lg:text-[44px]">
            {trainBanner.titleLine1}
            <br />
            <span className="text-cmt-primary-400">{trainBanner.titleHighlight}</span>{" "}
            {trainBanner.titleLine2}
          </h2>

          <p className="mt-4 max-w-md font-body text-sm leading-[1.6] text-white/85 [text-shadow:0_2px_12px_rgba(0,0,0,0.4)] sm:mt-4 sm:text-[15px] md:text-base">
            {trainBanner.description}
          </p>

          <div className="mt-8 grid max-w-3xl grid-cols-2 gap-x-6 gap-y-6 sm:mt-9 sm:grid-cols-4 sm:gap-0">
            {trainBanner.badges.map((badge, index) => (
              <div
                key={badge.id}
                className={`sm:px-5 sm:first:pl-0 sm:last:pr-0 ${
                  index > 0 ? "sm:border-l sm:border-white/15" : ""
                }`}
              >
                <Glyph
                  name={badge.icon}
                  className="h-6 w-6 text-cmt-primary-400 sm:h-7 sm:w-7"
                />
                <h3 className="mt-2 font-display text-sm font-bold leading-snug text-white sm:mt-2.5 sm:text-[15px]">
                  {badge.title}
                </h3>
                <p className="mt-1 font-body text-xs leading-[1.5] text-white/70 sm:mt-1.5 sm:text-[13px]">
                  {badge.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

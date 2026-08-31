"use client";

import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";

import { Glyph } from "@/lib/adminIcons";
import { frameSequenceDir } from "@/lib/frameSequenceSource";
import { startScrollFrameSequence } from "@/lib/scrollFrameSequence";
import { useSiteContent } from "@/lib/useSiteContent";

// Every frame of /media-source/trainBanner.mp4 — the source is 24fps, so this is
// the finest the scrub can get without synthesising frames. Scaled to 1440px,
// the card's own display width, and cropped to drop the baked-in watermark.
// Served from R2, not /public; see frameSequenceSource.
const FRAME_COUNT = 192;
const FRAMES_DIR = frameSequenceDir("train-banner");

export default function TrainFrameBanner() {
  const { trainBanner } = useSiteContent();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    return startScrollFrameSequence({
      wrapper,
      canvas,
      dir: FRAMES_DIR,
      count: FRAME_COUNT,
    });
  }, []);

  /* After the effect, never before — bailing out earlier would change the
     hook order between an enabled and a disabled banner. */
  if (!trainBanner.enabled) return null;

  return (
    <div ref={wrapperRef} className="relative h-[200vh] bg-white">
      <div className="sticky top-0 flex h-screen w-full items-center justify-center p-3 sm:p-4 md:p-6">
        <div className="relative h-auto min-h-[600px] w-full max-w-[1440px] overflow-hidden rounded-2xl bg-cmt-secondary-900 sm:h-[72vh] sm:max-h-[660px] sm:min-h-[480px] sm:rounded-3xl">
          <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />

          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/45 to-transparent" />

          <div className="absolute inset-0 flex flex-col justify-center px-6 py-8 sm:px-12 sm:py-12 md:px-16">
            <div className="flex items-center gap-2 font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-cmt-primary-400 sm:text-xs">
              <Sparkles className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
              {trainBanner.eyebrow}
            </div>

            <h2 className="mt-3.5 max-w-4xl font-display text-[26px] font-bold leading-[1.12] tracking-tight text-white [text-shadow:0_4px_24px_rgba(0,0,0,0.45)] sm:mt-5 sm:text-4xl md:text-5xl lg:text-[52px]">
              {trainBanner.titleLine1}
              <br />
              <span className="text-cmt-primary-400">{trainBanner.titleHighlight}</span>{" "}
              {trainBanner.titleLine2}
            </h2>

            <p className="mt-4 max-w-md font-body text-sm leading-[1.6] text-white/85 [text-shadow:0_2px_12px_rgba(0,0,0,0.4)] sm:mt-5 sm:text-[15px] md:text-base">
              {trainBanner.description}
            </p>

            <div className="mt-8 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-6 sm:mt-12 sm:grid-cols-4 sm:gap-0">
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
                  <h3 className="mt-2 font-display text-sm font-bold leading-snug text-white sm:mt-3 sm:text-[15px]">
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
      </div>
    </div>
  );
}

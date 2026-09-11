"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MoveRight, Plane, TrendingUp } from "lucide-react";

import { useSiteContent } from "@/lib/useSiteContent";
import type { SiteContent } from "@/lib/siteContent";
import ContentImage from "../_components/ContentImage";
import SectionHeader from "../_components/SectionHeader";

/* ------------------------------------------------------------------ */
/* Trending destinations — the homepage destination rail, carried over   */
/* unchanged in card design and re-cut as a ranked "trending" set        */
/* (design.md §15.4 D-1). One yellow element per card: the "from" pill.  */
/* Copy, photography and the ranking order are all edited in /admin.     */
/*                                                                       */
/* The rail loops: the item set is repeated enough times to cover the    */
/* viewport, scrollLeft is wrapped back into the middle copy on every    */
/* scroll, and an rAF drift keeps it moving until the traveller takes    */
/* over. Only the first copy is exposed to assistive tech.               */
/* ------------------------------------------------------------------ */

/** Idle drift speed, px/s — brisk, but a card still stays readable. */
const DRIFT_PX_PER_SECOND = 60;
/** How long after a wheel/drag before the drift picks back up. */
const RESUME_DELAY_MS = 2000;

type TrendingItem = SiteContent["trending"]["items"][number];

export default function TrendingDestinations() {
  const { trending } = useSiteContent();

  const scrollerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLDivElement>(null);
  const leadRef = useRef<HTMLDivElement>(null);
  /** Width of one item set plus the gap that follows it — the loop period. */
  const setWidthRef = useRef(0);
  const pausedRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [copies, setCopies] = useState(3);

  const enabled = trending.enabled;
  const itemCount = trending.items.length;

  useEffect(() => {
    const scroller = scrollerRef.current;
    const track = trackRef.current;
    const set = setRef.current;
    if (!enabled || !scroller || !track || !set || itemCount === 0) return;

    let raf = 0;
    let started = false;

    const measure = () => {
      const gap = parseFloat(getComputedStyle(track).columnGap || "0") || 0;
      const period = set.getBoundingClientRect().width + gap;
      if (period <= 0) return;
      setWidthRef.current = period;

      // Enough copies that the widest viewport never runs past the tail.
      const needed = Math.max(3, Math.ceil(scroller.clientWidth / period) + 2);
      setCopies((current) => (current < needed ? needed : current));

      if (!started) {
        started = true;
        // Park in the second copy so the rail can be dragged either way,
        // offset by the section's left inset so the first card lines up
        // with the heading above it.
        const lead = leadRef.current?.offsetWidth ?? 0;
        scroller.scrollLeft = period - lead;
      }
    };

    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(set);
    resizeObserver.observe(scroller);

    // Keep scrollLeft inside one period of the middle copy. The copies are
    // identical, so the correction is invisible.
    const handleScroll = () => {
      const period = setWidthRef.current;
      if (!period) return;
      const offset = scroller.scrollLeft;
      if (offset >= period * 2) scroller.scrollLeft = offset - period;
      else if (offset < period) scroller.scrollLeft = offset + period;
    };

    const pause = () => {
      pausedRef.current = true;
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    };
    const resume = () => {
      pausedRef.current = false;
    };
    // Wheel and touch have no matching "done" event — resume once idle.
    const pauseThenResume = () => {
      pausedRef.current = true;
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = setTimeout(resume, RESUME_DELAY_MS);
    };

    scroller.addEventListener("scroll", handleScroll, { passive: true });
    scroller.addEventListener("pointerenter", pause);
    scroller.addEventListener("pointerleave", resume);
    scroller.addEventListener("focusin", pause);
    scroller.addEventListener("focusout", resume);
    scroller.addEventListener("wheel", pauseThenResume, { passive: true });
    scroller.addEventListener("touchstart", pauseThenResume, { passive: true });

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let last = performance.now();
    const tick = (now: number) => {
      const elapsed = now - last;
      last = now;
      if (!pausedRef.current && !reduceMotion.matches && window.matchMedia("(hover: hover) and (pointer: fine)").matches && setWidthRef.current) {
        scroller.scrollLeft += (DRIFT_PX_PER_SECOND * elapsed) / 1000;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      scroller.removeEventListener("scroll", handleScroll);
      scroller.removeEventListener("pointerenter", pause);
      scroller.removeEventListener("pointerleave", resume);
      scroller.removeEventListener("focusin", pause);
      scroller.removeEventListener("focusout", resume);
      scroller.removeEventListener("wheel", pauseThenResume);
      scroller.removeEventListener("touchstart", pauseThenResume);
    };
  }, [enabled, itemCount]);

  if (!enabled) return null;

  const { header, items } = trending;

  return (
    <section
      id="trending-destinations"
      aria-labelledby="trending-destinations-title"
      className="w-full border-t border-cmt-neutral-100 bg-white py-12 sm:py-16"
    >
      <div className="mx-auto w-full max-w-[1440px] px-3 sm:px-4 md:px-6">
        <SectionHeader
          eyebrow={header.eyebrow}
          title={<span id="trending-destinations-title">{header.title}</span>}
          description={header.description}
          actionLabel={header.actionLabel}
          actionHref={header.actionHref}
        />
      </div>

      {/* Measures the section's left inset so the loop can start flush with
          the heading. Zero height, never painted. */}
      <div ref={leadRef} aria-hidden="true" className="h-0 w-3 sm:w-4 md:w-6" />

      <div
        ref={scrollerRef}
        className="mt-8 w-full overflow-x-auto pb-4 [overscroll-behavior-x:contain] sm:mt-10 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        <div ref={trackRef} className="flex w-max gap-5 sm:gap-6">
          {Array.from({ length: copies }, (_, copy) => (
            <div
              key={copy}
              ref={copy === 0 ? setRef : undefined}
              className="flex gap-5 sm:gap-6"
              aria-hidden={copy > 0 ? "true" : undefined}
            >
              {items.map((dest, index) => (
                <TrendingCard
                  key={dest.id}
                  dest={dest}
                  rank={index + 1}
                  inert={copy > 0}
                />
              ))}
            </div>
          ))}
        </div>
      </div>


    </section>
  );
}

function TrendingCard({
  dest,
  rank,
  inert,
}: {
  dest: TrendingItem;
  rank: number;
  inert: boolean;
}) {
  return (
    <Link
      href={dest.href}
      tabIndex={inert ? -1 : undefined}
      className="group relative aspect-[3/4] w-[240px] shrink-0 overflow-hidden rounded-cmt-lg bg-cmt-secondary-900 shadow-cmt-sm transition-shadow hover:shadow-cmt-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 sm:w-[280px]"
    >
      <ContentImage
        src={dest.image}
        alt={dest.name}
        fill
        sizes="(max-width: 640px) 240px, 280px"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

      {/* The one marker this card carries beyond its price pill: why
          it ranks where it does. Text, not colour alone (§17.5). */}
      <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-cmt-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-cmt-neutral-900 backdrop-blur-sm">
        <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
        <span className="tabular-nums">#{rank}</span>
        <span className="text-cmt-neutral-500">·</span>
        <span className="tabular-nums">+{dest.rise}%</span>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-5">
        <div>
          <h3 className="font-display text-xl font-bold leading-tight text-white sm:text-2xl">
            {dest.name}
          </h3>
          <p className="mt-0.5 text-[13px] font-medium text-white/75">
            {dest.subtitle} · <span className="tabular-nums">{dest.packages}</span> packages
          </p>
        </div>

        <div className="inline-flex w-fit items-center gap-1.5 rounded-cmt-full bg-cmt-primary-500 py-1.5 pl-2.5 pr-3 text-[12px] font-semibold text-cmt-neutral-900 shadow-cmt-primary">
          <Plane className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
          <span className="tabular-nums">Starting from ₹{dest.price}</span>
        </div>
      </div>

      <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-cmt-full bg-white/15 text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
        <MoveRight className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
      </div>
    </Link>
  );
}

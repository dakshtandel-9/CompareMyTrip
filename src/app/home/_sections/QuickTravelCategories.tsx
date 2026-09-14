"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Glyph } from "@/lib/adminIcons";
import { useSiteContent } from "@/lib/useSiteContent";
import ContentImage from "../_components/ContentImage";
import RailButton from "../_components/RailButton";
import SectionHeader from "../_components/SectionHeader";

/* ------------------------------------------------------------------ */
/* Quick travel categories — a photo rail. Each card is a picture of the */
/* style it sells, with the category icon sitting on the photo's bottom   */
/* edge as a 48px gold disc (§15.2 F-2 icon treatment, sized up to carry  */
/* against a photograph).                                                */
/*                                                                       */
/* The nine categories shipped are the approved set from §15.3, and they   */
/* are now the defaults behind the /admin CRM rather than a hard-coded     */
/* list: title, small line, icon, photo and link are all editable, and the */
/* rail scrolls rather than dropping any, with the header arrows driving   */
/* it.                                                                    */
/*                                                                       */
/* Photography: every India card names the place it actually shows. The   */
/* three cards drawn from the site's own cinematic footage               */
/* (/public/categories, see CREDITS.txt) are described generically for    */
/* the same reason — they are scenes, not locations we can name.          */
/* ------------------------------------------------------------------ */

const AUTOPLAY_INTERVAL_MS = 1000;
const RESUME_DELAY_MS = 2500;

export default function QuickTravelCategories() {
  const { categories } = useSiteContent();
  const railRef = useRef<HTMLUListElement>(null);
  const periodRef = useRef(0);
  const scrollTargetRef = useRef<number | null>(null);
  const pointerInsideRef = useRef(false);
  const touchingRef = useRef(false);
  const holdUntilRef = useRef(0);
  const [copies, setCopies] = useState(2);

  const holdAutoplay = useCallback(() => {
    scrollTargetRef.current = null;
    holdUntilRef.current = performance.now() + RESUME_DELAY_MS;
  }, []);

  const advanceRail = useCallback((direction: 1 | -1) => {
    const rail = railRef.current;
    const period = periodRef.current;
    if (!rail || period <= 0 || categories.cards.length < 2) return;

    // Measuring a complete copy includes the actual responsive card gap.
    const step = period / categories.cards.length;
    let left = rail.scrollLeft;
    if (left >= period - 1) {
      left = Math.max(0, left - period);
      rail.scrollTo({ left, behavior: "instant" });
    }
    if (direction === -1 && left < step / 2) {
      left += period;
      rail.scrollTo({ left, behavior: "instant" });
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = (Math.round(left / step) + direction) * step;
    scrollTargetRef.current = target;
    rail.scrollTo({
      left: target,
      behavior: reduced ? "instant" : "smooth",
    });
  }, [categories.cards.length]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail || !categories.enabled || categories.cards.length < 2) return;

    const measure = () => {
      const first = rail.querySelector<HTMLElement>('[data-style-copy="0"]');
      const repeated = rail.querySelector<HTMLElement>('[data-style-copy="1"]');
      if (!first || !repeated) return;
      const period = repeated.getBoundingClientRect().left - first.getBoundingClientRect().left;
      periodRef.current = period;
      if (period > 0) {
        const needed = Math.max(2, Math.ceil(rail.clientWidth / period) + 1);
        setCopies(current => current < needed ? needed : current);
      }
    };
    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(rail);
    if (rail.firstElementChild) resizeObserver.observe(rail.firstElementChild);

    // Wait for each glide to finish before moving back to the identical copy.
    const wrap = () => {
      // An instant relocation can also emit scrollend before the glide ends.
      const target = scrollTargetRef.current;
      if (target !== null && Math.abs(rail.scrollLeft - target) > 1) return;
      scrollTargetRef.current = null;
      const period = periodRef.current;
      if (period > 0 && rail.scrollLeft >= period - 1 && !rail.contains(document.activeElement)) {
        rail.scrollTo({ left: Math.max(0, rail.scrollLeft - period), behavior: "instant" });
      }
    };
    rail.addEventListener("scrollend", wrap);

    const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
    let visible = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    const syncAutoplay = () => {
      clearInterval(timer);
      timer = undefined;
      if (!visible || document.hidden || !motion.matches) return;
      timer = setInterval(() => {
        if (
          pointerInsideRef.current || touchingRef.current ||
          performance.now() < holdUntilRef.current ||
          rail.closest("section")?.contains(document.activeElement)
        ) return;
        advanceRail(1);
      }, AUTOPLAY_INTERVAL_MS);
    };
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      syncAutoplay();
    });
    visibilityObserver.observe(rail);
    document.addEventListener("visibilitychange", syncAutoplay);
    motion.addEventListener("change", syncAutoplay);

    return () => {
      clearInterval(timer);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      rail.removeEventListener("scrollend", wrap);
      document.removeEventListener("visibilitychange", syncAutoplay);
      motion.removeEventListener("change", syncAutoplay);
    };
  }, [advanceRail, categories.cards, categories.enabled]);

  const scrollRail = (direction: 1 | -1) => {
    holdAutoplay();
    advanceRail(direction);
  };

  /* Keep hooks above the content visibility guard. */
  if (!categories.enabled) return null;

  return (
    <section
      id="travel-categories"
      aria-labelledby="travel-categories-title"
      className="w-full border-t border-cmt-neutral-100 bg-cmt-neutral-50 py-12 sm:py-16"
    >
      <div className="mx-auto w-full max-w-[1440px] px-3 sm:px-4 md:px-6">
        <SectionHeader
          eyebrow={categories.eyebrow}
          title={<span id="travel-categories-title">{categories.title}</span>}
          description={categories.description}
          action={
            <div className="hidden shrink-0 items-center gap-3 sm:flex">
              <RailButton
                label="Show previous travel styles"
                icon={ArrowLeft}
                disabled={categories.cards.length < 2}
                onClick={() => scrollRail(-1)}
              />
              <RailButton
                label="Show more travel styles"
                icon={ArrowRight}
                disabled={categories.cards.length < 2}
                onClick={() => scrollRail(1)}
              />
            </div>
          }
        />
      </div>

      <ul
        ref={railRef}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") pointerInsideRef.current = true;
        }}
        onPointerLeave={() => { pointerInsideRef.current = false; }}
        onTouchStart={() => { touchingRef.current = true; holdAutoplay(); }}
        onTouchEnd={() => { touchingRef.current = false; holdAutoplay(); }}
        onTouchCancel={() => { touchingRef.current = false; holdAutoplay(); }}
        onWheel={holdAutoplay}
        onBlurCapture={holdAutoplay}
        className="cmt-style-rail mt-8 flex w-full snap-x snap-mandatory scroll-px-3 gap-5 overflow-x-auto px-3 pb-4 pt-1 sm:mt-10 sm:scroll-px-4 sm:px-4 md:scroll-px-6 md:px-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {Array.from({ length: categories.cards.length > 1 ? copies : 1 }, (_, copy) => categories.cards.map((card) => {
          const { id, label, tagline, href, image, alt } = card;

          return (
          <li
            key={`${copy}-${id}`}
            data-style-copy={copy}
            aria-hidden={copy > 0 ? true : undefined}
            className="w-[247.8px] shrink-0 snap-start sm:w-[273px]"
          >
            <Link
              href={href}
              tabIndex={copy > 0 ? -1 : undefined}
              className="group flex h-full flex-col rounded-cmt-lg border border-cmt-neutral-200 bg-white p-[10.55px] shadow-cmt-sm transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-1 hover:border-cmt-neutral-300 hover:shadow-cmt-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
            >
              <div className="relative">
                <div className="relative aspect-[3/2] w-full overflow-hidden rounded-cmt-md bg-cmt-neutral-100">
                  <ContentImage
                    src={image}
                    alt={alt}
                    fill
                    sizes="(max-width: 767px) 118px, 250px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                {/* Sits astride the photo's bottom edge, the way the badge
                    reads in the reference layout. */}
                <span className="absolute bottom-0 left-1/2 grid size-12 -translate-x-1/2 translate-y-1/2 place-items-center rounded-cmt-full bg-cmt-primary-500 text-cmt-neutral-900 shadow-cmt-md transition-colors duration-200 group-hover:bg-cmt-primary-600">
                  <Glyph name={card.icon} className="size-5" />
                </span>
              </div>

              <div className="flex flex-1 flex-col items-center px-3 pb-[18.9px] pt-[37.8px] text-center">
                <h3 className="font-display text-lg font-bold leading-tight text-cmt-neutral-900">
                  {label}
                </h3>

                <p className="mt-1.5 text-sm leading-snug text-cmt-neutral-600">{tagline}</p>
              </div>
            </Link>
          </li>
          );
        }))}
      </ul>
    </section>
  );
}

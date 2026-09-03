"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Quote } from "lucide-react";

import { useSiteContent } from "@/lib/useSiteContent";
import RailButton from "../_components/RailButton";
import Rating from "../_components/Rating";
import SectionHeader from "../_components/SectionHeader";

/* ------------------------------------------------------------------ */
/* Traveller reviews — design.md §15.5 C-5: stars, a quote, then a 40px  */
/* avatar with the name and trip meta. The cards run as one horizontal   */
/* rail rather than a wrapping grid, so a tenth review extends the row    */
/* instead of starting a second one with a single card stranded on it.    */
/* The header arrows drive the rail; it also takes a trackpad swipe.      */
/*                                                                       */
/* Avatars use the traveller photo uploaded in the CRM, falling back to   */
/* their initials when no photo has been added yet.                      */
/* ------------------------------------------------------------------ */

/* Two cards per press, which keeps a partial card in view as the hint
   that the rail continues. */
const CARDS_PER_PRESS = 2;

export default function TravellerReviews() {
  const { reviews } = useSiteContent();
  const railRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const syncEdges = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;

    setAtStart(rail.scrollLeft <= 1);
    setAtEnd(rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    syncEdges();
    rail.addEventListener("scroll", syncEdges, { passive: true });
    window.addEventListener("resize", syncEdges);

    return () => {
      rail.removeEventListener("scroll", syncEdges);
      window.removeEventListener("resize", syncEdges);
    };
  }, [syncEdges, reviews.items.length]);

  const scrollRail = (direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;

    const card = rail.querySelector("li");
    const gap = 24;
    const step = card ? card.getBoundingClientRect().width + gap : rail.clientWidth * 0.8;

    /* Honour the OS setting: scrollBy's smooth behaviour is not covered by
       the reduced-motion media query the way CSS scroll-behavior is. */
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    rail.scrollBy({
      left: direction * step * CARDS_PER_PRESS,
      behavior: reduced ? "auto" : "smooth",
    });
  };

  /* After the edge-sync effect, never before. */
  if (!reviews.enabled) return null;

  const { header, items } = reviews;

  return (
    <section
      id="traveller-reviews"
      aria-labelledby="traveller-reviews-title"
      className="w-full border-t border-cmt-neutral-100 bg-cmt-neutral-50 py-12 sm:py-16 lg:py-20"
    >
      <div className="mx-auto w-full max-w-[1440px] px-3 sm:px-4 md:px-6">
        <SectionHeader
          eyebrow={header.eyebrow}
          title={<span id="traveller-reviews-title">{header.title}</span>}
          description={header.description}
          action={
            <div className="hidden shrink-0 items-center gap-3 sm:flex">
              <RailButton
                label="Show previous reviews"
                icon={ArrowLeft}
                disabled={atStart}
                onClick={() => scrollRail(-1)}
              />
              <RailButton
                label="Show more reviews"
                icon={ArrowRight}
                disabled={atEnd}
                onClick={() => scrollRail(1)}
              />
            </div>
          }
        />
      </div>

      <ul
        ref={railRef}
        className="mt-8 flex w-full gap-6 overflow-x-auto px-3 pb-4 pt-1 sm:mt-10 sm:px-4 md:px-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((review) => (
          <li key={review.id} className="w-[300px] shrink-0 sm:w-[360px]">
            <figure className="flex h-full flex-col rounded-cmt-md border border-cmt-neutral-200 bg-white p-6 shadow-cmt-sm">
              <div className="flex items-center justify-between gap-3">
                <Rating value={review.rating} />
                <Quote
                  className="h-5 w-5 shrink-0 text-cmt-primary-400"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </div>

              <blockquote className="mt-4 flex-1 text-pretty text-base leading-relaxed text-cmt-neutral-700">
                {review.quote}
              </blockquote>

              <figcaption className="mt-6 flex items-center gap-3 border-t border-cmt-neutral-100 pt-5">
                {review.avatar ? (
                  <span className="relative size-10 shrink-0 overflow-hidden rounded-cmt-full bg-cmt-primary-100">
                    <Image
                      src={review.avatar}
                      alt=""
                      fill
                      sizes="40px"
                      unoptimized
                      className="object-cover"
                    />
                  </span>
                ) : (
                  <span
                    className="grid size-10 shrink-0 place-items-center rounded-cmt-full bg-cmt-primary-100 font-display text-sm font-semibold text-cmt-neutral-900"
                    aria-hidden="true"
                  >
                    {review.initials}
                  </span>
                )}

                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-cmt-neutral-900">
                    {review.name}
                  </span>
                  <span className="block truncate text-xs text-cmt-neutral-500">{review.trip}</span>
                  <span className="block text-xs text-cmt-neutral-400">{review.travelled}</span>
                </span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}

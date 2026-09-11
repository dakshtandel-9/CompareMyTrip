"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Quote } from "lucide-react";

import { useSiteContent } from "@/lib/useSiteContent";
import { useGoogleReviews } from "@/lib/useGoogleReviews";
import { mergeReviews } from "@/lib/googleBusiness";
import type { Review } from "@/lib/siteContent";
import RailButton from "../_components/RailButton";
import Rating from "../_components/Rating";
import SectionHeader from "../_components/SectionHeader";

/* ------------------------------------------------------------------ */
/* Traveller reviews — design.md §15.5 C-5: stars, a quote, then a 40px  */
/* avatar with the name and trip meta. The cards run as one horizontal   */
/* rail rather than a wrapping grid, so a tenth review extends the row    */
/* instead of starting a second one with a single card stranded on it.    */
/*                                                                       */
/* The rail creeps left on its own and wraps without a seam, the way the  */
/* footer's partner strip does. It cannot use that strip's CSS transform  */
/* though: this rail is also a real scroller (arrows, trackpad swipe,     */
/* keyboard focus), and a transform would fight scrollLeft rather than    */
/* compose with it. So the drift is scrollLeft itself, advanced a         */
/* fraction of a pixel per frame, and the list is rendered twice — when   */
/* the drift passes the halfway mark it jumps back by exactly half the    */
/* track, where the second copy is sitting in the same place the first    */
/* one was. The jump is invisible because the pixels do not change.       */
/*                                                                       */
/* The drift yields to the reader: it holds while the pointer is over the */
/* rail, while focus is inside it, while the tab is hidden, and for a     */
/* moment after an arrow press or a swipe. And it never starts at all     */
/* under prefers-reduced-motion, where a rail that moves by itself is the */
/* thing being asked for less of.                                        */
/*                                                                       */
/* Avatars use the traveller photo uploaded in the CRM, falling back to   */
/* their initials when no photo has been added yet.                      */
/* ------------------------------------------------------------------ */

/* Two cards per press, which keeps a partial card in view as the hint
   that the rail continues. */
const CARDS_PER_PRESS = 2;

/* Brisk automatic scrolling; hover or focus pauses the rail for reading. */
const DRIFT_PX_PER_SECOND = 60;

/* How long a deliberate move (arrow, swipe) owns the rail before the
   drift picks it back up. Long enough to finish reading the card you
   just brought into view. */
const RESUME_DELAY_MS = 2500;

/* The traveller's photo, falling back to their initials.
 *
 * The fallback fires on a failed load as well as on an empty field, which
 * matters for Google reviewers: their photos are hotlinked from Google's
 * CDN and those URLs do expire. Without the onError the card would show a
 * browser's broken-image glyph rather than the initials disc it has. */
function ReviewAvatar({ review }: { review: Review }) {
  const [failed, setFailed] = useState(false);

  if (review.avatar && !failed) {
    return (
      <span className="relative size-10 shrink-0 overflow-hidden rounded-cmt-full bg-cmt-primary-100">
        <Image
          src={review.avatar}
          alt=""
          fill
          sizes="40px"
          unoptimized
          onError={() => setFailed(true)}
          className="object-cover"
        />
      </span>
    );
  }

  return (
    <span
      className="grid size-10 shrink-0 place-items-center rounded-cmt-full bg-cmt-primary-100 font-display text-sm font-semibold text-cmt-neutral-900"
      aria-hidden="true"
    >
      {review.initials}
    </span>
  );
}

export default function TravellerReviews() {
  const { reviews } = useSiteContent();
  /* Empty until a Google Business Profile is connected and synced in the
     CRM, so this changes nothing for a site that has not connected one. */
  const googleReviews = useGoogleReviews();
  const railRef = useRef<HTMLUListElement>(null);

  /* Hand-written reviews lead; Google's follow. The travel desk chose what
     opens the rail and a sync must not be able to displace that.

     Computed up here with the hooks rather than after the `enabled` early
     return, because the drift effect below measures the track and has to
     re-run when a sync changes how many cards are on it. */
  const items = mergeReviews(reviews.items, googleReviews);

  /* The pause reasons are refs, not state: the animation frame reads them
     every frame and nothing in the tree renders differently for them, so
     re-rendering the whole rail sixty times a second would buy nothing. */
  const pointerInsideRef = useRef(false);
  const focusInsideRef = useRef(false);
  const holdUntilRef = useRef(0);

  const holdDrift = useCallback(() => {
    holdUntilRef.current = performance.now() + RESUME_DELAY_MS;
  }, []);

  /* Half the track is one full copy of the list. Read from the live DOM
     rather than remembered, so a resize or a font swap cannot leave the
     wrap point measuring something that is no longer there. */
  const copyWidth = (rail: HTMLElement) => rail.scrollWidth / 2;

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let last = performance.now();

    const step = (now: number) => {
      frame = requestAnimationFrame(step);

      const elapsed = now - last;
      last = now;

      const held =
        pointerInsideRef.current ||
        focusInsideRef.current ||
        now < holdUntilRef.current ||
        document.hidden;

      /* Wrap even while held: a swipe can carry the rail past the seam on
         its own, and it has to come back before the reader reaches the
         blank space beyond the second copy. */
      const half = copyWidth(rail);
      if (half > 0 && rail.scrollLeft >= half) rail.scrollLeft -= half;

      if (held) return;

      /* Sub-pixel per frame, so it is accumulated rather than rounded away
         — scrollLeft keeps the fraction, an integer step would not. */
      rail.scrollLeft += (DRIFT_PX_PER_SECOND * elapsed) / 1000;
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [items.length]);

  const scrollRail = (direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;

    const card = rail.querySelector("li");
    const gap = 24;
    const step = card ? card.getBoundingClientRect().width + gap : rail.clientWidth * 0.8;

    /* Stepping back from the very start would hit the left edge and stop.
       Jump forward by one copy first — the same pixels, a full copy along
       — so there is always track to the left to move into. */
    const half = copyWidth(rail);
    if (direction === -1 && half > 0 && rail.scrollLeft < step * CARDS_PER_PRESS) {
      rail.scrollLeft += half;
    }

    holdDrift();

    /* Honour the OS setting: scrollBy's smooth behaviour is not covered by
       the reduced-motion media query the way CSS scroll-behavior is. */
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    rail.scrollBy({
      left: direction * step * CARDS_PER_PRESS,
      behavior: reduced ? "auto" : "smooth",
    });
  };

  /* After the drift effect, never before. */
  if (!reviews.enabled) return null;

  const { header } = reviews;

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
              {/* Neither arrow is ever disabled: the rail loops, so there
                  is no start to be at and no end to reach. */}
              <RailButton
                label="Show previous reviews"
                icon={ArrowLeft}
                disabled={false}
                onClick={() => scrollRail(-1)}
              />
              <RailButton
                label="Show more reviews"
                icon={ArrowRight}
                disabled={false}
                onClick={() => scrollRail(1)}
              />
            </div>
          }
        />
      </div>

      <ul
        ref={railRef}
        onPointerEnter={() => {
          pointerInsideRef.current = true;
        }}
        onPointerLeave={() => {
          pointerInsideRef.current = false;
        }}
        /* A touch drag is a pointer that leaves without ever entering, so
           the drift is held on the gesture itself as well. */
        onTouchStart={holdDrift}
        onTouchMove={holdDrift}
        onFocusCapture={() => {
          focusInsideRef.current = true;
        }}
        onBlurCapture={() => {
          focusInsideRef.current = false;
        }}
        className="mt-8 flex w-full gap-6 overflow-x-auto px-3 pb-4 pt-1 sm:mt-10 sm:px-4 md:px-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* The list twice over, for the seamless wrap. Both copies have to
            stay identical for the join to hold, which is why this maps the
            same items rather than writing a second row out. The duplicate
            is hidden from screen readers so the reviews are not read out
            twice; it is the first copy that carries the content. */}
        {[0, 1].map((copy) => (
          <li
            key={copy}
            aria-hidden={copy === 1 ? "true" : undefined}
            className="contents"
          >
            <ul className="contents">
              {items.map((review) => (
                <li
                  key={review.id}
                  className="w-[min(300px,calc(100vw-2rem))] shrink-0 sm:w-[360px]"
                >
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
                      <ReviewAvatar review={review} />

                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-cmt-neutral-900">
                          {review.name}
                        </span>
                        <span className="block truncate text-xs text-cmt-neutral-500">
                          {review.trip}
                        </span>
                        <span className="block text-xs text-cmt-neutral-400">
                          {review.travelled}
                        </span>
                      </span>
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}

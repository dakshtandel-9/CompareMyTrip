"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, MessageSquareQuote, Quote } from "lucide-react";

import { useSiteContent } from "@/lib/useSiteContent";
import { startVisibleAnimation } from "@/lib/visibleAnimation";
import { getReviewScrollTarget } from "@/lib/reviewRail";
import type { Review } from "@/lib/siteContent";
import GoogleIcon from "@/app/(auth)/_components/GoogleIcon";
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

/* Brisk automatic scrolling; hover or focus pauses the rail for reading. */
const DRIFT_PX_PER_SECOND = 60;

// Keep the rail visible before the first manual review is published.
// These are labelled placeholders, never customer quotes or ratings.
const REVIEW_PLACEHOLDERS: Review[] = [
  { id: "review-placeholder-treks", name: "Weekend adventures", quote: "Traveller stories from trails, treks and short getaways will appear here.", trip: "Traveller review coming soon", travelled: "", initials: "", avatar: "", rating: 0 },
  { id: "review-placeholder-holidays", name: "Holiday memories", quote: "Traveller stories from holidays across India and abroad will appear here.", trip: "Traveller review coming soon", travelled: "", initials: "", avatar: "", rating: 0 },
  { id: "review-placeholder-together", name: "Trips together", quote: "Traveller stories from journeys with friends and family will appear here.", trip: "Traveller review coming soon", travelled: "", initials: "", avatar: "", rating: 0 },
];

/* How long a deliberate move (arrow, swipe) owns the rail before the
   drift picks it back up. Long enough to finish reading the card you
   just brought into view. */
const RESUME_DELAY_MS = 2500;

/* The traveller's photo, falling back to their initials.
 *
 * Failed or missing photos use the same initials fallback. */
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
  const railRef = useRef<HTMLUListElement>(null);
  const periodRef = useRef(0);
  const [copies, setCopies] = useState(2);

  const publishedReviews = reviews.items.filter(
    (review) => review.verified === true && review.name.trim() && review.quote.trim(),
  );

  const showingPlaceholders = publishedReviews.length === 0;
  const items = showingPlaceholders ? REVIEW_PLACEHOLDERS : publishedReviews;

  /* The pause reasons are refs, not state: the animation frame reads them
     every frame and nothing in the tree renders differently for them, so
     re-rendering the whole rail sixty times a second would buy nothing. */
  const pointerInsideRef = useRef(false);
  const focusInsideRef = useRef(false);
  const holdUntilRef = useRef(0);

  const holdDrift = useCallback(() => {
    holdUntilRef.current = performance.now() + RESUME_DELAY_MS;
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail || !reviews.enabled) return;

    const first = rail.querySelector<HTMLElement>('[data-review-copy="0"]');
    if (!first) return;
    const measure = () => {
      // Content edits can replace keyed cards without changing the item count.
      // Always measure the mounted cards, never detached nodes from setup.
      const currentFirst = rail.querySelector<HTMLElement>('[data-review-copy="0"]');
      const repeated = rail.querySelector<HTMLElement>('[data-review-copy="1"]');
      if (!currentFirst || !repeated) return;
      // scrollWidth includes rail padding and omits the final gap. Measuring
      // matching cards gives the actual loop period without a visible seam.
      const period = repeated.getBoundingClientRect().left - currentFirst.getBoundingClientRect().left;
      periodRef.current = period;
      if (period > 0) {
        const needed = Math.max(2, Math.ceil(rail.clientWidth / period) + 1);
        setCopies(current => current < needed ? needed : current);
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(rail);
    observer.observe(first);

    // Swipes and arrow presses must wrap even when decorative motion is off.
    const wrap = () => {
      const period = periodRef.current;
      if (period > 0 && rail.scrollLeft >= period) rail.scrollLeft %= period;
    };
    rail.addEventListener("scroll", wrap, { passive: true });
    const stopDrift = startVisibleAnimation(rail, (now, elapsed) => {
      const held =
        pointerInsideRef.current ||
        focusInsideRef.current ||
        now < holdUntilRef.current ||
        document.hidden;

      if (held) return;

      /* Sub-pixel per frame, so it is accumulated rather than rounded away
         — scrollLeft keeps the fraction, an integer step would not. */
      rail.scrollLeft += (DRIFT_PX_PER_SECOND * elapsed) / 1000;
    }, { allowMobile: true });
    return () => {
      stopDrift();
      observer.disconnect();
      rail.removeEventListener("scroll", wrap);
    };
  }, [items.length, reviews.enabled, showingPlaceholders]);

  const scrollRail = (direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;

    const target = getReviewScrollTarget(rail.scrollLeft, periodRef.current, items.length, direction);
    if (!target) return;

    holdDrift();

    /* Honour the OS setting: scrollBy's smooth behaviour is not covered by
       the reduced-motion media query the way CSS scroll-behavior is. */
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    rail.scrollTo({
      left: target.left,
      // A smooth seek across the duplicate boundary is interrupted by the
      // scroll wrap. Make that one relocation immediate; ordinary moves glide.
      behavior: reduced || target.wrapped ? "auto" : "smooth",
    });
  };

  /* After the drift effect, never before. */
  if (!reviews.enabled) return null;

  const { header } = reviews;

  return (
    <section
      id="traveller-reviews"
      aria-labelledby="traveller-reviews-title"
      className="w-full scroll-mt-32 border-t border-cmt-neutral-100 bg-cmt-neutral-50 py-12 sm:scroll-mt-40 sm:py-16 lg:py-20"
    >
      <div className="mx-auto w-full max-w-[1440px] px-3 sm:px-4 md:px-6">
        <SectionHeader
          eyebrow={header.eyebrow}
          title={<span id="traveller-reviews-title">{header.title}</span>}
          description={header.description}
          action={(
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <div className="flex items-center gap-3">
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
            </div>
          )}
        />
      </div>

        <ul
          ref={railRef}
          aria-label={showingPlaceholders ? "Upcoming traveller reviews" : "Traveller reviews"}
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
          onWheel={holdDrift}
          onFocusCapture={() => {
            focusInsideRef.current = true;
          }}
          onBlurCapture={() => {
            focusInsideRef.current = false;
          }}
          className="mt-8 flex w-full gap-6 overflow-x-auto px-3 pb-4 pt-1 sm:mt-10 sm:px-4 md:px-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {/* Repeat enough copies to fill even a wide screen with a short list.
              All copies have to
              stay identical for the join to hold, which is why this maps the
              same items rather than writing a second row out. The duplicate
              is hidden from screen readers so the reviews are not read out
              twice; it is the first copy that carries the content. */}
          {Array.from({ length: copies }, (_, copy) => (
            <li
              key={copy}
              aria-hidden={copy > 0 ? "true" : undefined}
              className="contents"
            >
              <ul className="contents">
                {items.map((review) => (
                  <li
                    key={review.id}
                    data-review-copy={copy}
                    className="w-[min(300px,calc(100vw-2rem))] shrink-0 sm:w-[360px]"
                  >
                    <figure className="flex h-full flex-col rounded-cmt-md border border-cmt-neutral-200 bg-white p-6 shadow-cmt-sm">
                      <div className="flex items-center justify-between gap-3">
                        {showingPlaceholders ? (
                          <span className="rounded-cmt-full bg-cmt-primary-100 px-3 py-1 text-xs font-semibold text-cmt-primary-900">
                            Review coming soon
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            {review.fromGoogle === true && (
                              <span role="img" aria-label="Google review" className="grid shrink-0 place-items-center">
                                <GoogleIcon size={16} />
                              </span>
                            )}
                            <Rating value={review.rating} />
                          </div>
                        )}
                        <Quote
                          className="h-5 w-5 shrink-0 text-cmt-primary-400"
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                      </div>

                      {showingPlaceholders ? (
                        <p className="mt-4 flex-1 text-pretty text-base leading-relaxed text-cmt-neutral-700">{review.quote}</p>
                      ) : (
                        <blockquote className="mt-4 flex-1 text-pretty text-base leading-relaxed text-cmt-neutral-700">{review.quote}</blockquote>
                      )}

                      <figcaption className="mt-6 flex items-center gap-3 border-t border-cmt-neutral-100 pt-5">
                        {showingPlaceholders ? (
                          <span className="grid size-10 shrink-0 place-items-center rounded-cmt-full bg-cmt-primary-100 text-cmt-primary-900">
                            <MessageSquareQuote className="size-5" aria-hidden="true" />
                          </span>
                        ) : <ReviewAvatar review={review} />}

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

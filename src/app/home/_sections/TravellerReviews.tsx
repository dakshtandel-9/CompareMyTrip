"use client";

import Image from "next/image";
import { Quote } from "lucide-react";

import { useSiteContent } from "@/lib/useSiteContent";
import Rating from "../_components/Rating";
import SectionHeader from "../_components/SectionHeader";

/* ------------------------------------------------------------------ */
/* Traveller reviews — design.md §15.5 C-5: three cards, stars, a quote  */
/* held to three lines, then a 40px avatar with the name and trip meta.  */
/* Avatars use the traveller photo uploaded in the CRM, falling back to   */
/* their initials when no photo has been added yet.                      */
/* ------------------------------------------------------------------ */

export default function TravellerReviews() {
  const { reviews } = useSiteContent();
  if (!reviews.enabled) return null;

  const { header, items } = reviews;

  return (
    <section
      id="traveller-reviews"
      aria-labelledby="traveller-reviews-title"
      className="w-full border-t border-cmt-neutral-100 bg-cmt-neutral-50 px-3 py-12 sm:px-4 sm:py-16 md:px-6 lg:py-20"
    >
      <div className="mx-auto w-full max-w-[1440px]">
        <SectionHeader
          eyebrow={header.eyebrow}
          title={<span id="traveller-reviews-title">{header.title}</span>}
          description={header.description}
          actionLabel={header.actionLabel}
          actionHref={header.actionHref}
        />

        <ul className="mt-8 grid grid-cols-1 gap-6 sm:mt-10 md:grid-cols-3">
          {items.map((review) => (
            <li key={review.id}>
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
                    <span className="block truncate text-xs text-cmt-neutral-500">
                      {review.trip}
                    </span>
                    <span className="block text-xs text-cmt-neutral-400">{review.travelled}</span>
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

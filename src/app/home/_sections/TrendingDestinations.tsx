"use client";

import Link from "next/link";
import { ArrowRight, MoveRight, Plane, TrendingUp } from "lucide-react";

import { useSiteContent } from "@/lib/useSiteContent";
import ContentImage from "../_components/ContentImage";
import SectionHeader from "../_components/SectionHeader";

/* ------------------------------------------------------------------ */
/* Trending destinations — the homepage destination rail, carried over   */
/* unchanged in card design and re-cut as a ranked "trending" set        */
/* (design.md §15.4 D-1). One yellow element per card: the "from" pill.  */
/* Copy, photography and the ranking order are all edited in /admin.     */
/* ------------------------------------------------------------------ */

export default function TrendingDestinations() {
  const { trending } = useSiteContent();
  if (!trending.enabled) return null;

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

      <div className="mt-8 flex w-full gap-5 overflow-x-auto px-3 pb-4 sm:mt-10 sm:gap-6 sm:px-4 md:px-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {items.map((dest, index) => (
          <Link
            key={dest.id}
            href={dest.href}
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
            <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-cmt-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-cmt-neutral-900 backdrop-blur-sm">
              <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
              <span className="tabular-nums">#{index + 1}</span>
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
        ))}
      </div>

      {header.actionLabel && header.actionHref && (
        <div className="mt-6 px-3 sm:hidden">
          <Link
            href={header.actionHref}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-cmt-neutral-900"
          >
            {header.actionLabel}
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
          </Link>
        </div>
      )}
    </section>
  );
}

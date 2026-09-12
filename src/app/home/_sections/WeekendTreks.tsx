"use client";

import Link from "next/link";
import { Clock, Footprints, MapPin, MountainSnow, Route } from "lucide-react";

import { useSiteContent } from "@/lib/useSiteContent";
import type { Trek } from "@/lib/siteContent";
import ContentImage from "../_components/ContentImage";
import Price from "../_components/Price";
import SectionHeader from "../_components/SectionHeader";

const GRADE_LABELS: Record<number, string> = { 1: "Easy", 2: "Moderate", 3: "Difficult" };

/* Grade as three bars plus its word — never colour or shape alone (§17.5). */
function GradeMeter({ grade }: { grade: Trek["grade"] }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="flex items-end gap-0.5" aria-hidden="true">
        {[1, 2, 3].map((step) => (
          <span
            key={step}
            className={`w-1 rounded-cmt-full ${
              step === 1 ? "h-2" : step === 2 ? "h-3" : "h-4"
            } ${step <= grade ? "bg-cmt-neutral-900" : "bg-cmt-neutral-200"}`}
          />
        ))}
      </span>
      <span className="text-xs font-semibold text-cmt-neutral-700">{GRADE_LABELS[grade]}</span>
    </span>
  );
}

export default function WeekendTreks() {
  const { weekendTreks } = useSiteContent();
  if (!weekendTreks.enabled) return null;

  const { header, items, badgeLabel, ctaLabel } = weekendTreks;

  return (
    <section
      id="weekend-treks"
      aria-labelledby="weekend-treks-title"
      className="w-full border-t border-cmt-neutral-100 bg-cmt-neutral-50 px-3 py-12 sm:px-4 sm:py-16 md:px-6 lg:py-20"
    >
      <div className="mx-auto w-full max-w-[1440px]">
        <SectionHeader
          eyebrow={header.eyebrow}
          title={<span id="weekend-treks-title">{header.title}</span>}
          description={header.description}
          actionLabel={header.actionLabel}
          actionHref={header.actionHref}
        />

        <div className="cmt-mobile-rail mt-8 grid grid-cols-1 gap-6 sm:mt-10 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((trek) => (
            <article
              key={trek.id}
              className="group relative flex flex-col overflow-hidden rounded-cmt-md border border-cmt-neutral-200 bg-white shadow-cmt-sm transition-[box-shadow,border-color] duration-200 hover:border-cmt-neutral-300 hover:shadow-cmt-md"
            >
              <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-cmt-neutral-100">
                <ContentImage
                  src={trek.image}
                  alt={`View from the ${trek.name} trek`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.035]"
                />

                {badgeLabel && (
                  <span className="absolute left-3 top-3 rounded-cmt-full border border-cmt-primary-500/30 bg-cmt-primary-100 px-2.5 py-1 text-xs font-semibold text-cmt-neutral-800">
                    {badgeLabel}
                  </span>
                )}

                <div className="absolute right-3 top-3 rounded-cmt-full bg-white/95 px-2.5 py-1 shadow-cmt-xs backdrop-blur-sm">
                  <GradeMeter grade={trek.grade} />
                </div>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <p className="flex min-w-0 items-center gap-1 text-xs font-medium text-cmt-neutral-500">
                  <MapPin className="size-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
                  <span className="truncate">{trek.region}</span>
                </p>

                <h3 className="mt-1.5 font-display text-base font-bold leading-snug text-cmt-neutral-900">
                  {trek.name}
                </h3>

                <dl className="mt-3 grid grid-cols-3 gap-3 text-cmt-neutral-700">
                  <div>
                    <dt className="flex items-center gap-1 text-xs font-medium text-cmt-neutral-500">
                      <Clock className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
                      Duration
                    </dt>
                    <dd className="mt-0.5 text-sm font-semibold tabular-nums text-cmt-neutral-900">
                      {trek.nights === 0 ? "1 day" : `${trek.nights}N / ${trek.days}D`}
                    </dd>
                  </div>

                  <div>
                    <dt className="flex items-center gap-1 text-xs font-medium text-cmt-neutral-500">
                      <Route className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
                      Distance
                    </dt>
                    <dd className="mt-0.5 text-sm font-semibold tabular-nums text-cmt-neutral-900">
                      {trek.distanceKm} km
                    </dd>
                  </div>

                  <div>
                    <dt className="flex items-center gap-1 text-xs font-medium text-cmt-neutral-500">
                      <MountainSnow className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
                      Summit
                    </dt>
                    <dd className="mt-0.5 text-sm font-semibold tabular-nums text-cmt-neutral-900">
                      {trek.peakM.toLocaleString("en-IN")} m
                    </dd>
                  </div>
                </dl>

                <p className="mt-3 flex items-start gap-1.5 text-sm leading-relaxed text-cmt-neutral-600">
                  <Footprints
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cmt-neutral-400"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  {trek.note}
                </p>

                <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-cmt-neutral-100 pt-4">
                  <Price
                    price={trek.price}
                    originalPrice={trek.originalPrice}
                    qualifier="/person"
                  />

                  <Link
                    href={trek.href}
                    aria-label={`${ctaLabel}: ${trek.name}`}
                    className="relative z-10 inline-flex h-11 shrink-0 sm:h-9 items-center justify-center rounded-cmt-control bg-cmt-primary-500 px-5 text-sm font-semibold text-cmt-neutral-900 shadow-cmt-xs transition-[background-color,box-shadow] duration-200 hover:bg-cmt-primary-600 hover:shadow-cmt-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
                  >
                    {ctaLabel}
                  </Link>
                </div>
              </div>

              {/* Keep the card link independent of the CTA: a hover transform
                  on a stretched ::after link changes its containing block and
                  makes the hit area collapse, flicker, and miss clicks. */}
              <Link
                href={trek.href}
                aria-hidden="true"
                tabIndex={-1}
                className="absolute inset-0"
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { ArrowRight, Clock, Plane, Sun, Wallet } from "lucide-react";

import type { VisaType } from "@/lib/siteContent";
import { useSiteContent } from "@/lib/useSiteContent";
import Price from "../_components/Price";
import SectionHeader from "../_components/SectionHeader";

/* ------------------------------------------------------------------ */
/* International holidays — deliberately data-led, not photo-led. The     */
/* questions that actually decide an overseas trip are the visa, the      */
/* season and the flight, so those are the card. The photography budget   */
/* for this page is already spent on the domestic showcase directly above */
/* (design.md §12.3: one photograph or one motif, never both competing).  */
/* ------------------------------------------------------------------ */

/* Visa status carries a word, never a colour on its own (§17.5). */
const VISA_TONES: Record<VisaType, string> = {
  "Visa free": "border-cmt-success-500/30 bg-cmt-success-100 text-cmt-success-700",
  "Visa on arrival": "border-cmt-success-500/30 bg-cmt-success-100 text-cmt-success-700",
  "e-Visa": "border-cmt-warning-500/30 bg-cmt-warning-100 text-cmt-warning-700",
  "Embassy visa": "border-cmt-neutral-300 bg-cmt-neutral-100 text-cmt-neutral-700",
};

export default function InternationalHolidays() {
  const { international } = useSiteContent();
  if (!international.enabled) return null;

  const { header, items, footnote } = international;

  return (
    <section
      id="international-holidays"
      aria-labelledby="international-holidays-title"
      className="w-full border-t border-cmt-neutral-100 bg-cmt-neutral-50 px-3 py-12 sm:px-4 sm:py-16 md:px-6 lg:py-20"
    >
      <div className="mx-auto w-full max-w-[1440px]">
        <SectionHeader
          eyebrow={header.eyebrow}
          title={<span id="international-holidays-title">{header.title}</span>}
          description={header.description}
          actionLabel={header.actionLabel}
          actionHref={header.actionHref}
        />

        <div className="mt-8 grid grid-cols-1 gap-6 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((country) => (
            <article
              key={country.id}
              className="group flex flex-col rounded-cmt-md border border-cmt-neutral-200 bg-white p-5 shadow-cmt-sm transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-cmt-neutral-300 hover:shadow-cmt-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-cmt-neutral-500">{country.region}</p>
                  <h3 className="mt-0.5 font-display text-lg font-semibold leading-snug text-cmt-neutral-900">
                    {country.country}
                  </h3>
                </div>

                <span
                  className={`shrink-0 rounded-cmt-full border px-2.5 py-1 text-[11px] font-semibold ${VISA_TONES[country.visa]}`}
                >
                  {country.visa}
                </span>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-cmt-neutral-600">{country.hook}</p>

              <dl className="mt-5 space-y-2.5 border-t border-cmt-neutral-100 pt-4 text-sm">
                <div className="flex items-start gap-2">
                  <dt className="flex w-[104px] shrink-0 items-center gap-1.5 text-xs font-medium text-cmt-neutral-500">
                    <Plane className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                    Visa
                  </dt>
                  <dd className="text-sm text-cmt-neutral-700">{country.visaNote}</dd>
                </div>

                <div className="flex items-start gap-2">
                  <dt className="flex w-[104px] shrink-0 items-center gap-1.5 text-xs font-medium text-cmt-neutral-500">
                    <Sun className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                    Best season
                  </dt>
                  <dd className="text-sm text-cmt-neutral-700">{country.bestMonths}</dd>
                </div>

                <div className="flex items-start gap-2">
                  <dt className="flex w-[104px] shrink-0 items-center gap-1.5 text-xs font-medium text-cmt-neutral-500">
                    <Clock className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                    Flight time
                  </dt>
                  <dd className="text-sm tabular-nums text-cmt-neutral-700">
                    {country.flightHours} direct
                  </dd>
                </div>

                <div className="flex items-start gap-2">
                  <dt className="flex w-[104px] shrink-0 items-center gap-1.5 text-xs font-medium text-cmt-neutral-500">
                    <Wallet className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                    Currency
                  </dt>
                  <dd className="text-sm text-cmt-neutral-700">{country.currency}</dd>
                </div>
              </dl>

              <div className="mt-auto flex items-end justify-between gap-3 border-t border-cmt-neutral-100 pt-4">
                <Price price={country.price} qualifier="/person" />

                <Link
                  href={country.href}
                  className="group/cta inline-flex h-9 shrink-0 items-center gap-1.5 rounded-cmt-control px-2 text-sm font-semibold text-cmt-neutral-900 transition-colors hover:text-cmt-primary-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
                >
                  See packages
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover/cta:translate-x-1"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {footnote && (
          <p className="mt-6 text-xs leading-relaxed text-cmt-neutral-500">{footnote}</p>
        )}
      </div>
    </section>
  );
}

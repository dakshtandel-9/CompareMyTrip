"use client";

import Link from "next/link";
import { Clock, Plane, Sun, Wallet } from "lucide-react";

import type { VisaType } from "@/lib/siteContent";
import { useSiteContent } from "@/lib/useSiteContent";
import { usePackages } from "@/lib/usePackages";
import { internationalCardTarget, internationalFromPrice } from "@/lib/internationalPackages";
import ContentImage from "../_components/ContentImage";
import Price from "../_components/Price";
import SectionHeader from "../_components/SectionHeader";

/* ------------------------------------------------------------------ */
/* International holidays — data-led first. The questions that actually   */
/* decide an overseas trip are the visa, the season and the flight, so    */
/* those are the card, and it is complete without a photograph.           */
/*                                                                        */
/* A photo is optional per country and set in /admin/content →            */
/* International. Countries ship without one: the domestic showcase        */
/* directly above is already carrying this page's photography (design.md   */
/* §12.3 — one photograph or one motif, never both competing), so a card   */
/* only takes a picture once an editor decides that country earns it. An   */
/* empty field renders no frame at all rather than a grey box.             */
/* ------------------------------------------------------------------ */

/* Visa status carries a word, never a colour on its own (§17.5). */
const VISA_TONES: Record<VisaType, string> = {
  "Check requirements": "border-cmt-neutral-300 bg-cmt-neutral-100 text-cmt-neutral-700",
  "Visa free": "border-cmt-success-500/30 bg-cmt-success-100 text-cmt-success-700",
  "Visa on arrival": "border-cmt-success-500/30 bg-cmt-success-100 text-cmt-success-700",
  "e-Visa": "border-cmt-warning-500/30 bg-cmt-warning-100 text-cmt-warning-700",
  "Embassy visa": "border-cmt-neutral-300 bg-cmt-neutral-100 text-cmt-neutral-700",
};

export default function InternationalHolidays() {
  const { international } = useSiteContent();
  const packages = usePackages();
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

        <div className="cmt-mobile-rail mt-8 grid grid-cols-1 gap-6 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((country) => {
            const { pkg: attachedPackage, href } = internationalCardTarget(country, packages);
            const price = attachedPackage?.price || internationalFromPrice(country.country, packages);
            return (
            <article
              key={country.id}
              className="group relative flex flex-col overflow-hidden rounded-cmt-md border border-cmt-neutral-200 bg-white shadow-cmt-sm transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-cmt-neutral-300 hover:shadow-cmt-md"
            >
              {country.image && (
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-cmt-neutral-100">
                  <ContentImage
                    src={country.image}
                    alt={country.alt}
                    fill
                    quality={90}
                    sizes="(max-width: 639px) min(86vw, 320px), (max-width: 1023px) calc((100vw - 72px) / 2), (max-width: 1487px) calc((100vw - 96px) / 3), 464px"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
              )}

              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-cmt-neutral-500">{country.region}</p>
                    <h3 className="mt-0.5 font-display text-lg font-semibold leading-snug text-cmt-neutral-900">
                      {country.country}
                    </h3>
                  </div>

                  <span
                    className={`shrink-0 rounded-cmt-full border px-2.5 py-1 text-xs font-semibold ${VISA_TONES[country.visa]}`}
                  >
                    {country.visa}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-cmt-neutral-600">{country.hook}</p>

                <dl className="mt-5 space-y-2.5 border-t border-cmt-neutral-100 pt-4 text-sm">
                  <div className="flex items-start gap-2">
                    <dt className="flex w-[84px] sm:w-[104px] shrink-0 items-center gap-1.5 text-xs font-medium text-cmt-neutral-500">
                      <Plane className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                      Visa
                    </dt>
                    <dd className="text-sm text-cmt-neutral-700">{country.visaNote}</dd>
                  </div>

                  <div className="flex items-start gap-2">
                    <dt className="flex w-[84px] sm:w-[104px] shrink-0 items-center gap-1.5 text-xs font-medium text-cmt-neutral-500">
                      <Sun className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                      Best season
                    </dt>
                    <dd className="text-sm text-cmt-neutral-700">{country.bestMonths}</dd>
                  </div>

                  <div className="flex items-start gap-2">
                    <dt className="flex w-[84px] sm:w-[104px] shrink-0 items-center gap-1.5 text-xs font-medium text-cmt-neutral-500">
                      <Clock className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                      Flight duration
                    </dt>
                    <dd className="text-sm tabular-nums text-cmt-neutral-700">
                      {country.flightHours}
                    </dd>
                  </div>

                  <div className="flex items-start gap-2">
                    <dt className="flex w-[84px] sm:w-[104px] shrink-0 items-center gap-1.5 text-xs font-medium text-cmt-neutral-500">
                      <Wallet className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                      Currency
                    </dt>
                    <dd className="text-sm text-cmt-neutral-700">{country.currency}</dd>
                  </div>
                </dl>

                <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-cmt-neutral-100 pt-4">
                  {price ? <Price price={price} qualifier="/person" /> : <p className="font-display text-lg font-bold text-cmt-neutral-900 sm:text-xl">Ask for a quote</p>}

                  <Link
                    href={href}
                    aria-label={attachedPackage ? `View package: ${attachedPackage.title}` : `Browse international packages for ${country.country}`}
                    className="relative z-10 inline-flex h-11 shrink-0 sm:h-9 items-center justify-center rounded-cmt-control bg-cmt-primary-500 px-5 text-sm font-semibold text-cmt-neutral-900 shadow-cmt-xs transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:bg-cmt-primary-600 hover:shadow-cmt-primary active:translate-y-0 active:bg-cmt-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
                  >
                    View Package
                  </Link>
                </div>
                </div>
              {/* Whole card opens the package. Separate from the button because the
                  button lifts on hover, which would collapse an ::after overlay. */}
              <Link href={href} aria-hidden="true" tabIndex={-1} className="absolute inset-0" />
            </article>
            );
          })}
        </div>

        {footnote && (
          <p className="mt-6 text-xs leading-relaxed text-cmt-neutral-500">{footnote}</p>
        )}
      </div>
    </section>
  );
}

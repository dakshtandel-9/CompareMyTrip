"use client";

import Image from "next/image";
import { useState } from "react";
import { Download, MapPin } from "lucide-react";
import { isCruiseDemo, publicCruises, type CruiseListing } from "@/lib/cruiseListings";
import { useCruisesState } from "@/lib/useCruises";
import { useSiteContent } from "@/lib/useSiteContent";
import { bannerFor } from "@/lib/siteContent";
import CruiseQuoteModal from "./CruiseQuoteModal";

/* Matches the catalogue's own price formatting. */
const formatINR = (value: number) => `₹${value.toLocaleString("en-IN")}`;

/* ------------------------------------------------------------------ */
/* The cruise cards.                                                    */
/*                                                                      */
/* A card is the whole listing — there is no detail page behind it, so  */
/* nothing here is a link. The two buttons are the only way out: an     */
/* enquiry, or the brochure PDF.                                        */
/*                                                                      */
/* Seeded from the server so the cards are in the first paint, then     */
/* kept live by the same Firestore subscription the admin uses.         */
/* ------------------------------------------------------------------ */

export default function CruiseGrid({ initialCruises }: { initialCruises: CruiseListing[] }) {
  const { cruises, loading, error } = useCruisesState();
  const { banners } = useSiteContent();
  const banner = bannerFor(banners, "packages-cruise");
  const live = loading || error ? initialCruises : cruises;
  const visible = publicCruises(live);
  const [quoteFor, setQuoteFor] = useState<CruiseListing | null>(null);

  return (
    <>
      {/* The same boxed masthead the catalogue and destination pages use —
          see PackagesCatalog's CatalogBanner. Edited in /admin/banners. */}
      <section className="flex w-full justify-center p-3 text-white sm:p-4 md:p-6">
        <div className="relative isolate flex min-h-[340px] w-full max-w-[1440px] items-center overflow-hidden rounded-2xl bg-cmt-secondary-900 px-6 py-14 sm:min-h-[400px] sm:rounded-3xl sm:px-10 sm:py-20">
          {banner.image && (
            <Image src={banner.image} alt="" fill priority sizes="(max-width: 1440px) 100vw, 1440px" className="-z-20 object-cover object-center" />
          )}
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/90 via-black/65 to-black/10" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/45 via-transparent to-black/15" />
          <div className="w-full">
            <p className="text-xs font-semibold uppercase tracking-wider text-cmt-primary-400 sm:text-sm">{banner.eyebrow}</p>
            <h1 className="mt-2 max-w-[18ch] font-display text-3xl font-semibold leading-[1.15] tracking-tight text-white [text-shadow:0_3px_18px_rgba(0,0,0,0.35)] sm:text-5xl">{banner.title}</h1>
            <p className="mt-3 max-w-xl text-pretty text-sm leading-relaxed text-white/75 [text-shadow:0_2px_12px_rgba(0,0,0,0.35)] sm:text-base">{banner.description}</p>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1440px] px-4 pb-16 pt-4 sm:px-6 md:px-8">
        <p className="mb-6 text-sm text-cmt-neutral-500">
          {visible.some((cruise) => isCruiseDemo(cruise.id))
            ? "Sample listings with illustrative per-person prices. Not available to book."
            : "Prices are per person, from. Request a quote for cabins and dates."}
        </p>

      {/* gap-5 as the catalogue grid. That one breaks to three at xl because
          it loses 240px to the filter column; this page is full width, so it
          reaches three a step earlier. */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((cruise) => (
          /* Same shell as the package card in PackagesCatalog — the shared
             cmt-catalog-card class carries the mobile sizing, so a cruise and
             a package read as one family on the phone too. */
          <article
            key={cruise.id}
            className="cmt-catalog-card group relative flex min-w-0 flex-col overflow-hidden rounded-cmt-md border border-cmt-neutral-200 bg-white shadow-cmt-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-cmt-neutral-300 hover:shadow-cmt-md"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-cmt-neutral-100">
              {cruise.image && (
                <Image
                  src={cruise.image}
                  alt={cruise.route || cruise.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.035]"
                />
              )}
              {cruise.badge && (
                <div className="absolute inset-x-3 top-3 flex">
                  <span className="rounded-cmt-full border border-white/70 bg-white/95 px-2.5 py-1 text-xs font-semibold text-cmt-neutral-900 shadow-cmt-xs">
                    {cruise.badge}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col p-4">
              {cruise.route && (
                <p className="flex min-w-0 items-center gap-1 text-xs font-medium text-cmt-neutral-500">
                  <MapPin className="size-3.5 shrink-0" strokeWidth={2} />
                  <span className="truncate">{cruise.route}</span>
                </p>
              )}

              <h2 className="mt-2 line-clamp-2 min-h-[44px] font-display text-base font-semibold leading-[1.35] text-cmt-neutral-900">
                {cruise.name}
              </h2>

              {cruise.pitch && (
                <p className="mt-2 line-clamp-2 text-xs text-cmt-neutral-600">{cruise.pitch}</p>
              )}

              {/* mt-auto keeps the price rule on the card's floor, so the row
                  lines up across cards whatever length the pitch runs to. */}
              <div className="mt-auto border-t border-cmt-neutral-100 pt-4">
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-cmt-neutral-500">From</p>
                    <p className="whitespace-nowrap font-display text-lg font-bold text-cmt-neutral-900">
                      {formatINR(cruise.fromPrice)}
                      <span className="ml-1 font-body text-xs font-normal text-cmt-neutral-500">
                        /person
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuoteFor(cruise)}
                    className="inline-flex h-10 shrink-0 items-center justify-center rounded-cmt-control bg-cmt-primary-500 px-4 text-sm font-semibold text-cmt-neutral-900 shadow-cmt-xs transition-colors hover:bg-cmt-primary-600 focus-visible:outline-none focus-visible:shadow-[var(--cmt-focus-ring)]"
                  >
                    Get quote
                  </button>
                </div>

                {cruise.brochureUrl && (
                  /* `download` names the saved file after the cruise rather
                     than the bucket's uuid. It only applies same-origin, so
                     an R2-hosted PDF still opens in a tab — the link works
                     either way, and the browser can save it from there. */
                  <a
                    href={cruise.brochureUrl}
                    download={`${cruise.name} brochure.pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-cmt-control border border-cmt-neutral-200 px-4 text-sm font-semibold text-cmt-neutral-700 transition-colors hover:border-cmt-neutral-300 hover:text-cmt-neutral-900 focus-visible:outline-none focus-visible:shadow-[var(--cmt-focus-ring)]"
                  >
                    <Download className="size-3.5" aria-hidden="true" />
                    Download brochure
                    <span className="sr-only">for {cruise.name} (PDF)</span>
                  </a>
                )}
              </div>
            </div>
          </article>
        ))}
        </div>
      </div>

      {quoteFor && <CruiseQuoteModal cruise={quoteFor} cruises={visible} onClose={() => setQuoteFor(null)} />}
    </>
  );
}

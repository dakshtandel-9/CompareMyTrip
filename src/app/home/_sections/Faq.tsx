"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown } from "lucide-react";

import { Glyph } from "@/lib/adminIcons";
import { useSiteContent } from "@/lib/useSiteContent";
import SectionHeader from "../_components/SectionHeader";

/* ------------------------------------------------------------------ */
/* FAQ — design.md §15.5 C-6 asks for a single 760px column, which at   */
/* desktop width leaves the band mostly empty either side of a thin     */
/* strip of text. The measure is kept where it matters (the answer is   */
/* still capped at 65ch) but the header and the still-need-help card    */
/* move into a sticky rail, and the questions become cards beside it.   */
/* Everything C-6 specifies that carries the brand is unchanged:        */
/* left-aligned rows, question in display 600 #0F172A, answer in        */
/* #334155, chevron rotating 180° over 300ms (§13 --motion-slow), one   */
/* row open by default and any number open at once.                     */
/*                                                                      */
/* Still built on <details>, so it opens without any JavaScript of ours  */
/* and announces as a disclosure to a screen reader without any ARIA of  */
/* our own. (The component itself is now client-side, because the        */
/* questions are edited in /admin.)                                      */
/* ------------------------------------------------------------------ */

export default function Faq() {
  const { faq } = useSiteContent();
  const pathname = usePathname();

  if (!faq.enabled) return null;

  const { header, items, help } = faq;

  /* The escape hatch is "still not answered? talk to the team", and it ships
     pointing at /contact — where this same section is also rendered. Offering
     a reader the page they are already on is a dead end, so the card steps
     aside there and the questions take the width. Comparing hrefs rather than
     hard-coding the route keeps it right if the CTA is ever repointed. */
  const helpHref = help.ctaHref.split(/[?#]/)[0].replace(/\/$/, "");
  const here = pathname.replace(/\/$/, "");
  const showHelp = helpHref !== "" && helpHref !== here;

  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="w-full border-t border-cmt-neutral-100 bg-cmt-neutral-50 px-3 py-12 sm:px-4 sm:py-16 md:px-6 lg:py-20"
    >
      <div className="mx-auto grid w-full max-w-[1440px] gap-10 lg:grid-cols-12 lg:gap-14 xl:gap-20">
        {/* Rail. Pinned on desktop so the escape hatch stays reachable while
            the reader works down a list taller than the viewport. */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="lg:sticky lg:top-24">
            <SectionHeader
              eyebrow={header.eyebrow}
              title={<span id="faq-title">{header.title}</span>}
              description={header.description}
            />

            {showHelp && (
            <div className="mt-8 rounded-cmt-lg border border-cmt-neutral-200 bg-white p-6 shadow-cmt-xs">
              <span className="flex h-10 w-10 items-center justify-center rounded-cmt-full bg-cmt-primary-100 text-cmt-primary-800">
                <Glyph name={help.icon} className="h-5 w-5" />
              </span>

              <p className="mt-4 font-display text-lg font-semibold text-cmt-neutral-900">
                {help.title}
              </p>

              <p className="mt-2 text-sm leading-relaxed text-cmt-neutral-600">
                {help.description}
              </p>

              <Link
                href={help.ctaHref}
                className="group mt-5 inline-flex h-11 items-center gap-2 rounded-cmt-control bg-cmt-primary-500 px-5 text-sm font-semibold text-cmt-neutral-900 transition-colors hover:bg-cmt-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
              >
                {help.ctaLabel}
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
              </Link>
            </div>
            )}
          </div>
        </div>

        {/* Questions */}
        <ul className="flex flex-col gap-3 lg:col-span-7 xl:col-span-8">
          {items.map((item, index) => (
            <li key={item.id}>
              <details
                open={index === 0}
                className="cmt-faq group rounded-cmt-md border border-cmt-neutral-200 bg-white transition-[border-color,box-shadow] duration-300 open:border-cmt-primary-400 open:shadow-cmt-sm"
              >
                <summary className="group/row flex cursor-pointer list-none items-start gap-4 p-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 sm:p-6 [&::-webkit-details-marker]:hidden">
                  <span
                    className="mt-0.5 w-8 shrink-0 font-display text-sm font-semibold tabular-nums text-cmt-primary-700"
                    aria-hidden="true"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <h3 className="flex-1 font-display text-base font-semibold leading-snug text-cmt-neutral-900 transition-colors group-hover/row:text-cmt-primary-900 sm:text-lg">
                    {item.question}
                  </h3>

                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-cmt-full border border-cmt-neutral-200 bg-cmt-neutral-50 text-cmt-neutral-600 transition-[transform,background-color,border-color,color] duration-300 group-hover/row:border-cmt-neutral-300 group-open:rotate-180 group-open:border-cmt-primary-500 group-open:bg-cmt-primary-500 group-open:text-cmt-neutral-900">
                    <ChevronDown className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                  </span>
                </summary>

                <div className="px-5 pb-5 sm:px-6 sm:pb-6">
                  <p className="max-w-[65ch] text-sm leading-relaxed text-cmt-neutral-700 sm:pl-12 sm:text-base">
                    {item.answer}
                  </p>
                </div>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

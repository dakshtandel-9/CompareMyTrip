"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Glyph } from "@/lib/adminIcons";
import { useSiteContent } from "@/lib/useSiteContent";
import ContentImage from "../_components/ContentImage";
import RailButton from "../_components/RailButton";
import SectionHeader from "../_components/SectionHeader";

/* ------------------------------------------------------------------ */
/* Quick travel categories — a photo rail. Each card is a picture of the */
/* style it sells, with the category icon sitting on the photo's bottom   */
/* edge as a 48px gold disc (§15.2 F-2 icon treatment, sized up to carry  */
/* against a photograph).                                                */
/*                                                                       */
/* The nine categories shipped are the approved set from §15.3, and they   */
/* are now the defaults behind the /admin CRM rather than a hard-coded     */
/* list: title, small line, icon, photo and link are all editable, and the */
/* rail scrolls rather than dropping any, with the header arrows driving   */
/* it.                                                                    */
/*                                                                       */
/* Photography: every India card names the place it actually shows. The   */
/* three cards drawn from the site's own cinematic footage               */
/* (/public/categories, see CREDITS.txt) are described generically for    */
/* the same reason — they are scenes, not locations we can name.          */
/* ------------------------------------------------------------------ */

/* Two cards per press, which keeps a partial card in view as the hint
   that the rail continues. */
const CARDS_PER_PRESS = 2;

export default function QuickTravelCategories() {
  const { categories } = useSiteContent();
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
  }, [syncEdges, categories.cards.length]);

  const scrollRail = (direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;

    const card = rail.querySelector("li");
    const gap = 20;
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
  if (!categories.enabled) return null;

  return (
    <section
      id="travel-categories"
      aria-labelledby="travel-categories-title"
      className="w-full border-t border-cmt-neutral-100 bg-cmt-neutral-50 py-12 sm:py-16"
    >
      <div className="mx-auto w-full max-w-[1440px] px-3 sm:px-4 md:px-6">
        <SectionHeader
          eyebrow={categories.eyebrow}
          title={<span id="travel-categories-title">{categories.title}</span>}
          description={categories.description}
          action={
            <div className="hidden shrink-0 items-center gap-3 sm:flex">
              <RailButton
                label="Show previous travel styles"
                icon={ArrowLeft}
                disabled={atStart}
                onClick={() => scrollRail(-1)}
              />
              <RailButton
                label="Show more travel styles"
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
        className="cmt-style-rail mt-8 flex w-full snap-x snap-mandatory scroll-px-3 gap-5 overflow-x-auto px-3 pb-4 pt-1 sm:mt-10 sm:px-4 md:px-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {categories.cards.map((card) => {
          const { id, label, tagline, href, image, alt } = card;

          return (
          <li key={id} className="w-[236px] shrink-0 snap-start sm:w-[260px]">
            <Link
              href={href}
              className="group flex h-full flex-col rounded-cmt-lg border border-cmt-neutral-200 bg-white p-2.5 shadow-cmt-sm transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-1 hover:border-cmt-neutral-300 hover:shadow-cmt-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
            >
              <div className="relative">
                <div className="relative aspect-[3/2] w-full overflow-hidden rounded-cmt-md bg-cmt-neutral-100">
                  <ContentImage
                    src={image}
                    alt={alt}
                    fill
                    sizes="(max-width: 640px) 236px, 260px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                {/* Sits astride the photo's bottom edge, the way the badge
                    reads in the reference layout. */}
                <span className="absolute bottom-0 left-1/2 grid size-12 -translate-x-1/2 translate-y-1/2 place-items-center rounded-cmt-full bg-cmt-primary-500 text-cmt-neutral-900 shadow-cmt-md transition-colors duration-200 group-hover:bg-cmt-primary-600">
                  <Glyph name={card.icon} className="size-5" />
                </span>
              </div>

              <div className="flex flex-1 flex-col items-center px-3 pb-4 pt-9 text-center">
                <h3 className="font-display text-lg font-bold leading-tight text-cmt-neutral-900">
                  {label}
                </h3>

                <p className="mt-1.5 text-sm leading-snug text-cmt-neutral-600">{tagline}</p>
              </div>
            </Link>
          </li>
          );
        })}
      </ul>
    </section>
  );
}

"use client";

import AccordionGallery from "@/components/AccordionGallery";
import { buildDestinations, destinationHref, destinationSlug, findDestinationBySlug } from "@/lib/destinations";
import { toIndiaState } from "@/lib/indiaStates";
import { usePackages } from "@/lib/usePackages";
import { useSiteContent } from "@/lib/useSiteContent";
import SectionHeader from "../_components/SectionHeader";

/* ------------------------------------------------------------------ */
/* Domestic holidays — the seven-panel image showcase carried over from  */
/* the existing homepage. Panels link to destinations and carry a       */
/* photo, the place and one line about it: no price, badge or CTA, so the */
/* photography does the work (design.md §9).                             */
/* Photos live in /public/destinations (see CREDITS.txt for sourcing).    */
/* ------------------------------------------------------------------ */

export default function DomesticHolidays() {
  const { domestic } = useSiteContent();
  const packages = usePackages();
  if (!domestic.enabled) return null;

  const { header, items, defaultIndex } = domestic;
  const destinations = buildDestinations(packages);
  const galleryItems = items.map((item) => {
    const label = item.label.trim();
    const name = label.toLowerCase() === "spiti valley"
      ? "Himachal Pradesh"
      : label.toLowerCase() === "andaman islands"
        ? "Andaman & Nicobar Islands"
        : toIndiaState(label);
    const destination = findDestinationBySlug(destinations, destinationSlug(name));

    // Resolve from the place shown, including saved cards with old package
    // links. Destinations without published packages have no detail page yet.
    return { ...item, link: destination ? destinationHref(destination.name) : "/destinations" };
  });

  return (
    <section
      id="domestic-holidays"
      aria-labelledby="domestic-holidays-title"
      className="w-full border-t border-cmt-neutral-100 bg-white px-3 py-12 sm:px-4 sm:py-16 md:px-6 lg:py-20"
    >
      <div className="mx-auto w-full max-w-[1440px]">
        <SectionHeader
          eyebrow={header.eyebrow}
          title={<span id="domestic-holidays-title">{header.title}</span>}
          description={header.description}
          actionLabel={header.actionLabel}
          actionHref={header.actionHref}
        />

        <div className="mt-8 sm:mt-10">
          <AccordionGallery
            items={galleryItems}
            defaultIndex={defaultIndex}
            expandRatio={0.42}
            height={520}
            gap={12}
            radius={24}
            accentColor="#ffc40c"
            overlayColor="#020617"
            trigger="hover"
          />
        </div>
      </div>
    </section>
  );
}

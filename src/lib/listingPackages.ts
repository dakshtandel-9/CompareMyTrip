import type { TravelPackage } from "@/lib/packageData";

/**
 * A package as the listing surfaces use it — catalogue cards and filters,
 * the homepage rails and search, comparisons and the compare bar.
 *
 * They read the card fields plus a little of `details`: stays, inclusions,
 * transfers, meals, flights, cancellation, facts, pickup locations, and each
 * day's title, route and activity titles. Everything else in `details` is the
 * detail page's own content — write-ups, custom page sections, galleries and
 * per-day descriptions and photos — and is about two thirds of the catalogue's
 * size, all of which would otherwise ship inside every listing page.
 */
export function toListingPackage(pkg: TravelPackage): TravelPackage {
  const details = pkg.details;
  if (!details) return pkg;
  const locations = details.pageSections?.locations;
  return {
    ...pkg,
    details: {
      ...details,
      gallery: [],
      summary: "",
      highlights: [],
      exclusions: [],
      itinerary: details.itinerary.map((day) => ({
        ...day,
        description: "",
        activities: day.activities?.map((activity) => ({ time: activity.time, title: activity.title, description: "" })),
      })),
      pageSections: locations
        ? {
            hiddenSections: [],
            sections: [],
            gallery: { enabled: false, images: [] },
            locations,
            reviews: { enabled: false, items: [] },
          }
        : undefined,
    },
  };
}

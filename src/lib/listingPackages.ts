import { isAudienceFact } from "@/lib/bengaluruTravel";
import type { PackageDetails, TravelPackage } from "@/lib/packageData";
import { getTravellerRating } from "@/lib/planComparison";
import { plainPackageText } from "@/lib/packageRichText";

/** The booking card's own copy; only the detail page renders it. */
const BOOKING_CARD_FIELDS = ["bookingBadges", "bookingLabel", "bookingHeading", "bookingTitle", "quoteNote"] as const;

/**
 * A package as the listing surfaces use it — catalogue cards and filters,
 * the homepage rails and search, comparisons and the compare bar.
 *
 * They read the card fields plus a little of `details`: stays, inclusions,
 * transfers, meals, flights, cancellation, availability, the facts that say
 * who a trip suits, pickup locations, and each day's title, route and
 * activity titles. Everything else in `details` is the detail page's own
 * content — write-ups, booking-card copy, custom page sections, galleries and
 * per-day descriptions and photos — and is about two thirds of the catalogue's
 * size, all of which would otherwise ship inside every listing page.
 *
 * What remains is read only as plain text (plainPackageText in planComparison
 * and bengaluruTravel), so formatted text goes out as that text: the editor's
 * formatting markup was most of what was left, and listing pages are rewritten
 * whenever any package is published. Only the detail page renders formatting,
 * and it reads the full package.
 *
 * Written reviews are left behind with the rest of the detail page's content,
 * but the rating they add up to is not: it is worked out here, while the
 * reviews are still attached, and carried on the card's own rating fields —
 * otherwise cards and comparisons would show only the summary typed into the
 * CRM, and a package rated through written reviews would show no rating.
 */
export function toListingPackage(pkg: TravelPackage): TravelPackage {
  const details = pkg.details;
  if (!details) return pkg;
  const plain = (value: string) => plainPackageText(value);
  const locations = details.pageSections?.locations;
  const listed: PackageDetails = { ...details };
  for (const field of BOOKING_CARD_FIELDS) delete listed[field];
  const travellerRating = getTravellerRating(pkg);
  return {
    ...pkg,
    ...(travellerRating && { rating: travellerRating.rating, reviews: travellerRating.reviews }),
    details: {
      ...listed,
      gallery: [],
      summary: "",
      highlights: [],
      exclusions: [],
      places: details.places.map(plain),
      inclusions: details.inclusions.map(plain),
      meals: plain(details.meals),
      transfers: plain(details.transfers),
      flights: plain(details.flights),
      cancellationPolicy: plain(details.cancellationPolicy),
      stays: details.stays.map((stay) => ({ ...stay, name: plain(stay.name), place: plain(stay.place), comfort: plain(stay.comfort) })),
      facts: details.facts?.filter(isAudienceFact).map((fact) => fact.value === undefined ? fact : { ...fact, value: plain(fact.value) }),
      itinerary: details.itinerary.map((day) => ({
        ...day,
        title: plain(day.title),
        route: plain(day.route),
        description: "",
        activities: day.activities?.map((activity) => ({ time: activity.time, title: plain(activity.title), description: "" })),
      })),
      pageSections: locations
        ? {
            hiddenSections: [],
            sections: [],
            gallery: { enabled: false, images: [] },
            // Departure filters read where each pickup is, not its notes or photos.
            locations: {
              ...locations,
              items: locations.items.map((item) => ({ ...item, notes: "", mapUrl: "", image: "" })),
            },
            reviews: { enabled: false, items: [] },
          }
        : undefined,
    },
  };
}

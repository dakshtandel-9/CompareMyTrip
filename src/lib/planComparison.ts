import { departureDaysLabel, getPackageDetails, getPackageItinerary, type TravelPackage } from "@/lib/packageData";
import { plainPackageText } from "@/lib/packageRichText";
import { getPackagePageSections, getVisiblePackageReviews } from "@/lib/packageDetailSections";

const CONFIRM = "Confirm with our travel team";
const text = (value: string | undefined) => plainPackageText(value ?? "").trim();
const lines = (values: string[]) => values.map(text).filter(Boolean).join("\n");

/** The rating a traveller sees for a package, or null when it has none.
    Written reviews added in the CRM win, averaged to one decimal — the same
    figure the package page shows; otherwise the entered rating summary. */
export function getTravellerRating(pkg: TravelPackage): { rating: number; reviews: number } | null {
  const written = getVisiblePackageReviews(getPackagePageSections(getPackageDetails(pkg)));
  if (written.length) {
    const total = written.reduce((sum, review) => sum + review.rating, 0);
    return { rating: Math.round((total / written.length) * 10) / 10, reviews: written.length };
  }
  return pkg.rating > 0 && pkg.reviews > 0 ? { rating: pkg.rating, reviews: pkg.reviews } : null;
}

export function hasTravellerRating(pkg: TravelPackage) {
  return getTravellerRating(pkg) !== null;
}

/** Both comparison surfaces use the published plan details, including unknowns.
 * Weekday rules describe departures, not confirmed availability on a date. */
export function getPlanComparison(pkg: TravelPackage) {
  const details = getPackageDetails(pkg);
  const itinerary = getPackageItinerary(details);
  const stays = lines(details.stays.map((stay) =>
    [stay.name, stay.place, stay.comfort, stay.nights > 0 ? `${stay.nights} night${stay.nights === 1 ? "" : "s"}` : ""]
      .map(text).filter(Boolean).join(" · "),
  ));
  const departures = departureDaysLabel(pkg);
  const availability = text(details.availabilityNote);

  return {
    destinations: lines(details.places) || text(pkg.location) || text(pkg.destination) || CONFIRM,
    accommodation: stays || (pkg.hotelStars > 0 ? `${pkg.hotelStars}★ hotels · Names to be confirmed` : CONFIRM),
    inclusions: lines(details.inclusions) || CONFIRM,
    activities: lines([...new Set(itinerary.flatMap((day) =>
      (day.activities ?? []).map((activity) => text(activity.title)).filter(Boolean),
    ))]) || CONFIRM,
    itinerary: lines(itinerary.map((day) =>
      `Day ${day.day}: ${[day.title, day.route].map(text).filter(Boolean).join(" · ") || CONFIRM}`,
    )) || CONFIRM,
    dates: [departures, availability, "Confirm your preferred dates with our team"].filter(Boolean).join("\n"),
    meals: text(details.meals) || CONFIRM,
    transfers: text(details.transfers) || CONFIRM,
    flights: text(details.flights) || CONFIRM,
    cancellation: text(details.cancellationPolicy) || CONFIRM,
    bestFor: pkg.tags.length > 0 ? pkg.tags.join(" · ") : "All travellers",
  };
}

export type ComparedAttributes = ReturnType<typeof getPlanComparison>;

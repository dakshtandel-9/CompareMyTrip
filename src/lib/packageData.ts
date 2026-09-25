import type { PackagePageSections } from "@/lib/packageDetailSections";
import type { WeekendTrackId } from "@/lib/weekendTracks";

export type PackageCategory =
  | "Honeymoon"
  | "Family"
  | "Adventure"
  | "Treks"
  | "Weekend Treks"
  | "Beaches"
  | "Mountains"
  | "Heritage"
  | "Wildlife"
  | "Luxury"
  | "Spiritual"
  | "Cruise"
  | "Hotels";

export type PackageItineraryDay = {
  day: number;
  title: string;
  route: string;
  description: string;
  meals: string;
  /** Photos are optional; up to three print under the activity in the itinerary PDF. */
  activities?: { time: string; title: string; description: string; images?: string[] }[];
};

export type PackageStay = {
  name: string;
  nights: number;
  place: string;
  comfort: string;
  roomType?: string;
  mealPlan?: string;
  checkIn?: string;
  checkOut?: string;
  /* Optional hotel-card extras. A stay shows as a plain entry without them
     and gains the star row, photo and inclusion line as each is filled in. */
  stars?: number;
  image?: string;
  roomInclusion?: string;
};

export type PackageBookingBadge = {
  id: "package" | "stay" | "flights";
  text: string;
  /** Empty hides the icon without hiding the text. */
  icon: string;
  visible: boolean;
};

export type PackageDetails = {
  /** Missing badges retain the existing package/stay/flight labels. */
  bookingBadges?: PackageBookingBadge[];
  /** Empty label uses the stay-based tier. Empty notes intentionally hide their text. */
  bookingLabel?: string;
  /** Empty card headings retain the original package/location text. */
  bookingHeading?: string;
  bookingTitle?: string;
  availabilityNote?: string;
  quoteNote?: string;
  /** Optional content and visibility choices for this package's detail page. */
  pageSections?: PackagePageSections;
  /** Missing uses the six standard boxes; an empty list intentionally removes the bar. */
  facts?: PackageFact[];
  factsHidden?: boolean;
  /** Set per package by the admin; required permits link to Aranya Vihaara. */
  permitRequired?: boolean;
  /** Hide the permit status and booking link without changing the requirement. */
  permitHidden?: boolean;
  gallery: string[];
  summary: string;
  places: string[];
  highlights: string[];
  itinerary: PackageItineraryDay[];
  /** False hides Day 0 while retaining its content for later. Missing preserves older packages. */
  dayZeroEnabled?: boolean;
  stays: PackageStay[];
  inclusions: string[];
  exclusions: string[];
  meals: string;
  transfers: string;
  flights: string;
  cancellationPolicy: string;
};

export type PackageFactSource = "duration" | "groupSize" | "stay" | "transfers" | "meals" | "flights";

export type PackageFact = {
  id: string;
  icon: string;
  label: string;
  visible: boolean;
  /** Standard boxes follow package fields until the editor supplies custom text. */
  source?: PackageFactSource;
  value?: string;
};

export type TravelPackage = {
  id: string;
  href?: string;
  title: string;
  location: string;
  /** Headline destination the package is filed under ("Kerala", "Bali").
      Drives the destination filter, so it is the grouped name rather than the
      full stop-by-stop route in `location`. */
  destination: string;
  image: string;
  nights: number;
  days: number;
  pax: string;
  hotelStars: number;
  /** 0 hides difficulty; missing preserves the legacy weekend-trek grade. */
  trekGrade?: 0 | 1 | 2 | 3;
  /** Which weekend track this trek is filed under, assigned in /admin/packages.
      Unset falls back to matching the title against the track keywords, so
      packages nobody has filed by hand keep the track they already showed on.
      Null explicitly removes the trek from all tracks.
      Only meaningful while the package carries the Weekend Treks tag. */
  weekendTrack?: WeekendTrackId | null;
  tags: PackageCategory[];
  region: "India" | "International";
  operator: string;
  rating: number;
  reviews: number;
  discount: number;
  originalPrice: number;
  price: number;
  /** Editorially picked "best deal". Not derived from the discount — a package
      can be keenly priced without being on sale — so it is set per package and
      drives the deals toggle on the catalogue and the badge on the price card. */
  deal?: boolean;
  /** Draft packages stay inside the CRM: they are kept out of the public
      catalogue, out of the sitemap and out of every server-rendered page.
      Documents written before this field existed carry no status and are
      treated as published, so adding it never retires a live package. */
  status?: "draft" | "published";
  /** Weekdays this trip actually departs on, as JS day numbers — 0 Sunday
      through 6 Saturday. A Sundays-only trek is [0]; a weekend trek [0, 6].

      Undefined or empty means every day, which is how every package written
      before this field existed behaves and why it is optional: adding it
      cannot accidentally close a running package's calendar. */
  departureDays?: number[];
  details?: PackageDetails;
};

/** Day numbers in the order a calendar shows them. */
export const WEEKDAYS = [
  { value: 0, short: "Sun", letter: "S" },
  { value: 1, short: "Mon", letter: "M" },
  { value: 2, short: "Tue", letter: "T" },
  { value: 3, short: "Wed", letter: "W" },
  { value: 4, short: "Thu", letter: "T" },
  { value: 5, short: "Fri", letter: "F" },
  { value: 6, short: "Sat", letter: "S" },
] as const;

/** The departure days a package really runs, de-duplicated and in week
    order. An empty array means "no restriction" rather than "never": a
    package with nothing selected departs any day, which is the only reading
    that keeps older packages working. */
export function departureDays(pkg: Pick<TravelPackage, "departureDays">): number[] {
  const raw = pkg.departureDays;
  if (!Array.isArray(raw)) return [];
  const days = [...new Set(raw.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))];
  // Every day selected is the same as no restriction, and saying so here
  // keeps "Departs daily" out of the UI as a pointless caveat.
  return days.length === 7 ? [] : days.sort((a, b) => a - b);
}

/** Whether a YYYY-MM-DD day is one this package can depart on. Anything
    unparseable is left for the date normaliser to reject. */
export function isDepartureAllowed(
  pkg: Pick<TravelPackage, "departureDays">,
  date: string,
): boolean {
  const allowed = departureDays(pkg);
  if (allowed.length === 0) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return true;
  const [year, month, day] = date.split("-").map(Number);
  return allowed.includes(new Date(year, month - 1, day).getDay());
}

/** How the rule reads to a traveller: "Departs Sundays only", "Weekends
    only", "Mon, Wed & Fri". Empty when the package departs any day. */
export function departureDaysLabel(pkg: Pick<TravelPackage, "departureDays">): string {
  const allowed = departureDays(pkg);
  if (allowed.length === 0) return "";

  const isWeekend = allowed.length === 2 && allowed.includes(0) && allowed.includes(6);
  if (isWeekend) return "Weekends only";

  const weekdaysOnly = allowed.length === 5 && !allowed.includes(0) && !allowed.includes(6);
  if (weekdaysOnly) return "Weekdays only";

  const names = allowed.map((day) => WEEKDAYS[day].short);
  if (names.length === 1) return `${names[0]}days only`;
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]} only`;
}

export const PACKAGE_CATEGORIES: PackageCategory[] = [
  "Honeymoon",
  "Family",
  "Adventure",
  "Treks",
  "Weekend Treks",
  "Beaches",
  "Mountains",
  "Heritage",
  "Wildlife",
  "Luxury",
  "Spiritual",
  "Cruise",
  "Hotels",
];

export const PACKAGE_STORAGE_KEY = "comparemytrip-admin-packages";
export const PACKAGE_UPDATE_EVENT = "comparemytrip-packages-updated";

export function readAdminPackages(): TravelPackage[] {
  if (typeof window === "undefined") return [];

  try {
    const value = window.localStorage.getItem(PACKAGE_STORAGE_KEY);
    return value ? (JSON.parse(value) as TravelPackage[]) : [];
  } catch {
    return [];
  }
}

export function writeAdminPackages(packages: TravelPackage[]) {
  window.localStorage.setItem(PACKAGE_STORAGE_KEY, JSON.stringify(packages));
  window.dispatchEvent(new Event(PACKAGE_UPDATE_EVENT));
}

/* ------------------- Publication and index gating ------------------ */

/** Firestore hands back documents written by older versions of the CRM, so
    the status is read defensively: only an explicit "draft" withholds a
    package. Anything else — a missing field, a legacy document, a typo —
    keeps the package on the website, which is the safe direction to fail. */
export function isPublishedPackage(pkg: Pick<TravelPackage, "status">): boolean {
  return pkg.status !== "draft";
}

export function publishedPackages(packages: TravelPackage[]): TravelPackage[] {
  return packages.filter(isIndexablePackage);
}

/* An address or a link in the title is never marketing copy — it is a record
   somebody typed into the CRM to try the form out. Such a package remains available in the CRM, but must not reach public
   listings, the sitemap or the index, where a stray address would be republished by search engines and
   scraped. Correcting the title in the CRM makes it indexable again. */
const JUNK_TITLE = /[\w.+-]+@[\w-]+\.[\w.]+|https?:\/\/|\bwww\./i;

/** Whether a package may be offered to search engines: published, and free of
    the placeholder text that marks a half-finished record. */
export function isIndexablePackage(pkg: TravelPackage): boolean {
  return isPublishedPackage(pkg) && Boolean(pkg.title?.trim()) && !JUNK_TITLE.test(pkg.title);
}

export function isPackageDayZeroEnabled(details: Pick<PackageDetails, "itinerary" | "dayZeroEnabled">): boolean {
  return details.dayZeroEnabled ?? details.itinerary.some((day) => day.day === 0);
}

export function getPackageItinerary(details: Pick<PackageDetails, "itinerary" | "dayZeroEnabled">): PackageItineraryDay[] {
  return details.itinerary.filter((day) => day.day !== 0 || isPackageDayZeroEnabled(details)).sort((a, b) => a.day - b.day);
}

export function setPackageDayZero(details: Pick<PackageDetails, "itinerary" | "dayZeroEnabled">, enabled: boolean) {
  return {
    dayZeroEnabled: enabled,
    itinerary: enabled && !details.itinerary.some((day) => day.day === 0)
      ? [{ day: 0, title: "Overnight pickup & departure", route: "", description: "", meals: "" }, ...details.itinerary]
      : details.itinerary,
  };
}

export function getPackageDetails(pkg: TravelPackage): PackageDetails {
  // Upgrade the former default on saved packages while preserving custom notes.
  if (pkg.details && ["Compare quotes from 3 verified agents · best price", "Need a custom plan?"].includes(pkg.details.quoteNote?.trim() ?? "")) {
    return { ...pkg.details, quoteNote: "🔒 Secure payment · Instant booking confirmation" };
  }
  if (pkg.details) return pkg.details;

  const places = pkg.location.split("·").map((place) => place.trim()).filter(Boolean);
  // Never invent a schedule, inclusions, hotel, cancellation promise or
  // unrelated gallery photos for a package the operator has not completed.
  return {
    gallery: pkg.image ? [pkg.image] : [],
    summary: `${pkg.title}: ${pkg.nights} night${pkg.nights === 1 ? "" : "s"} / ${pkg.days} day${pkg.days === 1 ? "" : "s"} in ${pkg.location}. Contact the travel team for the detailed trip plan.`,
    places,
    highlights: [],
    itinerary: [],
    stays: [],
    inclusions: [],
    exclusions: [],
    meals: "Confirm with the travel team",
    transfers: "Confirm with the travel team",
    flights: "Confirm with the travel team",
    cancellationPolicy: "Request the package-specific cancellation and change terms from the travel team before booking.",
  };
}

/* ------------------------------------------------------------------ */
/* Card commerce helpers, shared by the listing cards, the booking box  */
/* and the admin preview so one package shows one discount everywhere.  */
/* ------------------------------------------------------------------ */

/** The "X% off" pill. Falls back to the gap between the two prices when
    an operator saved a package without naming a percentage. */
export function getDiscountPercent(pkg: Pick<TravelPackage, "discount" | "originalPrice" | "price">): number {
  if (pkg.discount > 0) return Math.round(pkg.discount);
  if (pkg.originalPrice > pkg.price && pkg.originalPrice > 0) {
    return Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100);
  }
  return 0;
}

/** Same maths the admin discount field runs, kept here so the builder and
    the storefront never disagree by a rupee. */
export function discountToPrice(originalPrice: number, discount: number): number {
  if (originalPrice <= 0) return 0;
  const percent = Math.min(Math.max(discount, 0), 90);
  return Math.round(originalPrice * (1 - percent / 100));
}

/** Unrated dormitories and day treks must not be advertised as zero-star hotels. */
export function getPackageAccommodationLabel(pkg: TravelPackage): string {
  if (pkg.hotelStars > 0) return `${pkg.hotelStars}★ hotels`;
  const stays = pkg.details?.stays ?? [];
  if (!stays.length) return "No accommodation";
  const roomTypes = [...new Set(stays.map(stay => stay.roomType?.trim()).filter(Boolean))];
  return roomTypes.length ? roomTypes.join(" / ") : "Stay included";
}

/** Resolve the three booking badges without changing older packages. */
export function getPackageBookingBadges(pkg: TravelPackage, details = getPackageDetails(pkg)): PackageBookingBadge[] {
  const hasStay = details.stays.length > 0;
  const flights = details.flights.trim();
  const defaults: PackageBookingBadge[] = [
    { id: "package", text: details.bookingLabel?.trim() || (hasStay ? getPackageTier(pkg.hotelStars) : "Trip package"), icon: "", visible: true },
    { id: "stay", text: hasStay ? `${pkg.hotelStars > 0 ? "STAY " : ""}${getPackageAccommodationLabel(pkg)}` : "", icon: "BedDouble", visible: hasStay },
    { id: "flights", text: /not included|no flight/i.test(flights) ? "Land only" : flights, icon: "Plane", visible: Boolean(flights) },
  ];
  return defaults.map(badge => {
    const saved = details.bookingBadges?.find(item => item.id === badge.id);
    return saved ? { ...badge, ...saved } : badge;
  });
}

/** The tier chip — "Premium" and friends — read off the hotel rating. */
export function getPackageTier(hotelStars: number): string {
  if (hotelStars >= 5) return "Luxury";
  if (hotelStars >= 4) return "Premium";
  return "Value";
}

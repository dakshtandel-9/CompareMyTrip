/* ------------------------------------------------------------------ */
/* Cruises.                                                             */
/*                                                                      */
/* A cruise is not a package. It carries no itinerary, no stays and no  */
/* detail page: the card is the whole listing, and its job is to start  */
/* an enquiry or hand over a brochure. Keeping it out of TravelPackage  */
/* is what stops the catalogue, the sitemap and the package editor from */
/* having to special-case a type that shares almost none of their       */
/* fields.                                                              */
/* ------------------------------------------------------------------ */

export type CruiseListing = {
  id: string;
  /** The cruise line, which is what the card leads with. */
  name: string;
  /** Where it sails — "Singapore · Genting Dreams". */
  route: string;
  image: string;
  /** Lead-in price per person, in ₹ like the rest of the site. */
  fromPrice: number;
  /** One line of why this one, under the price. */
  pitch: string;
  /** Free text over the photo ("Top pick"). Empty hides it. */
  badge: string;
  /** Uploaded PDF. Empty hides the Brochure button. */
  brochureUrl: string;
  /** Drafts stay out of the public page, matching packages. */
  status?: "draft" | "published";
  /** Newest first, as packages order themselves. */
  position?: number;
};

export function isPublishedCruise(cruise: CruiseListing): boolean {
  return (cruise.status ?? "published") === "published";
}

/* ------------------------------------------------------------------ */
/* Demo listings.                                                       */
/*                                                                      */
/* Shown only while nothing real is published, so the page is never     */
/* empty before the first cruise is created. They are clearly marked    */
/* and cannot be enquired about — the same contract the cruise demos    */
/* had when they were packages.                                         */
/* ------------------------------------------------------------------ */

export const CRUISE_DEMO_LISTINGS: CruiseListing[] = [
  {
    id: "demo-cruise-arabian-sea",
    name: "Star Dream Cruises",
    route: "Mumbai · Goa",
    image: "/catalogue/cruise.jpg",
    fromPrice: 17999,
    pitch: "Fastest quotes, year-round availability",
    badge: "Top pick",
    brochureUrl: "",
  },
  {
    id: "demo-cruise-singapore",
    name: "Singapore Island Voyage",
    route: "Singapore · Penang",
    image: "/catalogue/cruise-singapore.jpg",
    fromPrice: 32999,
    pitch: "Island port calls and evening performances",
    badge: "Best for families",
    brochureUrl: "",
  },
  {
    id: "demo-cruise-mediterranean",
    name: "Mediterranean Coastal Escape",
    route: "Barcelona · Marseille · Genoa",
    image: "/catalogue/cruise-mediterranean.jpg",
    fromPrice: 69999,
    pitch: "Balcony cabins and leisure time ashore",
    badge: "Premium leisure",
    brochureUrl: "",
  },
];

export function isCruiseDemo(id: string): boolean {
  return CRUISE_DEMO_LISTINGS.some((cruise) => cruise.id === id);
}

/** What the public page shows: real published cruises, or the demos while
    there are none. A draft alone must not clear the placeholders, or saving
    one would empty the page until it is published. */
export function publicCruises(cruises: CruiseListing[]): CruiseListing[] {
  const published = cruises.filter(isPublishedCruise);
  return published.length > 0 ? published : CRUISE_DEMO_LISTINGS;
}

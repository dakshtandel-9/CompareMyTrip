import type { PackageCategory, TravelPackage } from "@/lib/packageData";

export type PackageCollectionId = "cruise" | "hotels";
export const PACKAGE_COLLECTIONS: Record<PackageCollectionId, { label: string; category: PackageCategory; bannerId: string }> = {
  cruise: { label: "Cruise packages", category: "Cruise", bannerId: "packages-cruise" },
  hotels: { label: "Hotel packages", category: "Hotels", bannerId: "packages-hotels" },
};

export function parsePackageCollection(value: string | null): PackageCollectionId | null {
  const category = value?.trim().toLowerCase();
  if (category === "cruise" || category === "cruises") return "cruise";
  if (category === "hotels" || category === "hotel") return "hotels";
  return null;
}

/** Admin lists include drafts but never substitute public demo listings. */
export function managedCollectionPackages(packages: TravelPackage[], collection?: PackageCollectionId): TravelPackage[] {
  return collection ? packages.filter(pkg => pkg.tags.includes(PACKAGE_COLLECTIONS[collection].category)) : packages;
}

/** Keep the collection attached through visual edits and content imports. */
export function withPackageCollection<T extends { tags: PackageCategory[] }>(value: T, collection?: PackageCollectionId): T {
  if (!collection || value.tags.includes(PACKAGE_COLLECTIONS[collection].category)) return value;
  return { ...value, tags: [...value.tags, PACKAGE_COLLECTIONS[collection].category] };
}

type Sample = { id: string; title: string; location: string; destination: string; region: TravelPackage["region"]; days: number; price: number; hotelStars: number; tags: PackageCategory[]; image: string; highlights: string[] };
function sample(value: Sample): TravelPackage {
  const cruise = value.tags.includes("Cruise");
  return {
    ...value, hotelStars: cruise ? 0 : value.hotelStars, nights: value.days - 1, pax: "2–4 guests", operator: "Demo listing",
    rating: 0, reviews: 0, discount: 0, originalPrice: value.price,
    details: {
      gallery: [value.image],
      summary: `Demo package: ${value.title}. Explore this sample ${cruise ? "voyage" : "hotel stay"} to see how your holiday could look. Prices and inclusions are illustrative; this listing is not available to book.`,
      places: value.location.split(" · "), highlights: value.highlights,
      itinerary: [
        { day: 1, title: cruise ? "Welcome aboard" : "Check in and unwind", route: value.destination, description: cruise ? "Board your ship, settle into your cabin and explore the decks." : "Settle into your room and enjoy a relaxed afternoon at the property.", meals: "Breakfast" },
        { day: 2, title: cruise ? "A day to explore" : "A day at your own pace", route: value.location, description: value.highlights.join(". ") + ".", meals: "Breakfast" },
        { day: value.days, title: cruise ? "Return to port" : "Check out", route: value.destination, description: "Enjoy breakfast before your onward journey.", meals: "Breakfast" },
      ],
      stays: [{ name: cruise ? "Sample cruise ship" : value.title, nights: value.days - 1, place: value.destination, comfort: cruise ? "Ocean-view cabin" : `${value.hotelStars}-star sample stay`, roomType: cruise ? "Ocean-view cabin" : "Deluxe double room", mealPlan: "Breakfast" }],
      inclusions: [cruise ? "Sample cabin accommodation" : "Sample hotel accommodation", "Daily breakfast", ...value.highlights.slice(0, 2)],
      exclusions: ["Flights", "Personal expenses", "Optional activities"],
      meals: "Breakfast", transfers: "Not included", flights: "Not included",
      availabilityNote: "Sample price · Demo listing",
      quoteNote: "",
      cancellationPolicy: "This is a demo listing. No reservation or payment can be made.",
    },
  };
}

export const COLLECTION_DEMO_PACKAGES: TravelPackage[] = [
  sample({ id: "demo-cruise-arabian-sea", title: "Arabian Sea Weekend Cruise", location: "Mumbai · Goa", destination: "Maharashtra", region: "India", days: 3, price: 17999, hotelStars: 4, tags: ["Cruise", "Family", "Beaches"], image: "/catalogue/cruise.jpg", highlights: ["Ocean-view cabin", "Sunset on deck", "Onboard entertainment"] }),
  sample({ id: "demo-cruise-singapore", title: "Singapore Island Voyage", location: "Singapore · Penang", destination: "Singapore", region: "International", days: 4, price: 32999, hotelStars: 4, tags: ["Cruise", "Family", "Adventure"], image: "/catalogue/cruise-singapore.jpg", highlights: ["Island port calls", "Pool deck access", "Evening performances"] }),
  sample({ id: "demo-cruise-mediterranean", title: "Mediterranean Coastal Escape", location: "Barcelona · Marseille · Genoa", destination: "Spain", region: "International", days: 6, price: 69999, hotelStars: 5, tags: ["Cruise", "Luxury", "Heritage"], image: "/catalogue/cruise-mediterranean.jpg", highlights: ["Mediterranean ports", "Balcony cabin", "Leisure time ashore"] }),
  sample({ id: "demo-hotel-goa", title: "Palm Cove Beach Resort", location: "Candolim · Goa", destination: "Goa", region: "India", days: 3, price: 8999, hotelStars: 4, tags: ["Hotels", "Beaches", "Family"], image: "/catalogue/hotels.jpg", highlights: ["Beachside setting", "Swimming pool", "Daily breakfast"] }),
  sample({ id: "demo-hotel-coorg", title: "Coorg Hillside Retreat", location: "Madikeri · Coorg", destination: "Karnataka", region: "India", days: 3, price: 11999, hotelStars: 4, tags: ["Hotels", "Mountains", "Honeymoon"], image: "/catalogue/hotel-hills.jpg", highlights: ["Coffee estate setting", "Valley-view room", "Guided estate walk"] }),
  sample({ id: "demo-hotel-bali", title: "Bali Lagoon Villa Stay", location: "Ubud · Bali", destination: "Bali", region: "International", days: 5, price: 24999, hotelStars: 5, tags: ["Hotels", "Luxury", "Honeymoon"], image: "/categories/honeymoon.jpg", highlights: ["Private villa", "Pool access", "Tropical garden setting"] }),
];

export function isCollectionDemo(id: string): boolean {
  return COLLECTION_DEMO_PACKAGES.some((pkg) => pkg.id === id);
}

/** Samples only fill an empty collection; publishing real tagged packages replaces them. */
export function packagesForCollection(packages: TravelPackage[], collection: PackageCollectionId): TravelPackage[] {
  const category = PACKAGE_COLLECTIONS[collection].category;
  const real = packages.filter((pkg) => pkg.status !== "draft" && pkg.tags.includes(category));
  return real.length ? real : COLLECTION_DEMO_PACKAGES.filter((pkg) => pkg.tags.includes(category));
}

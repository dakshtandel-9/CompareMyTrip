import type { PackageDetails } from "@/lib/packageData";

export type PackageBuiltinSection = "about" | "highlights" | "itinerary" | "stays" | "inclusions" | "exclusions" | "cancellation";

export type PackageCustomSection = {
  id: string;
  title: string;
  layout: "box" | "boxes" | "dropdown";
  visible: boolean;
  body: string;
  items: { id: string; title: string; body: string; visible?: boolean }[];
};

export type PackageLocation = {
  id: string;
  type: "pickup" | "drop";
  name: string;
  address: string;
  notes: string;
  mapUrl: string;
  image: string;
  visible: boolean;
};

export type PackageWrittenReview = {
  id: string;
  name: string;
  rating: number;
  text: string;
  visible: boolean;
};

export type PackagePageSections = {
  hiddenSections: PackageBuiltinSection[];
  sections: PackageCustomSection[];
  gallery: { enabled: boolean; images: string[] };
  locations: { enabled: boolean; items: PackageLocation[] };
  reviews: { enabled: boolean; items: PackageWrittenReview[] };
};

export const BUILTIN_PACKAGE_SECTIONS: { id: PackageBuiltinSection; label: string }[] = [
  { id: "about", label: "About this trip" },
  { id: "highlights", label: "Highlights" },
  { id: "itinerary", label: "Day-by-day itinerary" },
  { id: "stays", label: "Where you'll stay" },
  { id: "inclusions", label: "Included" },
  { id: "exclusions", label: "Not included" },
  { id: "cancellation", label: "Cancellation policy" },
];

/** Each editor gets its own arrays; older packages keep their existing layout. */
export function defaultPackagePageSections(): PackagePageSections {
  return {
    hiddenSections: [],
    sections: [],
    gallery: { enabled: false, images: [] },
    locations: { enabled: false, items: [] },
    reviews: { enabled: false, items: [] },
  };
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((item) => item !== null && typeof item === "object" && !Array.isArray(item))
    : [];
}

const text = (value: unknown): string => typeof value === "string" ? value : "";

/** Merge incomplete stored documents without deleting content when a toggle is off. */
export function getPackagePageSections(details: Pick<PackageDetails, "pageSections">): PackagePageSections {
  const raw = record(details?.pageSections);
  const gallery = record(raw.gallery);
  const locations = record(raw.locations);
  const reviews = record(raw.reviews);
  const hidden = Array.isArray(raw.hiddenSections) ? raw.hiddenSections : [];
  return {
    hiddenSections: BUILTIN_PACKAGE_SECTIONS.filter(({ id }) => hidden.includes(id)).map(({ id }) => id),
    sections: records(raw.sections).map((section, index) => ({
      id: text(section.id) || `section-${index + 1}`,
      title: text(section.title),
      layout: section.layout === "boxes" || section.layout === "dropdown" ? section.layout : "box",
      visible: section.visible !== false,
      body: text(section.body),
      items: records(section.items).map((item, itemIndex) => ({
        id: text(item.id) || `item-${index + 1}-${itemIndex + 1}`,
        title: text(item.title),
        body: text(item.body),
        ...(item.visible === false ? { visible: false } : {}),
      })),
    })),
    gallery: {
      enabled: gallery.enabled === true,
      images: Array.isArray(gallery.images) ? gallery.images.filter((image): image is string => typeof image === "string") : [],
    },
    locations: {
      enabled: locations.enabled === true,
      items: records(locations.items).map((location, index) => ({
        id: text(location.id) || `location-${index + 1}`,
        type: location.type === "drop" ? "drop" : "pickup",
        name: text(location.name),
        address: text(location.address),
        notes: text(location.notes),
        mapUrl: text(location.mapUrl),
        image: text(location.image),
        visible: location.visible !== false,
      })),
    },
    reviews: {
      enabled: reviews.enabled === true,
      items: records(reviews.items).map((review, index) => ({
        id: text(review.id) || `review-${index + 1}`,
        name: text(review.name),
        rating: typeof review.rating === "number" ? review.rating : 5,
        text: text(review.text),
        visible: review.visible !== false,
      })),
    },
  };
}

/** Only map providers are accepted; a pasted iframe or general website is never embedded. */
export function safeMapUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || /[\u0000-\u0020\\]/.test(trimmed)) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
    const host = url.hostname;
    const google = ["google.com", "www.google.com", "google.co.in", "www.google.co.in"].includes(host)
      && /^\/maps(?:\/|$)/.test(url.pathname);
    const googleMaps = ["maps.google.com", "maps.google.co.in"].includes(host)
      && (url.pathname === "/" || /^\/maps(?:\/|$)/.test(url.pathname));
    const googleShort = host === "maps.app.goo.gl" && url.pathname.length > 1;
    const googleLegacyShort = host === "goo.gl" && /^\/maps\//.test(url.pathname);
    const otherMaps = ["maps.apple.com", "openstreetmap.org", "www.openstreetmap.org", "osm.org", "www.osm.org"].includes(host);
    return google || googleMaps || googleShort || googleLegacyShort || otherMaps ? url.href : null;
  } catch {
    return null;
  }
}

export function locationMapLink(location: Pick<PackageLocation, "mapUrl" | "address" | "name">): string | null {
  const explicit = safeMapUrl(location.mapUrl);
  if (explicit) return explicit;
  const query = location.address.trim() || location.name.trim();
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : null;
}

/** Map previews always use an address we encode, never administrator-provided iframe HTML. */
export function locationEmbedUrl(location: Pick<PackageLocation, "address">): string | null {
  const address = location.address.trim();
  return address ? `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed` : null;
}

function validImage(value: string): boolean {
  const image = value.trim();
  if (/^\/(?!\/)/.test(image) && !/[\u0000-\u0020\\]/.test(image)) return true;
  if (/^data:image\/(?:png|jpe?g|gif|webp|avif);base64,[A-Za-z0-9+/]+=*$/i.test(image)) return true;
  try {
    const url = new URL(image);
    return url.protocol === "https:" && !url.username && !url.password && !/[\u0000-\u0020\\]/.test(image);
  } catch {
    return false;
  }
}

/** Hidden drafts can remain incomplete. Enabled optional areas may also be empty. */
export function packagePageSectionsIssue(config: PackagePageSections): string | null {
  for (const [index, section] of config.sections.entries()) {
    if (!section.visible) continue;
    const label = section.title.trim() || `Custom section ${index + 1}`;
    if (!section.title.trim()) return `Add a title for custom section ${index + 1}, or hide it.`;
    if (section.layout === "box") {
      if (!section.body.trim()) return `Add text to “${label}”, or hide it.`;
    } else {
      if (!section.items.length) return `Add at least one item to “${label}”, or hide it.`;
      for (const [itemIndex, item] of section.items.entries()) {
        if (item.visible === false) continue;
        if (!item.title.trim() || !item.body.trim()) return `Add a title and text for item ${itemIndex + 1} in “${label}”.`;
      }
    }
  }
  if (config.gallery.enabled) {
    if (config.gallery.images.length > 20) return "The optional gallery can contain up to 20 images.";
    if (config.gallery.images.some((image) => !validImage(image))) return "Use an uploaded image, HTTPS image URL, or local image path in the optional gallery.";
  }
  if (config.locations.enabled) {
    for (const [index, location] of config.locations.items.entries()) {
      if (!location.visible) continue;
      const label = location.name.trim() || `Location ${index + 1}`;
      if (!location.name.trim()) return `Add a name for location ${index + 1}, or hide it.`;
      if (!location.address.trim() && !location.mapUrl.trim()) return `Add an address or map link for “${label}”.`;
      if (location.mapUrl.trim() && !safeMapUrl(location.mapUrl)) return `Use a Google Maps, Apple Maps, or OpenStreetMap HTTPS link for “${label}”.`;
      if (location.image.trim() && !validImage(location.image)) return `Use an uploaded image, HTTPS image URL, or local image path for “${label}”.`;
    }
  }
  if (config.reviews.enabled) {
    for (const [index, review] of config.reviews.items.entries()) {
      if (!review.visible) continue;
      if (!review.name.trim() || !review.text.trim()) return `Add a reviewer name and text for review ${index + 1}, or hide it.`;
      if (!Number.isInteger(review.rating) || review.rating < 1 || review.rating > 5) return `Choose a rating from 1 to 5 for review ${index + 1}.`;
    }
  }
  return null;
}

/** Include hidden images so saving another field never deletes uploads kept for later. */
export function packagePageSectionImages(config: PackagePageSections): string[] {
  return [...new Set([...config.gallery.images, ...config.locations.items.map((location) => location.image)].filter((image) => image.trim()))];
}

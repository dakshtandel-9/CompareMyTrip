import type { Metadata } from "next";

export const SITE_NAME = "CompareMyTrip";
export const DEFAULT_DESCRIPTION =
  "Compare curated travel packages side by side, including itineraries, inclusions, prices and cancellation terms.";

const LOCAL_URL = "http://localhost:3000";
const PRODUCTION_URL = "https://comparemytrip.in";

/**
 * NEXT_PUBLIC_SITE_URL can override the canonical origin. Production falls
 * back to the verified public domain and refuses a localhost value; local
 * development still uses localhost so previews and callbacks keep working.
 */
export function getSiteUrl(): URL {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  try {
    const parsed = new URL(configured || (process.env.NODE_ENV === "production" ? PRODUCTION_URL : LOCAL_URL));
    const url =
      process.env.NODE_ENV === "production" && (parsed.protocol !== "https:" || parsed.hostname !== "comparemytrip.in")
        ? new URL(PRODUCTION_URL)
        : parsed;
    url.pathname = "/";
    url.search = "";
    url.hash = "";
    return url;
  } catch {
    return new URL(process.env.NODE_ENV === "production" ? PRODUCTION_URL : LOCAL_URL);
  }
}

export function absoluteUrl(path = "/"): string {
  return new URL(path, getSiteUrl()).toString();
}

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
  index?: boolean;
  follow?: boolean;
  type?: "website" | "article";
};

export function createPageMetadata({
  title,
  description,
  path,
  image = "/images/destinations-header-banner.jpg",
  imageAlt = "Mountain landscape featured by CompareMyTrip",
  index = true,
  follow = index,
  type = "website",
}: PageMetadataOptions): Metadata {
  const canonical = absoluteUrl(path);

  return {
    title,
    description,
    alternates: { canonical },
    robots: {
      index,
      follow,
      googleBot: {
        index,
        follow,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type,
      locale: "en_IN",
      siteName: SITE_NAME,
      title,
      description,
      url: canonical,
      images: [{ url: image, alt: imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

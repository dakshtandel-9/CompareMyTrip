import { DUMMY_PACKAGES } from "@/lib/packageSeed";
import { cache } from "react";
import { unstable_cache } from "next/cache";

import { BLOG_SEED_POSTS } from "@/lib/blogSeed";
import {
  normalizeBlogPost,
  sortBlogPosts,
  type BlogPost,
} from "@/lib/blogData";
import { getAdminDb } from "@/lib/firebase/admin";
import { isPublishedCruise, type CruiseListing } from "@/lib/cruiseListings";
import {
  publishedPackages,
  type TravelPackage,
} from "@/lib/packageData";

const PACKAGE_MARKER = "_catalog";

/* The seed posts stand in whenever Firestore is unavailable. They are public
   content like any other, so they go through the same published-only gate. */
function developmentFallback<T>(name: string, fallback: () => T): T {
  if (process.env.NODE_ENV === "production") {
    throw new Error(`Cannot load published ${name}. Release content must come from the CMS; seed fallback is disabled in production.`);
  }
  console.warn(`Using development seed content for ${name}.`);
  return fallback();
}
const seedBlogPosts = () => developmentFallback("blog posts", () =>
  sortBlogPosts(BLOG_SEED_POSTS.filter((post) => post.status === "published")));

/* One read serves both the catalogue and the sitemap's lastModified dates.
   `updatedAt` is the CRM's write timestamp, which belongs to the document
   rather than to the package, so it is kept beside the catalogue instead of
   being folded into TravelPackage. */
type PackageCatalogue = {
  packages: TravelPackage[];
  /** Package id → last CRM write, for the packages that carry one. */
  updatedAt: Map<string, Date>;
};

const seedCatalogue = (): PackageCatalogue => developmentFallback("packages", () => ({
  packages: publishedPackages(DUMMY_PACKAGES),
  updatedAt: new Map(),
}));

const readPackageCatalogue = async (): Promise<PackageCatalogue> => {
  const db = getAdminDb();
  if (!db) return seedCatalogue();

  try {
    const snapshot = await db.collection("packages").get();
    const initialized = snapshot.docs.some((item) => item.id === PACKAGE_MARKER);
    if (!initialized) return seedCatalogue();

    const updatedAt = new Map<string, Date>();
    const catalogue = snapshot.docs
      .filter((item) => item.id !== PACKAGE_MARKER)
      .map((item) => {
        const data = item.data();
        // A Firestore Timestamp, but only once the document has been written
        // by a CRM version that sets it.
        const written = data.updatedAt as { toDate?: () => Date } | undefined;
        const date = typeof written?.toDate === "function" ? written.toDate() : null;
        if (date && !Number.isNaN(date.getTime())) updatedAt.set(item.id, date);

        return {
          id: item.id,
          ...(data.package as Omit<TravelPackage, "id">),
          _position:
            typeof data.position === "number" ? data.position : Number.MAX_SAFE_INTEGER,
        };
      })
      .sort((left, right) => left._position - right._position)
      .map((item) => {
        const result = { ...item };
        delete (result as { _position?: number })._position;
        return result as TravelPackage;
      });

    // Drafts are withheld here rather than at each call site, so no
    // server-rendered page, metadata block or sitemap entry can leak one.
    return { packages: publishedPackages(catalogue), updatedAt };
  } catch (error) {
    console.error("Unable to load packages for server rendering:", error instanceof Error ? error.message : "Unknown database error");
    return seedCatalogue();
  }
};

// The existing OpenNext incremental cache persists JSON. Encode Map/Date explicitly.
// Keep Cache Components off: the routes use ISR and must return real HTTP 404s.
const readCachedCatalogue = unstable_cache(async () => {
  const catalogue = await readPackageCatalogue();
  return {
    packages: catalogue.packages,
    updatedAt: Array.from(catalogue.updatedAt, ([id, date]) => [id, date.toISOString()]),
  };
}, ["published-catalogue-v3"], { revalidate: 300, tags: ["public-content"] });
const loadPackageCatalogue = cache(async (): Promise<PackageCatalogue> => {
  const catalogue = await readCachedCatalogue();
  return {
    packages: catalogue.packages,
    updatedAt: new Map(catalogue.updatedAt.map(([id, date]) => [id, new Date(date)])),
  };
});

/** Public catalogue data for server-rendered HTML, metadata and sitemap. */
export const getPublishedPackages = cache(async (): Promise<TravelPackage[]> => {
  return (await loadPackageCatalogue()).packages;
});

/** When each package was last edited in the CRM, for the sitemap. Empty for
    packages written before the CRM recorded it — an absent date is honest,
    a made-up one is not. */
export const getPackageUpdateTimes = cache(async (): Promise<Map<string, Date>> => {
  return (await loadPackageCatalogue()).updatedAt;
});

export const getPublishedPackage = cache(async (id: string) => {
  const packages = await getPublishedPackages();
  return packages.find((item) => item.id === id) ?? null;
});

/** Published-only blog data; drafts must never be emitted in public HTML. */
export const getPublishedBlogPosts = cache(unstable_cache(async (): Promise<BlogPost[]> => {
  const db = getAdminDb();
  if (!db) return seedBlogPosts();

  try {
    const snapshot = await db.collection("blogPosts").get();
    if (snapshot.empty) return [];

    return sortBlogPosts(
      snapshot.docs
        .map((item) => normalizeBlogPost(item.id, item.data().post))
        .filter((post) => post.status === "published"),
    );
  } catch (error) {
    console.error("Unable to load blog posts for server rendering:", error instanceof Error ? error.message : "Unknown database error");
    return seedBlogPosts();
  }
}, ["published-blog-v2"], { revalidate: 300, tags: ["public-content"] }));

export const getPublishedBlogPost = cache(async (slug: string) => {
  const posts = await getPublishedBlogPosts();
  return posts.find((item) => item.id === slug) ?? null;
});

/* Published cruises for /cruise. Returns [] on failure rather than throwing:
   the page falls back to the demo listings, so a database blip shows
   placeholders instead of an error. */
export const getPublishedCruises = cache(unstable_cache(async (): Promise<CruiseListing[]> => {
  const db = getAdminDb();
  if (!db) return [];

  try {
    const snapshot = await db.collection("cruises").get();
    return snapshot.docs
      .map((item) => {
        const data = item.data();
        const asText = (value: unknown) => (typeof value === "string" ? value.trim() : "");
        const price = Number(data.fromPrice);
        return {
          id: item.id,
          name: asText(data.name),
          route: asText(data.route),
          image: asText(data.image),
          fromPrice: Number.isFinite(price) ? Math.max(0, price) : 0,
          pitch: asText(data.pitch),
          badge: asText(data.badge),
          brochureUrl: asText(data.brochureUrl),
          status: data.status === "draft" ? "draft" as const : "published" as const,
          position: Number(data.position) || 0,
        };
      })
      .filter((cruise) => cruise.name && isPublishedCruise(cruise))
      .sort((a, b) => b.position - a.position);
  } catch (error) {
    console.error("Unable to load cruises for server rendering:", error instanceof Error ? error.message : "Unknown database error");
    return [];
  }
}, ["published-cruises-v1"], { revalidate: 300, tags: ["public-content"] }));

export const getDestinationCovers = cache(unstable_cache(async (): Promise<Record<string, string>> => {
  const db = getAdminDb();
  if (!db) return {};

  try {
    const snapshot = await db.collection("destinationCovers").get();
    const covers: Record<string, string> = {};
    for (const item of snapshot.docs) {
      const data = item.data();
      const name = typeof data.name === "string" ? data.name.trim() : "";
      const image = typeof data.image === "string" ? data.image.trim() : "";
      if (name && image) covers[name] = image;
    }
    return covers;
  } catch (error) {
    console.error("Unable to load destination covers for server rendering:", error instanceof Error ? error.message : "Unknown database error");
    return {};
  }
}, ["destination-covers-v1"], { revalidate: 300, tags: ["public-content"] }));

import { cache } from "react";

import { BLOG_SEED_POSTS } from "@/lib/blogSeed";
import {
  normalizeBlogPost,
  sortBlogPosts,
  type BlogPost,
} from "@/lib/blogData";
import { getAdminDb } from "@/lib/firebase/admin";
import {
  DUMMY_PACKAGES,
  publishedPackages,
  type TravelPackage,
} from "@/lib/packageData";

const PACKAGE_MARKER = "_catalog";

/* The seed posts stand in whenever Firestore is unavailable. They are public
   content like any other, so they go through the same published-only gate. */
const seedBlogPosts = () =>
  sortBlogPosts(BLOG_SEED_POSTS.filter((post) => post.status === "published"));

/* One read serves both the catalogue and the sitemap's lastModified dates.
   `updatedAt` is the CRM's write timestamp, which belongs to the document
   rather than to the package, so it is kept beside the catalogue instead of
   being folded into TravelPackage. */
type PackageCatalogue = {
  packages: TravelPackage[];
  /** Package id → last CRM write, for the packages that carry one. */
  updatedAt: Map<string, Date>;
};

const seedCatalogue = (): PackageCatalogue => ({
  packages: publishedPackages(DUMMY_PACKAGES),
  updatedAt: new Map(),
});

const loadPackageCatalogue = cache(async (): Promise<PackageCatalogue> => {
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
    console.error("Unable to load packages for server rendering", error);
    return seedCatalogue();
  }
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
export const getPublishedBlogPosts = cache(async (): Promise<BlogPost[]> => {
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
    console.error("Unable to load blog posts for server rendering", error);
    return seedBlogPosts();
  }
});

export const getPublishedBlogPost = cache(async (slug: string) => {
  const posts = await getPublishedBlogPosts();
  return posts.find((item) => item.id === slug) ?? null;
});

export const getDestinationCovers = cache(async (): Promise<Record<string, string>> => {
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
    console.error("Unable to load destination covers for server rendering", error);
    return {};
  }
});

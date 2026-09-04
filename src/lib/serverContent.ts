import { cache } from "react";

import { BLOG_SEED_POSTS } from "@/lib/blogSeed";
import {
  normalizeBlogPost,
  sortBlogPosts,
  type BlogPost,
} from "@/lib/blogData";
import { getAdminDb } from "@/lib/firebase/admin";
import { DUMMY_PACKAGES, type TravelPackage } from "@/lib/packageData";

const PACKAGE_MARKER = "_catalog";

/** Public catalogue data for server-rendered HTML, metadata and sitemap. */
export const getPublishedPackages = cache(async (): Promise<TravelPackage[]> => {
  const db = getAdminDb();
  if (!db) return DUMMY_PACKAGES;

  try {
    const snapshot = await db.collection("packages").get();
    const initialized = snapshot.docs.some((item) => item.id === PACKAGE_MARKER);
    if (!initialized) return DUMMY_PACKAGES;

    return snapshot.docs
      .filter((item) => item.id !== PACKAGE_MARKER)
      .map((item) => {
        const data = item.data();
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
  } catch (error) {
    console.error("Unable to load packages for server rendering", error);
    return DUMMY_PACKAGES;
  }
});

export const getPublishedPackage = cache(async (id: string) => {
  const packages = await getPublishedPackages();
  return packages.find((item) => item.id === id) ?? null;
});

/** Published-only blog data; drafts must never be emitted in public HTML. */
export const getPublishedBlogPosts = cache(async (): Promise<BlogPost[]> => {
  const db = getAdminDb();
  if (!db) return BLOG_SEED_POSTS;

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
    return BLOG_SEED_POSTS;
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

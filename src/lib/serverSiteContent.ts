import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getAdminDb } from "@/lib/firebase/admin";
import { DEFAULT_SITE_CONTENT, normalizeSiteContent } from "@/lib/siteContent";

/** Initial homepage settings share the public publish invalidation tag. */
export const getPublishedSiteContent = cache(unstable_cache(async () => {
  const db = getAdminDb();
  if (!db) return { content: DEFAULT_SITE_CONTENT, exists: false };
  const snapshot = await db.collection("siteContent").doc("homepage").get();
  return { content: normalizeSiteContent(snapshot.data()?.content), exists: snapshot.exists };
}, ["public-site-content-v1"], { revalidate: 300, tags: ["public-content"] }));

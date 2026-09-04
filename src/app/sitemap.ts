import type { MetadataRoute } from "next";

import { buildDestinations, destinationHref } from "@/lib/destinations";
import { isIndexablePackage } from "@/lib/packageData";
import { absoluteUrl } from "@/lib/seo";
import {
  getPackageUpdateTimes,
  getPublishedBlogPosts,
  getPublishedPackages,
} from "@/lib/serverContent";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [packages, posts, packageUpdatedAt] = await Promise.all([
    getPublishedPackages(),
    getPublishedBlogPosts(),
    getPackageUpdateTimes(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/packages"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/destinations"), changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/compare"), changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/blog"), changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/contact"), changeFrequency: "yearly", priority: 0.5 },
    /* Indexable, linked from every page's footer, and the pages a traveller
       checks before paying — they belong in the sitemap like anything else. */
    { url: absoluteUrl("/terms"), changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/privacy"), changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/refund-policy"), changeFrequency: "yearly", priority: 0.3 },
  ];

  const seen = new Set(staticPages.map((entry) => entry.url));
  const packagePages: MetadataRoute.Sitemap = [];
  for (const pkg of packages) {
    // A package can be live on the website and still be unfit to advertise —
    // see isIndexablePackage. The sitemap is the stricter of the two gates.
    if (!isIndexablePackage(pkg)) continue;
    const path = pkg.href || `/packages/${pkg.id}`;
    if (!path.startsWith("/") || path.includes("?")) continue;
    const url = absoluteUrl(path);
    if (seen.has(url)) continue;
    seen.add(url);
    packagePages.push({
      url,
      lastModified: packageUpdatedAt.get(pkg.id),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  /* One entry per destination that currently has something to sell. Built
     from the same catalogue as the pages themselves, so the sitemap cannot
     advertise a destination page that would 404. */
  const destinationPages: MetadataRoute.Sitemap = buildDestinations(
    packages.filter(isIndexablePackage),
  ).map((destination) => ({
    url: absoluteUrl(destinationHref(destination.name)),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const blogPages: MetadataRoute.Sitemap = posts.map((post) => {
    const published = new Date(post.publishedAt);
    return {
      url: absoluteUrl(`/blog/${post.id}`),
      lastModified: Number.isNaN(published.getTime()) ? undefined : published,
      changeFrequency: "monthly",
      priority: 0.7,
    };
  });

  return [...staticPages, ...destinationPages, ...packagePages, ...blogPages];
}

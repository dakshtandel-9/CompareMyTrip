import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";
import { getPublishedBlogPosts, getPublishedPackages } from "@/lib/serverContent";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [packages, posts] = await Promise.all([
    getPublishedPackages(),
    getPublishedBlogPosts(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/packages"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/destinations"), changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/compare"), changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/blog"), changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/contact"), changeFrequency: "yearly", priority: 0.5 },
  ];

  const seen = new Set(staticPages.map((entry) => entry.url));
  const packagePages: MetadataRoute.Sitemap = [];
  for (const pkg of packages) {
    const path = pkg.href || `/packages/${pkg.id}`;
    if (!path.startsWith("/") || path.includes("?")) continue;
    const url = absoluteUrl(path);
    if (seen.has(url)) continue;
    seen.add(url);
    packagePages.push({ url, changeFrequency: "weekly", priority: 0.8 });
  }

  const blogPages: MetadataRoute.Sitemap = posts.map((post) => {
    const published = new Date(post.publishedAt);
    return {
      url: absoluteUrl(`/blog/${post.id}`),
      lastModified: Number.isNaN(published.getTime()) ? undefined : published,
      changeFrequency: "monthly",
      priority: 0.7,
    };
  });

  return [...staticPages, ...packagePages, ...blogPages];
}

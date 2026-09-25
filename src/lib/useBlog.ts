"use client";

import { usePublicContent } from "@/lib/usePublicContent";

/** Only what the website should show: published posts, newest first. */
export function usePublishedBlogPosts() {
  const { posts, loading, error } = usePublicContent();
  return { posts: posts.filter((post) => post.status === "published"), loading, error };
}

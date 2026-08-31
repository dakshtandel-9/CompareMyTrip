"use client";

import { useEffect, useSyncExternalStore } from "react";

import type { BlogPost } from "@/lib/blogData";
import { subscribeToBlogPosts } from "@/lib/firebase/blog";

/* One Firestore listener for the whole tab, shared by the index, the article
   page and the CRM — the same store shape /lib/usePackages.ts uses. */

type BlogState = { posts: BlogPost[]; loading: boolean; error: string };

let current: BlogState = { posts: [], loading: true, error: "" };
const listeners = new Set<(state: BlogState) => void>();
let unsubscribe: (() => void) | undefined;

function publish(next: BlogState) {
  current = next;
  listeners.forEach((listener) => listener(current));
}

function start() {
  if (unsubscribe) return;
  unsubscribe = subscribeToBlogPosts(
    (posts) => publish({ posts, loading: false, error: "" }),
    (error) => publish({ ...current, loading: false, error }),
  );
}

export function useBlogState() {
  const state = useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    () => current,
    () => current,
  );
  useEffect(() => {
    start();
  }, []);
  return state;
}

/** Only what the website should show: published posts, newest first. */
export function usePublishedBlogPosts() {
  const { posts, loading, error } = useBlogState();
  return { posts: posts.filter((post) => post.status === "published"), loading, error };
}

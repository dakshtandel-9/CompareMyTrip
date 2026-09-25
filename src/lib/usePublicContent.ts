"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import type { TravelPackage } from "@/lib/packageData";
import type { BlogPost } from "@/lib/blogData";

export type PublicContentState = { packages: TravelPackage[]; posts: BlogPost[]; loading: boolean; error: string };
const INITIAL: PublicContentState = { packages: [], posts: [], loading: true, error: "" };
export const PublicContentContext = createContext<PublicContentState | null>(null);
const noSubscription = () => () => {};
let current = INITIAL;
let refreshedAt = 0;
const FRESH_MS = 300_000;
const listeners = new Set<() => void>();
let stop: (() => void) | undefined;

/** Called after hydration; never mutate the shared browser store during SSR. */
export function seedPublicContent(state: PublicContentState) {
  current = state;
  refreshedAt = Date.now();
  listeners.forEach((notify) => notify());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!stop) {
    let active = true;
    let pending = false;
    const controller = new AbortController();
    const refresh = async () => {
      if (pending || document.visibilityState === "hidden" || Date.now() - refreshedAt < FRESH_MS) return;
      pending = true;
      try {
        const response = await fetch("/api/content", { signal: controller.signal });
        if (!response.ok) throw new Error("Travel content could not be refreshed. Please try again.");
        const data = await response.json();
        if (!Array.isArray(data.packages) || !Array.isArray(data.posts)) throw new Error("Invalid content response.");
        if (active) {
          current = { packages: data.packages, posts: data.posts, loading: false, error: "" };
          refreshedAt = Date.now();
        }
      } catch (error) {
        if (active) current = { ...current, loading: false, error: error instanceof Error ? error.message : "Content unavailable." };
      } finally {
        pending = false;
        if (active) listeners.forEach((notify) => notify());
      }
    };
    queueMicrotask(() => { if (active) void refresh(); });
    document.addEventListener("visibilitychange", refresh);
    stop = () => {
      active = false;
      controller.abort();
      document.removeEventListener("visibilitychange", refresh);
    };
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) { stop?.(); stop = undefined; }
  };
}

/** Fetch on entry or stale tab activation; no idle polling. Server seeds need no duplicate request. */
export function usePublicContent() {
  const initial = useContext(PublicContentContext);
  return useSyncExternalStore(initial ? noSubscription : subscribe, () => initial ?? current, () => initial ?? INITIAL);
}

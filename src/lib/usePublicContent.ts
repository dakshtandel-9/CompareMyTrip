"use client";

import { useSyncExternalStore } from "react";
import type { TravelPackage } from "@/lib/packageData";
import type { BlogPost } from "@/lib/blogData";

type State = { packages: TravelPackage[]; posts: BlogPost[]; loading: boolean; error: string };
const INITIAL: State = { packages: [], posts: [], loading: true, error: "" };
let current = INITIAL;
const listeners = new Set<() => void>();
let stop: (() => void) | undefined;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!stop) {
    let active = true;
    let pending = false;
    const controller = new AbortController();
    const refresh = async () => {
      if (pending || document.visibilityState === "hidden") return;
      pending = true;
      try {
        const response = await fetch("/api/content", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Travel content could not be refreshed. Please try again.");
        const data = await response.json();
        if (!Array.isArray(data.packages) || !Array.isArray(data.posts)) throw new Error("Invalid content response.");
        if (active) current = { packages: data.packages, posts: data.posts, loading: false, error: "" };
      } catch (error) {
        if (active) current = { ...current, loading: false, error: error instanceof Error ? error.message : "Content unavailable." };
      } finally {
        pending = false;
        if (active) listeners.forEach((notify) => notify());
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, 30000);
    document.addEventListener("visibilitychange", refresh);
    stop = () => {
      active = false;
      controller.abort();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) { stop?.(); stop = undefined; }
  };
}

/** Saved publication changes appear in open tabs within 30 seconds. */
export function usePublicContent() {
  return useSyncExternalStore(subscribe, () => current, () => INITIAL);
}

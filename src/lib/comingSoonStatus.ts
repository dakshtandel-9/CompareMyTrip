"use client";

import { useSyncExternalStore } from "react";

/* Whether coming-soon mode is on, for pages that are already open. A fresh
   request never needs this — middleware has just checked — but a tab can
   stay open for hours and client navigation can be served from the router
   cache. This reads the same uncached switch the middleware reads, at most
   once a minute, instead of every page holding a Firestore connection open
   for one boolean. A failed check keeps the last answer: one slow response
   should not send everyone already browsing to the coming-soon screen. */

const STATUS_PATH = "/api/content/status";
const MIN_INTERVAL_MS = 60_000;

let enabled: boolean | undefined;
let checkedAt = 0;
let pending: Promise<void> | undefined;
const listeners = new Set<() => void>();

export function refreshComingSoonStatus(): Promise<void> {
  if (pending) return pending;
  if (Date.now() - checkedAt < MIN_INTERVAL_MS) return Promise.resolve();
  checkedAt = Date.now();
  pending = fetch(STATUS_PATH, { cache: "no-store", signal: AbortSignal.timeout(10000) })
    .then(async (response) => {
      if (!response.ok) return;
      const next = ((await response.json()) as { enabled?: unknown }).enabled === true;
      if (next === enabled) return;
      enabled = next;
      listeners.forEach((listener) => listener());
    })
    .catch(() => {})
    .finally(() => {
      pending = undefined;
    });
  return pending;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The last answer from the server; undefined until a check has returned one. */
export function useComingSoonStatus(): boolean | undefined {
  return useSyncExternalStore(subscribe, () => enabled, () => undefined);
}

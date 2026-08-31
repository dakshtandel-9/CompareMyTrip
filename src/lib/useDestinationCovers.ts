"use client";

import { useEffect, useSyncExternalStore } from "react";
import { subscribeToDestinationCovers } from "@/lib/firebase/destinations";

/* One Firestore subscription shared by every component that needs covers,
   mirroring usePackages. Covers are public content, so this starts empty and
   fills in — a destination simply shows its package photo until then. */

type CoverState = { covers: Record<string, string>; loading: boolean; error: string };

let current: CoverState = { covers: {}, loading: true, error: "" };
const listeners = new Set<(state: CoverState) => void>();
let unsubscribe: (() => void) | undefined;

function emit(next: CoverState) {
  current = next;
  listeners.forEach((listener) => listener(current));
}

function start() {
  if (unsubscribe) return;
  unsubscribe = subscribeToDestinationCovers(
    (covers) => emit({ covers, loading: false, error: "" }),
    (error) => emit({ ...current, loading: false, error }),
  );
}

export function useDestinationCoversState() {
  const state = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => current,
    () => current,
  );
  useEffect(() => {
    start();
  }, []);
  return state;
}

export function useDestinationCovers() {
  return useDestinationCoversState().covers;
}

"use client";

import { useEffect, useSyncExternalStore } from "react";
import { subscribeToCruises } from "@/lib/firebase/cruises";
import type { CruiseListing } from "@/lib/cruiseListings";

/* One Firestore subscription shared by every component that needs cruises,
   mirroring usePackages and useDestinationCovers. */

type CruiseState = { cruises: CruiseListing[]; loading: boolean; error: string };

let current: CruiseState = { cruises: [], loading: true, error: "" };
const listeners = new Set<(state: CruiseState) => void>();
let unsubscribe: (() => void) | undefined;

function emit(next: CruiseState) {
  current = next;
  listeners.forEach((listener) => listener(current));
}

function start() {
  if (unsubscribe) return;
  unsubscribe = subscribeToCruises(
    (cruises) => emit({ cruises, loading: false, error: "" }),
    (error) => emit({ ...current, loading: false, error }),
  );
}

export function useCruisesState() {
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

"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { DUMMY_PACKAGES, publishedPackages, type TravelPackage } from "@/lib/packageData";
import { subscribeToPackages } from "@/lib/firebase/packages";

type PackageState = { packages: TravelPackage[]; loading: boolean; error: string; databaseInitialized: boolean };
let current: PackageState = { packages: DUMMY_PACKAGES, loading: true, error: "", databaseInitialized: false };
const listeners = new Set<(state: PackageState) => void>();
let unsubscribe: (() => void) | undefined;

function start() {
  if (unsubscribe) return;
  unsubscribe = subscribeToPackages(
    (databasePackages, initialized) => {
      current = {
        packages: initialized ? databasePackages : DUMMY_PACKAGES,
        loading: false,
        error: "",
        databaseInitialized: initialized,
      };
      listeners.forEach((listener) => listener(current));
    },
    (error) => {
      current = { ...current, loading: false, error };
      listeners.forEach((listener) => listener(current));
    },
  );
}

/** The unfiltered catalogue, drafts included. CRM only: a draft rendered on
    the website would contradict the server HTML the crawler was given. */
export function useAllPackagesState() {
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

export function useAllPackages() {
  return useAllPackagesState().packages;
}

/** What the website may show. Mirrors the server's `getPublishedPackages`, so
    the catalogue does not change shape when the subscription hydrates over
    the server-rendered markup. */
export function usePackagesState() {
  const state = useAllPackagesState();
  const packages = useMemo(() => publishedPackages(state.packages), [state.packages]);
  return { ...state, packages };
}

export function usePackages() {
  return usePackagesState().packages;
}

"use client";

import { useEffect, useSyncExternalStore } from "react";
import { DUMMY_PACKAGES, type TravelPackage } from "@/lib/packageData";
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

export function usePackagesState() {
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

export function usePackages() {
  return usePackagesState().packages;
}

"use client";

import { useSyncExternalStore } from "react";
import { getAuthDestination } from "./authDestination";

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

function getSnapshot() {
  return getAuthDestination(window.location.search, window.location.origin);
}

// The server and hydration render the same links; the browser then restores
// the return address without forcing these public pages behind Suspense.
export function useAuthDestination() {
  return useSyncExternalStore(subscribe, getSnapshot, () => "/");
}

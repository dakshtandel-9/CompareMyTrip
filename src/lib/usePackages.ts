"use client";

import { usePublicContent } from "@/lib/usePublicContent";

/** What the website may show. Mirrors the server's `getPublishedPackages`, so
    the catalogue does not change shape when the subscription hydrates over
    the server-rendered markup. */
export function usePackagesState() {
  const { packages, loading, error } = usePublicContent();
  return { packages, loading, error, databaseInitialized: !loading && !error };
}

export function usePackages() {
  return usePackagesState().packages;
}

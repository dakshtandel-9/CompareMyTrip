"use client";

import { useEffect, useMemo, useState } from "react";
import type { TravelPackage } from "@/lib/packageData";

type Match = { id: string; probability: number };

/* NEXT_PUBLIC_JEV_SEARCH=true in the environment turns smart search on in
   every package search box; anything else leaves them as plain name search.
   Inlined at build time, so changing it needs a rebuild (a restart in dev). */
export const JEV_SEARCH_ENABLED = process.env.NEXT_PUBLIC_JEV_SEARCH === "true";

const DEBOUNCE_MS = 500;
const MIN_SMART_LENGTH = 3;

/* Package search for the catalogue and the compare pickers. Names and places filter instantly
   in the browser; a described trip ("beach under 10k", "weekend trek near
   Bangalore") goes to /api/package-search once typing pauses. Smart matches
   lead, ranked by how sure Jev is, and plain text matches it passed over
   follow — so a failed or slow request only ever costs the extra results. */
export function usePackageSearch(packages: TravelPackage[], query: string) {
  const normalized = query.trim().replace(/\s+/g, " ");
  const [smart, setSmart] = useState<{ query: string; matches: Match[] } | null>(null);

  useEffect(() => {
    if (!JEV_SEARCH_ENABLED || normalized.length < MIN_SMART_LENGTH) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/package-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: normalized }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(String(response.status));
        const { matches } = (await response.json()) as { matches: Match[] };
        setSmart({ query: normalized, matches });
      } catch {
        if (!controller.signal.aborted) setSmart({ query: normalized, matches: [] });
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [normalized]);

  const textMatches = useMemo(() => {
    const terms = normalized.toLowerCase().split(" ").filter(Boolean);
    if (terms.length === 0) return packages;

    return packages.filter((pkg) => {
      /* Operator is left out: it is never shown, so a match on it
         would return results the visitor cannot account for. */
      const haystack = `${pkg.title} ${pkg.location} ${pkg.destination}`.toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }, [packages, normalized]);

  const current = smart?.query === normalized ? smart.matches : null;

  const results = useMemo(() => {
    if (!current?.length) return textMatches;

    const byId = new Map(packages.map((pkg) => [pkg.id, pkg]));
    const ranked = current.flatMap((match) => byId.get(match.id) ?? []);
    const rankedIds = new Set(ranked.map((pkg) => pkg.id));
    return [...ranked, ...textMatches.filter((pkg) => !rankedIds.has(pkg.id))];
  }, [packages, textMatches, current]);

  return {
    results,
    /** Results are in Jev's order, best fit first. */
    ranked: Boolean(current?.length),
    /** Waiting on Jev for the query as it stands now. */
    searching: JEV_SEARCH_ENABLED && normalized.length >= MIN_SMART_LENGTH && current === null,
  };
}

import { slugify } from "@/lib/blogData";
import type { PackageCategory, TravelPackage } from "@/lib/packageData";
import { toIndiaState } from "@/lib/indiaStates";

/* ------------------------------------------------------------------ */
/* The destination list is derived from the package catalogue and never  */
/* hardcoded: a place exists as a destination exactly while a package is */
/* filed under it. Both the public /destinations grid and the CRM's      */
/* cover-artwork screen read this, so the two can never drift apart.     */
/*                                                                       */
/* India groups by state, matching the catalogue's Destination filter, so */
/* a Coorg package and a Mysore package are both Karnataka rather than    */
/* two near-identical cards.                                              */
/* ------------------------------------------------------------------ */

export type DestinationSummary = {
  name: string;
  region: "India" | "International";
  count: number;
  fromPrice: number;
  /** Cover set in the CRM. Empty when nobody has chosen one. */
  cover: string;
  /** First package photo under this destination, used when there is no cover. */
  fallbackImage: string;
  /** What actually renders: the cover when set, the package photo otherwise. */
  image: string;
  styles: PackageCategory[];
  minDays: number;
  maxDays: number;
};

export function buildDestinations(
  packages: TravelPackage[],
  covers: Record<string, string> = {},
): DestinationSummary[] {
  const groups = new Map<string, TravelPackage[]>();
  for (const pkg of packages) {
    const filed = pkg.destination?.trim();
    if (!filed) continue;
    const name = pkg.region === "India" ? toIndiaState(filed) : filed;
    const existing = groups.get(name);
    if (existing) existing.push(pkg);
    else groups.set(name, [pkg]);
  }

  return [...groups.entries()]
    .map(([name, list]) => {
      const styleCounts = new Map<PackageCategory, number>();
      let internationalCount = 0;
      for (const pkg of list) {
        if (pkg.region === "International") internationalCount += 1;
        for (const tag of pkg.tags) {
          styleCounts.set(tag, (styleCounts.get(tag) ?? 0) + 1);
        }
      }

      const days = list.map((pkg) => pkg.days).filter((value) => value > 0);
      const cover = covers[name]?.trim() ?? "";
      const fallbackImage = list.find((pkg) => pkg.image)?.image ?? "";

      return {
        name,
        /* Packages under one destination should all agree on region; a majority
           keeps a single mis-tagged import from re-filing the whole place. */
        region: internationalCount * 2 > list.length ? "International" : "India",
        count: list.length,
        fromPrice: Math.min(...list.map((pkg) => pkg.price)),
        cover,
        fallbackImage,
        image: cover || fallbackImage,
        styles: [...styleCounts.entries()]
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
          .slice(0, 3)
          .map(([tag]) => tag),
        minDays: days.length ? Math.min(...days) : 0,
        maxDays: days.length ? Math.max(...days) : 0,
      } satisfies DestinationSummary;
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function durationLabel(destination: DestinationSummary) {
  if (!destination.maxDays) return "";
  if (destination.minDays === destination.maxDays) return `${destination.maxDays} days`;
  return `${destination.minDays}–${destination.maxDays} days`;
}

/* ---------------------- Destination landing pages ------------------- */
/* A destination's own URL. The name is the catalogue's filed-under value
   ("Kerala", "Himachal Pradesh"), so the slug is derived rather than stored
   and a place gets its page the moment a package is filed under it. */

export const destinationSlug = (name: string) => slugify(name);

export const destinationHref = (name: string) => `/destinations/${destinationSlug(name)}`;

/** The destination a slug refers to, or null. Matching on the slug rather
    than the name means "Himachal Pradesh" and "himachal-pradesh" resolve to
    the same page without a lookup table to keep in step. */
export function findDestinationBySlug(
  destinations: DestinationSummary[],
  slug: string,
): DestinationSummary | null {
  const needle = slugify(slug);
  return destinations.find((item) => destinationSlug(item.name) === needle) ?? null;
}

/** The packages filed under one destination, in catalogue order. Mirrors the
    grouping `buildDestinations` uses, so a card's count and the list on the
    destination page can never disagree. */
export function packagesForDestination(
  packages: TravelPackage[],
  name: string,
): TravelPackage[] {
  return packages.filter((pkg) => {
    const filed = pkg.destination?.trim();
    if (!filed) return false;
    return (pkg.region === "India" ? toIndiaState(filed) : filed) === name;
  });
}

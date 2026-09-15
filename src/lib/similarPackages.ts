import type { TravelPackage } from "./packageData";

/** Rank the published catalogue without changing its original order. */
export function getSimilarPackages(current: TravelPackage, packages: TravelPackage[]): TravelPackage[] {
  const destination = current.destination?.trim().toLowerCase();
  const score = (pkg: TravelPackage) =>
    (destination && pkg.destination?.trim().toLowerCase() === destination ? 100 : 0)
    + pkg.tags.filter(tag => current.tags.includes(tag)).length * 20
    + (pkg.region === current.region ? 10 : 0)
    + Math.max(0, 5 - Math.abs(pkg.days - current.days));
  return packages
    .filter(pkg => pkg.id !== current.id && pkg.status !== "draft")
    .map((pkg, index) => ({ pkg, index, score: score(pkg) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 4)
    .map(({ pkg }) => pkg);
}

import { publishedPackages, type TravelPackage } from "@/lib/packageData";
import { findPackageByPath, packagePath } from "@/lib/packageUrls";
import type { CountryCard } from "@/lib/siteContent";

const countryAliases: Record<string, string> = {
  bali: "indonesia",
  dubai: "united arab emirates",
  "abu dhabi": "united arab emirates",
  uae: "united arab emirates",
  srilanka: "sri lanka",
};

function countryKey(name: string) {
  const key = name.trim().toLowerCase();
  return countryAliases[key] ?? key;
}

/** Use published inventory for country-level prices, never sample card values. */
export function internationalFromPrice(country: string, packages: TravelPackage[]): number | undefined {
  const prices = publishedPackages(packages)
    .filter((pkg) => pkg.region === "International" && countryKey(pkg.destination) === countryKey(country))
    .map((pkg) => pkg.price)
    .filter((price) => Number.isFinite(price) && price > 0);
  return prices.length ? Math.min(...prices) : undefined;
}

/** One of our own package pages, as opposed to a catalogue or another page. */
const PACKAGE_PAGE = /^\/packages\/[^/?#]+$/;

/* "Automatic" is an empty link, or the plain international catalogue that
   every card shipped with — both mean "show this country's best live trip".
   The catalogue link counts because it is what the cards were seeded with,
   so reading it as a deliberate destination would quietly stop them
   resolving to a package at all. */
const AUTOMATIC_LINKS = new Set(["", "/packages?region=international"]);

/** Where a country card goes, and which package (if any) supplies its price.

    A link pasted in the CRM wins. Otherwise the card falls back to the first
    live trip for that country, and then to the catalogue. */
export function internationalCardTarget(
  card: Pick<CountryCard, "country" | "href">,
  packages: TravelPackage[],
): { pkg: TravelPackage | undefined; href: string } {
  const available = publishedPackages(packages).filter((pkg) => pkg.region === "International");
  const link = card.href.trim();

  // Matches the title URL as well as an id or former-title URL saved earlier.
  const attached = findPackageByPath(link, available);
  if (attached) return { pkg: attached, href: packagePath(attached) };

  /* A pasted link — a filtered catalogue, a destination page — is used exactly
     as given, and the card falls back to its own "From price".

     A /packages/<slug> that matched nothing is deliberately not: it drops
     through to the country match below, so unpublishing or deleting an
     attached package leaves a working card rather than a dead link. */
  if (!AUTOMATIC_LINKS.has(link) && !PACKAGE_PAGE.test(link)) {
    return { pkg: undefined, href: link };
  }

  const matched = available.find((pkg) => countryKey(pkg.destination) === countryKey(card.country));
  return matched
    ? { pkg: matched, href: packagePath(matched) }
    : { pkg: undefined, href: "/packages?region=international" };
}

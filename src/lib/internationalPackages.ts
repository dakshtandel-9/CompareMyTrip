import { publishedPackages, type TravelPackage } from "@/lib/packageData";
import type { CountryCard } from "@/lib/siteContent";

const countryAliases: Record<string, string> = {
  bali: "indonesia",
  dubai: "united arab emirates",
  "abu dhabi": "united arab emirates",
  uae: "united arab emirates",
};

function countryKey(name: string) {
  const key = name.trim().toLowerCase();
  return countryAliases[key] ?? key;
}

/** Prefer the admin attachment, otherwise choose the first matching live trip. */
export function internationalCardPackage(
  card: Pick<CountryCard, "country" | "href">,
  packages: TravelPackage[],
): TravelPackage | undefined {
  const available = publishedPackages(packages).filter((pkg) => pkg.region === "International");
  const attached = available.find((pkg) => `/packages/${pkg.id}` === card.href);
  return attached ?? available.find((pkg) => countryKey(pkg.destination) === countryKey(card.country));
}

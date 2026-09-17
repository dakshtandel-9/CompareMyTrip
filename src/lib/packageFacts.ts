
import { plainPackageText } from "@/lib/packageRichText";
import { getPackageDetails, type PackageFact, type TravelPackage } from "@/lib/packageData";

export const PERMIT_BOOKING_URL = "https://aranyavihaara.karnataka.gov.in/";

export type PackageFactValues = Pick<TravelPackage, "nights" | "days" | "pax" | "hotelStars"> & {
  meals: string;
  transfers: string;
  flights: string;
  hasStay?: boolean;
};

export function defaultPackageFacts(): PackageFact[] {
  return [
    { id: "duration", source: "duration", icon: "Clock3", label: "Duration", visible: true },
    { id: "group-size", source: "groupSize", icon: "Users", label: "Group size", visible: true },
    { id: "stay", source: "stay", icon: "BedDouble", label: "Stay", visible: true },
    { id: "transfers", source: "transfers", icon: "Car", label: "Transfers", visible: true },
    { id: "meals", source: "meals", icon: "PlateAndCup", label: "Meals", visible: true },
    { id: "flights", source: "flights", icon: "Plane", label: "Flights", visible: true },
  ];
}

export function packageFactValue(fact: PackageFact, values: PackageFactValues): string {
  if (fact.value !== undefined) return fact.value;
  switch (fact.source) {
    case "duration": return `${values.nights} night${values.nights === 1 ? "" : "s"} / ${values.days} day${values.days === 1 ? "" : "s"}`;
    case "groupSize": return values.pax;
    case "stay": return values.hasStay === false ? "No accommodation" : `${values.hotelStars}★ verified stays`;
    case "transfers": return plainPackageText(values.transfers);
    case "meals": return values.meals;
    case "flights": return values.flights;
    default: return "";
  }
}

export function getPackageFacts(pkg: TravelPackage) {
  const details = getPackageDetails(pkg);
  if (details.factsHidden) return [];
  return (details.facts ?? defaultPackageFacts())
    .filter((fact) => fact.visible !== false)
    .map((fact) => ({ ...fact, value: packageFactValue(fact, { ...pkg, ...details, hasStay: pkg.details ? details.stays.length > 0 : undefined }) }));
}

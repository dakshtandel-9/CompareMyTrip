import { departureDays, departureDaysLabel, type TravelPackage } from "@/lib/packageData";
import { plainPackageText } from "@/lib/packageRichText";

export const BENGALURU = /\b(?:bengaluru|bangalore)\b/i;
const plain = (value?: string) => plainPackageText(value || "");

/** Departure evidence comes from logistics, never proximity or promotional copy. */
export function startsInBengaluru(pkg: TravelPackage): boolean {
  if (pkg.departureCity?.trim()) return BENGALURU.test(pkg.departureCity);
  const details = pkg.details;
  if (!details) return false;
  const pickups = details.pageSections?.locations;
  if (pickups?.enabled && pickups.items.some(item => item.visible && item.type === "pickup" && BENGALURU.test(`${item.name} ${item.address}`))) return true;
  const inclusion = (details.inclusions || []).map(plain).some(value =>
    /(?:transport|transfer|pickup|pick.up|departure)/i.test(value) && /(?:from|in|across)\s+(?:bengaluru|bangalore)\b/i.test(value) && !/not included|excluded|extra cost/i.test(value));
  const firstDay = (details.itinerary || []).filter(day => details.dayZeroEnabled !== false || day.day !== 0)[0];
  const route = plain(firstDay?.route || firstDay?.title);
  return inclusion || /^(?:departure\s+from\s+|pickup'?s?\s+from\s+)?(?:bengaluru|bangalore)\s*(?:to\b|→|–|—|->|pickup)/i.test(route);
}

export function transportIncluded(pkg: TravelPackage): boolean {
  const text = plain(pkg.details?.transfers);
  if (/not included|excluded|own arrangement|self.drive|extra cost/i.test(text)) return false;
  return /\bincluded\b/i.test(text) || (pkg.details?.inclusions || []).some(value => /transport|transfer|pickup|pick.up/i.test(plain(value)) && !/not included|excluded|extra cost/i.test(plain(value)));
}

export const TRAVELLER_TYPES = [
  { value: "professionals", label: "Working professionals", description: "Short breaks around your work week", icon: "BriefcaseBusiness" },
  { value: "students", label: "College students", description: "Explore plans under ₹5,000 per person", icon: "GraduationCap" },
  { value: "couples", label: "Couples", description: "Time together, beyond the honeymoon", icon: "Heart" },
  { value: "friends", label: "Friends & groups", description: "Shared adventures and group escapes", icon: "Users" },
  { value: "adventure", label: "Adventure seekers", description: "Choose a trail that matches your experience", icon: "Mountain" },
  { value: "families", label: "Families", description: "Find the pace and comfort for your family", icon: "House" },
  { value: "corporate", label: "Corporate teams", description: "Tell us your group size and outing plans", icon: "Building2" },
] as const;
export type TravellerType = typeof TRAVELLER_TYPES[number]["value"];
export function matchesTraveller(pkg: TravelPackage, audience: string): boolean {
  const bestFor = (pkg.details?.facts || []).filter(fact => fact.visible && /best for|suitable|traveller/i.test(fact.label)).map(fact => plain(fact.value)).join(" ");
  switch (audience) {
    case "professionals": return pkg.days <= 3;
    case "students": return pkg.price > 0 && pkg.price <= 5000;
    case "couples": return pkg.tags.includes("Honeymoon") || /couple/i.test(bestFor);
    case "friends": return /friends|groups/i.test(bestFor);
    case "families": return pkg.tags.includes("Family");
    case "adventure": return pkg.tags.some(tag => ["Adventure", "Treks", "Weekend Treks"].includes(tag));
    default: return true;
  }
}

export function indiaToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
function dateFrom(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}
/** Scheduled weekdays are not seat inventory. Unspecified schedules never match a date filter. */
export function matchesDepartureWindow(pkg: TravelPackage, start: string, end = start): boolean {
  const first = dateFrom(start), last = dateFrom(end || start);
  if (!first || !last || last < first) return false;
  const allowed = departureDays(pkg);
  if (!pkg.departureDays?.length) return false;
  for (let date = new Date(first); date <= last && date.getTime() <= first.getTime() + 366 * 86400000; date.setUTCDate(date.getUTCDate() + 1)) {
    if (!allowed.length || allowed.includes(date.getUTCDay())) return true;
  }
  return false;
}
export function weekendWindow(next = false, today = indiaToday()): [string, string] {
  const date = dateFrom(today) || new Date();
  const day = date.getUTCDay();
  // Friday night is a common departure; include the remaining weekend on Sat/Sun.
  const offset = day === 0 || day >= 5 ? 0 : 5 - day;
  date.setUTCDate(date.getUTCDate() + offset + (next ? (day === 0 ? 5 : day >= 5 ? 12 - day : 7) : 0));
  const start = date.toISOString().slice(0, 10);
  date.setUTCDate(date.getUTCDate() + (7 - date.getUTCDay()) % 7);
  return [start, date.toISOString().slice(0, 10)];
}
export function packageLogistics(pkg: TravelPackage): string[] {
  const result: string[] = [];
  if (transportIncluded(pkg)) result.push("Transport included");
  const schedule = departureDaysLabel(pkg);
  if (schedule) result.push(`Departures: ${schedule}`);
  return result;
}

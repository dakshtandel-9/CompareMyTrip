import type { TravelPackage } from "./packageData";

/** Only internal UI paths reach here; copy each ancestor to preserve undo snapshots. */
export function changePackageContent(pkg: TravelPackage, path: (string | number)[], value: unknown): TravelPackage {
  if (!path.length || path.some(key => ["__proto__", "prototype", "constructor"].includes(String(key)))) throw new Error("Invalid content path");
  const change = (current: unknown, index: number): unknown => {
    if (index === path.length) return value;
    const key = path[index];
    if (Array.isArray(current)) { const copy = [...current]; copy[Number(key)] = change(copy[Number(key)], index + 1); return copy; }
    const record = current && typeof current === "object" ? current as Record<string, unknown> : {};
    return { ...record, [key]: change(record[String(key)], index + 1) };
  };
  return change(pkg, 0) as TravelPackage;
}

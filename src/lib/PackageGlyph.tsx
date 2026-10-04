import names from "./packageIconNames.json";

const supported = new Set(names);

/* One small file per icon (scripts/generate-package-icons.mjs), so a page
   downloads only the handful it draws. */
export function PackageGlyph({ name, className = "size-5" }: { name: string; className?: string }) {
  const icon = supported.has(name) ? name : "MapPin";
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><use href={`/package-icons/${icon}.svg#i`} /></svg>;
}

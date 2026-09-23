export function videoSource(path: string): string {
  const base = process.env.NEXT_PUBLIC_VIDEO_CDN_URL?.replace(/\/$/, "");
  return base ? `${base}${path}` : path;
}

export function shouldLoadVideo({ allowMobile = false, allow3g = false }: { allowMobile?: boolean; allow3g?: boolean } = {}): boolean {
  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;
  return (allowMobile || window.matchMedia("(min-width: 768px)").matches)
    && window.matchMedia("(prefers-reduced-motion: no-preference)").matches
    && !window.matchMedia("(prefers-reduced-data: reduce)").matches
    && !connection?.saveData
    && !["slow-2g", "2g"].includes(connection?.effectiveType ?? "")
    && (allow3g || connection?.effectiveType !== "3g");
}

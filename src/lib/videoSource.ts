export function videoSource(path: string): string {
  const base = process.env.NEXT_PUBLIC_VIDEO_CDN_URL?.replace(/\/$/, "");
  return base ? `${base}${path}` : path;
}

export function shouldLoadVideo(): boolean {
  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;
  return window.matchMedia("(min-width: 768px) and (prefers-reduced-motion: no-preference)").matches
    && !window.matchMedia("(prefers-reduced-data: reduce)").matches
    && !connection?.saveData
    && !["slow-2g", "2g", "3g"].includes(connection?.effectiveType ?? "");
}

/** Keep the intended page through every step of sign-in without allowing an open redirect. */
export function getAuthDestination(search: string, origin: string): string {
  const next = new URLSearchParams(search).get("next") ?? "";
  if (!next.startsWith("/") || next.startsWith("//")) return "/";
  try {
    const url = new URL(next, origin);
    if (url.origin !== origin || /^\/(?:login|signup|forgot-password)\/?$/.test(url.pathname)) return "/";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/";
  }
}

export function getAuthPageHref(page: "/login" | "/signup" | "/forgot-password", destination: string): string {
  return destination === "/" ? page : `${page}?${new URLSearchParams({ next: destination })}`;
}

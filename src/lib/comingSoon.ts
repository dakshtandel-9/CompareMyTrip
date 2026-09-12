export type ComingSoonContent = {
  enabled: boolean;
  title: string;
  message: string;
  image: string;
  imageAlt: string;
};

export const DEFAULT_COMING_SOON: ComingSoonContent = {
  enabled: false,
  title: "Your next adventure is almost here.",
  message: "We're getting everything ready to help you discover, compare and book your next great escape. Check back soon — we can't wait to take you places.",
  image: "/destinations/ladakh.jpg",
  imageAlt: "Pangong Lake and the mountains of Ladakh",
};

export function normalizeComingSoon(raw: unknown): ComingSoonContent {
  const value = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const text = (key: Exclude<keyof ComingSoonContent, "enabled">) => typeof value[key] === "string" ? value[key] as string : DEFAULT_COMING_SOON[key];
  return {
    enabled: value.enabled === true,
    title: text("title"),
    message: text("message"),
    image: text("image"),
    imageAlt: text("imageAlt"),
  };
}

/** Keep administration, sign-in, existing bookings and payment returns usable. */
export function bypassComingSoon(pathname: string) {
  const prefixes = ["/admin", "/api", "/_next", "/login", "/forgot-password", "/account", "/checkout/status", "/pay/status"];
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
    || ["/coming-soon", "/404", "/terms", "/privacy", "/refund-policy"].includes(pathname)
    || /\.[^/]+$/.test(pathname);
}

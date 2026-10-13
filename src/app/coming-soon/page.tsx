import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ComingSoonScreen from "@/components/ComingSoonScreen";
import { getPublishedSiteSections, SITE_WIDE_SECTIONS } from "@/lib/serverSiteContent";

export const metadata: Metadata = {
  title: "Coming soon",
  description: "A new way to discover and compare your next getaway is on the horizon.",
  robots: { index: false, follow: false },
};

// Rendered per request so switching the mode off redirects at once. Only
// visitors sent here while the mode is on, or holding an old link, arrive.
export const dynamic = "force-dynamic";

export default async function ComingSoonPage() {
  // The same cached copy the layout reads; an unreadable one keeps the site open.
  const site = await getPublishedSiteSections(SITE_WIDE_SECTIONS).catch(() => null);
  if (!site?.content.comingSoon?.enabled) redirect("/");
  return <ComingSoonScreen />;
}

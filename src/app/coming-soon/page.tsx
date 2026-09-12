import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ComingSoonScreen from "@/components/ComingSoonScreen";
import { readComingSoonEnabled } from "@/lib/comingSoonServer";

export const metadata: Metadata = {
  title: "Coming soon",
  description: "A new way to discover and compare your next getaway is on the horizon.",
  robots: { index: false, follow: false },
};

export default async function ComingSoonPage() {
  // The uncached settings read makes this decision on every request,
  // before rendering, so disabled mode returns an actual HTTP 404.
  if (!await readComingSoonEnabled()) notFound();
  return <ComingSoonScreen />;
}

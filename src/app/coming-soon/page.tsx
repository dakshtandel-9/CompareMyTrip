import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import ComingSoonScreen from "@/components/ComingSoonScreen";

export const metadata: Metadata = {
  title: "Coming soon",
  description: "A new way to discover and compare your next getaway is on the horizon.",
  robots: { index: false, follow: false },
};

export default async function ComingSoonPage() {
  // Middleware owns the setting lookup and the HTTP status for this request.
  if ((await headers()).get("x-cmt-coming-soon") !== "enabled") notFound();
  return <ComingSoonScreen />;
}

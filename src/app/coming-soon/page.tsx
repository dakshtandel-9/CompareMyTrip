import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import ComingSoonScreen from "@/components/ComingSoonScreen";

export const metadata: Metadata = {
  title: "Coming soon",
  description: "A new way to discover and compare your next getaway is on the horizon.",
  robots: { index: false, follow: false },
};

export default async function ComingSoonPage() {
  // Middleware owns the setting lookup and redirects home while the mode is
  // off; this only catches a request that somehow got past it.
  if ((await headers()).get("x-cmt-coming-soon") !== "enabled") redirect("/");
  return <ComingSoonScreen />;
}

import type { Metadata } from "next";

import PolicyPage from "@/components/PolicyPage";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Privacy Policy",
  description: "CompareMyTrip privacy policy.",
  path: "/privacy",
  index: false,
});

export default function PrivacyPage() {
  return <PolicyPage policy="privacy" />;
}


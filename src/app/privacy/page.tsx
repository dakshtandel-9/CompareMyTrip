import type { Metadata } from "next";

import PendingPolicyPage from "@/components/PendingPolicyPage";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Privacy Policy",
  description: "CompareMyTrip privacy policy.",
  path: "/privacy",
  index: false,
});

export default function PrivacyPage() {
  return <PendingPolicyPage title="Privacy Policy" />;
}


import type { Metadata } from "next";

import PolicyPage from "@/components/PolicyPage";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Data Protection Policy",
  description: "CompareMyTrip data protection and personal data governance framework.",
  path: "/data-protection",
  index: false,
});

export default function DataProtectionPage() {
  return <PolicyPage policy="dataProtection" />;
}

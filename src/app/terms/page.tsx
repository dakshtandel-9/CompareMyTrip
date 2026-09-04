import type { Metadata } from "next";

import PendingPolicyPage from "@/components/PendingPolicyPage";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Terms and Conditions",
  description: "CompareMyTrip terms and conditions.",
  path: "/terms",
  index: false,
});

export default function TermsPage() {
  return <PendingPolicyPage title="Terms and Conditions" />;
}


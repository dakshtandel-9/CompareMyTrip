import type { Metadata } from "next";

import PendingPolicyPage from "@/components/PendingPolicyPage";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Refund and Cancellation Policy",
  description: "CompareMyTrip refund and cancellation policy.",
  path: "/refund-policy",
  index: false,
});

export default function RefundPolicyPage() {
  return <PendingPolicyPage title="Refund and Cancellation Policy" />;
}


import type { Metadata } from "next";

import PolicyPage from "@/components/PolicyPage";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Trust Guarantee",
  description: "CompareMyTrip Trust Guarantee for hotel and holiday bookings.",
  path: "/trust-guarantee",
  index: false,
});

export default function TrustGuaranteePage() {
  return <PolicyPage policy="trustGuarantee" />;
}

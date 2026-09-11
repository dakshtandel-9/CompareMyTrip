import type { Metadata } from "next";

import PolicyPage from "@/components/PolicyPage";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Terms and Conditions",
  description: "CompareMyTrip terms and conditions.",
  path: "/terms",
  index: false,
});

export default function TermsPage() {
  return <PolicyPage policy="terms" />;
}


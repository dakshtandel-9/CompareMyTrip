import type { Metadata } from "next";

import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Create an Account",
  description: "Create a CompareMyTrip account to save and compare holiday packages.",
  path: "/signup",
  index: false,
});

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}


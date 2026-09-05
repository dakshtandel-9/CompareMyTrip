import type { Metadata } from "next";
import { Suspense } from "react";

import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Sign In",
  description: "Sign in to manage your CompareMyTrip account, trips and quote requests.",
  path: "/login",
  index: false,
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  /* The page reads ?next= with useSearchParams, which needs a boundary so the
     shell can still be prerendered. */
  return <Suspense>{children}</Suspense>;
}


import type { Metadata } from "next";

import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Reset Your Password",
  description: "Request a password-reset email for your CompareMyTrip account.",
  path: "/forgot-password",
  index: false,
});

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}


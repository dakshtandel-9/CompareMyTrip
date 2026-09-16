import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Package design demos",
  robots: { index: false, follow: false },
};

/** These comparison routes are intentionally unavailable in production. */
export default function PackageDemoLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV !== "development") notFound();
  return children;
}

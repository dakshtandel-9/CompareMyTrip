import type { Metadata } from "next";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CompareSection from "./CompareSection";
import { createPageMetadata } from "@/lib/seo";

/* Stays a server component so the page keeps its metadata; the comparison
   itself is the homepage band's own copy in CompareSection, which reads the
   shared tray on the client. */

export const metadata: Metadata = createPageMetadata({
  title: "Compare Holiday Packages Side by Side",
  description:
    "Put up to three shortlisted packages side by side — duration, price, accommodation, meals, flights and cancellation terms in one table.",
  path: "/compare",
});

export default function ComparePage() {
  return (
    <>
      <Header />

      <main className="w-full bg-white font-body text-cmt-neutral-900">
        <h1 className="sr-only">Compare holiday packages side by side</h1>
        <CompareSection />
      </main>

      <Footer />
    </>
  );
}

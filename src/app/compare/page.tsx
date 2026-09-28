import type { Metadata } from "next";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CompareSection from "./CompareSection";
import { createPageMetadata } from "@/lib/seo";

/* Stays a server component so the page keeps its metadata; the comparison
   itself is the homepage band's own copy in CompareSection, which reads the
   shared tray on the client. */

export const metadata: Metadata = createPageMetadata({
  title: "Compare Our Travel Plans",
  description:
    "Explore and compare CompareMyTrip travel plans by price, duration, destinations, hotels, inclusions, activities, transport, itinerary and dates.",
  path: "/compare",
});

export default function ComparePage() {
  return (
    <>
      <Header />

      <main className="cmt-compare w-full bg-white font-body text-cmt-neutral-900">
        <h1 className="sr-only">Compare our travel plans</h1>
        <CompareSection />
      </main>

      <Footer />
    </>
  );
}

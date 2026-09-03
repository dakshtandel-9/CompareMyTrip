import type { Metadata } from "next";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CompareSection from "./CompareSection";

/* Stays a server component so the page keeps its metadata; the comparison
   itself is the homepage band's own copy in CompareSection, which reads the
   shared tray on the client. */

export const metadata: Metadata = {
  title: "Compare packages | CompareMyTrip",
  description:
    "Put up to three shortlisted packages side by side — duration, price, accommodation, meals, flights and cancellation terms in one table.",
};

export default function ComparePage() {
  return (
    <>
      <Header />

      <main className="w-full bg-white font-body text-cmt-neutral-900">
        <CompareSection />
      </main>

      <Footer />
    </>
  );
}

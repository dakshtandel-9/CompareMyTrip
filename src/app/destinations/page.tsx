import type { Metadata } from "next";
import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DestinationsIndex from "./DestinationsIndex";

export const metadata: Metadata = {
  title: "Destinations | CompareMyTrip",
  description:
    "Every destination we cover, with package counts and starting prices from trusted travel operators.",
};

export default function DestinationsPage() {
  return (
    <>
      <Header />
      {/* The index reads its tab out of the query string (?india,
          ?weekend-treks), so it renders on the client behind a boundary
          while the shell prerenders. */}
      <Suspense fallback={<div className="min-h-[60vh]" />}>
        <DestinationsIndex />
      </Suspense>
      <Footer />
    </>
  );
}

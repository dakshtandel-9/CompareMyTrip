import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DestinationsIndex from "./DestinationsIndex";

export const metadata: Metadata = {
  title: "Destinations | CompareMyTrip",
  description:
    "Every destination we cover, with package counts and starting prices from GST-verified travel operators.",
};

export default function DestinationsPage() {
  return (
    <>
      <Header />
      <DestinationsIndex />
      <Footer />
    </>
  );
}

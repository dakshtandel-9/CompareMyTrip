import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CruiseGrid from "./CruiseGrid";
import CruiseWhyBook from "./CruiseWhyBook";
import { getPublishedCruises } from "@/lib/serverContent";
import { createPageMetadata } from "@/lib/seo";

export const revalidate = 86400; // 24 hours

export const metadata: Metadata = createPageMetadata({
  title: "Cruise Holidays & Booking Assistance",
  description:
    "Explore cruise holidays with CompareMyTrip. Ask about sailing dates, cabin options, itineraries and booking assistance for your next trip.",
  path: "/cruise",
  index: true,
  follow: true,
});

export default async function CruisePage() {
  const cruises = await getPublishedCruises();

  return (
    <>
      <Header />
      <main className="bg-white">
        <CruiseGrid initialCruises={cruises} />
        <CruiseWhyBook />
      </main>
      <Footer />
    </>
  );
}

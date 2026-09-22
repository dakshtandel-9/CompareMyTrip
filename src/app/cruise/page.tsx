import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CruiseGrid from "./CruiseGrid";
import CruiseWhyBook from "./CruiseWhyBook";
import { getPublishedCruises } from "@/lib/serverContent";
import { createPageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = createPageMetadata({
  title: "Cruise Holidays",
  description:
    "Compare cruise lines sailing from India and worldwide. Request a quote or download a brochure for the cruise you like.",
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

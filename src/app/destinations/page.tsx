import type { Metadata } from "next";
import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DestinationsIndex, { DestinationsContent } from "./DestinationsIndex";
import { getDestinationCovers, getPublishedPackages } from "@/lib/serverContent";
import { toListingPackage } from "@/lib/listingPackages";
import { createPageMetadata } from "@/lib/seo";

export const revalidate = 86400; // 24 hours

export const metadata: Metadata = createPageMetadata({
  title: "Travel Destinations in India and Abroad",
  description:
    "Explore destinations covered by CompareMyTrip, with available package counts, trip lengths and starting prices.",
  path: "/destinations",
  image: "/images/destinations-header-banner.jpg",
  imageAlt: "Mountain destination landscape",
  index: true,
  follow: true,
});

export default async function DestinationsPage() {
  const [catalogue, covers] = await Promise.all([
    getPublishedPackages(),
    getDestinationCovers(),
  ]);
  const packages = catalogue.map(toListingPackage);
  return (
    <>
      <Header />
      {/* Keep destination cards in the prerendered HTML while URL tabs hydrate. */}
      <Suspense fallback={<DestinationsContent initialPackages={packages} initialCovers={covers} />}>
        <DestinationsIndex initialPackages={packages} initialCovers={covers} />
      </Suspense>
      <Footer />
    </>
  );
}

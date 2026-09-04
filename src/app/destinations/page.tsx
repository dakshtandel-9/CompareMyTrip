import type { Metadata } from "next";
import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DestinationsIndex from "./DestinationsIndex";
import { getDestinationCovers, getPublishedPackages } from "@/lib/serverContent";
import { createPageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  return createPageMetadata({
    title: "Travel Destinations in India and Abroad",
    description:
      "Explore destinations covered by CompareMyTrip, with available package counts, trip lengths and starting prices.",
    path: "/destinations",
    image: "/images/destinations-header-banner.jpg",
    imageAlt: "Mountain destination landscape",
    index: Object.keys(params).length === 0,
    follow: true,
  });
}

export default async function DestinationsPage() {
  const [packages, covers] = await Promise.all([
    getPublishedPackages(),
    getDestinationCovers(),
  ]);
  return (
    <>
      <Header />
      {/* The index reads its tab out of the query string (?india,
          ?weekend-treks), so it renders on the client behind a boundary
          while the shell prerenders. */}
      <Suspense fallback={<div className="min-h-[60vh]" />}>
        <DestinationsIndex initialPackages={packages} initialCovers={covers} />
      </Suspense>
      <Footer />
    </>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageSiteContent from "@/components/PageSiteContent";
import PackagesCatalog, { CatalogContent } from "./PackagesCatalog";
import { getPublishedPackages } from "@/lib/serverContent";
import { toListingPackage } from "@/lib/listingPackages";
import { createPageMetadata } from "@/lib/seo";

export const revalidate = 604800; // 7 days; publishing refreshes it at once

export const metadata: Metadata = createPageMetadata({
  title: "Explore Our Travel Plans",
  description:
    "Explore CompareMyTrip travel plans with day-by-day itineraries, hotels, inclusions and prices. Compare our plans side by side and choose your next trip.",
  path: "/packages",
  index: true,
  follow: true,
});

export default async function PackagesPage() {
  const packages = (await getPublishedPackages()).map(toListingPackage);

  return (
    <PageSiteContent sections={["banners", "weekendTreks"]}>
      <Header />
      {/* Prerender the unfiltered catalogue; hydrate URL filters inside the boundary. */}
      <Suspense fallback={<CatalogContent initialPackages={packages} />}>
        <PackagesCatalog initialPackages={packages} />
      </Suspense>
      {/* The compare bar sits over the bottom of this page alone — see
          @/components/FloatingActions. */}
      <Footer clearsCompareBar />
    </PageSiteContent>
  );
}

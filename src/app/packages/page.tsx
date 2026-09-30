import type { Metadata } from "next";
import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PackagesCatalog, { CatalogContent } from "./PackagesCatalog";
import { getPublishedPackages } from "@/lib/serverContent";
import { createPageMetadata } from "@/lib/seo";

export const revalidate = 86400; // 24 hours

export const metadata: Metadata = createPageMetadata({
  title: "Explore Our Travel Plans",
  description:
    "Explore CompareMyTrip travel plans with day-by-day itineraries, hotels, inclusions and prices. Compare our plans side by side and choose your next trip.",
  path: "/packages",
  index: true,
  follow: true,
});

export default async function PackagesPage() {
  const packages = await getPublishedPackages();

  return (
    <>
      <Header />
      {/* Prerender the unfiltered catalogue; hydrate URL filters inside the boundary. */}
      <Suspense fallback={<CatalogContent initialPackages={packages} />}>
        <PackagesCatalog initialPackages={packages} />
      </Suspense>
      {/* The compare bar sits over the bottom of this page alone — see
          @/components/FloatingActions. */}
      <Footer clearsCompareBar />
    </>
  );
}

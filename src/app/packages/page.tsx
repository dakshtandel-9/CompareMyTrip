import type { Metadata } from "next";
import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PackagesCatalog, { CatalogContent } from "./PackagesCatalog";
import { getPublishedPackages } from "@/lib/serverContent";
import { createPageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = createPageMetadata({
  title: "Holiday Packages with Itineraries and Prices",
  description:
    "Browse holiday packages with day-by-day itineraries, inclusions, exclusions and prices, then compare your shortlist side by side.",
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

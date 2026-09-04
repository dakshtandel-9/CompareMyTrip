import type { Metadata } from "next";
import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PackagesCatalog from "./PackagesCatalog";
import { getPublishedPackages } from "@/lib/serverContent";
import { createPageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  return createPageMetadata({
    title: "Holiday Packages with Itineraries and Prices",
    description:
      "Browse holiday packages with day-by-day itineraries, inclusions, exclusions and prices, then compare your shortlist side by side.",
    path: "/packages",
    index: Object.keys(params).length === 0,
    follow: true,
  });
}

/* The filters are seeded from the query string once, when the catalogue
   mounts. Navigating between two /packages URLs — the header's India and World
   menus, and the weekend-trek tracks, all land here — keeps that component
   mounted, so without a key the address bar would change while the grid stayed
   put. Every parameter the catalogue seeds itself from has to be in the key,
   or a menu click from this page does nothing. */
export default async function PackagesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const packages = await getPublishedPackages();
  const catalogKey = [
    "region",
    "category",
    "type",
    "trek",
    "q",
    "budgetMin",
    "budgetMax",
    "deals",
    "destination",
  ]
    .map((name) => `${name}=${params[name] ?? ""}`)
    .join("&");

  return (
    <>
      <Header />
      {/* PackagesCatalog reads the hero search's query string, so it renders
          on the client behind a boundary while the shell prerenders. */}
      <Suspense fallback={<div className="min-h-[60vh]" />}>
        <PackagesCatalog key={catalogKey} initialPackages={packages} />
      </Suspense>
      {/* The compare bar sits over the bottom of this page alone — see
          @/components/FloatingActions. */}
      <Footer clearsCompareBar />
    </>
  );
}

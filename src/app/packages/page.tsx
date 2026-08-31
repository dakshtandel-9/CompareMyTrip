import type { Metadata } from "next";
import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PackagesCatalog from "./PackagesCatalog";

export const metadata: Metadata = {
  title: "Holiday Packages | CompareMyTrip",
  description:
    "Browse curated holiday packages from GST-verified travel operators.",
};

/* The filters are seeded from the query string once, when the catalogue
   mounts. Navigating between two /packages URLs — the header's Domestic Tours
   and International Holidays both land here — keeps that component mounted, so
   without a key the address bar would change while the grid stayed put. */
export default async function PackagesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const catalogKey = ["region", "category", "q", "budgetMin", "budgetMax", "deals", "destination"]
    .map((name) => `${name}=${params[name] ?? ""}`)
    .join("&");

  return (
    <>
      <Header />
      {/* PackagesCatalog reads the hero search's query string, so it renders
          on the client behind a boundary while the shell prerenders. */}
      <Suspense fallback={<div className="min-h-[60vh]" />}>
        <PackagesCatalog key={catalogKey} />
      </Suspense>
      <Footer />
    </>
  );
}

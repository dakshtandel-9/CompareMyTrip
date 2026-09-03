import type { Metadata } from "next";
import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PackagesCatalog from "./PackagesCatalog";

export const metadata: Metadata = {
  title: "Holiday Packages | CompareMyTrip",
  description:
    "Browse curated holiday packages from trusted travel operators.",
};

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
  const catalogKey = [
    "region",
    "category",
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
        <PackagesCatalog key={catalogKey} />
      </Suspense>
      <Footer />
    </>
  );
}

import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PackageDetailClient from "./PackageDetailClient";

export const metadata: Metadata = {
  title: "Travel package | CompareMyTrip",
  description: "Explore a complete travel package with gallery, daily itinerary, stays and inclusions.",
};

export default function PackageDetailPage() {
  return <><Header /><PackageDetailClient /><Footer /></>;
}

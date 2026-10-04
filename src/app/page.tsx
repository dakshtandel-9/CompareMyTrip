import type { Metadata } from "next";

import { getPublishedBlogPosts, getPublishedPackages } from "@/lib/serverContent";
import { toListingPackage } from "@/lib/listingPackages";
import HomeContentProvider from "./home/HomeContentProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { createPageMetadata } from "@/lib/seo";

// Sections render in the order they appear below.
import ScrollFrameSequence from "./home/_sections/ScrollFrameSequence";
import QuickTravelCategories from "./home/_sections/QuickTravelCategories";
import TrendingDestinations from "./home/_sections/TrendingDestinations";
import CompareBeforeYouBook from "./home/_sections/CompareBeforeYouBook";
import FeaturedPackages from "./home/_sections/FeaturedPackages";
import WeekendTreks from "./home/_sections/WeekendTreks";
import TrainFrameBanner from "./home/_sections/TrainFrameBanner";
import DomesticHolidays from "./home/_sections/DomesticHolidays";
import InternationalHolidays from "./home/_sections/InternationalHolidays";
import WhyTravelWithUs from "./home/_sections/WhyTravelWithUs";
import LatestDeals from "./home/_sections/LatestDeals";
import TravellerReviews from "./home/_sections/TravellerReviews";
import TravelGallery from "./home/_sections/TravelGallery";
import TravelGuides from "./home/_sections/TravelGuides";
import Faq from "./home/_sections/Faq";
import TrustAndNewsletter from "./home/_sections/TrustAndNewsletter";

export const metadata: Metadata = createPageMetadata({
  title: "Treks, Getaways & Holiday Packages | CompareMyTrip",
  description:
    "Explore curated treks, weekend getaways and holidays in India and abroad. Compare CompareMyTrip plans by itinerary, inclusions and price.",
  path: "/",
});

export const revalidate = 86400; // 24 hours

export default async function HomePage() {
  const [packages, posts] = await Promise.all([getPublishedPackages(), getPublishedBlogPosts()]);
  return (
    <HomeContentProvider packages={packages.map(toListingPackage)} posts={posts}>
      <Header />

      <main className="cmt-home w-full bg-white font-body text-cmt-neutral-900">
        <ScrollFrameSequence />
        <QuickTravelCategories />
        <TrendingDestinations />
        <CompareBeforeYouBook />
        <FeaturedPackages />
        <WeekendTreks />
        <TrainFrameBanner />
        <DomesticHolidays />
        <InternationalHolidays />
        <WhyTravelWithUs />
        <LatestDeals />
        <TravelGallery />
        <TravellerReviews />
        <TravelGuides />
        <Faq />
        <TrustAndNewsletter />
      </main>

      <Footer />
    </HomeContentProvider>
  );
}

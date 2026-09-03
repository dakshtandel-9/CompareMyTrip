import type { Metadata } from "next";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
import TravelGuides from "./home/_sections/TravelGuides";
import Faq from "./home/_sections/Faq";
import TrustAndNewsletter from "./home/_sections/TrustAndNewsletter";

export const metadata: Metadata = {
  title: "CompareMyTrip — Compare travel packages before you book",
  description:
    "Compare curated travel packages side by side — full itineraries, inclusions and cancellation terms published up front, from trusted operators across India and beyond.",
};

export default function HomePage() {
  return (
    <>
      <Header />

      <main className="w-full bg-white font-body text-cmt-neutral-900">
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
        <TravellerReviews />
        <TravelGuides />
        <Faq />
        <TrustAndNewsletter />
      </main>

      <Footer />
    </>
  );
}

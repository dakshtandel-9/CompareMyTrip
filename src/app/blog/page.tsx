import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BlogIndex from "./BlogIndex";

export const metadata: Metadata = {
  title: "Travel Guides | CompareMyTrip",
  description:
    "Destination guides, itineraries and practical travel advice from the CompareMyTrip travel desk.",
};

export default function BlogPage() {
  return (
    <>
      <Header />
      <BlogIndex />
      <Footer />
    </>
  );
}

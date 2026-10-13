import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BlogIndex from "./BlogIndex";
import { getPublishedBlogPosts } from "@/lib/serverContent";
import { createPageMetadata } from "@/lib/seo";

export const revalidate = 604800; // 7 days; publishing refreshes it at once

export const metadata: Metadata = createPageMetadata({
  title: "Travel Guides and Trip Planning Advice",
  description:
    "Destination guides, itineraries and practical travel advice from the CompareMyTrip travel desk.",
  path: "/blog",
});

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts();
  return (
    <>
      <Header />
      <BlogIndex initialPosts={posts} />
      <Footer />
    </>
  );
}

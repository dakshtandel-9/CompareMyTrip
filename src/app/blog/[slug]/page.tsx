import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BlogArticle from "./BlogArticle";

/* Posts are read from Firestore in the browser, so the shell carries a
   generic title and the article swaps in its own once it has loaded. */
export const metadata: Metadata = {
  title: "Travel guide | CompareMyTrip",
  description: "A destination guide from the CompareMyTrip travel desk.",
};

export default function BlogPostPage() {
  return (
    <>
      <Header />
      <BlogArticle />
      <Footer />
    </>
  );
}

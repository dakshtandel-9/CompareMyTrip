import type { Metadata } from "next";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactBody from "./ContactBody";
import { createPageMetadata } from "@/lib/seo";

/* Stays a server component so the page keeps its metadata; everything it
   says lives in ContactBody, which reads the CRM's content. */

export const metadata: Metadata = createPageMetadata({
  title: "Plan Your Next Trip",
  description:
    "Contact CompareMyTrip for treks, weekend getaways and holiday planning. Share your destination, dates and budget with our travel team.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <Header />
      <ContactBody />
      <Footer />
    </>
  );
}

import type { Metadata } from "next";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactBody from "./ContactBody";
import { createPageMetadata } from "@/lib/seo";

/* Stays a server component so the page keeps its metadata; everything it
   says lives in ContactBody, which reads the CRM's content. */

export const metadata: Metadata = createPageMetadata({
  title: "Contact the Travel Desk",
  description:
    "Send an enquiry and our travel desk will come back with package options that match the trip you have in mind.",
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

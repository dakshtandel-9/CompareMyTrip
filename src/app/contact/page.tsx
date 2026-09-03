import type { Metadata } from "next";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactBody from "./ContactBody";

/* Stays a server component so the page keeps its metadata; everything it
   says lives in ContactBody, which reads the CRM's content. */

export const metadata: Metadata = {
  title: "Contact | CompareMyTrip",
  description:
    "Send an enquiry and our travel desk will come back with package options that match the trip you have in mind.",
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <ContactBody />
      <Footer />
    </>
  );
}

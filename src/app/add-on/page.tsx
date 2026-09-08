import type { Metadata } from "next";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AddOnBody from "./AddOnBody";
import { createPageMetadata } from "@/lib/seo";
import { findService, toServiceId } from "./services";

/* Stays a server component so the page keeps its metadata; the tabs and the
   three forms live in AddOnBody.

   `?service=` opens one of them, which is what the header's Add On menu
   points at. AddOnBody is keyed by it: the panels are client state, so
   without the key a menu click from this page would change the address bar
   and leave the same tab open. */

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const service = findService(toServiceId(params.service));

  return createPageMetadata({
    title: "Flight, Hotel and Visa Enquiries",
    description:
      "Ask our travel desk for flights, hotels or a visa — on their own or alongside a package. Tell us the dates and we come back with options you can compare.",
    path: "/add-on",
    // One canonical page; the tabs are the same content, so only the plain
    // URL is offered to search.
    index: !params.service,
    follow: true,
    imageAlt: `${service.title} with CompareMyTrip`,
  });
}

export default async function AddOnPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const service = toServiceId(params.service);

  return (
    <>
      <Header />
      <AddOnBody key={service} initialService={service} />
      <Footer />
    </>
  );
}

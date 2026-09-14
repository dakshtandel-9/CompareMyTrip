import type { Metadata } from "next";
import ContentEditor from "./ContentEditor";
import { SECTION_ORDER, type SectionKey } from "@/lib/siteContent";

export const metadata: Metadata = {
  title: "Website Content",
  description:
    "Edit the copy, photos and icons across the CompareMyTrip site — header, sign-in screens, contact page and homepage.",
};

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string | string[] }>;
}) {
  const { section } = await searchParams;
  const initialSection = typeof section === "string" && SECTION_ORDER.includes(section as SectionKey)
    ? section as SectionKey
    : "hero";

  return <ContentEditor key={initialSection} initialSection={initialSection} />;
}

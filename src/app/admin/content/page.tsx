import type { Metadata } from "next";
import ContentEditor from "./ContentEditor";

export const metadata: Metadata = {
  title: "Website Content",
  description:
    "Edit the copy, photos and icons across the CompareMyTrip site — header, sign-in screens, contact page and homepage.",
};

export default function AdminContentPage() {
  return <ContentEditor />;
}

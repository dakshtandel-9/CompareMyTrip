import type { Metadata } from "next";
import HomepageEditor from "./HomepageEditor";

export const metadata: Metadata = {
  title: "Homepage | CompareMyTrip CRM",
  description: "Edit every section of the CompareMyTrip homepage.",
};

export default function AdminHomepagePage() {
  return <HomepageEditor />;
}

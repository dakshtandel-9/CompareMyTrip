import type { Metadata } from "next";
import AdminCruiseEnquiriesList from "./AdminCruiseEnquiriesList";

export const metadata: Metadata = {
  title: "Cruise Enquiries",
  description: "Quote requests sent from the cruise page.",
};

export default function AdminCruiseEnquiriesPage() {
  return <AdminCruiseEnquiriesList />;
}

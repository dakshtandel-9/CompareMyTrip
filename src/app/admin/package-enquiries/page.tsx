import type { Metadata } from "next";
import AdminEnquiriesList from "../enquiries/AdminEnquiriesList";

export const metadata: Metadata = {
  title: "Package Quote Requests | CompareMyTrip CRM",
  description: "Manage customized package quote requests.",
};

export default function AdminPackageEnquiriesPage() {
  return <AdminEnquiriesList kind="package" />;
}

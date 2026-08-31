import type { Metadata } from "next";
import AdminEnquiriesList from "./AdminEnquiriesList";

export const metadata: Metadata = { title: "Contact Enquiries | CompareMyTrip CRM", description: "Manage customer travel enquiries." };

export default function AdminEnquiriesPage() { return <AdminEnquiriesList kind="contact" />; }

import type { Metadata } from "next";
import AdminEnquiriesList from "./AdminEnquiriesList";

export const metadata: Metadata = { title: "Contact Enquiries", description: "Manage customer travel enquiries." };

export default function AdminEnquiriesPage() { return <AdminEnquiriesList kind="contact" />; }

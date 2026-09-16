import type { Metadata } from "next";
import AdminDestinationsManager from "./AdminDestinationsManager";

export const metadata: Metadata = {
  title: "Destinations",
  description: "Create destinations, add travel packages and manage destination cover photos.",
};

export default function AdminDestinationsPage() {
  return <AdminDestinationsManager />;
}

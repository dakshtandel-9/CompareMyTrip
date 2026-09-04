import type { Metadata } from "next";
import AdminDestinationsManager from "./AdminDestinationsManager";

export const metadata: Metadata = {
  title: "Destinations",
  description: "Set the cover artwork shown for each destination that has packages.",
};

export default function AdminDestinationsPage() {
  return <AdminDestinationsManager />;
}

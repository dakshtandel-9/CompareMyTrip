import type { Metadata } from "next";
import AdminPackagesManager from "./AdminPackagesManager";

export const metadata: Metadata = {
  title: "Packages | CompareMyTrip CRM",
  description: "Create, edit and publish travel packages.",
};

export default function AdminPackagesPage() {
  return <AdminPackagesManager />;
}

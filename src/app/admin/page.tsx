import type { Metadata } from "next";
import DashboardHome from "./DashboardHome";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage homepage content and travel packages.",
};

export default function AdminPage() {
  return <DashboardHome />;
}

import type { Metadata } from "next";
import DashboardHome from "./DashboardHome";

export const metadata: Metadata = {
  title: "Overview",
  description: "Your customer follow-ups, bookings, travel catalogue and website workspace.",
};

export default function AdminPage() {
  return <DashboardHome />;
}

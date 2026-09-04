import type { Metadata } from "next";
import AdminBannersManager from "./AdminBannersManager";

export const metadata: Metadata = {
  title: "Banners | CompareMyTrip CRM",
  description: "The photography mastheads across the site.",
};

export default function AdminBannersPage() {
  return <AdminBannersManager />;
}

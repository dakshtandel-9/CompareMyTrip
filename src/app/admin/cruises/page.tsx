import type { Metadata } from "next";
import AdminCruisesManager from "./AdminCruisesManager";

export const metadata: Metadata = {
  title: "Cruises",
  description: "Create and manage the cruise cards on your cruise page.",
};

export default function AdminCruisesPage() {
  return <AdminCruisesManager />;
}

import type { Metadata } from "next";
import AdminUsersList from "./AdminUsersList";

export const metadata: Metadata = {
  title: "Customer Accounts",
  description: "View customer accounts registered with CompareMyTrip.",
};

export default function AdminUsersPage() {
  return <AdminUsersList />;
}

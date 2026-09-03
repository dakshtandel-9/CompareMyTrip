import type { Metadata } from "next";
import AdminCouponsManager from "./AdminCouponsManager";

export const metadata: Metadata = {
  title: "Coupons | CompareMyTrip CRM",
  description: "Discount codes and standing offers applied at checkout.",
};

export default function AdminCouponsPage() {
  return <AdminCouponsManager />;
}

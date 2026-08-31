import type { Metadata } from "next";
import AdminSubscribersList from "./AdminSubscribersList";

export const metadata: Metadata = {
  title: "Newsletter Subscribers | CompareMyTrip CRM",
  description: "View newsletter subscribers and subscription times.",
};

export default function AdminSubscribersPage() {
  return <AdminSubscribersList />;
}

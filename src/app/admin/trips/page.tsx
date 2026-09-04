import type { Metadata } from "next";
import AdminTripsList from "./AdminTripsList";

export const metadata: Metadata = {
  title: "Trips",
  description: "Bookings taken through PayU checkout.",
};

export default function AdminTripsPage() {
  return <AdminTripsList />;
}

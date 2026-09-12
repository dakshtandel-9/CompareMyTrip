import type { Trip } from "./firebase/trips";

/** Payment must succeed before a booking's travel status is meaningful. */
export function accountTripGroup(trip: Pick<Trip, "paymentStatus" | "tripStatus">): "active" | "completed" | "unsuccessful" {
  if (trip.paymentStatus === "failed") return "unsuccessful";
  if (trip.paymentStatus === "pending") return "active";
  if (trip.tripStatus === "rejected" || trip.tripStatus === "refunded") return "unsuccessful";
  if (trip.tripStatus === "completed") return "completed";
  return "active";
}

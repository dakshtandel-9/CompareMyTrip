import type { Trip } from "./firebase/trips";

export function paymentMethodLabel(mode: string): string {
  const labels: Record<string, string> = { CC: "Credit card", DC: "Debit card", NB: "Net banking", UPI: "UPI", CASH: "Wallet", EMI: "EMI" };
  return labels[mode.trim().toUpperCase()] || mode.trim() || "Not available";
}

export function paymentHistoryStatus(trip: Pick<Trip, "paymentStatus" | "tripStatus" | "amountMismatch">) {
  if (trip.amountMismatch) return { label: "Under review", className: "bg-cmt-primary-100 text-cmt-primary-900" };
  if (trip.paymentStatus === "successful") {
    if (trip.tripStatus === "refunded") return { label: "Refunded", className: "bg-cmt-neutral-100 text-cmt-neutral-700" };
    return { label: "Paid", className: "bg-cmt-success-100 text-cmt-success-700" };
  }
  if (trip.paymentStatus === "failed") return { label: "Failed", className: "bg-cmt-error-100 text-cmt-error-700" };
  return { label: "Pending", className: "bg-cmt-primary-100 text-cmt-primary-900" };
}

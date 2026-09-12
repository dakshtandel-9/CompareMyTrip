/** Pending checkout records expire 48 hours after their original creation. */
export const PENDING_PAYMENT_TTL_MS = 48 * 60 * 60 * 1000;
export const PAYMENT_RETRY_COOLDOWN_MS = 5 * 60 * 1000;

export function pendingPaymentExpired(payment: { paymentStatus: string; createdAt: Date | null }, now = Date.now()) {
  return payment.paymentStatus === "pending" && payment.createdAt !== null &&
    Number.isFinite(payment.createdAt.getTime()) && now >= payment.createdAt.getTime() + PENDING_PAYMENT_TTL_MS;
}

export type PaymentReport = {
  id: string;
  tripId: string;
  packageTitle: string;
  name: string;
  email: string;
  phone: string;
  amount: number;
  reference: string;
  message: string;
  status: "open" | "resolved";
  adminNote: string;
  createdAt: string;
};

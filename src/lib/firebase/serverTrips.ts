import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "./admin";
import type { PaymentStatus } from "./trips";

/* ------------------------------------------------------------------ */
/* Server-side writes to `trips`. Never import into a client component. */
/*                                                                      */
/* The document id is the PayU txnid, which makes both writes naturally */
/* idempotent: the redirect and the (optional) PayU webhook can both     */
/* land without producing duplicates or double-processing a booking.     */
/* ------------------------------------------------------------------ */

export type NewTrip = {
  txnid: string;
  userId: string;
  packageId: string;
  packageTitle: string;
  travellers: number;
  perPerson: number;
  amount: number;
  name: string;
  email: string;
  phone: string;
};

/** Records the booking as pending, before the buyer is sent to PayU. */
export async function createPendingTrip(trip: NewTrip) {
  const db = getAdminDb();
  if (!db) return false;

  await db.collection("trips").doc(trip.txnid).set({
    ...trip,
    paymentStatus: "pending" satisfies PaymentStatus,
    tripStatus: "awaiting_confirmation",
    // Scheduled by the travel desk once the booking is confirmed.
    tripDate: "",
    payuPaymentId: "",
    paymentMode: "",
    failureReason: "",
    amountMismatch: false,
    createdAt: FieldValue.serverTimestamp(),
    paidAt: null,
    updatedAt: FieldValue.serverTimestamp(),
  });
  return true;
}

/**
 * Applies PayU's verified outcome. Only ever called after the response
 * hash checks out, and only moves a trip off `pending` — so a replayed
 * callback cannot flip a settled booking back, and cannot overwrite the
 * travel desk's own tripStatus decisions.
 */
export async function settleTrip(input: {
  txnid: string;
  paymentStatus: Exclude<PaymentStatus, "pending">;
  payuPaymentId: string;
  paymentMode: string;
  failureReason: string;
  reportedAmount: string;
}) {
  const db = getAdminDb();
  if (!db) return;

  const ref = db.collection("trips").doc(input.txnid);
  const snapshot = await ref.get();
  if (!snapshot.exists) {
    // No pending row — the initiate write failed, or this txnid was never
    // ours. Record it anyway so the booking is not silently lost, and let
    // the CRM see it has no order behind it.
    await ref.set({
      txnid: input.txnid,
      userId: "",
      packageId: "",
      packageTitle: "Unmatched PayU transaction",
      travellers: 0,
      perPerson: 0,
      amount: Number(input.reportedAmount) || 0,
      name: "",
      email: "",
      phone: "",
      paymentStatus: input.paymentStatus,
      tripStatus: "awaiting_confirmation",
      tripDate: "",
      payuPaymentId: input.payuPaymentId,
      paymentMode: input.paymentMode,
      failureReason: input.failureReason,
      amountMismatch: true,
      createdAt: FieldValue.serverTimestamp(),
      paidAt: input.paymentStatus === "successful" ? FieldValue.serverTimestamp() : null,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return;
  }

  if (snapshot.data()?.paymentStatus !== "pending") return;

  // PayU echoes the amount it actually charged. A disagreement with the
  // price the server signed means the booking needs a human check against
  // the PayU dashboard before it is honoured.
  const signed = Number(snapshot.data()?.amount ?? 0);
  const reported = Number(input.reportedAmount);
  const amountMismatch =
    !Number.isFinite(reported) || Math.abs(reported - signed) > 0.01;

  await ref.update({
    paymentStatus: input.paymentStatus,
    payuPaymentId: input.payuPaymentId,
    paymentMode: input.paymentMode,
    failureReason: input.failureReason,
    amountMismatch: input.paymentStatus === "successful" ? amountMismatch : false,
    paidAt: input.paymentStatus === "successful" ? FieldValue.serverTimestamp() : null,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

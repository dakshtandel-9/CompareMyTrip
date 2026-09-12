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
  /** Before the coupon: perPerson × travellers. */
  subtotal: number;
  /** What the coupon took off, in rupees. 0 when none was applied. */
  discount: number;
  /** The code as applied, uppercase. Empty when none. Coupon usage is
      counted off these rows, so this is the record of a redemption. */
  couponCode: string;
  couponLabel: string;
  /** What PayU was asked to charge: subtotal − discount. */
  amount: number;
  name: string;
  email: string;
  phone: string;
  /** The day the traveller asked to depart, YYYY-MM-DD, or "" if they left
      it open. Already normalised by the caller. */
  tripDate: string;
  payuEnvironment?: "test" | "live";
  paymentKind?: "custom";
  paymentReference?: string;
};

/** Records the booking as pending, before the buyer is sent to PayU. */
export async function createPendingTrip(trip: NewTrip) {
  const db = getAdminDb();
  if (!db) return false;

  await db.collection("trips").doc(trip.txnid).set({
    // tripDate rides in on `trip`: it is the date the traveller picked on
    // the package page. Left empty when they did not choose one, which is
    // the case the travel desk fills in from the admin list as before.
    ...trip,
    paymentStatus: "pending" satisfies PaymentStatus,
    tripStatus: "awaiting_confirmation",
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

/** Verified callbacks and reconciliation share one atomic, monotonic write. */
export async function settleTrip(input: {
  txnid: string;
  tripId?: string;
  paymentStatus: Exclude<PaymentStatus, "pending">;
  payuPaymentId: string;
  paymentMode: string;
  failureReason: string;
  reportedAmount: string;
  recovery?: { userId: string; packageId: string; packageTitle: string; travellers: number; name: string; email: string };
}) {
  const db = getAdminDb();
  if (!db) throw new Error("Booking storage is unavailable.");
  const tripId = input.tripId || input.txnid;
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(tripId)) throw new Error("Invalid booking reference.");
  const ref = db.collection("trips").doc(tripId);
  const reportRef = db.collection("paymentReports").doc(tripId);

  await db.runTransaction(async tx => {
    const snapshot = await tx.get(ref);
    const report = await tx.get(reportRef);
    const data = snapshot.data();
    if (data?.paymentStatus === "successful") {
      if (input.paymentStatus === "successful" && data.settledPaymentId && data.settledPaymentId !== input.txnid) {
        tx.update(ref, { duplicatePaymentIds: FieldValue.arrayUnion(input.txnid), updatedAt: FieldValue.serverTimestamp() });
      }
      return;
    }
    // A failure from an older attempt cannot reject the current retry.
    if (input.paymentStatus === "failed" && (!data || data.paymentStatus !== "pending" || (data.activePaymentId || data.txnid) !== input.txnid)) return;

    // A reported payment keeps its booking snapshot, even after pending
    // cleanup. New checkouts also carry signed ownership fields in PayU.
    const backup = data ?? report.data()?.booking;
    const amount = Number(input.reportedAmount);
    const expected = Number(backup?.amount ?? amount);
    const mismatch = input.paymentStatus === "successful" && (!Number.isFinite(amount) || !Number.isFinite(expected) || Math.abs(amount - expected) > 0.01);
    const result = {
      paymentStatus: input.paymentStatus,
      settledPaymentId: input.txnid,
      payuPaymentId: input.payuPaymentId,
      paymentMode: input.paymentMode,
      failureReason: input.failureReason,
      amountMismatch: mismatch,
      paidAt: input.paymentStatus === "successful" ? FieldValue.serverTimestamp() : null,
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (snapshot.exists) tx.update(ref, result);
    else {
      tx.set(ref, {
        txnid: tripId, userId: "", packageId: "", packageTitle: "Unmatched PayU transaction",
        travellers: 0, perPerson: 0, subtotal: Number.isFinite(amount) ? amount : 0,
        discount: 0, couponCode: "", couponLabel: "", amount: Number.isFinite(amount) ? amount : 0,
        name: "", email: "", phone: "", tripStatus: "awaiting_confirmation", tripDate: "",
        createdAt: FieldValue.serverTimestamp(), ...input.recovery, ...backup, ...result,
        amountMismatch: mismatch || (!backup && !input.recovery?.userId),
      });
    }
    if (report.exists && input.paymentStatus === "successful" && !mismatch) {
      tx.update(reportRef, { status: "resolved", adminNote: "Payment confirmed by PayU.", updatedAt: FieldValue.serverTimestamp() });
      tx.update(ref, { paymentReportStatus: "resolved" });
    }
  });
}

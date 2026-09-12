import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { getFirebaseDb } from "./client";

/* ------------------------------------------------------------------ */
/* Bookings taken through PayU checkout.                                */
/*                                                                      */
/* Two independent status axes:                                         */
/*                                                                      */
/*  paymentStatus — what PayU told us. Written only by the server from  */
/*    the hash-verified callback; Firestore rules deny every client      */
/*    write to it, admins included. Never edit it by hand.               */
/*                                                                      */
/*  tripStatus — what the travel desk decided afterwards. Meaningful     */
/*    only once payment succeeded, and the one field the admin UI can    */
/*    change.                                                            */
/* ------------------------------------------------------------------ */

export type PaymentStatus = "pending" | "successful" | "failed";
export type TripStatus =
  | "awaiting_confirmation"
  | "accepted"
  | "rejected"
  | "refunded"
  | "completed";

export type Trip = {
  id: string;
  txnid: string;
  userId: string;
  packageId: string;
  packageTitle: string;
  travellers: number;
  perPerson: number;
  /* The coupon, as applied at checkout. Bookings taken before coupons
     existed carry none of these, and read as a full-price order. */
  subtotal: number;
  discount: number;
  couponCode: string;
  couponLabel: string;
  amount: number;
  name: string;
  email: string;
  phone: string;
  paymentStatus: PaymentStatus;
  tripStatus: TripStatus;
  /* The departure day, as YYYY-MM-DD. Deliberately a calendar day rather
     than a Timestamp: a trip on the 14th is on the 14th regardless of the
     viewer's timezone, and a Timestamp would render as the 13th for anyone
     west of the booking. Empty until the travel desk schedules it. */
  tripDate: string;
  payuPaymentId: string;
  paymentMode: string;
  payuEnvironment?: "test" | "live";
  settledPaymentId?: string;
  failureReason: string;
  /* Set when PayU reports an amount that disagrees with the price the
     server signed — the booking is then not trustworthy without a manual
     check against the PayU dashboard. */
  amountMismatch: boolean;
  activePaymentId?: string;
  paymentReportStatus?: "open" | "resolved" | "";
  duplicatePaymentIds?: string[];
  createdAt: Date | null;
  paidAt: Date | null;
  updatedAt: Date | null;
};

type StoredTrip = Record<string, unknown> & {
  createdAt?: Timestamp | null;
  paidAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
};

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const number = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;
const date = (value: Timestamp | null | undefined) =>
  value && typeof value.toDate === "function" ? value.toDate() : null;

const paymentStatusValue = (value: unknown): PaymentStatus =>
  value === "successful" || value === "failed" ? value : "pending";

const tripStatusValue = (value: unknown): TripStatus =>
  value === "accepted" || value === "rejected" || value === "refunded" || value === "completed"
    ? value
    : "awaiting_confirmation";

const mapTrip = (id: string, data: StoredTrip): Trip => ({
  id,
  txnid: text(data.txnid) || id,
  userId: text(data.userId),
  packageId: text(data.packageId),
  packageTitle: text(data.packageTitle),
  travellers: number(data.travellers),
  perPerson: number(data.perPerson),
  /* Older rows have no subtotal: the amount charged was the subtotal. */
  subtotal: number(data.subtotal) || number(data.amount),
  discount: number(data.discount),
  couponCode: text(data.couponCode),
  couponLabel: text(data.couponLabel),
  amount: number(data.amount),
  name: text(data.name),
  email: text(data.email),
  phone: text(data.phone),
  paymentStatus: paymentStatusValue(data.paymentStatus),
  tripStatus: tripStatusValue(data.tripStatus),
  tripDate: /^\d{4}-\d{2}-\d{2}$/.test(text(data.tripDate)) ? text(data.tripDate) : "",
  payuPaymentId: text(data.payuPaymentId),
  paymentMode: text(data.paymentMode),
  payuEnvironment: data.payuEnvironment === "test" || data.payuEnvironment === "live" ? data.payuEnvironment : undefined,
  settledPaymentId: text(data.settledPaymentId),
  failureReason: text(data.failureReason),
  amountMismatch: data.amountMismatch === true,
  activePaymentId: text(data.activePaymentId) || text(data.txnid) || id,
  paymentReportStatus: data.paymentReportStatus === "open" || data.paymentReportStatus === "resolved" ? data.paymentReportStatus : "",
  duplicatePaymentIds: Array.isArray(data.duplicatePaymentIds) ? data.duplicatePaymentIds.filter((id): id is string => typeof id === "string") : [],
  createdAt: date(data.createdAt),
  paidAt: date(data.paidAt),
  updatedAt: date(data.updatedAt),
});

const byNewest = (a: Trip, b: Trip) =>
  (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0);

/** Every booking, for the CRM. Admin-only by rule. */
export function subscribeToTrips(
  onTrips: (trips: Trip[]) => void,
  onError: (message: string) => void,
) {
  return onSnapshot(
    collection(getFirebaseDb(), "trips"),
    (snapshot) => {
      onTrips(
        snapshot.docs
          .map((tripDocument) => mapTrip(tripDocument.id, tripDocument.data() as StoredTrip))
          .sort(byNewest),
      );
    },
    (error) =>
      onError(
        error instanceof FirebaseError && error.code === "permission-denied"
          ? "This CRM account is not authorized to view trips."
          : error.message || "Trips could not be loaded.",
      ),
  );
}

/** One customer's own bookings, for My Trips. */
export function subscribeToUserTrips(
  userId: string,
  onTrips: (trips: Trip[]) => void,
  onError: (message: string) => void,
) {
  return onSnapshot(
    query(collection(getFirebaseDb(), "trips"), where("userId", "==", userId)),
    (snapshot) => {
      onTrips(
        snapshot.docs
          .map((tripDocument) => mapTrip(tripDocument.id, tripDocument.data() as StoredTrip))
          .sort(byNewest),
      );
    },
    (error) => onError(error.message || "Your trips could not be loaded."),
  );
}

/** One of only two fields the CRM may change — rules reject anything else. */
export async function updateTripStatus(tripId: string, tripStatus: TripStatus) {
  await updateDoc(doc(getFirebaseDb(), "trips", tripId), {
    tripStatus,
    updatedAt: serverTimestamp(),
  });
}

/** Schedules (or clears, with "") the departure day. */
export async function updateTripDate(tripId: string, tripDate: string) {
  if (tripDate && !/^\d{4}-\d{2}-\d{2}$/.test(tripDate)) {
    throw new Error("Enter the trip date as a calendar date.");
  }
  await updateDoc(doc(getFirebaseDb(), "trips", tripId), {
    tripDate,
    updatedAt: serverTimestamp(),
  });
}

/* ------------------------------- dates ------------------------------- */

/**
 * A YYYY-MM-DD string as local midnight, or null if it is not a real date.
 *
 * The shape check alone is not enough: "2026-13-45" matches the pattern but
 * Date happily rolls it forward into the following year, which would show a
 * confident countdown to a day nobody chose.
 */
function parseTripDate(tripDate: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tripDate)) return null;
  const [year, month, day] = tripDate.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  const rolledOver =
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day;
  return rolledOver ? null : parsed;
}

/**
 * Whole days from today to the trip date; negative once it has passed,
 * null when no date is set or it is malformed.
 *
 * Both ends are snapped to local midnight and the division is rounded, so a
 * day containing a daylight-saving change (23 or 25 hours long) still counts
 * as one day rather than silently going off by one.
 */
export function daysUntilTrip(tripDate: string, now = new Date()): number | null {
  const target = parseTripDate(tripDate);
  if (!target) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

/** "in 12 days" / "Tomorrow" / "Today" / "12 days ago". */
export function countdownLabel(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  return days > 0 ? `in ${days} days` : `${Math.abs(days)} days ago`;
}

/* en-GB rather than en-IN: both are day-first, but en-IN renders
   "Sat, 12 Sept, 2026" with a stray comma and a four-letter "Sept". */
const tripDateFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** Renders a YYYY-MM-DD trip date without dragging it through a timezone. */
export function formatTripDate(tripDate: string): string {
  const parsed = parseTripDate(tripDate);
  return parsed ? tripDateFormatter.format(parsed) : "";
}

/* ---------------------------- presentation ---------------------------- */

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Payment pending",
  successful: "Payment successful",
  failed: "Payment rejected",
};

export const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  awaiting_confirmation: "Awaiting confirmation",
  accepted: "Accepted",
  rejected: "Rejected",
  refunded: "Refunded",
  completed: "Trip completed",
};

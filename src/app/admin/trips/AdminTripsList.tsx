"use client";

import { useEffect, useMemo, useState } from "react";
import PaymentReports from "@/components/PaymentReports";
import { pendingPaymentExpired } from "@/lib/pendingPayments";
import { FirebaseError } from "firebase/app";
import {
  BadgeIndianRupee,
  CalendarClock,
  CalendarHeart,
  Mail,
  Phone,
  Plane,
  TriangleAlert,
  Users,
} from "lucide-react";
import {
  PAYMENT_STATUS_LABELS,
  TRIP_STATUS_LABELS,
  countdownLabel,
  daysUntilTrip,
  formatTripDate,
  subscribeToTrips,
  updateTripDate,
  updateTripStatus,
  type PaymentStatus,
  type Trip,
  type TripStatus,
} from "@/lib/firebase/trips";

const dateFormatter = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" });
const formatINR = (value: number) => `₹${value.toLocaleString("en-IN")}`;

const paymentTone: Record<PaymentStatus, string> = {
  pending: "border-cmt-neutral-300 bg-cmt-neutral-100 text-cmt-neutral-700",
  successful: "border-cmt-success-500/40 bg-cmt-success-100 text-cmt-success-700",
  failed: "border-cmt-error-500/40 bg-cmt-error-100 text-cmt-error-700",
};

type Filter = "all" | PaymentStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "successful", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Rejected" },
];

export default function AdminTripsList() {
  const [records, setTrips] = useState<Trip[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [updatingId, setUpdatingId] = useState("");
  const [fieldError, setFieldError] = useState<Record<string, string>>({});

  useEffect(
    () =>
      subscribeToTrips(
        (next) => {
          setTrips(next);
          setError("");
          setLoading(false);
        },
        (message) => {
          setError(message);
          setLoading(false);
        },
      ),
    [],
  );

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  const trips = useMemo(() => records.filter(trip => !pendingPaymentExpired(trip, now)), [records, now]);
  const visible = useMemo(
    () => (filter === "all" ? trips : trips.filter((trip) => trip.paymentStatus === filter)),
    [trips, filter],
  );

  const revenue = useMemo(
    () =>
      trips
        .filter((trip) => trip.paymentStatus === "successful")
        .reduce((total, trip) => total + trip.amount, 0),
    [trips],
  );

  const changeStatus = async (trip: Trip, tripStatus: TripStatus) => {
    setUpdatingId(trip.id);
    try {
      await updateTripStatus(trip.id, tripStatus);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The trip status could not be updated.");
    } finally {
      setUpdatingId("");
    }
  };

  const changeDate = async (trip: Trip, tripDate: string) => {
    setUpdatingId(trip.id);
    setFieldError((current) => ({ ...current, [trip.id]: "" }));
    try {
      await updateTripDate(trip.id, tripDate);
    } catch (cause) {
      // Firestore applies the write locally before the server answers, so a
      // rejected save briefly *looks* saved. Pin the failure to this row so
      // it cannot be mistaken for success once the value snaps back.
      const message =
        cause instanceof FirebaseError && cause.code === "permission-denied"
          ? "Not saved — deploy firestore.rules to allow trip dates."
          : cause instanceof Error
            ? cause.message
            : "The trip date could not be saved.";
      setFieldError((current) => ({ ...current, [trip.id]: message }));
      setError(message);
    } finally {
      setUpdatingId("");
    }
  };

  return (
    <div className="space-y-6">
    <PaymentReports admin />
    <section className="overflow-hidden rounded-cmt-md border border-cmt-neutral-200 bg-white shadow-cmt-sm">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-cmt-neutral-200 px-5 py-5 sm:px-7">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-cmt-full bg-cmt-primary-50 text-cmt-primary-900">
            <Plane className="size-5" />
          </span>
          <div>
            <h1 className="font-display text-xl font-semibold">Trips</h1>
            <p className="text-xs text-cmt-neutral-500">
              Bookings taken through PayU checkout. Payment status comes from PayU and cannot be edited.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-cmt-full bg-cmt-success-100 px-3 py-1.5 text-xs font-semibold text-cmt-success-700">
            {formatINR(revenue)} collected
          </span>
          <span className="rounded-cmt-full bg-cmt-neutral-100 px-3 py-1.5 text-xs font-semibold text-cmt-neutral-700">
            {loading ? "Loading…" : `${trips.length} trip${trips.length === 1 ? "" : "s"}`}
          </span>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-cmt-neutral-200 px-5 py-4 sm:px-7">
        {FILTERS.map((option) => {
          const count =
            option.value === "all"
              ? trips.length
              : trips.filter((trip) => trip.paymentStatus === option.value).length;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              className={`inline-flex h-9 items-center gap-2 rounded-cmt-control border px-4 text-sm font-semibold transition ${
                filter === option.value
                  ? "border-cmt-neutral-900 bg-cmt-neutral-900 text-white"
                  : "border-cmt-neutral-200 bg-white text-cmt-neutral-700 hover:border-cmt-neutral-300"
              }`}
            >
              {option.label}
              <span className="text-xs opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {error ? (
        <p role="alert" className="m-5 rounded-cmt-control bg-cmt-error-100 px-4 py-3 text-sm text-cmt-error-700 sm:m-7">
          {error}
        </p>
      ) : null}

      <div className="divide-y divide-cmt-neutral-200">
        {visible.map((trip) => (
          <article key={trip.id} className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-lg font-semibold">
                    {trip.packageTitle || "Unnamed package"}
                  </h2>
                  <span
                    className={`inline-flex h-7 items-center rounded-cmt-full border px-3 text-xs font-semibold ${paymentTone[trip.paymentStatus]}`}
                  >
                    {PAYMENT_STATUS_LABELS[trip.paymentStatus]}
                  </span>
                  {trip.paymentReportStatus === "open" ? <span className="rounded-cmt-full bg-cmt-primary-100 px-3 py-1 text-xs font-semibold text-cmt-primary-900">Payment reported · review request above</span> : null}
                  {trip.duplicatePaymentIds?.length ? <span className="rounded-cmt-full bg-cmt-error-100 px-3 py-1 text-xs font-semibold text-cmt-error-700">Multiple payments received · check PayU</span> : null}
                  {trip.amountMismatch ? (
                    <span className="inline-flex h-7 items-center gap-1.5 rounded-cmt-full border border-cmt-error-500/40 bg-cmt-error-100 px-3 text-xs font-semibold text-cmt-error-700">
                      <TriangleAlert className="size-3.5" />
                      Check in PayU
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 font-mono text-xs text-cmt-neutral-500">{trip.txnid}</p>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-cmt-neutral-600">
                  <span className="font-semibold text-cmt-neutral-900">{trip.name || "—"}</span>
                  {trip.email ? (
                    <a href={`mailto:${trip.email}`} className="inline-flex items-center gap-1.5 hover:text-cmt-neutral-900">
                      <Mail className="size-4" />
                      {trip.email}
                    </a>
                  ) : null}
                  {trip.phone ? (
                    <a href={`tel:${trip.phone}`} className="inline-flex items-center gap-1.5 hover:text-cmt-neutral-900">
                      <Phone className="size-4" />
                      {trip.phone}
                    </a>
                  ) : null}
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock className="size-4" />
                    {trip.createdAt ? dateFormatter.format(trip.createdAt) : "Saving…"}
                  </span>
                  {/* The traveller picks their date on the package page, so
                      most bookings now arrive with one. It is repeated here
                      because the editable field to the right is locked until
                      the payment succeeds — on a pending booking this is the
                      only place the desk can see what was asked for. */}
                  {trip.tripDate ? (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-cmt-neutral-900">
                      <CalendarHeart className="size-4 text-cmt-neutral-400" />
                      Wants {formatTripDate(trip.tripDate)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-cmt-neutral-400">
                      <CalendarHeart className="size-4" />
                      Dates open
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-start gap-2">
              <label className="min-w-[190px]">
                <span className="sr-only">Trip date for {trip.txnid}</span>
                <input
                  type="date"
                  value={trip.tripDate}
                  disabled={updatingId === trip.id || trip.paymentStatus !== "successful"}
                  onChange={(event) => void changeDate(trip, event.target.value)}
                  title={
                    trip.paymentStatus === "successful"
                      ? "Departure date shown to the traveller — prefilled with the date they asked for, change it to what was confirmed"
                      : "The date the traveller asked for. Editable once the payment succeeds."
                  }
                  className="h-10 w-full rounded-cmt-control border border-cmt-neutral-200 bg-white px-3 text-sm font-semibold text-cmt-neutral-900 outline-none focus:border-cmt-primary-500 focus:ring-2 focus:ring-cmt-primary-500/20 disabled:cursor-not-allowed disabled:bg-cmt-neutral-100 disabled:text-cmt-neutral-400"
                />
                {fieldError[trip.id] ? (
                  <span className="mt-1 block max-w-[210px] text-xs font-semibold text-cmt-error-700">
                    {fieldError[trip.id]}
                  </span>
                ) : trip.tripDate && trip.paymentStatus === "successful" ? (
                  (() => {
                    const days = daysUntilTrip(trip.tripDate);
                    if (days === null) return null;
                    return (
                      <span className="mt-1 block text-xs font-semibold text-cmt-neutral-500">
                        {trip.tripStatus === "completed" ? "Travelled" : countdownLabel(days)}
                      </span>
                    );
                  })()
                ) : null}
              </label>
              <label className="min-w-[190px]">
                <span className="sr-only">Trip status for {trip.txnid}</span>
                <select
                  disabled={updatingId === trip.id || trip.paymentStatus !== "successful"}
                  value={trip.tripStatus}
                  onChange={(event) => void changeStatus(trip, event.target.value as TripStatus)}
                  title={
                    trip.paymentStatus === "successful"
                      ? undefined
                      : "Available once the payment succeeds."
                  }
                  className="h-10 w-full rounded-cmt-control border border-cmt-primary-500/40 bg-cmt-primary-50 px-3 text-sm font-semibold text-cmt-primary-900 outline-none focus:ring-2 focus:ring-cmt-primary-500/20 disabled:cursor-not-allowed disabled:border-cmt-neutral-200 disabled:bg-cmt-neutral-100 disabled:text-cmt-neutral-400"
                >
                  {(Object.keys(TRIP_STATUS_LABELS) as TripStatus[]).map((value) => (
                    <option key={value} value={value}>
                      {TRIP_STATUS_LABELS[value]}
                    </option>
                  ))}
                </select>
              </label>
              </div>
            </div>

            <div className="mt-5 grid gap-3 rounded-cmt-control bg-cmt-neutral-50 p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-cmt-neutral-400">Travellers</p>
                <p className="mt-1 flex items-center gap-1.5">
                  <Users className="size-4 text-cmt-neutral-400" />
                  {trip.travellers || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-cmt-neutral-400">Per person</p>
                <p className="mt-1">{trip.perPerson ? formatINR(trip.perPerson) : "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-cmt-neutral-400">{trip.paymentStatus === "successful" ? "Total paid" : "Booking amount"}</p>
                <p className="mt-1 flex items-center gap-1.5 font-semibold">
                  <BadgeIndianRupee className="size-4 text-cmt-neutral-400" />
                  {formatINR(trip.amount)}
                </p>
                {/* Only where a coupon actually moved the number — every
                    older booking would otherwise carry a dash. */}
                {trip.discount > 0 && (
                  <p className="mt-1 text-xs text-cmt-success-700">
                    {trip.couponCode} · −{formatINR(trip.discount)} off {formatINR(trip.subtotal)}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-cmt-neutral-400">
                  {trip.paymentStatus === "failed" ? "Failure reason" : "PayU reference"}
                </p>
                <p className="mt-1 break-words text-cmt-neutral-600">
                  {trip.paymentStatus === "failed"
                    ? trip.failureReason || "Not reported"
                    : trip.payuPaymentId || "—"}
                  {trip.paymentMode ? ` · ${trip.paymentMode}` : ""}
                </p>
              </div>
            </div>
          </article>
        ))}

        {!loading && !error && visible.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Plane className="mx-auto size-8 text-cmt-neutral-300" />
            <p className="mt-3 text-sm font-semibold">No trips here yet</p>
            <p className="mt-1 text-xs text-cmt-neutral-500">
              Bookings appear the moment someone starts a PayU payment, even before it completes.
            </p>
          </div>
        ) : null}
      </div>
    </section>
    </div>
  );
}

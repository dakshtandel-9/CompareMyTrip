"use client";

import { useEffect, useMemo, useState } from "react";
import PaymentReports from "@/components/PaymentReports";
import { pendingPaymentExpired } from "@/lib/pendingPayments";
import { FirebaseError } from "firebase/app";
import { ChevronDown, TriangleAlert } from "lucide-react";
import { ContactLinks, InboxFilters, InboxSearch, InboxState, OperationsHeader, WorkflowGuide } from "../enquiries/OperationsUI";
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
  { value: "all", label: "All bookings" },
  { value: "successful", label: "Paid" },
  { value: "pending", label: "Payment pending" },
  { value: "failed", label: "Payment failed" },
];

export default function AdminTripsList() {
  const [records, setTrips] = useState<Trip[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
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
  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return trips.filter(trip => (filter === "all" || trip.paymentStatus === filter) &&
      (!query || [trip.name, trip.email, trip.phone, trip.packageTitle, trip.txnid, trip.payuPaymentId].some(value => value?.toLowerCase().includes(query))));
  }, [trips, filter, search]);

  const revenue = useMemo(
    () =>
      trips
        .filter((trip) => trip.paymentStatus === "successful")
        .reduce((total, trip) => total + trip.amount, 0),
    [trips],
  );

  const changeStatus = async (trip: Trip, tripStatus: TripStatus) => {
    setUpdatingId(trip.id);
    setError("");
    setNotice("");
    try {
      await updateTripStatus(trip.id, tripStatus);
      setNotice(`Trip status saved for ${trip.name || trip.packageTitle}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The trip status could not be updated.");
    } finally {
      setUpdatingId("");
    }
  };

  const changeDate = async (trip: Trip, tripDate: string) => {
    setUpdatingId(trip.id);
    setError("");
    setNotice("");
    setFieldError((current) => ({ ...current, [trip.id]: "" }));
    try {
      await updateTripDate(trip.id, tripDate);
      setNotice(`Departure date saved for ${trip.name || trip.packageTitle}.`);
    } catch (cause) {
      // Firestore applies the write locally before the server answers, so a
      // rejected save briefly *looks* saved. Pin the failure to this row so
      // it cannot be mistaken for success once the value snaps back.
      const message =
        cause instanceof FirebaseError && cause.code === "permission-denied"
          ? "Date not saved. Your account does not currently have permission to change departure dates."
          : cause instanceof Error
            ? cause.message
            : "The trip date could not be saved.";
      setFieldError((current) => ({ ...current, [trip.id]: message }));
      setError(message);
    } finally {
      setUpdatingId("");
    }
  };

  const paidCount = trips.filter(trip => trip.paymentStatus === "successful").length;
  const pendingCount = trips.filter(trip => trip.paymentStatus === "pending").length;

  return <div className="space-y-6 text-slate-900">
    <OperationsHeader eyebrow="Bookings & payments" title="Bookings & trips" description="Keep track of customer payments, confirm departure dates, and update each trip as it progresses."
      metrics={[
        { label: "Payments collected", value: loading ? "—" : formatINR(revenue), hint: `${paidCount} successfully paid bookings`, attention: true },
        { label: "Payment pending", value: loading ? "—" : pendingCount, hint: "Waiting for payment confirmation" },
        { label: "All bookings", value: loading ? "—" : trips.length, hint: "Current checkout and trip records" },
      ]} />
    <WorkflowGuide steps={["Check the payment status", "Confirm the departure date", "Update the trip status"]} />
    <PaymentReports admin />
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="space-y-4 border-b border-slate-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-semibold">Booking list</h2><p className="mt-1 text-xs text-slate-500">{loading ? "Loading bookings…" : `${visible.length} of ${trips.length} bookings · newest first`}</p></div><InboxSearch value={search} onChange={setSearch} placeholder="Search customer, package or booking ID" label="Search bookings" /></div>
        <InboxFilters value={filter} onChange={setFilter} options={FILTERS.map(option => ({ ...option, count: option.value === "all" ? trips.length : trips.filter(trip => trip.paymentStatus === option.value).length }))} />
        <p className="text-xs leading-5 text-slate-500">Payment status updates automatically from PayU. Departure dates and trip statuses can be edited once a booking is paid.</p>
      </div>
      {error && <p role="alert" className="m-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {notice && !error && <p role="status" className="m-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}
      <div className="divide-y divide-slate-100">
        {visible.map(trip => <article key={trip.id} className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-base font-semibold">{trip.packageTitle || "Package not specified"}</h3><span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold ${paymentTone[trip.paymentStatus]}`}>{trip.paymentStatus === "failed" ? "Payment failed" : PAYMENT_STATUS_LABELS[trip.paymentStatus]}</span></div><p className="mt-2 text-sm font-medium text-slate-700">{trip.name || "Customer name not provided"}</p><ContactLinks email={trip.email} phone={trip.phone} /></div>
            <div className="text-left sm:text-right"><p className="text-lg font-semibold">{formatINR(trip.amount)}</p><p className="mt-0.5 text-xs text-slate-500">{trip.paymentStatus === "successful" ? "Total paid" : "Booking amount"} · {trip.travellers || "Unspecified"} travellers</p></div>
          </div>
          {(trip.paymentReportStatus === "open" || trip.duplicatePaymentIds?.length || trip.amountMismatch) && <div className="mt-4 space-y-1 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
            {trip.paymentReportStatus === "open" && <p>Customer reported a payment issue. Review their payment request above.</p>}
            {Boolean(trip.duplicatePaymentIds?.length) && <p>Multiple payments received. Check the transactions in PayU.</p>}
            {trip.amountMismatch && <p className="flex items-center gap-2"><TriangleAlert className="size-4 shrink-0" aria-hidden="true" />The payment amount needs checking in PayU.</p>}
          </div>}
          <div className="mt-4 grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <div><p className="text-xs font-medium text-slate-500">Travel date</p><p className="mt-2 text-sm font-semibold">{trip.tripDate ? formatTripDate(trip.tripDate) : "Date not selected"}</p><p className="mt-1 text-xs text-slate-500">Booked {trip.createdAt ? dateFormatter.format(trip.createdAt) : "just now"}</p></div>
            <label><span className="mb-1.5 block text-xs font-medium text-slate-500">Departure date</span><input type="date" value={trip.tripDate} disabled={Boolean(updatingId) || trip.paymentStatus !== "successful"} onChange={event => void changeDate(trip, event.target.value)} aria-label={`Departure date for ${trip.txnid}`} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400" />
              {fieldError[trip.id] ? <span className="mt-1 block text-xs font-medium text-red-700">{fieldError[trip.id]}</span> : <span className="mt-1 block text-xs text-slate-500">{trip.paymentStatus !== "successful" ? "Available after payment is confirmed" : updatingId === trip.id ? "Saving changes…" : trip.tripDate ? (() => { const days = daysUntilTrip(trip.tripDate); return trip.tripStatus === "completed" ? "Trip completed" : days === null ? "Saves automatically" : countdownLabel(days); })() : "Choose the confirmed date · saves automatically"}</span>}
            </label>
            <label><span className="mb-1.5 block text-xs font-medium text-slate-500">Trip status</span><select value={trip.tripStatus} disabled={Boolean(updatingId) || trip.paymentStatus !== "successful"} onChange={event => void changeStatus(trip, event.target.value as TripStatus)} aria-label={`Trip status for ${trip.txnid}`} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400">{(Object.keys(TRIP_STATUS_LABELS) as TripStatus[]).map(status => <option key={status} value={status}>{TRIP_STATUS_LABELS[status]}</option>)}</select><span className="mt-1 block text-xs text-slate-500">{trip.paymentStatus === "successful" ? "Changes save automatically" : "Available after payment is confirmed"}</span></label>
          </div>
          <details className="group mt-4"><summary className="flex w-fit cursor-pointer list-none items-center gap-2 rounded-md py-1 text-sm font-semibold text-emerald-700 [&::-webkit-details-marker]:hidden"><ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />View payment & booking details</summary><dl className="mt-4 grid gap-4 rounded-xl border border-slate-200 p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div><dt className="text-xs text-slate-500">Booking reference</dt><dd className="mt-1 break-all font-mono text-xs">{trip.txnid}</dd></div>
            <div><dt className="text-xs text-slate-500">Price per person</dt><dd className="mt-1 font-medium">{trip.perPerson ? formatINR(trip.perPerson) : "Not recorded"}</dd></div>
            <div><dt className="text-xs text-slate-500">Number of travellers</dt><dd className="mt-1 font-medium">{trip.travellers || "Not recorded"}</dd></div>
            <div><dt className="text-xs text-slate-500">{trip.paymentStatus === "failed" ? "Payment failure reason" : "PayU payment reference"}</dt><dd className="mt-1 break-words">{trip.paymentStatus === "failed" ? trip.failureReason || "No reason provided" : trip.payuPaymentId || "Awaiting payment"}</dd></div>
            <div><dt className="text-xs text-slate-500">Payment method</dt><dd className="mt-1">{trip.paymentMode || "Not recorded"}</dd></div>
            {trip.discount > 0 && <div><dt className="text-xs text-slate-500">Discount applied</dt><dd className="mt-1 text-emerald-700">{trip.couponCode} · {formatINR(trip.discount)} off {formatINR(trip.subtotal)}</dd></div>}
          </dl></details>
        </article>)}
        <InboxState loading={loading} empty={!error && visible.length === 0} title={trips.length ? "No bookings match your filters" : "No bookings yet"} description={trips.length ? "Try a customer name, package, or booking reference, or clear your filters." : "Bookings appear here when a customer starts a payment. Expired pending payments are removed automatically."} onReset={search || filter !== "all" ? () => { setSearch(""); setFilter("all"); } : undefined} />
      </div>
    </section>
  </div>;
}

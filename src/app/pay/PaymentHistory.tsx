"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CreditCard, History, RefreshCw } from "lucide-react";
import { useAuthUser } from "@/lib/firebase/useAuthUser";
import { subscribeToUserTrips, type Trip } from "@/lib/firebase/trips";
import { paymentHistoryStatus, paymentMethodLabel } from "@/lib/paymentHistory";

const buttonClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-cmt-control border border-cmt-neutral-200 px-4 text-sm font-semibold hover:bg-cmt-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500";
const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 });
const dateFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

export default function PaymentHistory() {
  const user = useAuthUser();
  return <section id="payment-history" aria-labelledby="payment-history-heading" className="min-w-0 rounded-cmt-md border border-cmt-neutral-200 bg-white p-6 shadow-cmt-sm sm:p-7">
    <div className="flex items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-cmt-primary-100"><History className="size-5" aria-hidden="true" /></span>
      <h2 id="payment-history-heading" className="font-display text-2xl font-semibold tracking-tight">Payment history</h2>
    </div>
    <p className="mt-3 text-sm leading-6 text-cmt-neutral-600">Your previous payments and their latest status, all in one place.</p>
    {user === undefined ? <p role="status" className="py-8 text-sm text-cmt-neutral-500">Loading payment history…</p>
      : user ? <UserPaymentHistory key={user.uid} uid={user.uid} />
      : <div className="mt-6 rounded-cmt-control bg-cmt-neutral-50 p-5 text-center">
        <p className="text-sm leading-6 text-cmt-neutral-600">Sign in to view your payment history and save future payments to your account.</p>
        <Link href="/login?next=%2Fpay%23payment-history" className={`${buttonClass} mt-4 bg-white`}>Sign in to view history</Link>
      </div>}
    <p className="mt-5 border-t border-cmt-neutral-200 pt-4 text-xs leading-5 text-cmt-neutral-500">Only payments linked to your account appear here. For an earlier guest payment, <Link href="/contact" className="font-semibold underline">contact our team</Link> with your transaction reference.</p>
  </section>;
}

function UserPaymentHistory({ uid }: { uid: string }) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [visibleCount, setVisibleCount] = useState(5);

  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeToUserTrips(uid, records => {
      if (!active) return;
      setTrips(records);
      setError("");
      setLoading(false);
    }, () => {
      if (!active) return;
      setError("Your payment history could not be loaded. Please try again.");
      setLoading(false);
    });
    return () => { active = false; unsubscribe(); };
  }, [uid, refresh]);

  if (loading) return <p role="status" className="py-8 text-sm text-cmt-neutral-500">Loading payment history…</p>;
  if (error) return <div className="mt-6">
    <p role="alert" className="text-sm text-cmt-error-700">{error}</p>
    <button type="button" className={`${buttonClass} mt-4`} onClick={() => { setLoading(true); setRefresh(value => value + 1); }}><RefreshCw className="size-4" aria-hidden="true" />Try again</button>
  </div>;
  if (!trips.length) return <div className="mt-6 rounded-cmt-control bg-cmt-neutral-50 px-5 py-8 text-center">
    <CreditCard className="mx-auto size-7 text-cmt-neutral-400" aria-hidden="true" />
    <h3 className="mt-3 text-sm font-semibold">No payments yet</h3>
    <p className="mt-2 text-sm leading-6 text-cmt-neutral-500">Payments made while signed in will appear here, along with how you paid.</p>
  </div>;

  return <>
    <p className="mt-5 text-xs font-semibold text-cmt-neutral-500">{trips.length} payment{trips.length === 1 ? "" : "s"} · Newest first</p>
    <ol className="mt-3 divide-y divide-cmt-neutral-200">
      {trips.slice(0, visibleCount).map(trip => {
        const status = paymentHistoryStatus(trip);
        const date = trip.createdAt;
        const reference = trip.settledPaymentId || trip.activePaymentId || trip.txnid;
        return <li key={trip.id} className="py-5 first:pt-2">
          <article aria-label={`Payment ${reference}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xl font-semibold tabular-nums">{currency.format(trip.amount)}</p>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span>
            </div>
            <p className="mt-2 break-words text-sm font-medium leading-6">{trip.packageTitle || "Trip payment"}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-cmt-neutral-500">
              {date ? <time dateTime={date.toISOString()}>{dateFormat.format(date)} IST</time> : <span>Date unavailable</span>}
              {trip.payuEnvironment === "test" && <span className="rounded bg-cmt-primary-100 px-1.5 py-0.5 text-cmt-neutral-700">Test payment</span>}
            </div>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex items-start justify-between gap-3"><dt className="text-cmt-neutral-500">Payment method</dt><dd className="text-right font-medium">{paymentMethodLabel(trip.paymentMode)}</dd></div>
              <div className="flex items-start justify-between gap-3"><dt className="shrink-0 text-cmt-neutral-500">Transaction ID</dt><dd className="break-all text-right font-mono">{reference}</dd></div>
            </dl>
          </article>
        </li>;
      })}
    </ol>
    {trips.length > visibleCount && <button type="button" className={`${buttonClass} mt-2 w-full`} onClick={() => setVisibleCount(count => count + 5)}>Show older payments</button>}
  </>;
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Luggage,
  MapPin,
  CircleAlert,
  BadgeIndianRupee,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Plane,
  RotateCcw,
  Ticket,
  Users,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import ContentImage from "@/app/home/_components/ContentImage";
import { usePackages } from "@/lib/usePackages";
import { accountTripGroup } from "@/lib/accountTrips";
import { pendingPaymentExpired } from "@/lib/pendingPayments";
import PendingPaymentActions from "./PendingPaymentActions";
import PaymentReports from "@/components/PaymentReports";
import {
  countdownLabel,
  daysUntilTrip,
  formatTripDate,
  subscribeToUserTrips,
  type PaymentStatus,
  type Trip,
  type TripStatus,
} from "@/lib/firebase/trips";

const bookedFormatter = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });
const formatINR = (value: number) => `₹${value.toLocaleString("en-IN")}`;

type Badge = { label: string; className: string; icon: typeof Clock3 };

/* One clear state per booking, not two internal fields. Until payment
   resolves that is the whole story; after it, what matters is the travel
   desk's decision. */
function badgeFor(trip: Trip): Badge {
  const payment: Record<Exclude<PaymentStatus, "successful">, Badge> = {
    pending: {
      label: "Payment pending",
      className: "border-cmt-neutral-300 bg-cmt-neutral-100 text-cmt-neutral-700",
      icon: Clock3,
    },
    failed: {
      label: "Payment rejected",
      className: "border-cmt-error-500/40 bg-cmt-error-100 text-cmt-error-700",
      icon: XCircle,
    },
  };
  if (trip.paymentStatus !== "successful") return payment[trip.paymentStatus];

  const booking: Record<TripStatus, Badge> = {
    awaiting_confirmation: {
      label: "Confirming",
      className: "border-cmt-primary-500 bg-cmt-primary-100 text-cmt-primary-900",
      icon: Clock3,
    },
    accepted: {
      label: "Confirmed",
      className: "border-cmt-success-500/40 bg-cmt-success-100 text-cmt-success-700",
      icon: CheckCircle2,
    },
    rejected: {
      label: "Rejected",
      className: "border-cmt-error-500/40 bg-cmt-error-100 text-cmt-error-700",
      icon: XCircle,
    },
    refunded: {
      label: "Refunded",
      className: "border-cmt-neutral-300 bg-cmt-neutral-100 text-cmt-neutral-700",
      icon: RotateCcw,
    },
    completed: {
      label: "Completed",
      className: "border-cmt-neutral-300 bg-cmt-neutral-100 text-cmt-neutral-700",
      icon: CheckCircle2,
    },
  };
  return booking[trip.tripStatus];
}

/** A live booking with a date still ahead of it. */
function isUpcoming(trip: Trip, now: Date) {
  if (trip.paymentStatus !== "successful") return false;
  if (trip.tripStatus === "rejected" || trip.tripStatus === "refunded") return false;
  if (trip.tripStatus === "completed" || !trip.tripDate) return false;
  const days = daysUntilTrip(trip.tripDate, now);
  return days !== null && days >= 0;
}

function StatusBadge({ trip }: { trip: Trip }) {
  const badge = badgeFor(trip);
  const Icon = badge.icon;
  return (
    <span
      className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-cmt-full border px-3 font-body text-xs font-semibold ${badge.className}`}
    >
      <Icon className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
      {badge.label}
    </span>
  );
}

function Meta({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-xs text-cmt-neutral-500"><Icon className="size-3.5 shrink-0" aria-hidden="true" />{label}</dt>
      <dd className="mt-1.5 break-words text-sm font-semibold leading-relaxed text-cmt-neutral-900">{value}</dd>
    </div>
  );
}

const FILTERS = [
  { id: "all", label: "All bookings" },
  { id: "active", label: "Active" },
  { id: "completed", label: "Completed" },
  { id: "unsuccessful", label: "Unsuccessful" },
] as const;

export default function AccountTrips({ userId }: { userId: string }) {
  const packages = usePackages();
  const [records, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const update = () => setNow(new Date());
    const timer = setInterval(update, 30_000);
    window.addEventListener("focus", update);
    return () => { clearInterval(timer); window.removeEventListener("focus", update); };
  }, []);

  useEffect(
    () => subscribeToUserTrips(userId, (next) => {
      setTrips(next);
      setError("");
      setLoading(false);
    }, (message) => {
      setError(message);
      setLoading(false);
    }),
    [userId],
  );

  const trips = useMemo(() => records.filter(trip => !pendingPaymentExpired(trip, now.getTime())), [records, now]);
  const featured = useMemo(() => trips.filter((trip) => isUpcoming(trip, now)).sort(
    (a, b) => (daysUntilTrip(a.tripDate, now) ?? 0) - (daysUntilTrip(b.tripDate, now) ?? 0),
  )[0], [trips, now]);
  const featuredDays = featured ? daysUntilTrip(featured.tripDate, now) : null;
  const counts = { all: trips.length, active: 0, completed: 0, unsuccessful: 0 };
  for (const trip of trips) counts[accountTripGroup(trip)]++;
  const visibleTrips = filter === "all" ? trips : trips.filter((trip) => accountTripGroup(trip) === filter);

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:gap-4" aria-label="Booking overview">
        {[
          { label: "Total bookings", value: counts.all, icon: Luggage },
          { label: "Active bookings", value: counts.active, icon: Plane },
          { label: "Completed trips", value: counts.completed, icon: CheckCircle2 },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-cmt-md border border-cmt-neutral-200 bg-white p-4 shadow-cmt-xs sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="font-display text-[26px] font-semibold leading-none text-cmt-neutral-900 sm:text-[32px]">{loading || error ? "—" : value}</p>
              <span className="hidden size-10 items-center justify-center rounded-cmt-control bg-cmt-neutral-50 text-cmt-neutral-500 sm:flex"><Icon className="size-5" aria-hidden="true" /></span>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-cmt-neutral-500 sm:text-xs">{label}</p>
          </div>
        ))}
      </div>

      {featured && featuredDays !== null && (filter === "all" || filter === "active") ? (
        <div className="mt-6 flex items-center justify-between gap-5 rounded-cmt-md bg-cmt-neutral-900 p-5 sm:p-6">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-cmt-primary-400">Next on your calendar</p>
            <p className="mt-2 font-display text-lg font-semibold text-white sm:text-xl">{featured.packageTitle || "Your next trip"}</p>
            <p className="mt-2 text-xs text-cmt-neutral-300">{formatTripDate(featured.tripDate)}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-display text-[40px] font-semibold leading-none text-cmt-primary-400">{featuredDays}</p>
            <p className="mt-2 text-xs text-cmt-neutral-300">{featuredDays === 0 ? "departing today" : featuredDays === 1 ? "day to go" : "days to go"}</p>
          </div>
        </div>
      ) : null}

      <div className="mt-8">
        <h2 className="font-display text-[22px] font-semibold text-cmt-neutral-900 sm:text-[26px]">My trips</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-cmt-neutral-500">Track your bookings, travel dates, and payment updates.</p>
      </div>
      <div className="mt-5 flex gap-5 overflow-x-auto border-b border-cmt-neutral-200 sm:gap-6" aria-label="Filter bookings">
        {FILTERS.map(({ id, label }) => (
          <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)} className={`flex min-h-12 shrink-0 items-center gap-2 border-b-[3px] px-1 pb-3 pt-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cmt-primary-500 sm:text-sm ${filter === id ? "border-cmt-primary-500 text-cmt-neutral-900" : "border-transparent text-cmt-neutral-500 hover:text-cmt-neutral-900"}`}>
            {label}<span className="rounded-cmt-full bg-cmt-neutral-100 px-2 py-0.5 text-[11px] text-cmt-neutral-600">{loading || error ? "—" : counts[id]}</span>
          </button>
        ))}
      </div>

      {error ? <p role="alert" className="mt-5 rounded-cmt-control border border-cmt-error-500/40 bg-cmt-error-100 p-4 text-sm text-cmt-neutral-900">{error}</p> : null}
      {loading ? (
        <div role="status" className="mt-5 space-y-4"><span className="sr-only">Loading your bookings…</span>{[0, 1].map((item) => <div key={item} aria-hidden="true" className="h-48 animate-pulse rounded-cmt-md border border-cmt-neutral-200 bg-white motion-reduce:animate-none" />)}</div>
      ) : null}
      {!loading && visibleTrips.length > 0 ? (
        <div className="mt-5 space-y-5">
          {visibleTrips.map((trip) => {
            const pkg = packages.find((item) => item.id === trip.packageId);
            const hasDate = trip.paymentStatus === "successful" && trip.tripStatus !== "rejected" && trip.tripStatus !== "refunded" && Boolean(formatTripDate(trip.tripDate));
            const days = hasDate && trip.tripStatus !== "completed" ? daysUntilTrip(trip.tripDate, now) : null;
            const href = pkg ? pkg.href ?? `/packages/${pkg.id}` : null;
            return (
              <article key={trip.id} className="overflow-hidden rounded-cmt-md border border-cmt-neutral-200 bg-white shadow-cmt-sm">
                <div className="p-4 sm:p-5">
                  <div className="flex items-start gap-4 sm:gap-5">
                    <div className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-cmt-control bg-cmt-primary-50 text-cmt-primary-900 sm:h-32 sm:w-40">
                      <Luggage className="size-8" aria-hidden="true" />
                      {pkg?.image ? <ContentImage src={pkg.image} alt="" fill sizes="(max-width: 639px) 80px, 160px" className="object-cover" /> : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        {pkg?.destination ? <p className="flex items-center gap-1 text-xs text-cmt-neutral-500"><MapPin className="size-3.5" aria-hidden="true" />{pkg.destination}</p> : null}
                        <StatusBadge trip={trip} />
                      </div>
                      <h3 className="mt-2 font-display text-base font-semibold leading-snug text-cmt-neutral-900 sm:text-xl">{trip.packageTitle || "Travel package"}</h3>
                      <p className="mt-2 text-xs text-cmt-neutral-500">Booked {trip.createdAt ? bookedFormatter.format(trip.createdAt) : "just now"}</p>
                    </div>
                  </div>

                  <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-cmt-neutral-100 pt-4 sm:grid-cols-3 sm:gap-5">
                    <Meta icon={CalendarDays} label={trip.tripStatus === "completed" && hasDate ? "Travelled on" : "Travel date"} value={hasDate ? formatTripDate(trip.tripDate) : accountTripGroup(trip) === "active" ? "To be confirmed" : "—"} />
                    <Meta icon={Users} label="Travellers" value={`${trip.travellers || "—"} ${trip.travellers === 1 ? "person" : "people"}`} />
                    <Meta icon={BadgeIndianRupee} label={trip.paymentStatus === "successful" && trip.tripStatus !== "refunded" ? "Total paid" : "Booking amount"} value={formatINR(trip.amount)} />
                  </dl>
                  {days !== null && days >= 0 ? <p className="mt-3 text-xs font-semibold text-cmt-primary-900">{countdownLabel(days)} · {trip.tripStatus === "awaiting_confirmation" ? "Awaiting booking confirmation" : "Time to get ready for your trip"}</p> : null}
                  {trip.paymentStatus === "failed" && trip.failureReason ? <p className="mt-4 flex items-start gap-2 rounded-cmt-sm bg-cmt-error-100/60 px-3 py-3 text-xs leading-relaxed text-cmt-error-700"><CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span><strong>Payment unsuccessful.</strong> {trip.failureReason}</span></p> : null}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-cmt-neutral-100 bg-cmt-neutral-50/60 px-4 py-3 sm:px-5">
                  <p className="min-w-0 break-all text-[11px] leading-relaxed text-cmt-neutral-500"><Ticket className="mr-1.5 inline size-3.5" aria-hidden="true" />Booking ID <span className="ml-1 font-medium text-cmt-neutral-700">{trip.txnid}</span></p>
                  {href ? <Link href={href} className="inline-flex min-h-11 shrink-0 items-center gap-2 text-xs font-semibold text-cmt-neutral-900 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500">View package <ArrowRight className="size-3.5" aria-hidden="true" /></Link> : <Link href="/contact" className="inline-flex min-h-11 items-center text-xs font-semibold text-cmt-neutral-900 underline underline-offset-4">Booking support</Link>}
                </div>
                {trip.paymentStatus === "pending" ? <PendingPaymentActions trip={trip} /> : null}
              </article>
            );
          })}
        </div>
      ) : null}
      {!loading && !error && visibleTrips.length === 0 ? (
        <div className="mt-5 rounded-cmt-md border border-dashed border-cmt-neutral-300 bg-white px-5 py-12 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-cmt-full bg-cmt-primary-100 text-cmt-primary-900"><Luggage className="size-6" aria-hidden="true" /></span>
          <h3 className="mt-5 font-display text-xl font-semibold text-cmt-neutral-900">{trips.length === 0 ? "Your next adventure starts here" : `No ${filter === "all" ? "" : filter + " "}bookings`}</h3>
          <p className="mx-auto mt-2 max-w-[420px] text-sm leading-relaxed text-cmt-neutral-500">{trips.length === 0 ? "Find a place you love. Your bookings and trip updates will appear here." : "Try another filter to see the rest of your bookings."}</p>
          {trips.length === 0 ? <Link href="/packages" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-cmt-control bg-cmt-primary-500 px-5 text-sm font-semibold text-cmt-neutral-900 hover:bg-cmt-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500">Explore packages <ArrowRight className="size-4" aria-hidden="true" /></Link> : <button type="button" onClick={() => setFilter("all")} className="mt-5 min-h-11 rounded-cmt-control border border-cmt-neutral-200 px-5 text-sm font-semibold text-cmt-neutral-900 hover:bg-cmt-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500">View all bookings</button>}
        </div>
      ) : null}
      <PaymentReports />
    </div>
  );
}

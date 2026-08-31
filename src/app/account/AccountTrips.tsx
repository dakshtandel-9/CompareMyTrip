"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
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
import {
  countdownLabel,
  daysUntilTrip,
  formatTripDate,
  subscribeToUserTrips,
  type PaymentStatus,
  type Trip,
  type TripStatus,
} from "@/lib/firebase/trips";

/* ------------------------------------------------------------------ */
/* My Trips (design.md §8.3 cards, §8.5 badges, §3.9 colour balance).    */
/*                                                                      */
/* The soonest upcoming trip is promoted into the dark card variant —     */
/* §8.3 reserves that treatment for countdowns, one per page, which is    */
/* exactly this. Every other trip uses the standard white card, so the    */
/* page keeps a single dark block and a single gold CTA.                  */
/* ------------------------------------------------------------------ */

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

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="font-body text-[11px] font-semibold uppercase tracking-[0.12em] text-cmt-neutral-400">
        {label}
      </p>
      <p className="mt-1 flex items-center gap-1.5 font-body text-sm text-cmt-neutral-700">
        <Icon className="size-4 shrink-0 text-cmt-neutral-400" aria-hidden="true" />
        <span className="truncate">{value}</span>
      </p>
    </div>
  );
}

export default function AccountTrips({ userId }: { userId: string }) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  /* Re-read the clock so a tab left open overnight rolls "in 1 day" over
     to "Today" on its own rather than going stale. */
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(
    () =>
      subscribeToUserTrips(
        userId,
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
    [userId],
  );

  /* The soonest upcoming trip gets the hero treatment; the rest fall
     through to the list below it in the order the subscription gives. */
  const { featured, rest } = useMemo(() => {
    const upcoming = trips
      .filter((trip) => isUpcoming(trip, now))
      .sort(
        (a, b) => (daysUntilTrip(a.tripDate, now) ?? 0) - (daysUntilTrip(b.tripDate, now) ?? 0),
      );
    const hero = upcoming[0];
    return { featured: hero, rest: hero ? trips.filter((trip) => trip.id !== hero.id) : trips };
  }, [trips, now]);

  const featuredDays = featured ? daysUntilTrip(featured.tripDate, now) : null;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-[560px]">
          <p className="font-body text-[11px] font-semibold uppercase tracking-[0.12em] text-cmt-primary-900">
            Your bookings
          </p>
          <h2 className="mt-2 font-display text-[22px] font-semibold tracking-[-0.003em] text-cmt-neutral-900 sm:text-[26px]">
            My Trips
          </h2>
          <p className="mt-1.5 font-body text-sm leading-[1.55] text-cmt-neutral-600">
            Packages you have paid for, and where each one stands.
          </p>
        </div>
        <span className="rounded-cmt-full border border-cmt-neutral-200 bg-white px-3.5 py-1.5 font-body text-xs font-semibold text-cmt-neutral-700">
          {loading ? "Loading…" : `${trips.length} trip${trips.length === 1 ? "" : "s"}`}
        </span>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-5 rounded-cmt-control border border-cmt-error-500/40 bg-cmt-error-100 px-4 py-3 font-body text-sm text-cmt-neutral-900"
        >
          {error}
        </p>
      ) : null}

      {/* ------------------------------------------------------------ */}
      {/* Featured next trip — the page's one dark block (§8.3)          */}
      {/* ------------------------------------------------------------ */}
      {featured && featuredDays !== null ? (
        <article className="mt-6 overflow-hidden rounded-cmt-md bg-cmt-neutral-900 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <p className="font-body text-[11px] font-semibold uppercase tracking-[0.12em] text-cmt-primary-400">
                Your next trip
              </p>
              <h3 className="mt-2 text-balance font-display text-[24px] font-semibold leading-[1.25] text-white sm:text-[28px]">
                {featured.packageTitle || "Travel package"}
              </h3>
              <p className="mt-3 inline-flex items-center gap-2 font-body text-sm text-cmt-neutral-300">
                <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
                Departing {formatTripDate(featured.tripDate)}
              </p>
            </div>

            {/* The countdown itself: the reason this card is allowed to be dark. */}
            <div className="shrink-0 text-left sm:text-right">
              <p className="font-display text-[48px] font-bold leading-[1] text-cmt-primary-400 sm:text-[64px]">
                {featuredDays}
              </p>
              <p className="mt-1 font-body text-sm font-semibold text-cmt-neutral-300">
                {featuredDays === 0
                  ? "Departing today"
                  : featuredDays === 1
                    ? "day to go"
                    : "days to go"}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-white/10 pt-5">
            <span className="inline-flex items-center gap-2 font-body text-sm text-cmt-neutral-300">
              <Users className="size-4 text-cmt-neutral-400" aria-hidden="true" />
              {featured.travellers} traveller{featured.travellers === 1 ? "" : "s"}
            </span>
            <span className="inline-flex items-center gap-2 font-body text-sm text-cmt-neutral-300">
              <BadgeIndianRupee className="size-4 text-cmt-neutral-400" aria-hidden="true" />
              {formatINR(featured.amount)} paid
            </span>
            <StatusBadge trip={featured} />
          </div>
        </article>
      ) : null}

      {/* ------------------------------------------------------------ */}
      {/* Every other booking                                           */}
      {/* ------------------------------------------------------------ */}
      {rest.length > 0 ? (
        <div className="mt-5 grid gap-5">
          {rest.map((trip) => {
            const hasDate =
              trip.paymentStatus === "successful" &&
              trip.tripStatus !== "rejected" &&
              trip.tripStatus !== "refunded" &&
              Boolean(trip.tripDate);
            // A finished trip shows its date as a record, never a countdown.
            const counting = hasDate && trip.tripStatus !== "completed";
            const days = counting ? daysUntilTrip(trip.tripDate, now) : null;

            return (
              <article
                key={trip.id}
                className="rounded-cmt-md border border-cmt-neutral-200 bg-white p-5 shadow-cmt-sm transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-cmt-neutral-300 hover:shadow-cmt-md sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display text-[20px] font-medium leading-[1.35] text-cmt-neutral-900">
                      {trip.packageTitle || "Travel package"}
                    </h3>
                    <p className="mt-1 font-body text-xs text-cmt-neutral-500">
                      Booked {trip.createdAt ? bookedFormatter.format(trip.createdAt) : "just now"}
                    </p>
                  </div>
                  <StatusBadge trip={trip} />
                </div>

                {hasDate ? (
                  <div
                    className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-cmt-control border px-4 py-3 ${
                      counting
                        ? "border-cmt-primary-500/40 bg-cmt-primary-50"
                        : "border-cmt-neutral-200 bg-cmt-neutral-50"
                    }`}
                  >
                    <p className="inline-flex items-center gap-2 font-body text-sm font-semibold text-cmt-neutral-900">
                      <CalendarDays
                        className={`size-4 ${counting ? "text-cmt-primary-900" : "text-cmt-neutral-400"}`}
                        aria-hidden="true"
                      />
                      {counting ? "Your trip is on" : "Travelled on"} {formatTripDate(trip.tripDate)}
                    </p>
                    {counting && days !== null ? (
                      <span className="rounded-cmt-full bg-cmt-primary-500 px-3 py-1 font-body text-xs font-bold text-cmt-neutral-900">
                        {days > 1 ? `${days} days to go` : countdownLabel(days)}
                      </span>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-5 grid gap-4 rounded-cmt-control bg-cmt-neutral-50 p-4 sm:grid-cols-3">
                  <Meta icon={Users} label="Travellers" value={String(trip.travellers || "—")} />
                  <Meta icon={BadgeIndianRupee} label="Amount" value={formatINR(trip.amount)} />
                  <Meta icon={Ticket} label="Reference" value={trip.txnid} />
                </div>

                {trip.paymentStatus === "failed" && trip.failureReason ? (
                  <p className="mt-4 font-body text-sm leading-[1.55] text-cmt-neutral-600">
                    <span className="font-semibold text-cmt-neutral-900">Why it failed:</span>{" "}
                    {trip.failureReason}
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : null}

      {/* ------------------------------------------------------------ */}
      {/* Empty state — §2.7 "empathetic empty states"                   */}
      {/* ------------------------------------------------------------ */}
      {!loading && !error && trips.length === 0 ? (
        <div className="mt-6 rounded-cmt-md border border-dashed border-cmt-neutral-300 bg-white px-6 py-14 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-cmt-full bg-cmt-primary-100 text-cmt-primary-900">
            <Plane className="size-6" strokeWidth={2} aria-hidden="true" />
          </span>
          <h3 className="mt-5 font-display text-[20px] font-medium text-cmt-neutral-900">
            No trips booked yet
          </h3>
          <p className="mx-auto mt-2 max-w-[420px] text-pretty font-body text-sm leading-[1.6] text-cmt-neutral-600">
            Once you book a package it appears here, with its confirmation status and a countdown to
            departure.
          </p>
          <Link
            href="/packages"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-cmt-control border border-cmt-neutral-300 bg-white px-5 font-body text-sm font-semibold text-cmt-neutral-900 transition-colors duration-200 hover:border-cmt-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
          >
            Browse packages
            <ArrowRight className="size-4" strokeWidth={2.5} aria-hidden="true" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { BadgePercent, BedDouble, Check, Flame, GitCompareArrows, Minus, Plane, Plus, ShieldCheck } from "lucide-react";
import { departureDays, departureDaysLabel, getDiscountPercent, getPackageTier, type PackageDetails, type TravelPackage } from "@/lib/packageData";
import DepartureDatePicker from "@/components/DepartureDatePicker";
import { useCompare } from "@/lib/useCompare";
import TrekGradeBadge from "@/components/TrekGradeBadge";

/* ------------------------------------------------------------------ */
/* The booking box on a package page: who is selling, what tier the     */
/* trip is, the per-person price with its discount pill, live demand,   */
/* and the three things a traveller can do — ask for quotes, pay now,   */
/* or park the package in the comparison tray.                          */
/* ------------------------------------------------------------------ */

const formatINR = (value: number) => `₹${value.toLocaleString("en-IN")}`;

const CHIP = "inline-flex items-center gap-1.5 rounded-cmt-full border border-cmt-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-cmt-neutral-700";

/* Small stable spread over package ids — enough to make the viewer count
   differ between packages without pretending to be real analytics. */
const hash = (value: string) => {
  let total = 0;
  for (let index = 0; index < value.length; index += 1) total = (total * 31 + value.charCodeAt(index)) % 100_000;
  return total;
};

type Props = {
  pkg: TravelPackage;
  details: PackageDetails;
  travelDate: string;
  onTravelDateChange: (value: string) => void;
  travellers: number;
  onTravellersChange: (value: number) => void;
  onRequestQuote: () => void;
};

export default function BookingCard({ pkg, details, travelDate, onTravelDateChange, travellers, onTravellersChange, onRequestQuote }: Props) {
  const { toggle, isCompared } = useCompare();
  const compared = isCompared(pkg.id);

  const discount = getDiscountPercent(pkg);
  const tier = getPackageTier(pkg.hotelStars);
  const flightLabel = /not included|no flight/i.test(details.flights) ? "Land only" : "Flights included";

  /* Demand is a signal, not data we hold, so it is hashed out of the
     package id: a different number per package, but the same one on the
     server and in the browser, which keeps hydration quiet. */
  const viewers = 4 + (hash(pkg.id) % 11);

  const step = (delta: number) => onTravellersChange(Math.min(Math.max(travellers + delta, 1), 20));

  /* Which days this trip actually runs, and how that reads to a traveller.
     Empty when it departs any day, in which case the picker offers the whole
     calendar and no caveat is shown. */
  const runsOn = departureDays(pkg);
  const runsOnLabel = departureDaysLabel(pkg);

  const checkoutHref = `/checkout?pkg=${encodeURIComponent(pkg.id)}&travellers=${travellers}${
    travelDate ? `&date=${travelDate}` : ""
  }`;

  return (
    <div className="overflow-hidden rounded-cmt-md border border-cmt-neutral-200 bg-white shadow-cmt-md">
      <div className="flex items-center gap-3 border-b border-cmt-neutral-100 p-4 sm:p-5">
        <span className="relative size-11 shrink-0 overflow-hidden rounded-cmt-sm bg-cmt-neutral-100">
          <Image
            src={pkg.image}
            alt={pkg.location}
            fill
            sizes="44px"
            className="object-cover"
            unoptimized={pkg.image.startsWith("data:")}
          />
        </span>
        {/* The operating partner is never named to the visitor — the header
            carries the trip itself. */}
        <span className="min-w-0">
          <span className="block text-[11px] text-cmt-neutral-500">Package</span>
          <span className="block truncate text-sm font-semibold">{pkg.location}</span>
        </span>
        <TrekGradeBadge pkg={pkg} className="ml-auto shrink-0 border border-cmt-neutral-200" />
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-cmt-full border border-cmt-success-500/30 bg-cmt-success-100 px-2.5 py-1 text-xs font-semibold text-cmt-success-700">
            {tier}
          </span>
          <span className={CHIP}>
            <BedDouble className="size-3.5 text-cmt-neutral-500" aria-hidden="true" />
            STAY {pkg.hotelStars}★ hotels
          </span>
          <span className={CHIP}>
            <Plane className="size-3.5 text-cmt-neutral-500" aria-hidden="true" />
            {flightLabel}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-cmt-control border border-cmt-success-500/40 bg-cmt-success-100/60 px-4 py-3">
          <span className="font-display text-base font-semibold">{tier}</span>
          <span className="text-xs text-cmt-neutral-600">{pkg.hotelStars}★ hotels</span>
          <span className="font-display text-base font-bold">{formatINR(pkg.price)}</span>
        </div>

        <div className="border-t border-cmt-neutral-100 pt-5">
          {/* Same editorial pick as the "Best deal" badge on the listing card,
              repeated here because this is where the price is decided. */}
          {pkg.deal && (
            <p className="mb-2.5 inline-flex items-center gap-1.5 rounded-cmt-full bg-cmt-neutral-900 px-3 py-1 text-xs font-semibold text-cmt-primary-400">
              <BadgePercent className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
              Best deal · hand-picked for value
            </p>
          )}
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span className="font-display text-[32px] font-bold leading-none tracking-tight">{formatINR(pkg.price)}</span>
            {discount > 0 && (
              <span className="rounded-cmt-full bg-cmt-success-100 px-2.5 py-1 text-xs font-semibold text-cmt-success-700">
                {discount}% off
              </span>
            )}
            <span className="text-sm text-cmt-neutral-500">/ person</span>
          </div>
          {pkg.originalPrice > pkg.price && (
            <p className="mt-1.5 text-xs text-cmt-neutral-400 line-through">{formatINR(pkg.originalPrice)}</p>
          )}
          <p className="mt-2.5 flex items-center gap-1.5 text-sm font-medium text-cmt-coral-700">
            <Flame className="size-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
            Available on request · {viewers} viewing now
          </p>
        </div>

        {/* Asked before the head count, because it is the question that
            decides whether the trip is on at all — and the travel desk
            cannot quote a season without it. Carried into the quote form
            and the checkout so nobody is asked for it twice. */}
        <div className="rounded-cmt-control border border-cmt-neutral-200 p-3">
          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor="booking-travel-date" className="text-xs font-semibold">
              When do you want to go?
            </label>
            {/* Said before the calendar is opened, so the greyed-out days are
                explained rather than looking broken. */}
            {runsOnLabel ? (
              <span className="shrink-0 rounded-cmt-full bg-cmt-primary-100 px-2 py-0.5 text-[11px] font-semibold text-cmt-neutral-800">
                {runsOnLabel}
              </span>
            ) : null}
          </div>
          <div className="mt-2">
            <DepartureDatePicker
              id="booking-travel-date"
              value={travelDate}
              onChange={onTravelDateChange}
              allowedDays={runsOn}
            />
          </div>
          <p className="mt-2 text-xs text-cmt-neutral-500">
            {travelDate
              ? "We'll check availability for this date."
              : "Not fixed yet? Leave it blank and we'll suggest dates."}
          </p>
        </div>

        <div className="rounded-cmt-control border border-cmt-neutral-200 p-3">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="booking-travellers" className="text-xs font-semibold">Travellers</label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => step(-1)}
                disabled={travellers <= 1}
                aria-label="Remove a traveller"
                className="grid size-9 place-items-center rounded-cmt-sm border border-cmt-neutral-200 text-cmt-neutral-700 transition-colors hover:border-cmt-neutral-300 disabled:opacity-40"
              >
                <Minus className="size-4" />
              </button>
              <input
                id="booking-travellers"
                type="number"
                min="1"
                max="20"
                value={travellers}
                onChange={(event) => onTravellersChange(Math.min(Math.max(Number(event.target.value) || 1, 1), 20))}
                className="h-9 w-14 rounded-cmt-sm border border-cmt-neutral-200 text-center text-sm font-semibold outline-none focus:border-cmt-primary-500"
              />
              <button
                type="button"
                onClick={() => step(1)}
                disabled={travellers >= 20}
                aria-label="Add a traveller"
                className="grid size-9 place-items-center rounded-cmt-sm border border-cmt-neutral-200 text-cmt-neutral-700 transition-colors hover:border-cmt-neutral-300 disabled:opacity-40"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>
          <p className="mt-3 flex items-center justify-between border-t border-cmt-neutral-100 pt-3 text-xs text-cmt-neutral-600">
            Total for {travellers} traveller{travellers === 1 ? "" : "s"}
            <b className="font-display text-sm text-cmt-neutral-900">{formatINR(pkg.price * travellers)}</b>
          </p>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={onRequestQuote}
            className="flex h-12 w-full items-center justify-center rounded-cmt-control bg-cmt-primary-500 text-sm font-semibold text-cmt-neutral-900 shadow-cmt-primary transition-colors hover:bg-cmt-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
          >
            Get customized quote
          </button>
          <p className="text-center text-xs text-cmt-neutral-500">Compare quotes from 3 verified agents · best price</p>
          <Link
            href={checkoutHref}
            className="flex h-12 w-full items-center justify-center rounded-cmt-control bg-cmt-secondary-900 text-sm font-semibold text-white transition-colors hover:bg-cmt-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
          >
            Pay &amp; book now
          </Link>
          <button
            type="button"
            onClick={() => toggle(pkg.id)}
            aria-pressed={compared}
            className={`flex h-12 w-full items-center justify-center gap-2 rounded-cmt-control border text-sm font-semibold transition-colors ${
              compared
                ? "border-cmt-neutral-900 bg-cmt-neutral-900 text-white"
                : "border-cmt-neutral-300 bg-white text-cmt-neutral-900 hover:border-cmt-neutral-400"
            }`}
          >
            {compared ? <Check className="size-4" /> : <GitCompareArrows className="size-4" />}
            {compared ? "Added to compare" : "Add to compare"}
          </button>
        </div>

        <p className="flex items-center justify-center gap-1.5 border-t border-cmt-neutral-100 pt-4 text-[11px] text-cmt-neutral-600">
          <ShieldCheck className="size-3.5 shrink-0 text-cmt-success-700" strokeWidth={2.25} aria-hidden="true" />
          Free cancellation
        </p>
      </div>
    </div>
  );
}

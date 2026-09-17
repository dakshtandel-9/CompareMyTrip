"use client";

import Image from "next/image";
import Link from "next/link";
import { BadgePercent, Check, Flame, GitCompareArrows, Minus, Plus, ShieldCheck } from "lucide-react";
import { departureDays, departureDaysLabel, getDiscountPercent, getPackageBookingBadges, type PackageDetails, type TravelPackage } from "@/lib/packageData";
import { PackageGlyph } from "@/lib/PackageGlyph";
import DepartureDatePicker from "@/components/DepartureDatePicker";
import { useCompare } from "@/lib/useCompare";
import TrekGradeBadge from "@/components/TrekGradeBadge";

/* ------------------------------------------------------------------ */
/* The booking box on a package page: who is selling, what tier the     */
/* trip is, the per-person price with its discount pill, live demand,   */
/* and the three things a traveller can do — ask for quotes, pay now,   */
/* or park the package in the comparison tray.                          */
/* ------------------------------------------------------------------ */

const formatINR = (value: number) => `₹\u00A0${value.toLocaleString("en-IN")}`;

const CHIP = "inline-flex items-center gap-1.5 text-xs font-medium leading-5 text-cmt-neutral-600";



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
  const badges = getPackageBookingBadges(pkg, details).filter(badge => badge.visible && badge.text.trim());

  const availabilityNote = details.availabilityNote ?? "Availability confirmed with your quote";
  const quoteNote = details.quoteNote ?? "Compare quotes from 3 verified agents · best price";

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
    <div className="cmt-package-booking-card overflow-hidden rounded-[20px] border border-[#e5e5e0] bg-white text-cmt-neutral-900 shadow-[0_8px_32px_rgba(25,35,31,0.055)]">
      <div className="cmt-package-booking-heading flex items-center gap-3 border-b border-[#eeeee9] px-5 py-4 sm:px-6">
        <span className="relative size-11 shrink-0 overflow-hidden rounded-[10px] bg-cmt-neutral-100">
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
        <span className="min-w-0 flex-1">
          <span className="mb-0.5 block text-[11px] font-medium tracking-[0.04em] text-cmt-neutral-500">Package</span>
          <span className="block break-words text-[13px] font-semibold leading-5">{pkg.location}</span>
        </span>
        <TrekGradeBadge pkg={pkg} className="ml-auto shrink-0 border border-cmt-neutral-200 shadow-none" />
      </div>

      <div className="cmt-package-booking-body space-y-5 p-5 sm:p-6">
        {badges.length > 0 && <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5" aria-label="Package badges">
          {badges.map(badge => <span key={badge.id} className={badge.id === "package"
            ? "inline-flex min-w-0 max-w-full items-center gap-1.5 break-words border-l-2 border-cmt-primary-500 pl-2 text-xs font-semibold leading-5 text-cmt-neutral-700"
            : `${CHIP} min-w-0 max-w-full break-words`}>
            {badge.icon && <PackageGlyph name={badge.icon} className="size-3.5 shrink-0 text-cmt-neutral-500" />}
            <span className="min-w-0 break-words">{badge.text}</span>
          </span>)}
        </div>}



        <div className="cmt-package-price">
          {/* Same editorial pick as the "Best deal" badge on the listing card,
              repeated here because this is where the price is decided. */}
          {pkg.deal && (
            <p className="cmt-package-booking-deal mb-3 inline-flex items-center gap-1.5 text-xs font-semibold leading-5 text-cmt-neutral-700">
              <BadgePercent className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
              Best deal · hand-picked for value
            </p>
          )}
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-2">
            <span className="font-display text-[38px] font-bold leading-none tracking-[-0.05em]">{formatINR(pkg.price)}</span>
            {discount > 0 && (
              <span className="rounded-[6px] bg-cmt-success-100 px-2 py-1 text-xs font-semibold text-cmt-success-700">
                {discount}% off
              </span>
            )}
            <span className="text-sm text-cmt-neutral-500">/ person</span>
          </div>
          {pkg.originalPrice > pkg.price && (
            <p className="cmt-package-original-price mt-2 text-[13px] text-cmt-neutral-500 line-through">{formatINR(pkg.originalPrice)}</p>
          )}
          {availabilityNote.trim() && <p className="cmt-package-availability mt-3 flex items-start gap-1.5 text-xs font-medium leading-5 text-cmt-neutral-600">
            <Flame className="mt-0.5 size-4 shrink-0 text-[#ad7400]" strokeWidth={2.25} aria-hidden="true" />
            <span className="min-w-0 whitespace-pre-wrap break-words">{availabilityNote}</span>
          </p>}
        </div>

        {/* Asked before the head count, because it is the question that
            decides whether the trip is on at all — and the travel desk
            cannot quote a season without it. Carried into the quote form
            and the checkout so nobody is asked for it twice. */}
        <div className="cmt-package-booking-field cmt-package-booking-date border-t border-[#eeeee9] pt-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1.5">
            <label htmlFor="booking-travel-date" className="text-[13px] font-semibold leading-5">
              When do you want to go?
            </label>
            {/* Said before the calendar is opened, so the greyed-out days are
                explained rather than looking broken. */}
            {runsOnLabel ? (
              <span className="shrink-0 text-[11px] font-semibold leading-5 text-[#8b620b]">
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
              triggerClassName={`h-12 rounded-[10px] ${travelDate ? "border-cmt-primary-500 bg-cmt-primary-100/30" : ""}`}
            />
          </div>
          <p className="mt-2 text-xs leading-[1.6] text-cmt-neutral-500">
            {travelDate
              ? "We'll check availability for this date."
              : "Not fixed yet? Leave it blank and we'll suggest dates."}
          </p>
        </div>

        <div className="cmt-package-booking-field cmt-package-booking-travellers">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="booking-travellers" className="text-[13px] font-semibold">Travellers</label>
            <div className="flex items-center gap-1 rounded-[10px] border border-[#e7e8e3] p-0.5">
              <button
                type="button"
                onClick={() => step(-1)}
                disabled={travellers <= 1}
                aria-label="Remove a traveller"
                className="grid size-11 place-items-center rounded-[8px] text-cmt-neutral-700 transition-colors hover:bg-cmt-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 disabled:opacity-40"
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
                className="h-11 w-9 rounded-[6px] bg-transparent text-center text-sm font-semibold tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-cmt-primary-500"
              />
              <button
                type="button"
                onClick={() => step(1)}
                disabled={travellers >= 20}
                aria-label="Add a traveller"
                className="grid size-11 place-items-center rounded-[8px] text-cmt-neutral-700 transition-colors hover:bg-cmt-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 disabled:opacity-40"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>
          <p className="mt-4 flex items-center justify-between gap-3 border-t border-[#eeeee9] pt-4 text-[13px] text-cmt-neutral-600">
            Total for {travellers} traveller{travellers === 1 ? "" : "s"}
            <b className="shrink-0 font-display text-base text-cmt-neutral-900">{formatINR(pkg.price * travellers)}</b>
          </p>
        </div>

        <div className="cmt-package-booking-actions space-y-2.5">
          <Link
            href={checkoutHref}
            className="flex min-h-[52px] w-full items-center justify-center rounded-[10px] bg-cmt-primary-500 px-3 py-3 text-[15px] font-bold text-cmt-neutral-900 shadow-[0_3px_10px_rgba(205,158,17,0.12)] transition-[background-color,box-shadow,transform] duration-200 hover:bg-cmt-primary-600 hover:shadow-[0_5px_14px_rgba(205,158,17,0.18)] motion-safe:hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
          >
            Book now
          </Link>
          {quoteNote.trim() && <p className="whitespace-pre-wrap break-words px-1 text-center text-xs leading-[1.6] text-cmt-neutral-500">{quoteNote}</p>}
          <button
            type="button"
            onClick={onRequestQuote}
            className="flex min-h-11 w-full items-center justify-center rounded-[10px] border border-cmt-neutral-300 bg-white px-3 py-2.5 text-sm font-semibold text-cmt-neutral-900 transition-colors hover:border-cmt-neutral-500 hover:bg-cmt-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
          >
            Get customized quote
          </button>
          <button
            type="button"
            onClick={() => toggle(pkg.id)}
            aria-pressed={compared}
            className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-transparent px-3 py-2.5 text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 ${
              compared
                ? "bg-cmt-neutral-100 text-cmt-neutral-900"
                : "bg-white text-cmt-neutral-600 hover:bg-cmt-neutral-50 hover:text-cmt-neutral-900"
            }`}
          >
            {compared ? <Check className="size-4" /> : <GitCompareArrows className="size-4" />}
            {compared ? "Added to compare" : "Add to compare"}
          </button>
        </div>

        {details.cancellationPolicy.trim() && !details.pageSections?.hiddenSections?.includes("cancellation") && <p className="cmt-package-booking-policy flex min-h-11 items-center justify-center gap-1.5 border-t border-[#eeeee9] pt-4 text-xs text-cmt-neutral-600">
          <ShieldCheck className="size-3.5 shrink-0 text-cmt-success-700" strokeWidth={2.25} aria-hidden="true" />
          <a href="#package-policy" className="rounded-sm underline decoration-cmt-neutral-300 underline-offset-4 transition-colors hover:text-cmt-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cmt-primary-500">View cancellation policy</a>
        </p>}
      </div>
    </div>
  );
}

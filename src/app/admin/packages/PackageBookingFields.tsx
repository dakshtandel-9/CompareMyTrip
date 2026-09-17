"use client";

import {
  departureDays,
  departureDaysLabel,
  getDiscountPercent,
  getPackageDetails,
  getPackageTier,
  WEEKDAYS,
  type TravelPackage,
} from "@/lib/packageData";
import type { ContentPath } from "@/app/packages/_components/PackageInlineEditing";

type Props = {
  pkg: TravelPackage;
  change: (path: ContentPath, value: unknown) => void;
  disabled: boolean;
  pricing?: { price: string; originalPrice: string };
};

const field = "mt-1.5 block min-h-11 w-full rounded-lg border border-cmt-neutral-200 bg-white px-3 py-2.5 text-sm text-cmt-neutral-900 outline-none transition-colors focus:border-cmt-primary-500 focus:ring-2 focus:ring-cmt-primary-500/15 disabled:bg-cmt-neutral-50 disabled:text-cmt-neutral-500";
const label = "block text-sm font-semibold text-cmt-neutral-800";
const hint = "mt-1.5 text-xs leading-5 text-cmt-neutral-500";
const allDays = WEEKDAYS.map(day => day.value);
const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const formatINR = (value: number) => `₹${value.toLocaleString("en-IN")}`;

/** Writes directly to the package draft. Saving is owned by the package editor. */
export default function PackageBookingFields({ pkg, change, disabled, pricing }: Props) {
  const details = getPackageDetails(pkg);
  const allowedDays = departureDays(pkg);
  const selectedDays = allowedDays.length ? allowedDays : allDays;
  const defaultBadge = details.stays.length ? getPackageTier(pkg.hotelStars) : "Trip package";
  const originalPriceInvalid = pkg.price > 0 && pkg.originalPrice < pkg.price;
  const update = (path: ContentPath, value: unknown) => {
    if (!disabled) change(path, value);
  };

  return (
    <fieldset disabled={disabled} className="min-w-0 space-y-8">
      <legend className="sr-only">Price and booking card settings</legend>

      <div className="rounded-lg bg-cmt-neutral-50 px-4 py-3 text-sm">
        <p className="font-semibold text-cmt-neutral-900">{pkg.title || "Untitled package"}</p>
        {pkg.location && <p className="mt-1 text-cmt-neutral-600">{pkg.location}</p>}
        <p className={hint}>The booking card uses the package location and cover image. Update those in the package details and photos.</p>
      </div>

      <fieldset className="space-y-4">
        <legend className="mb-3 text-base font-semibold">Pricing</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="package-booking-price" className={label}>Selling price (₹ / person)</label>
            <input id="package-booking-price" className={field} type="number" inputMode="decimal" min="0" step="0.01" value={pricing?.price ?? (pkg.price || "")} onChange={event => update(["price"], event.target.value)} aria-describedby="package-booking-pricing-help" />
          </div>
          <div>
            <label htmlFor="package-booking-original-price" className={label}>Original price (₹ / person)</label>
            <input id="package-booking-original-price" className={field} type="number" inputMode="decimal" min="0" step="0.01" value={pricing?.originalPrice ?? (pkg.originalPrice || "")} onChange={event => update(["originalPrice"], event.target.value)} aria-invalid={originalPriceInvalid || undefined} aria-describedby={originalPriceInvalid ? "package-booking-original-price-error package-booking-pricing-help" : "package-booking-pricing-help"} />
          </div>
        </div>
        {originalPriceInvalid && <p id="package-booking-original-price-error" role="alert" className="text-sm text-red-700">Original price must be at least the selling price.</p>}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <p>Discount shown: <output aria-label="Discount shown on website" className="font-semibold">{getDiscountPercent(pkg)}%</output></p>
          <p>Total for 2 travellers: <output aria-label="Example total for two travellers" className="font-semibold">{formatINR(pkg.price * 2)}</output></p>
        </div>
        <p id="package-booking-pricing-help" className={hint}>Changing a price recalculates the discount automatically. Set both prices equal to remove the discount. The traveller total is the selling price multiplied by the selected traveller count.</p>
        <label className="flex items-start gap-2.5 text-sm">
          <input type="checkbox" className="mt-0.5 size-4 accent-cmt-primary-500" checked={pkg.deal ?? false} onChange={event => update(["deal"], event.target.checked)} />
          <span><span className="font-semibold">Featured deal</span><span className="mt-1 block text-xs leading-5 text-cmt-neutral-500">Shows “Best deal · hand-picked for value” on the booking card and includes this package in the catalogue’s deals filter.</span></span>
        </label>
      </fieldset>

      <fieldset className="space-y-4 border-t border-cmt-neutral-200 pt-5">
        <legend className="pr-3 text-base font-semibold">Package labels</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="package-booking-difficulty" className={label}>Difficulty level</label>
            <select id="package-booking-difficulty" className={field} value={pkg.trekGrade ?? ""} onChange={event => update(["trekGrade"], Number(event.target.value))} aria-describedby="package-booking-difficulty-help">
              {pkg.trekGrade === undefined && <option value="" disabled>Existing catalogue setting</option>}
              <option value={0}>Hide difficulty</option>
              <option value={1}>Easy</option>
              <option value={2}>Moderate</option>
              <option value={3}>Difficult</option>
            </select>
            <p id="package-booking-difficulty-help" className={hint}>Choose the difficulty for this package. Older packages keep their existing catalogue setting until you choose a value.</p>
          </div>
          <div>
            <label htmlFor="package-booking-hotel-stars" className={label}>Hotel rating</label>
            <select id="package-booking-hotel-stars" className={field} value={pkg.hotelStars} onChange={event => update(["hotelStars"], Number(event.target.value))} aria-describedby="package-booking-hotel-stars-help">
              {[0, 1, 2, 3, 4, 5].map(stars => <option key={stars} value={stars}>{stars ? `${stars} star` : "No hotel / unrated"}</option>)}
            </select>
            <p id="package-booking-hotel-stars-help" className={hint}>The hotel badge appears only when the package has a stay. Hotel rating also sets the default package badge.</p>
          </div>
        </div>
        <div>
          <label htmlFor="package-booking-label" className={label}>Package badge</label>
          <input id="package-booking-label" className={field} value={details.bookingLabel ?? ""} placeholder={defaultBadge} onChange={event => update(["details", "bookingLabel"], event.target.value)} aria-describedby="package-booking-label-help" />
          <p id="package-booking-label-help" className={hint}>Leave blank to show “{defaultBadge}”, based on the package’s stays and hotel rating.</p>
        </div>
        <div>
          <label htmlFor="package-booking-flights" className={label}>Flights</label>
          <input id="package-booking-flights" className={field} value={details.flights} onChange={event => update(["details", "flights"], event.target.value)} aria-describedby="package-booking-flights-help" />
          <p id="package-booking-flights-help" className={hint}>Leave blank to hide the flight badge. Text containing “not included” or “no flight” displays as “Land only” on the booking card. This field also supplies the package’s flight details.</p>
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-cmt-neutral-200 pt-5">
        <legend className="pr-3 text-base font-semibold">Departure weekdays</legend>
        <p className="text-sm leading-6 text-cmt-neutral-600">Select the weekdays this package departs. These choices control the available dates in the traveller’s calendar.</p>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map(day => {
            const checked = selectedDays.includes(day.value);
            return <label key={day.value} className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm ${checked ? "border-cmt-primary-500 bg-cmt-primary-50" : "border-cmt-neutral-200 bg-white"}`}>
              <input type="checkbox" aria-label={`Departs on ${dayNames[day.value]}`} checked={checked} disabled={disabled || (checked && selectedDays.length === 1)} className="size-4 accent-cmt-primary-500" onChange={event => {
                const next = event.target.checked ? [...new Set([...selectedDays, day.value])].sort((a, b) => a - b) : selectedDays.filter(value => value !== day.value);
                if (next.length) update(["departureDays"], next.length === 7 ? [] : next);
              }} />
              {day.short}
            </label>;
          })}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="min-h-11 rounded-lg border border-cmt-neutral-200 px-3 text-sm font-semibold transition-colors hover:bg-cmt-neutral-50 disabled:opacity-50" disabled={disabled || !allowedDays.length} onClick={() => update(["departureDays"], [])}>Select every day</button>
          <p className="text-sm text-cmt-neutral-600">{departureDaysLabel(pkg) || "Departs every day"}</p>
        </div>
        <p className={hint}>Keep at least one departure day selected. Weekdays do not represent seat availability; availability is confirmed through the existing booking process.</p>
      </fieldset>

      <fieldset className="space-y-4 border-t border-cmt-neutral-200 pt-5">
        <legend className="pr-3 text-base font-semibold">Booking card notes</legend>
        <div>
          <label htmlFor="package-booking-availability-note" className={label}>Availability note</label>
          <textarea id="package-booking-availability-note" className={field} rows={2} value={details.availabilityNote ?? "Availability confirmed with your quote"} onChange={event => update(["details", "availabilityNote"], event.target.value)} aria-describedby="package-booking-availability-note-help" />
          <p id="package-booking-availability-note-help" className={hint}>Appears below the price. Clear this field to hide the note.</p>
        </div>
        <div>
          <label htmlFor="package-booking-quote-note" className={label}>Quote note</label>
          <textarea id="package-booking-quote-note" className={field} rows={2} value={details.quoteNote ?? "Compare quotes from 3 verified agents · best price"} onChange={event => update(["details", "quoteNote"], event.target.value)} aria-describedby="package-booking-quote-note-help" />
          <p id="package-booking-quote-note-help" className={hint}>Appears below “Get customized quote”. Clear this field to hide the note.</p>
        </div>
        <p className="text-xs leading-5 text-cmt-neutral-500">The cancellation-policy link appears when cancellation policy content is provided. Edit that content in the package’s policy section.</p>
      </fieldset>
    </fieldset>
  );
}

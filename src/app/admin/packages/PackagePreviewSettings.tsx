"use client";
import { getPackageTier, PACKAGE_CATEGORIES, WEEKDAYS, type TravelPackage } from "@/lib/packageData";
import { InlineText, type ContentPath } from "@/app/packages/_components/PackageInlineEditing";
import TrekGradeBadge from "@/components/TrekGradeBadge";

export default function PackagePreviewSettings({ pkg, editing, change, disabled, filedUnderOptions }: {
  pkg: TravelPackage; editing: boolean; change: (path: ContentPath, value: unknown) => void; disabled: boolean; filedUnderOptions: Record<TravelPackage["region"], string[]>;
}) {
  const details = pkg.details!;
  const bookingLabel = details.bookingLabel?.trim() || (details.stays.length ? getPackageTier(pkg.hotelStars) : "Trip package");
  const smallSelect = "max-w-full rounded-md border border-cmt-neutral-200 bg-white px-2 py-1.5 text-xs";
  return <div className="rounded-xl border border-cmt-neutral-200 bg-white p-5">
    <h2 className="text-lg font-semibold"><InlineText value={pkg.title} path={["title"]} label="Package title" /></h2>
    <div className="mt-3"><TrekGradeBadge pkg={pkg} /></div>
    <p className="mt-3 text-sm text-cmt-neutral-500"><InlineText value={pkg.nights} path={["nights"]} label="Nights" numeric /> nights / <InlineText value={pkg.days} path={["days"]} label="Days" numeric /> days</p>
    <p className="mt-5 text-3xl font-semibold">₹<InlineText value={pkg.price} path={["price"]} label="Selling price" numeric /><span className="ml-1 text-sm font-normal text-cmt-neutral-500">/ person</span></p>
    {(editing || pkg.originalPrice > pkg.price) && <p className="mt-2 text-sm text-cmt-neutral-500">{editing ? "Original price: ₹" : "₹"}<InlineText value={pkg.originalPrice} path={["originalPrice"]} label="Original price" numeric /></p>}
    <div className="mt-5 space-y-3 border-t border-cmt-neutral-100 pt-4 text-sm">
      <p>Group size: <InlineText value={pkg.pax} path={["pax"]} label="Group size" /></p>
      <p>Meals: <InlineText value={details.meals} path={["details", "meals"]} label="Meals" /></p>
      <p>Transfers: <InlineText value={details.transfers} path={["details", "transfers"]} label="Transfers" /></p>
      <p>Flights: <InlineText value={details.flights} path={["details", "flights"]} label="Flights" /></p>
    </div>
    {editing && <fieldset disabled={disabled} className="mt-5 space-y-4 border-t border-cmt-neutral-200 pt-4">
      <legend className="text-sm font-semibold">Booking card details</legend>
      <label className="flex flex-wrap items-center justify-between gap-2 text-xs">Difficulty level<select className={smallSelect} value={pkg.trekGrade ?? ""} onChange={event => change(["trekGrade"], Number(event.target.value))}>
        {pkg.trekGrade === undefined && <option value="" disabled>Existing weekend-trek grade</option>}
        <option value={0}>Hide difficulty</option><option value={1}>Easy</option><option value={2}>Moderate</option><option value={3}>Difficult</option>
      </select></label>
      <p className="text-xs">Package badge: <InlineText value={bookingLabel} path={["details", "bookingLabel"]} label="Package badge" /></p>
      <p className="text-xs">Availability note: <InlineText value={details.availabilityNote ?? "Availability confirmed with your quote"} path={["details", "availabilityNote"]} label="Availability note" multiline /></p>
      <p className="text-xs">Quote note: <InlineText value={details.quoteNote ?? "Compare quotes from 3 verified agents · best price"} path={["details", "quoteNote"]} label="Quote note" multiline /></p>
      <p className="text-xs leading-5 text-cmt-neutral-500">Click text to edit. A blank package badge uses Trip package or the hotel tier. Clear a note to hide it. Flights can be edited above; clear the value to hide that badge. Departure weekdays below also control the date picker.</p>
    </fieldset>}
    {!editing && <div className="mt-4 space-y-2 text-xs text-cmt-neutral-600"><p>{bookingLabel}</p><p>{details.availabilityNote ?? "Availability confirmed with your quote"}</p><p>{details.quoteNote ?? "Compare quotes from 3 verified agents · best price"}</p></div>}
    {editing && <details open className="mt-5 border-t border-cmt-neutral-200 pt-4"><summary className="cursor-pointer text-sm font-semibold">Catalogue & departure settings</summary><fieldset disabled={disabled} className="mt-4 space-y-4">
      <label className="flex flex-wrap items-center justify-between gap-2 text-xs">Region<select className={smallSelect} value={pkg.region} onChange={event => change(["region"], event.target.value)}><option>India</option><option>International</option></select></label>
      <label className="block text-xs">Destination<input className={`${smallSelect} mt-1 w-full`} value={pkg.destination} list="preview-destinations" onChange={event => change(["destination"], event.target.value)} /><datalist id="preview-destinations">{filedUnderOptions[pkg.region].map(value => <option key={value} value={value} />)}</datalist></label>
      <p className="text-xs text-cmt-neutral-500">Choose an existing destination or type a new one. India destinations are grouped by state. Save the package to apply changes.</p>
      <label className="block text-xs">Operator<input className={`${smallSelect} mt-1 w-full`} value={pkg.operator} onChange={event => change(["operator"], event.target.value)} /></label>
      <label className="flex flex-wrap items-center justify-between gap-2 text-xs">Hotel rating<select className={smallSelect} value={pkg.hotelStars} onChange={event => change(["hotelStars"], Number(event.target.value))}>{[0,1,2,3,4,5].map(stars => <option key={stars} value={stars}>{stars ? `${stars} star` : "No hotel / unrated"}</option>)}</select></label>
      <div><p className="mb-2 text-xs font-semibold">Categories</p><div className="flex flex-wrap gap-1">{PACKAGE_CATEGORIES.map(category => <button type="button" key={category} aria-pressed={pkg.tags.includes(category)} className={`rounded-full border px-2 py-1 text-[11px] ${pkg.tags.includes(category) ? "border-cmt-primary-500 bg-cmt-primary-50" : "border-cmt-neutral-200"}`} onClick={() => change(["tags"], pkg.tags.includes(category) ? pkg.tags.filter(tag => tag !== category) : [...pkg.tags, category])}>{category}</button>)}</div></div>
      <div><p className="mb-2 text-xs font-semibold">Departure weekdays</p><div className="flex flex-wrap gap-2">{WEEKDAYS.map(day => <label key={day.value} className="text-xs"><input type="checkbox" checked={!pkg.departureDays?.length || pkg.departureDays.includes(day.value)} onChange={event => { const days = pkg.departureDays?.length ? pkg.departureDays : [0,1,2,3,4,5,6]; const next = event.target.checked ? [...days, day.value] : days.filter(value => value !== day.value); if (next.length) change(["departureDays"], next); }} /> {day.short}</label>)}</div></div>
      <label className="flex gap-2 text-xs"><input type="checkbox" checked={details.permitRequired ?? false} onChange={event => change(["details", "permitRequired"], event.target.checked)} />Permit required</label>
      <label className="flex gap-2 text-xs"><input type="checkbox" checked={pkg.deal ?? false} onChange={event => change(["deal"], event.target.checked)} />Featured deal</label>
    </fieldset></details>}
    <p className="mt-4 text-xs leading-6 text-cmt-neutral-500"><InlineText value={details.pageSections?.bookingNote ?? ""} path={["details", "pageSections", "bookingNote"]} label="Booking note" multiline /></p>
    <button type="button" disabled className="mt-4 w-full rounded-lg bg-cmt-primary-500 px-4 py-3 text-sm font-semibold">Get customized quote</button>
    <p className="mt-2 text-center text-xs text-cmt-neutral-400">Booking actions are disabled in preview.</p>
  </div>;
}

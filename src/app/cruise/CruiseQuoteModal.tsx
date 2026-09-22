"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Minus, Plus, X } from "lucide-react";
import PhoneNumberField from "@/components/PhoneNumberField";
import { isCruiseDemo, type CruiseListing } from "@/lib/cruiseListings";
import { useUserProfile } from "@/lib/firebase/useUserProfile";
import {
  BOOKING_TIMELINE_LABELS,
  BOOKING_TIMELINES,
  CABIN_TYPE_LABELS,
  CABIN_TYPES,
  saveCruiseEnquiry,
  type BookingTimeline,
  type CabinType,
} from "@/lib/firebase/cruiseEnquiries";

/* The Get quote form. Deliberately not the package QuoteModal: that one needs
   a TravelPackage and forces a sign-in, and a cruise enquiry should not put a
   login in front of a lead. Everything here lands in /admin/cruise-enquiries.

   Styling follows design.md: §8.8 modal (24px radius, shadow-xl, 48% scrim),
   §8.2 form controls (48px fields, 12px radius, 2px gold focus border),
   §4.3 Label type (11px uppercase 600), §5.4 form spacing (8px label→input,
   16px field→field, 32px group→action) and §8.4 alerts. */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** One room sleeps four, which is what sets the guest ceiling below. */
const GUESTS_PER_ROOM = 4;

/* §8.2: 48px tall, 12px radius, 16px text so iOS does not zoom on focus.
   Focus is a 2px gold border plus the ring — the border thickens rather than
   the box growing, so the field does not shift its neighbours. */
const FIELD =
  "h-12 w-full rounded-cmt-control border border-cmt-neutral-200 bg-white px-4 text-base text-cmt-neutral-900 outline-none transition-[border-color,box-shadow] duration-200 hover:border-cmt-neutral-300 focus:border-2 focus:border-cmt-primary-500 focus:px-[15px] focus:shadow-[var(--cmt-focus-ring)]";

/* §4.3 Label: 11px uppercase 600 at 0.8% tracking in --text-muted. This is
   the overline treatment, which is why it is uppercase and never a sentence. */
const LABEL =
  "block text-[11px] font-semibold uppercase leading-[1.4] tracking-[0.008em] text-cmt-neutral-500";

/* §5.4: label → input is 8px. */
const FIELD_GAP = "mt-2";

/* §4.3 H4 for the block titles inside the sheet. */
const SECTION = "font-display text-base font-medium leading-[1.35] text-cmt-neutral-900";

/* §18.6: required is stated in the label text, not by a coloured asterisk. */
function Optional() {
  return <span className="font-normal normal-case tracking-normal text-cmt-neutral-400"> (optional)</span>;
}

/* §8.2 stepper: 32px circular −/+ with a 1px neutral border and a 40px
   numeral slot between them, so the digit never shifts the buttons as it
   goes from one to two figures. */
function Stepper({
  label, hint, value, min, max, onChange,
}: {
  label: string; hint?: string; value: number; min: number; max: number;
  onChange: (next: number) => void;
}) {
  const step = (delta: number) => onChange(Math.min(max, Math.max(min, value + delta)));
  const button =
    "grid size-8 shrink-0 place-items-center rounded-cmt-full border border-cmt-neutral-200 text-cmt-neutral-700 transition-colors duration-150 hover:border-cmt-neutral-300 hover:bg-cmt-neutral-50 focus-visible:outline-none focus-visible:border-cmt-primary-500 focus-visible:shadow-[var(--cmt-focus-ring)] disabled:border-cmt-neutral-200 disabled:text-cmt-neutral-400 disabled:hover:bg-white";

  return (
    <div>
      <p className={LABEL}>
        {label}
        {hint && <span className="font-normal normal-case tracking-normal text-cmt-neutral-400"> · {hint}</span>}
      </p>
      <div className={`flex items-center gap-1 ${FIELD_GAP}`}>
        <button type="button" onClick={() => step(-1)} disabled={value <= min} aria-label={`Decrease ${label}`} className={button}>
          <Minus className="size-4" strokeWidth={2} />
        </button>
        <span aria-live="polite" className="w-10 text-center font-display text-base font-semibold tabular-nums text-cmt-neutral-900">
          {value}
        </span>
        <button type="button" onClick={() => step(1)} disabled={value >= max} aria-label={`Increase ${label}`} className={button}>
          <Plus className="size-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

/* §8.5 category tags as a two-option group: selected is the gold-filled pill
   the design system uses for a chosen tag, not the inverted dark chip. */
function YesNo({
  label, value, onChange,
}: { label: string; value: boolean; onChange: (next: boolean) => void }) {
  return (
    <div>
      <p className={LABEL}>{label}</p>
      <div className={`flex gap-2 ${FIELD_GAP}`} role="group" aria-label={label}>
        {[true, false].map((option) => (
          <button
            key={String(option)} type="button" aria-pressed={value === option}
            onClick={() => onChange(option)}
            className={`h-10 min-w-[72px] rounded-cmt-full border px-4 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:shadow-[var(--cmt-focus-ring)] ${
              value === option
                ? "border-cmt-primary-500 bg-cmt-primary-100 font-semibold text-cmt-neutral-900"
                : "border-cmt-neutral-200 bg-white text-cmt-neutral-700 hover:border-cmt-neutral-300"
            }`}
          >
            {option ? "Yes" : "No"}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CruiseQuoteModal({
  cruise, cruises, onClose,
}: {
  cruise: CruiseListing;
  /** Every published cruise, so the line can be changed without reopening. */
  cruises: CruiseListing[];
  onClose: () => void;
}) {
  const [cruiseId, setCruiseId] = useState(cruise.id);
  const [rooms, setRooms] = useState(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [bookingTimeline, setBookingTimeline] = useState<BookingTimeline | "">("");
  const [sailDate, setSailDate] = useState("");
  const [nights, setNights] = useState("");
  const [cabinType, setCabinType] = useState<CabinType>("any");
  const [budget, setBudget] = useState("");
  const [specialOccasion, setSpecialOccasion] = useState(false);
  const [flightBooked, setFlightBooked] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  /* Which field the message belongs to, so it can carry aria-invalid and take
     focus on submit (§18.6). "" means the failure was not field-specific. */
  const [errorField, setErrorField] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);
  const errorId = useId();

  /* Prefill name / email / phone for a signed-in user, the same way the
     contact and package-quote forms do. Applied once, and only into fields
     still empty, so a profile that resolves a moment after mount never
     overwrites what the visitor has already typed. Signing in is not required
     to enquire, so a signed-out visitor simply sees empty fields. */
  const { profile } = useUserProfile();
  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current || !profile) return;
    prefilled.current = true;
    setName((current) => current || profile.name);
    setEmail((current) => current || profile.email);
    setPhone((current) => current || profile.phone);
  }, [profile]);

  const selected = cruises.find((item) => item.id === cruiseId) ?? cruise;
  const demo = isCruiseDemo(selected.id);
  /* Infants are lap-held, so they do not count against the room capacity. */
  const seatedGuests = adults + children;
  const guestCeiling = rooms * GUESTS_PER_ROOM;

  /* Fields flag themselves rather than each call site repeating the wiring:
     `flag` carries the ARIA, `fieldClass` the red border (§8.2 error state). */
  const flag = (field: string) =>
    errorField === field ? { "aria-invalid": true as const, "aria-describedby": errorId } : {};
  const fieldClass = (field: string) =>
    errorField === field ? `${FIELD} border-2 border-cmt-error-500 px-[15px]` : FIELD;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKeyDown);
    dialog.current?.querySelector<HTMLElement>("select, input")?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const fail = (field: string, message: string) => {
    setErrorField(field);
    setError(message);
    /* §18.6: focus moves to the first invalid field on submit failure.
       PhoneNumberField renders no `name`, so the id is matched as well. */
    if (field) dialog.current?.querySelector<HTMLElement>(`[name="${field}"], #${field}`)?.focus();
    return undefined;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (sending) return;
    if (!bookingTimeline) return fail("bookingTimeline", "Please tell us when you are looking to book.");
    if (seatedGuests > guestCeiling) {
      return fail("", `One room sleeps ${GUESTS_PER_ROOM}. Add a room, or reduce the number of guests.`);
    }
    if (!name.trim()) return fail("name", "Please tell us your name.");
    if (!EMAIL_PATTERN.test(email)) return fail("email", "Enter a valid email address, like name@example.com.");
    if (phone.replace(/\D/g, "").length < 7) return fail("phone", "Enter a valid phone number we can reach you on.");

    setSending(true); setError(""); setErrorField("");
    try {
      await saveCruiseEnquiry({
        name, email, phone,
        cruiseId: selected.id,
        cruiseName: selected.name,
        rooms, adults, children, infants,
        bookingTimeline,
        sailDate,
        nights: Number(nights) || 0,
        cabinType,
        budgetPerPerson: Number(budget) || 0,
        specialOccasion, flightBooked,
        notes,
      });
      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your enquiry could not be sent. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    /* §8.8 modal: 24px radius, --shadow-xl, rgba(15,23,42,0.48) backdrop. */
    <div className="fixed inset-0 z-[80] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Cruise enquiry">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-[rgba(15,23,42,0.48)]" />
      <div ref={dialog} className="relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-cmt-lg bg-white shadow-cmt-xl">
        {/* The header carries the chosen cruise as an eyebrow, so the sheet
            says what is being enquired about without spending a field on it. */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-cmt-neutral-200 px-6 py-5 sm:px-8">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase leading-[1.4] tracking-[0.008em] text-cmt-neutral-500">
              Cruise enquiry
            </p>
            <h2 className="mt-1.5 truncate font-display text-2xl font-semibold leading-[1.3] tracking-tight text-cmt-neutral-900">
              {selected.name}
            </h2>
            <p className="mt-2 text-sm leading-[1.55] text-cmt-neutral-600">
              Tell us who is sailing and our cruise specialists will come back with cabins and prices.
            </p>
          </div>
          {/* §8.1 icon-only: 44px hit area, 12px radius, 1px border. */}
          <button
            type="button" onClick={onClose} aria-label="Close"
            className="grid size-11 shrink-0 place-items-center rounded-cmt-control border border-cmt-neutral-200 text-cmt-neutral-500 transition-colors duration-150 hover:border-cmt-neutral-300 hover:bg-cmt-neutral-50 hover:text-cmt-neutral-900 focus-visible:outline-none focus-visible:border-cmt-primary-500 focus-visible:shadow-[var(--cmt-focus-ring)]"
          >
            <X className="size-5" strokeWidth={2} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          {demo ? (
            /* §8.4 information alert. */
            <p className="flex items-start gap-3 rounded-cmt-control border border-cmt-neutral-200 bg-cmt-neutral-50 px-4 py-3.5 text-sm leading-[1.55] text-cmt-neutral-900">
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-cmt-neutral-500" strokeWidth={2} />
              <span><strong className="font-semibold">Sample listing.</strong> This cruise is illustrative, so it cannot be enquired about yet.</span>
            </p>
          ) : sent ? (
            /* §8.4 success alert: bold lead word, then the sentence. */
            <p role="status" className="flex items-start gap-3 rounded-cmt-control border border-[color-mix(in_srgb,var(--cmt-color-success-500)_45%,white)] bg-cmt-success-100 px-4 py-3.5 text-sm leading-[1.55] text-cmt-neutral-900">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-cmt-success-500" strokeWidth={2} />
              <span><strong className="font-semibold">Enquiry sent.</strong> We have your details and will come back with cabins and prices shortly.</span>
            </p>
          ) : (
            /* §5.4: 48px between content blocks inside a section, which is what
               separates the four field groups below. */
            <form id="cruise-enquiry" onSubmit={submit} className="flex flex-col gap-10" noValidate>
              <section>
                <h3 className={SECTION}>Cruise selection</h3>
                <div className="mt-4">
                  <label className={LABEL} htmlFor="cruise-line">Cruise line</label>
                  {/* Seeded from the card, but every published cruise is here
                      so the line can be changed without reopening. */}
                  <select
                    id="cruise-line" name="cruiseId" value={cruiseId}
                    onChange={(event) => setCruiseId(event.target.value)}
                    className={`${FIELD_GAP} ${FIELD} appearance-none bg-[length:16px] bg-[right_1rem_center] bg-no-repeat pr-11 [background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2364748b%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22m6 9 6 6 6-6%22/></svg>')]`}
                  >
                    {cruises.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}{item.route ? ` · ${item.route}` : ""}</option>
                    ))}
                  </select>
                </div>
              </section>

              <section>
                <h3 className={SECTION}>Guest details</h3>
                <p className="mt-2 text-sm leading-[1.55] text-cmt-neutral-600">
                  Guests above the age of 12 are counted as adults. One room sleeps up to {GUESTS_PER_ROOM}.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-4">
                  <Stepper label="Rooms" value={rooms} min={1} max={20} onChange={setRooms} />
                  <Stepper label="Adults" hint="12+" value={adults} min={1} max={60} onChange={setAdults} />
                  <Stepper label="Children" hint="2–12" value={children} min={0} max={60} onChange={setChildren} />
                  <Stepper label="Infants" hint="0–2" value={infants} min={0} max={60} onChange={setInfants} />
                </div>
                {seatedGuests > guestCeiling && (
                  /* §8.4 warning: the count is over capacity but nothing has
                     failed yet, so this warns rather than erroring. */
                  <p className="mt-4 flex items-start gap-3 rounded-cmt-control border border-[color-mix(in_srgb,var(--cmt-color-warning-500)_45%,white)] bg-cmt-warning-100 px-4 py-3 text-sm leading-[1.55] text-cmt-neutral-900">
                    <AlertCircle className="mt-0.5 size-5 shrink-0 text-cmt-warning-500" strokeWidth={2} />
                    <span>
                      <strong className="font-semibold">Not enough rooms.</strong>{" "}
                      {seatedGuests} guests need at least {Math.ceil(seatedGuests / GUESTS_PER_ROOM)} rooms.
                    </span>
                  </p>
                )}
              </section>

              <section>
                <h3 className={SECTION}>Trip details</h3>
                {/* §5.4: 16px between one field and the next label. */}
                <div className="mt-4 flex flex-col gap-4">
                  <div>
                    <label className={LABEL} htmlFor="booking-timeline">Booking timeline</label>
                    <select
                      id="booking-timeline" name="bookingTimeline" value={bookingTimeline}
                      onChange={(event) => { setBookingTimeline(event.target.value as BookingTimeline); setErrorField(""); }}
                      {...flag("bookingTimeline")}
                      className={`${FIELD_GAP} ${fieldClass("bookingTimeline")} appearance-none bg-[length:16px] bg-[right_1rem_center] bg-no-repeat pr-11 [background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2364748b%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22m6 9 6 6 6-6%22/></svg>')]`}
                    >
                      <option value="">When are you looking to book?</option>
                      {BOOKING_TIMELINES.map((value) => (
                        <option key={value} value={value}>{BOOKING_TIMELINE_LABELS[value]}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={LABEL} htmlFor="sail-date">Preferred sail date<Optional /></label>
                      <input id="sail-date" type="date" value={sailDate} onChange={(event) => setSailDate(event.target.value)} className={`${FIELD_GAP} ${FIELD}`} />
                    </div>
                    <div>
                      <label className={LABEL} htmlFor="nights">Duration in nights<Optional /></label>
                      <input id="nights" type="number" min={0} max={365} inputMode="numeric" value={nights} onChange={(event) => setNights(event.target.value)} placeholder="e.g. 4" className={`${FIELD_GAP} ${FIELD} placeholder:text-cmt-neutral-400`} />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={LABEL} htmlFor="cabin-type">Cabin type</label>
                      <select
                        id="cabin-type" value={cabinType}
                        onChange={(event) => setCabinType(event.target.value as CabinType)}
                        className={`${FIELD_GAP} ${FIELD} appearance-none bg-[length:16px] bg-[right_1rem_center] bg-no-repeat pr-11 [background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2364748b%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22m6 9 6 6 6-6%22/></svg>')]`}
                      >
                        {CABIN_TYPES.map((value) => (
                          <option key={value} value={value}>{CABIN_TYPE_LABELS[value]}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={LABEL} htmlFor="budget">Budget per person<Optional /></label>
                      {/* §8.2: a leading affordance reserves 40px on its side. */}
                      <div className={`relative ${FIELD_GAP}`}>
                        <span aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-cmt-neutral-500">₹</span>
                        <input id="budget" type="number" min={0} inputMode="numeric" value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="25,000" className={`${FIELD} pl-9 placeholder:text-cmt-neutral-400`} />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <YesNo label="Honeymoon / anniversary" value={specialOccasion} onChange={setSpecialOccasion} />
                    <YesNo label="Flight already booked" value={flightBooked} onChange={setFlightBooked} />
                  </div>
                </div>
              </section>

              <section>
                <h3 className={SECTION}>Your details</h3>
                <div className="mt-4 flex flex-col gap-4">
                  <div>
                    <label className={LABEL} htmlFor="name">Your name</label>
                    <input
                      id="name" name="name" value={name}
                      onChange={(event) => { setName(event.target.value); setErrorField(""); }}
                      autoComplete="name" required
                      {...flag("name")}
                      className={`${FIELD_GAP} ${fieldClass("name")}`}
                    />
                  </div>
                  <div>
                    <label className={LABEL} htmlFor="email">Email</label>
                    <input
                      id="email" name="email" type="email" value={email}
                      onChange={(event) => { setEmail(event.target.value); setErrorField(""); }}
                      autoComplete="email" required placeholder="name@example.com"
                      {...flag("email")}
                      className={`${FIELD_GAP} ${fieldClass("email")} placeholder:text-cmt-neutral-400`}
                    />
                  </div>
                  <PhoneNumberField
                    id="phone"
                    value={phone}
                    onChange={(next) => { setPhone(next); setErrorField(""); }}
                    required
                    labelClassName={LABEL}
                    invalid={errorField === "phone"}
                    describedBy={errorField === "phone" ? errorId : undefined}
                  />
                  <div>
                    <label className={LABEL} htmlFor="notes">Anything we should know?<Optional /></label>
                    <textarea
                      id="notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={3}
                      placeholder="Dietary needs, accessibility, cabins together…"
                      className={`${FIELD_GAP} w-full rounded-cmt-control border border-cmt-neutral-200 bg-white px-4 py-3 text-base leading-[1.6] text-cmt-neutral-900 outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-cmt-neutral-400 hover:border-cmt-neutral-300 focus:border-2 focus:border-cmt-primary-500 focus:px-[15px] focus:py-[11px] focus:shadow-[var(--cmt-focus-ring)]`}
                    />
                  </div>
                </div>
              </section>
            </form>
          )}
        </div>

        {!demo && !sent && (
          /* Outside the scroll area, so the submit is always reachable on a
             phone without scrolling the whole form to the bottom. */
          <div className="shrink-0 border-t border-cmt-neutral-200 px-6 py-4 sm:px-8">
            {error && (
              /* §8.4 error alert, §18.6 summary: it sits with the action it
                 blocks, so the reason is on screen when the button is. */
              <p id={errorId} role="alert" className="mb-3 flex items-start gap-3 rounded-cmt-control border border-[color-mix(in_srgb,var(--cmt-color-error-500)_45%,white)] bg-cmt-error-100 px-4 py-3 text-sm leading-[1.55] text-cmt-neutral-900">
                <AlertCircle className="mt-0.5 size-5 shrink-0 text-cmt-error-500" strokeWidth={2} />
                <span><strong className="font-semibold">Check your details.</strong> {error}</span>
              </p>
            )}
            {/* §8.1 Primary Large: 52px, 18px label, shadow-primary on hover
                only, full width because it is the mobile conversion action. */}
            <button
              type="submit" form="cruise-enquiry" disabled={sending} aria-busy={sending}
              className="inline-flex h-[52px] w-full items-center justify-center rounded-cmt-control bg-cmt-primary-500 px-8 font-body text-base font-semibold tracking-[0.005em] text-cmt-neutral-900 shadow-cmt-xs transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:bg-cmt-primary-600 hover:shadow-cmt-primary active:translate-y-0 focus-visible:outline-none focus-visible:shadow-[var(--cmt-focus-ring)] disabled:translate-y-0 disabled:bg-cmt-neutral-100 disabled:text-cmt-neutral-300 disabled:shadow-none"
            >
              {sending ? "Sending…" : "Send enquiry"}
            </button>
            <p className="mt-3 text-center text-xs leading-[1.5] text-cmt-neutral-500">
              No payment now — we will send cabins and prices for you to review.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

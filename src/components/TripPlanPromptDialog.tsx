"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  IndianRupee,
  Mail,
  MapPin,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  X,
} from "lucide-react";

import PhoneNumberField from "@/components/PhoneNumberField";
import { useAllPackages } from "@/lib/usePackages";
import { buildDestinations } from "@/lib/destinations";
import {
  DEPARTURE_TYPES,
  DEPARTURE_TYPE_LABELS,
  FOOD_PREFERENCES,
  FOOD_PREFERENCE_LABELS,
  savePopupLead,
  type DepartureType,
  type FoodPreference,
} from "@/lib/firebase/popupLeads";

/* ------------------------------------------------------------------ */
/* The timed pop-up. It asks a browsing visitor what trip they want and  */
/* files the answer as a lead for the travel desk — it is not a sign-in  */
/* surface. Accounts still exist and still matter (checkout, saved trips,*/
/* quote history), but they live on /login and /signup; a visitor who is */
/* only browsing should not be asked for a password to get a quote.      */
/*                                                                      */
/* Mounted once in the root layout, so the timer is armed by a document  */
/* load and not by client-side navigation: it appears after the delay on */
/* a hard load or refresh, and a dismissal lasts until the next one.     */
/* Nothing is written to storage — that is what re-arms it each refresh. */
/* ------------------------------------------------------------------ */

const PROMPT_DELAY_MS = 1000;

/* Routes where the prompt would be in the way: the auth pages, checkout
   (already a conversion flow) and the CRM. */
const SUPPRESSED_PREFIXES = ["/login", "/signup", "/forgot-password", "/admin", "/checkout"];

/* Offered when the catalogue has not loaded yet, so the picker is never
   empty on a cold first paint. The visitor can type anything regardless. */
const FALLBACK_DESTINATIONS = [
  "Kashmir", "Kerala", "Goa", "Rajasthan", "Himachal Pradesh", "Uttarakhand",
  "Andaman", "Ladakh", "Meghalaya", "Sikkim", "Bali", "Thailand",
  "Dubai", "Singapore", "Maldives", "Vietnam", "Sri Lanka", "Nepal",
];

const fieldClass =
  "h-12 w-full rounded-cmt-control border border-cmt-neutral-200 bg-white px-4 font-body text-[16px] text-cmt-neutral-900 shadow-cmt-xs outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-cmt-neutral-400 hover:border-cmt-neutral-300 focus:border-2 focus:border-cmt-primary-500 focus:ring-[3px] focus:ring-cmt-primary-500/20";
const labelClass =
  "mb-2 block text-[11px] font-semibold uppercase leading-[1.4] tracking-[0.008em] text-cmt-neutral-500";

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function TripPlanPromptDialog() {
  const pathname = usePathname();
  const packages = useAllPackages();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [delayElapsed, setDelayElapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [requested, setRequested] = useState(false);
  const [entered, setEntered] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+91");
  const [destinations, setDestinations] = useState<string[]>([]);
  const [destinationDraft, setDestinationDraft] = useState("");
  const [departureType, setDepartureType] = useState<DepartureType>("group");
  const [foodPreference, setFoodPreference] = useState<FoodPreference>("veg");
  const [travelDate, setTravelDate] = useState("");
  const [travellers, setTravellers] = useState("2");
  const [budget, setBudget] = useState("");

  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  /* Real destinations from the catalogue, so the suggestions are places we
     actually sell. Falls back to a static list until packages arrive. */
  const suggestions = useMemo(() => {
    const live = buildDestinations(packages).map((destination) => destination.name);
    return (live.length ? live : FALLBACK_DESTINATIONS)
      .filter((suggestion) => !destinations.includes(suggestion))
      .slice(0, 40);
  }, [packages, destinations]);

  /* One timer per document load. It only marks the delay as spent — whether
     to show is decided below. */
  useEffect(() => {
    const timer = window.setTimeout(() => setDelayElapsed(true), PROMPT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  /* Product actions can open this same form immediately, so there is one
     enquiry experience across the site. */
  useEffect(() => {
    const handleRequest = () => {
      setEntered(false);
      setDismissed(false);
      setRequested(true);
    };
    window.addEventListener("cmt:open-trip-prompt", handleRequest);
    return () => window.removeEventListener("cmt:open-trip-prompt", handleRequest);
  }, []);

  const suppressedRoute = SUPPRESSED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const open = (requested || (delayElapsed && !dismissed)) && !suppressedRoute;

  /* showModal() is what gives the focus trap, the inert background and Esc
     without hand-rolling any of them. The panel is painted at scale(0.98)
     first, then the next frame flips it to its resting state so the
     transition has two values to move between. */
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;

    if (!dialog.open) dialog.showModal();
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const close = () => {
    setRequested(false);
    setDismissed(true);
    setEntered(false);
    window.dispatchEvent(new Event("cmt:trip-prompt-dismissed"));
  };

  const addDestination = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setDestinations((current) =>
      current.length >= 12 || current.some((item) => item.toLowerCase() === trimmed.toLowerCase())
        ? current
        : [...current, trimmed],
    );
    setDestinationDraft("");
  };

  const removeDestination = (value: string) =>
    setDestinations((current) => current.filter((item) => item !== value));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    /* A destination typed but not committed with Enter still counts — losing
       it because the visitor went straight for the button would be rude. */
    const draft = destinationDraft.trim();
    const chosen = draft && !destinations.some((item) => item.toLowerCase() === draft.toLowerCase())
      ? [...destinations, draft]
      : destinations;

    const phoneDigits = phone.replace(/\D/g, "");
    const travellerCount = Number(travellers);
    const budgetvalue = budget.trim() ? Number(budget.replace(/[^\d]/g, "")) : 0;

    if (name.trim().length < 2) return setError("Please enter your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Please enter a valid email address.");
    if (phoneDigits.length < 7 || phoneDigits.length > 15) return setError("Please enter a valid phone number.");
    if (!chosen.length) return setError("Tell us where you would like to go.");
    if (!travelDate) return setError("Please choose your travel date.");
    if (!Number.isFinite(travellerCount) || travellerCount < 1 || travellerCount > 60)
      return setError("Please enter between 1 and 60 travellers.");

    setSending(true);
    try {
      await savePopupLead({
        name,
        email,
        phone,
        destinations: chosen,
        departureType,
        foodPreference,
        travelDate,
        travellers: travellerCount,
        budgetPerPerson: Number.isFinite(budgetvalue) ? budgetvalue : 0,
        pagePath: pathname,
      });
      setDestinations(chosen);
      setDestinationDraft("");
      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your request could not be sent. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="trip-prompt-title"
      onClose={close}
      /* A click that lands on the element itself is a click on the backdrop,
         since the panel below covers the whole dialog box. */
      onClick={(event) => {
        if (event.target === dialogRef.current) close();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[560px] overflow-hidden rounded-cmt-lg border-0 bg-transparent p-0 backdrop:bg-[rgba(15,23,42,0.48)]"
    >
      <div
        className={`relative flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-cmt-lg bg-cmt-white font-body text-cmt-neutral-900 shadow-cmt-xl transition-[opacity,transform] duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none ${
          entered ? "scale-100 opacity-100" : "scale-[0.98] opacity-0"
        }`}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close and keep browsing"
          className={`absolute right-4 top-4 z-10 grid size-11 place-items-center rounded-cmt-control border transition-colors duration-200 focus-visible:shadow-[var(--cmt-focus-ring)] focus-visible:outline-none ${
            sent
              ? "border-cmt-neutral-200 bg-white text-cmt-neutral-600 hover:border-cmt-neutral-300 hover:bg-cmt-neutral-50 hover:text-cmt-neutral-900"
              : "border-white/15 bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          <X size={18} strokeWidth={2} aria-hidden="true" />
        </button>

        {sent ? (
          <div className="p-8 text-center sm:p-10">
            <span className="mx-auto grid size-14 place-items-center rounded-cmt-full bg-cmt-success-100 text-cmt-success-700">
              <CheckCircle2 className="size-7" aria-hidden="true" />
            </span>
            <h2 id="trip-prompt-title" className="mt-5 font-display text-2xl font-semibold">
              Request received
            </h2>
            <p className="mt-2 text-sm leading-6 text-cmt-neutral-600">
              Our travel team will call you on {phone} with quotes for{" "}
              {destinations.join(", ")}.
            </p>
            <button
              type="button"
              onClick={close}
              className="mt-6 h-11 rounded-cmt-control bg-cmt-primary-500 px-6 text-sm font-semibold text-cmt-neutral-900 shadow-cmt-xs transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:bg-cmt-primary-600 hover:shadow-cmt-primary focus-visible:shadow-[var(--cmt-focus-ring)] focus-visible:outline-none"
            >
              Keep browsing
            </button>
          </div>
        ) : (
          <>
            <header className="shrink-0 bg-cmt-neutral-900 px-6 py-6 pr-20 text-white sm:px-8 sm:pr-20">
              <span className="inline-flex items-center gap-1.5 rounded-cmt-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-cmt-primary-400">
                <Sparkles className="size-3.5" aria-hidden="true" /> Free trip planning
              </span>
              <h2
                id="trip-prompt-title"
                className="mt-3 text-balance font-display text-[24px] font-semibold leading-[1.2] tracking-[-0.005em] sm:text-[26px]"
              >
                Planning a holiday? Let us help.
              </h2>
              <p className="mt-2 text-pretty text-[14px] leading-[1.55] text-cmt-neutral-300">
                Share your trip and we&rsquo;ll call with quotes from verified operators.
              </p>
            </header>

            <form
              onSubmit={submit}
              noValidate
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 overflow-y-auto overscroll-contain px-5 py-5 sm:px-8 sm:py-6">
                {error ? (
                  <p
                    id="trip-prompt-error"
                    role="alert"
                    className="mb-5 rounded-cmt-control border border-cmt-error-500/20 bg-cmt-error-100 px-4 py-3 text-sm leading-6 text-cmt-error-700"
                  >
                    {error}
                  </p>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className={labelClass}>Name *</span>
                    <span className="relative block">
                      <UserRound className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-cmt-neutral-500" aria-hidden="true" />
                      <input
                        required
                        autoComplete="name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Your full name"
                        className={`${fieldClass} pl-11`}
                      />
                    </span>
                  </label>

                  <PhoneNumberField
                    required
                    compactCountryCode
                    value={phone}
                    onChange={setPhone}
                    label={<>Phone number *</>}
                    labelClassName={labelClass.replace("mb-2 block", "block")}
                  />
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className={labelClass}>Email *</span>
                    <span className="relative block">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-cmt-neutral-500" aria-hidden="true" />
                      <input
                        required
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                        className={`${fieldClass} pl-11`}
                      />
                    </span>
                  </label>

                  {/* Chips plus free text: visitors are never limited to the catalogue. */}
                  <div>
                    <label id="trip-prompt-destination-label" htmlFor="trip-prompt-destination" className={labelClass}>
                      Where to? (one or more) *
                    </label>
                    <div className="flex min-h-12 flex-wrap items-center gap-1.5 rounded-cmt-control border border-cmt-neutral-200 bg-white px-3 py-1.5 shadow-cmt-xs transition-[border-color,box-shadow] duration-200 hover:border-cmt-neutral-300 focus-within:border-2 focus-within:border-cmt-primary-500 focus-within:ring-[3px] focus-within:ring-cmt-primary-500/20">
                      <MapPin className="size-4 shrink-0 text-cmt-neutral-500" aria-hidden="true" />
                      {destinations.map((destination) => (
                        <span
                          key={destination}
                          className="inline-flex items-center gap-1 rounded-cmt-full bg-cmt-primary-100 py-1 pl-3 pr-1.5 text-[12px] font-semibold text-cmt-neutral-900"
                        >
                          {destination}
                          <button
                            type="button"
                            onClick={() => removeDestination(destination)}
                            aria-label={`Remove ${destination}`}
                            className="grid size-5 place-items-center rounded-cmt-full text-cmt-neutral-700 transition-colors hover:bg-cmt-primary-50 focus-visible:shadow-[var(--cmt-focus-ring)] focus-visible:outline-none"
                          >
                            <X className="size-3" aria-hidden="true" />
                          </button>
                        </span>
                      ))}
                      <input
                        id="trip-prompt-destination"
                        list="trip-prompt-destinations"
                        value={destinationDraft}
                        onChange={(event) => {
                          const { value } = event.target;
                          if (suggestions.some((suggestion) => suggestion === value)) addDestination(value);
                          else setDestinationDraft(value);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === ",") {
                            event.preventDefault();
                            addDestination(destinationDraft);
                          } else if (event.key === "Backspace" && !destinationDraft && destinations.length) {
                            removeDestination(destinations[destinations.length - 1]);
                          }
                        }}
                        placeholder={destinations.length ? "Add another…" : "Kashmir, Bali…"}
                        className="h-8 min-w-0 flex-1 bg-transparent px-1 font-body text-[16px] text-cmt-neutral-900 outline-none placeholder:text-cmt-neutral-400"
                      />
                      <datalist id="trip-prompt-destinations">
                        {suggestions.map((suggestion) => (
                          <option key={suggestion} value={suggestion} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className={labelClass}>Departure type</span>
                    <span className="relative block">
                      <select
                        value={departureType}
                        onChange={(event) => setDepartureType(event.target.value as DepartureType)}
                        className={`${fieldClass} appearance-none pr-10`}
                      >
                        {DEPARTURE_TYPES.map((value) => (
                          <option key={value} value={value}>
                            {DEPARTURE_TYPE_LABELS[value]}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-cmt-neutral-500" aria-hidden="true" />
                    </span>
                  </label>

                  <label className="block">
                    <span className={labelClass}>Food preference</span>
                    <span className="relative block">
                      <select
                        value={foodPreference}
                        onChange={(event) => setFoodPreference(event.target.value as FoodPreference)}
                        className={`${fieldClass} appearance-none pr-10`}
                      >
                        {FOOD_PREFERENCES.map((value) => (
                          <option key={value} value={value}>
                            {FOOD_PREFERENCE_LABELS[value]}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-cmt-neutral-500" aria-hidden="true" />
                    </span>
                  </label>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="block min-w-0">
                    <span className={labelClass}>Travel date *</span>
                    <span className="relative block min-w-0">
                      <CalendarDays className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-cmt-neutral-500" aria-hidden="true" />
                      <input
                        required
                        type="date"
                        min={todayISO()}
                        value={travelDate}
                        onChange={(event) => setTravelDate(event.target.value)}
                        className={`${fieldClass} min-w-0 pl-11 pr-3`}
                      />
                    </span>
                  </label>

                  <label className="block">
                    <span className={labelClass}>Travellers *</span>
                    <span className="relative block">
                      <Users className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-cmt-neutral-500" aria-hidden="true" />
                      <input
                        required
                        type="number"
                        min="1"
                        max="60"
                        value={travellers}
                        onChange={(event) => setTravellers(event.target.value)}
                        className={`${fieldClass} pl-11`}
                      />
                    </span>
                  </label>
                </div>

                <label className="mt-4 block">
                  <span className={labelClass}>
                    Budget / person <span className="normal-case tracking-normal text-cmt-neutral-400">(optional)</span>
                  </span>
                  <span className="relative block">
                    <IndianRupee className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-cmt-neutral-500" aria-hidden="true" />
                    <input
                      inputMode="numeric"
                      value={budget}
                      onChange={(event) => setBudget(event.target.value)}
                      placeholder="e.g. 25,000"
                      className={`${fieldClass} pl-11`}
                    />
                  </span>
                </label>
              </div>

              <footer className="shrink-0 border-t border-cmt-neutral-100 bg-white px-5 py-4 sm:px-8">
                <button
                  type="submit"
                  disabled={sending}
                  aria-busy={sending}
                  className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-cmt-control bg-cmt-primary-500 px-6 text-sm font-semibold tracking-[0.005em] text-cmt-neutral-900 shadow-cmt-xs transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:bg-cmt-primary-600 hover:shadow-cmt-primary active:translate-y-0 active:bg-cmt-primary-700 active:shadow-none focus-visible:shadow-[var(--cmt-focus-ring)] focus-visible:outline-none disabled:cursor-wait disabled:bg-cmt-neutral-100 disabled:text-cmt-neutral-400 disabled:shadow-none"
                >
                  {sending ? "Sending…" : "Get free quotes"}
                  {!sending ? <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" /> : null}
                </button>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-cmt-neutral-500">
                  <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
                  Your details stay with our verified travel team.
                </p>
              </footer>
            </form>
          </>
        )}
      </div>
    </dialog>
  );
}

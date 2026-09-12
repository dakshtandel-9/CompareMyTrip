import { BedDouble, PlaneTakeoff, Stamp, FileCheck2, type LucideIcon } from "lucide-react";
import type { AddOnContent } from "@/lib/siteContent";

/* ------------------------------------------------------------------ */
/* The four add-on enquiries, in the order the page offers them:       */
/* flights, hotels, visa and Bring Your Quote.                                   */
/*                                                                      */
/* Each is the same form with a different middle: the contact block and  */
/* the notes box are shared by AddOnForm, and everything specific to a   */
/* service is the `fields` list below. Adding a service is a fourth      */
/* entry here — the tabs, the URL, the validation, the summary the       */
/* travel desk reads and the success note all follow from it.           */
/*                                                                      */
/* These enquiries are saved as ordinary contact enquiries so they land  */
/* in /admin/enquiries with the rest: the Firestore rules only accept    */
/* `contact` and `custom_quote` as a source, so the service is carried   */
/* in the message instead, which is what the desk reads anyway.          */
/* ------------------------------------------------------------------ */

export type ServiceId = keyof AddOnContent["services"];

export type FieldOption = { value: string; label: string };

/** One service-specific field. `kind` picks the control; everything else is
    the same handling for all forms. */
export type FieldSpec = {
  name: string;
  label: string;
  kind: "text" | "date" | "select";
  required?: boolean;
  placeholder?: string;
  options?: FieldOption[];
  /** Rendered only when this passes — the return date on a one-way flight is
      not an empty field, it is not a question. */
  when?: (values: Values) => boolean;
  /** Full width on the two-column grid; the notes box is always full width. */
  wide?: boolean;
  /** Shown under the field, for the one or two that need a nudge. */
  hint?: string;
};

export type Values = Record<string, string>;

export type ServiceSpec = {
  id: ServiceId;
  /** Tab label, and the word used in the sentence the desk gets. */
  label: string;
  icon: LucideIcon;
  title: string;
  description: string;
  fields: FieldSpec[];
  notesLabel: string;
  notesPlaceholder: string;
  /** The three lines beside the form: what we come back with. */
  promises: string[];
  /** What the visitor is told once it has sent. */
  sentNote: string;
  /** The three columns the CRM list shows without opening an enquiry. Each is
      length-capped to what the Firestore rules accept. */
  summary: (values: Values) => { destination: string; departure: string; travellers: string };
};

const TRAVELLER_OPTIONS: FieldOption[] = [
  { value: "1", label: "1 traveller" },
  { value: "2", label: "2 travellers" },
  { value: "3", label: "3 travellers" },
  { value: "4", label: "4 travellers" },
  { value: "5", label: "5 travellers" },
  { value: "6-9", label: "6–9 travellers" },
  { value: "10+", label: "10 or more" },
];

/* The rules cap these fields, so a long free-text answer is trimmed here
   rather than rejected at the write. */
const clamp = (value: string, max: number) => value.trim().slice(0, max);

export const SERVICES: ServiceSpec[] = [
  {
    id: "flights",
    label: "Flights",
    icon: PlaneTakeoff,
    title: "Flight enquiry",
    description:
      "Tell us the route and the dates. We come back with fare options across airlines — including the ones that are cheaper a day either side.",
    fields: [
      {
        name: "tripType",
        label: "Trip type",
        kind: "select",
        required: true,
        options: [
          { value: "round", label: "Round trip" },
          { value: "oneway", label: "One way" },
          { value: "multicity", label: "Multi-city" },
        ],
      },
      {
        name: "cabin",
        label: "Cabin",
        kind: "select",
        options: [
          { value: "economy", label: "Economy" },
          { value: "premium", label: "Premium economy" },
          { value: "business", label: "Business" },
          { value: "first", label: "First" },
        ],
      },
      { name: "from", label: "Flying from", kind: "text", required: true, placeholder: "Mumbai" },
      { name: "to", label: "Flying to", kind: "text", required: true, placeholder: "Bali" },
      { name: "departDate", label: "Departure date", kind: "date", required: true },
      {
        name: "returnDate",
        label: "Return date",
        kind: "date",
        required: true,
        when: (values) => values.tripType === "round",
      },
      { name: "travellers", label: "Travellers", kind: "select", required: true, options: TRAVELLER_OPTIONS },
      {
        name: "flexibility",
        label: "Date flexibility",
        kind: "select",
        options: [
          { value: "exact", label: "These dates only" },
          { value: "1-2", label: "Give or take a day or two" },
          { value: "week", label: "Anywhere in that week" },
        ],
        hint: "Flexible dates usually find a lower fare.",
      },
    ],
    notesLabel: "Anything we should know?",
    notesPlaceholder:
      "Preferred airline, morning departure, checked baggage, seats together — whatever matters on this one.",
    promises: [
      "Fares across airlines, not one booking site's view",
      "What the ticket actually includes — baggage, seats, changes",
      "The cheaper dates either side, if there are any",
    ],
    sentNote: "Our flights desk will come back with fare options for this route.",
    summary: (values) => ({
      destination: clamp(`${values.from} → ${values.to}`, 160),
      departure: clamp(values.departDate, 20),
      travellers: clamp(values.travellers, 20),
    }),
  },
  {
    id: "hotels",
    label: "Hotels",
    icon: BedDouble,
    title: "Hotel enquiry",
    description:
      "Where you are going and when. We send a shortlist that fits the budget, with what each rate includes spelled out.",
    fields: [
      { name: "city", label: "City or area", kind: "text", required: true, placeholder: "Ubud, Bali" },
      {
        name: "category",
        label: "Preferred category",
        kind: "select",
        options: [
          { value: "any", label: "Whatever fits the budget" },
          { value: "3", label: "3-star" },
          { value: "4", label: "4-star" },
          { value: "5", label: "5-star" },
          { value: "resort", label: "Resort" },
          { value: "villa", label: "Villa or apartment" },
          { value: "homestay", label: "Homestay or boutique" },
        ],
      },
      { name: "checkIn", label: "Check-in", kind: "date", required: true },
      { name: "checkOut", label: "Check-out", kind: "date", required: true },
      {
        name: "rooms",
        label: "Rooms",
        kind: "select",
        required: true,
        options: [
          { value: "1", label: "1 room" },
          { value: "2", label: "2 rooms" },
          { value: "3", label: "3 rooms" },
          { value: "4", label: "4 rooms" },
          { value: "5+", label: "5 or more" },
        ],
      },
      { name: "guests", label: "Guests", kind: "select", required: true, options: TRAVELLER_OPTIONS },
      {
        name: "budget",
        label: "Budget per night",
        kind: "text",
        placeholder: "₹6,000 or so",
        hint: "A rough figure is enough — it decides the shortlist.",
      },
      {
        name: "meals",
        label: "Meals",
        kind: "select",
        options: [
          { value: "any", label: "No preference" },
          { value: "room-only", label: "Room only" },
          { value: "breakfast", label: "Breakfast included" },
          { value: "half", label: "Half board" },
          { value: "full", label: "Full board" },
        ],
      },
    ],
    notesLabel: "Anything the stay has to have?",
    notesPlaceholder:
      "Pool, near the beach, quiet street, family room, late check-out, accessible bathroom — say it here.",
    promises: [
      "A shortlist inside your budget, not above it",
      "What each rate includes — meals, taxes, cancellation",
      "Honest notes on location, not just the photos",
    ],
    sentNote: "Our stays desk will come back with a shortlist for these dates.",
    summary: (values) => ({
      destination: clamp(values.city, 160),
      departure: clamp(values.checkIn, 20),
      travellers: clamp(values.guests, 20),
    }),
  },
  {
    id: "visa",
    label: "Visa",
    icon: Stamp,
    title: "Visa enquiry",
    description:
      "Tell us where you are headed and on which passport. We come back with the exact route, the documents, the fee and how long it takes.",
    fields: [
      { name: "country", label: "Travelling to", kind: "text", required: true, placeholder: "Indonesia" },
      { name: "nationality", label: "Passport / nationality", kind: "text", required: true, placeholder: "India" },
      {
        name: "visaType",
        label: "Visa type",
        kind: "select",
        required: true,
        options: [
          { value: "tourist", label: "Tourist" },
          { value: "business", label: "Business" },
          { value: "transit", label: "Transit" },
          { value: "student", label: "Student" },
          { value: "unsure", label: "Not sure — advise me" },
        ],
      },
      {
        name: "applicants",
        label: "Applicants",
        kind: "select",
        required: true,
        /* Same counts, but a visa has applicants rather than travellers.
           "traveller" is the stem of both labels, so one swap covers the
           singular and the plural. */
        options: TRAVELLER_OPTIONS.map((option) => ({
          ...option,
          label: option.label.replace("traveller", "applicant"),
        })),
      },
      { name: "travelDate", label: "Intended travel date", kind: "date", required: true },
      {
        name: "passportValidity",
        label: "Passport validity",
        kind: "select",
        options: [
          { value: "6plus", label: "More than 6 months left" },
          { value: "under6", label: "Less than 6 months left" },
          { value: "renewing", label: "Being renewed" },
          { value: "unknown", label: "Not sure" },
        ],
        hint: "Most countries want six months beyond your travel dates.",
      },
      {
        name: "previousVisas",
        label: "Earlier visas held",
        kind: "text",
        wide: true,
        placeholder: "Schengen 2023, UK 2019 — or leave blank",
        hint: "Past travel history helps some applications along.",
      },
    ],
    notesLabel: "Anything unusual about this application?",
    notesPlaceholder:
      "A refusal in the past, a tight travel date, travelling with a minor, a name change on the passport — tell us now rather than later.",
    promises: [
      "The exact route for your passport — e-visa, on arrival or embassy",
      "The document checklist, in the order you will need it",
      "Government fee, our fee, and how long it really takes",
    ],
    sentNote: "Our visa desk will come back with the requirements for this passport and country.",
    summary: (values) => ({
      destination: clamp(values.country, 160),
      departure: clamp(values.travelDate, 20),
      travellers: clamp(values.applicants, 20),
    }),
  },
  {
    id: "byq",
    label: "Bring Your Quote",
    icon: FileCheck2,
    title: "Bring Your Quote",
    description:
      "Already have a travel quote? Share your trip details and attach the quote so our desk can compare the same itinerary, inclusions and price.",
    fields: [
      { name: "destination", label: "Destination", kind: "text", required: true, placeholder: "Bali, Indonesia" },
      { name: "travelDate", label: "Departure date", kind: "date", required: true },
      { name: "travellers", label: "Travellers", kind: "select", required: true, options: TRAVELLER_OPTIONS },
      { name: "quoteAmount", label: "Quoted price and currency", kind: "text", required: true, placeholder: "₹80,000 total for 2 travellers", hint: "Include whether the price is per person or for the whole trip." },
      { name: "provider", label: "Quote provider", kind: "text", placeholder: "Travel company or agent" },
      { name: "duration", label: "Trip duration", kind: "text", placeholder: "5 nights / 6 days" },
    ],
    notesLabel: "Itinerary and inclusions",
    notesPlaceholder: "Hotels, room type, meals, transfers and activities included in your quote.",
    promises: [
      "A comparison of the same destination and itinerary",
      "A clear breakdown of inclusions and the quoted price",
      "Next steps and the applicable price-beat guarantee terms",
    ],
    sentNote: "Our quote comparison desk will review your trip and contact you with the next steps.",
    summary: (values) => ({
      destination: clamp(values.destination, 160),
      departure: clamp(values.travelDate, 20),
      travellers: clamp(values.travellers, 20),
    }),
  },
];

export const DEFAULT_SERVICE: ServiceId = "flights";

/** `?service=` is visitor-supplied, so an unknown value opens the first tab
    rather than an empty page. */
export function toServiceId(value: unknown): ServiceId {
  return SERVICES.some((service) => service.id === value) ? (value as ServiceId) : DEFAULT_SERVICE;
}

export function findService(id: ServiceId): ServiceSpec {
  return SERVICES.find((service) => service.id === id) ?? SERVICES[0];
}

/** Fields the visitor can actually see right now — the only ones validated,
    summarised, or sent. */
export function visibleFields(service: ServiceSpec, values: Values): FieldSpec[] {
  return service.fields.filter((field) => !field.when || field.when(values));
}

/** The enquiry as the travel desk reads it: which desk it is for, every
    answer under its own label, then the visitor's own words. */
export function composeMessage(service: ServiceSpec, values: Values, notes: string): string {
  const lines = visibleFields(service, values).flatMap((field) => {
    const raw = values[field.name]?.trim() ?? "";
    if (!raw) return [];
    const shown =
      field.kind === "select"
        ? field.options?.find((option) => option.value === raw)?.label ?? raw
        : raw;
    return [`${field.label}: ${shown}`];
  });

  const written = notes.trim();
  return [`${service.title} (via Add On)`, "", ...lines, ...(written ? ["", "Notes:", written] : [])]
    .join("\n")
    .slice(0, 5000);
}

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  type Timestamp,
} from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { getFirebaseDb } from "./client";

/* Cruise enquiries from the Get quote form on /cruise. Its own collection
   rather than another `source` on contactEnquiries, for the same reason
   popupLeads is separate: rooms, cabin grade and the adult/child/infant
   split have no counterpart there, and squeezing them into the message
   field would make them unreadable in the CRM. */

export type CruiseEnquiryStatus = "new" | "contacted" | "quoted" | "converted" | "closed";

export const CRUISE_ENQUIRY_STATUS_LABELS: Record<CruiseEnquiryStatus, string> = {
  new: "New",
  contacted: "Contacted",
  quoted: "Quoted",
  converted: "Converted",
  closed: "Closed",
};

export const BOOKING_TIMELINES = ["immediately", "1_month", "3_months", "later", "unsure"] as const;
export type BookingTimeline = (typeof BOOKING_TIMELINES)[number];

export const BOOKING_TIMELINE_LABELS: Record<BookingTimeline, string> = {
  immediately: "Immediately",
  "1_month": "Within a month",
  "3_months": "In 1–3 months",
  later: "More than 3 months away",
  unsure: "Not sure yet",
};

export const CABIN_TYPES = ["interior", "ocean_view", "balcony", "suite", "any"] as const;
export type CabinType = (typeof CABIN_TYPES)[number];

export const CABIN_TYPE_LABELS: Record<CabinType, string> = {
  interior: "Interior",
  ocean_view: "Ocean view",
  balcony: "Balcony",
  suite: "Suite",
  any: "No preference",
};

export type CruiseEnquiry = {
  id: string;
  name: string;
  email: string;
  phone: string;
  /** The cruise picked in the form; the card only seeds the default. */
  cruiseId: string;
  cruiseName: string;
  rooms: number;
  adults: number;
  children: number;
  infants: number;
  bookingTimeline: BookingTimeline;
  /** ISO yyyy-mm-dd, or "" when left blank. */
  sailDate: string;
  /** Nights; 0 means "not stated". */
  nights: number;
  cabinType: CabinType;
  /** Per person in rupees; 0 means "not stated". */
  budgetPerPerson: number;
  specialOccasion: boolean;
  flightBooked: boolean;
  notes: string;
  status: CruiseEnquiryStatus;
  submittedAt: Date | null;
};

export type NewCruiseEnquiry = Omit<CruiseEnquiry, "id" | "status" | "submittedAt">;

type StoredEnquiry = Partial<Record<keyof NewCruiseEnquiry, unknown>> & {
  status?: unknown;
  submittedAt?: Timestamp | null;
};

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const count = (value: unknown, fallback = 0) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const timelineValue = (value: unknown): BookingTimeline =>
  BOOKING_TIMELINES.includes(value as BookingTimeline) ? (value as BookingTimeline) : "unsure";

const cabinValue = (value: unknown): CabinType =>
  CABIN_TYPES.includes(value as CabinType) ? (value as CabinType) : "any";

const statusValue = (value: unknown): CruiseEnquiryStatus =>
  value === "contacted" || value === "quoted" || value === "converted" || value === "closed"
    ? value
    : "new";

const mapEnquiry = (id: string, data: StoredEnquiry): CruiseEnquiry => ({
  id,
  name: text(data.name),
  email: text(data.email),
  phone: text(data.phone),
  cruiseId: text(data.cruiseId),
  cruiseName: text(data.cruiseName),
  rooms: count(data.rooms, 1),
  adults: count(data.adults, 2),
  children: count(data.children),
  infants: count(data.infants),
  bookingTimeline: timelineValue(data.bookingTimeline),
  sailDate: text(data.sailDate),
  nights: count(data.nights),
  cabinType: cabinValue(data.cabinType),
  budgetPerPerson: count(data.budgetPerPerson),
  specialOccasion: data.specialOccasion === true,
  flightBooked: data.flightBooked === true,
  notes: text(data.notes),
  status: statusValue(data.status),
  submittedAt:
    data.submittedAt && typeof data.submittedAt.toDate === "function"
      ? data.submittedAt.toDate()
      : null,
});

/* Clamped here as well as in the form, because this is an unauthenticated
   write path — the rules cap the same values from the other side. */
export async function saveCruiseEnquiry(enquiry: NewCruiseEnquiry) {
  await addDoc(collection(getFirebaseDb(), "cruiseEnquiries"), {
    name: enquiry.name.trim(),
    email: enquiry.email.trim().toLowerCase(),
    phone: enquiry.phone.trim(),
    cruiseId: enquiry.cruiseId.trim().slice(0, 180),
    cruiseName: enquiry.cruiseName.trim().slice(0, 240),
    rooms: Math.min(20, Math.max(1, Math.round(enquiry.rooms))),
    adults: Math.min(60, Math.max(1, Math.round(enquiry.adults))),
    children: Math.min(60, Math.max(0, Math.round(enquiry.children))),
    infants: Math.min(60, Math.max(0, Math.round(enquiry.infants))),
    bookingTimeline: enquiry.bookingTimeline,
    sailDate: enquiry.sailDate,
    nights: Math.min(365, Math.max(0, Math.round(enquiry.nights))),
    cabinType: enquiry.cabinType,
    budgetPerPerson: Math.min(100000000, Math.max(0, Math.round(enquiry.budgetPerPerson))),
    specialOccasion: enquiry.specialOccasion === true,
    flightBooked: enquiry.flightBooked === true,
    notes: enquiry.notes.trim().slice(0, 5000),
    status: "new",
    submittedAt: serverTimestamp(),
  });
}

export function subscribeToCruiseEnquiries(
  onEnquiries: (enquiries: CruiseEnquiry[]) => void,
  onError: (message: string) => void,
) {
  return onSnapshot(
    collection(getFirebaseDb(), "cruiseEnquiries"),
    (snapshot) => {
      onEnquiries(
        snapshot.docs
          .map((item) => mapEnquiry(item.id, item.data() as StoredEnquiry))
          .sort((a, b) => (b.submittedAt?.getTime() ?? 0) - (a.submittedAt?.getTime() ?? 0)),
      );
    },
    (error) =>
      onError(
        error instanceof FirebaseError && error.code === "permission-denied"
          ? "This CRM account is not authorized to view cruise enquiries."
          : error.message || "Cruise enquiries could not be loaded.",
      ),
  );
}

export async function updateCruiseEnquiryStatus(enquiryId: string, status: CruiseEnquiryStatus) {
  await updateDoc(doc(getFirebaseDb(), "cruiseEnquiries", enquiryId), { status });
}

export async function deleteCruiseEnquiry(enquiryId: string) {
  await deleteDoc(doc(getFirebaseDb(), "cruiseEnquiries", enquiryId));
}

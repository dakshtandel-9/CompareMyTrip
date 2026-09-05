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

/* Leads captured by the timed pop-up form. Deliberately its own collection
   rather than another `source` on contactEnquiries: the shape is different
   (destinations are a list, and departure type / food / budget have no
   counterpart there), and the travel desk works this inbox on its own. */

export type PopupLeadStatus = "new" | "contacted" | "quoted" | "converted" | "closed";

export const DEPARTURE_TYPES = ["group", "fixed", "couple", "family", "private", "custom"] as const;
export type DepartureType = (typeof DEPARTURE_TYPES)[number];

export const FOOD_PREFERENCES = ["veg", "non_veg", "both", "jain", "vegan"] as const;
export type FoodPreference = (typeof FOOD_PREFERENCES)[number];

/** Labels for the CRM and the form's own dropdowns, so the two never drift. */
export const DEPARTURE_TYPE_LABELS: Record<DepartureType, string> = {
  group: "Group",
  fixed: "Fixed departure",
  couple: "Couple",
  family: "Family",
  private: "Private",
  custom: "Custom",
};

export const FOOD_PREFERENCE_LABELS: Record<FoodPreference, string> = {
  veg: "Veg",
  non_veg: "Non-veg",
  both: "Both",
  jain: "Jain",
  vegan: "Vegan",
};

export const POPUP_LEAD_STATUS_LABELS: Record<PopupLeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  quoted: "Quoted",
  converted: "Converted",
  closed: "Closed",
};

export type PopupLead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  /** One or more places the visitor picked. */
  destinations: string[];
  departureType: DepartureType;
  foodPreference: FoodPreference;
  /** ISO yyyy-mm-dd, or "" when the visitor left it blank. */
  travelDate: string;
  travellers: number;
  /** Budget per person in rupees; 0 means "not stated". */
  budgetPerPerson: number;
  /** Where on the site the pop-up fired. */
  pagePath: string;
  status: PopupLeadStatus;
  submittedAt: Date | null;
};

export type NewPopupLead = Omit<PopupLead, "id" | "status" | "submittedAt">;

type StoredLead = Partial<Record<keyof NewPopupLead, unknown>> & {
  status?: unknown;
  submittedAt?: Timestamp | null;
};

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const count = (value: unknown, fallback = 0) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const departureValue = (value: unknown): DepartureType =>
  DEPARTURE_TYPES.includes(value as DepartureType) ? (value as DepartureType) : "custom";

const foodValue = (value: unknown): FoodPreference =>
  FOOD_PREFERENCES.includes(value as FoodPreference) ? (value as FoodPreference) : "both";

const statusValue = (value: unknown): PopupLeadStatus =>
  value === "contacted" || value === "quoted" || value === "converted" || value === "closed"
    ? value
    : "new";

const mapLead = (id: string, data: StoredLead): PopupLead => ({
  id,
  name: text(data.name),
  email: text(data.email),
  phone: text(data.phone),
  destinations: Array.isArray(data.destinations)
    ? data.destinations.map(text).filter(Boolean)
    : [],
  departureType: departureValue(data.departureType),
  foodPreference: foodValue(data.foodPreference),
  travelDate: text(data.travelDate),
  travellers: count(data.travellers, 1),
  budgetPerPerson: count(data.budgetPerPerson),
  pagePath: text(data.pagePath),
  status: statusValue(data.status),
  submittedAt:
    data.submittedAt && typeof data.submittedAt.toDate === "function"
      ? data.submittedAt.toDate()
      : null,
});

export async function savePopupLead(lead: NewPopupLead) {
  await addDoc(collection(getFirebaseDb(), "popupLeads"), {
    name: lead.name.trim(),
    email: lead.email.trim().toLowerCase(),
    phone: lead.phone.trim(),
    destinations: lead.destinations.map((value) => value.trim()).filter(Boolean).slice(0, 12),
    departureType: lead.departureType,
    foodPreference: lead.foodPreference,
    travelDate: lead.travelDate,
    travellers: Math.min(60, Math.max(1, Math.round(lead.travellers))),
    budgetPerPerson: Math.min(100000000, Math.max(0, Math.round(lead.budgetPerPerson))),
    pagePath: lead.pagePath.slice(0, 300),
    status: "new",
    submittedAt: serverTimestamp(),
  });
}

export function subscribeToPopupLeads(
  onLeads: (leads: PopupLead[]) => void,
  onError: (message: string) => void,
) {
  return onSnapshot(
    collection(getFirebaseDb(), "popupLeads"),
    (snapshot) => {
      onLeads(
        snapshot.docs
          .map((leadDocument) => mapLead(leadDocument.id, leadDocument.data() as StoredLead))
          .sort((a, b) => (b.submittedAt?.getTime() ?? 0) - (a.submittedAt?.getTime() ?? 0)),
      );
    },
    (error) =>
      onError(
        error instanceof FirebaseError && error.code === "permission-denied"
          ? "This CRM account is not authorized to view pop-up form leads."
          : error.message || "Pop-up form leads could not be loaded.",
      ),
  );
}

export async function updatePopupLeadStatus(leadId: string, status: PopupLeadStatus) {
  await updateDoc(doc(getFirebaseDb(), "popupLeads", leadId), { status });
}

export async function deletePopupLead(leadId: string) {
  await deleteDoc(doc(getFirebaseDb(), "popupLeads", leadId));
}

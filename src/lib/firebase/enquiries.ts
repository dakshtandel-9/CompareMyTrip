import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { getFirebaseDb } from "./client";

export type EnquiryStatus = "not_contacted" | "contacted" | "under_review" | "accepted" | "rejected" | "completed";

export type ContactEnquiry = {
  id: string;
  name: string;
  email: string;
  phone: string;
  destination: string;
  departure: string;
  travellers: string;
  message: string;
  packageId: string;
  packageTitle: string;
  pricePerPerson: number;
  userId: string;
  source: string;
  status: EnquiryStatus;
  submittedAt: Date | null;
  quoteExpiresAt?: Date | null;
};

type NewEnquiry = Omit<ContactEnquiry, "id" | "status" | "submittedAt" | "packageId" | "packageTitle" | "pricePerPerson" | "userId" | "source"> &
  Partial<Pick<ContactEnquiry, "packageId" | "packageTitle" | "pricePerPerson" | "userId" | "source">>;
type StoredEnquiry = Partial<Omit<NewEnquiry, "quoteExpiresAt">> & {
  status?: unknown;
  submittedAt?: Timestamp | null;
  quoteExpiresAt?: Timestamp | null;
};

const text = (value: unknown) => typeof value === "string" ? value.trim() : "";

const statusValue = (value: unknown): EnquiryStatus => {
  if (value === "contacted" || value === "under_review" || value === "accepted" || value === "rejected" || value === "completed") return value;
  return "not_contacted";
};

const mapEnquiry = (id: string, data: StoredEnquiry): ContactEnquiry => {
  const source = text(data.source) || "contact";
  const storedStatus = statusValue(data.status);
  return {
    id,
    quoteExpiresAt: data.quoteExpiresAt?.toDate?.() ?? null,
    name: text(data.name),
    email: text(data.email),
    phone: text(data.phone),
    destination: text(data.destination),
    departure: text(data.departure),
    travellers: text(data.travellers),
    message: text(data.message),
    packageId: text(data.packageId),
    packageTitle: text(data.packageTitle),
    pricePerPerson: typeof data.pricePerPerson === "number" && Number.isFinite(data.pricePerPerson) ? data.pricePerPerson : 0,
    userId: text(data.userId),
    source,
    status: source === "custom_quote" && (storedStatus === "not_contacted" || storedStatus === "contacted")
      ? storedStatus === "contacted" ? "accepted" : "under_review"
      : storedStatus,
    submittedAt: data.submittedAt && typeof data.submittedAt.toDate === "function" ? data.submittedAt.toDate() : null,
  };
};

export async function saveContactEnquiry(enquiry: NewEnquiry) {
  const source = enquiry.source?.trim() || "contact";
  const userId = enquiry.userId?.trim() ?? "";
  if (source === "custom_quote" && !userId) throw new Error("Sign in before sending a customized quote request.");
  await addDoc(collection(getFirebaseDb(), "contactEnquiries"), {
    name: enquiry.name.trim(),
    email: enquiry.email.trim().toLowerCase(),
    phone: enquiry.phone.trim(),
    destination: enquiry.destination.trim(),
    departure: enquiry.departure.trim(),
    travellers: enquiry.travellers.trim(),
    message: enquiry.message.trim(),
    packageId: enquiry.packageId?.trim() ?? "",
    packageTitle: enquiry.packageTitle?.trim() ?? "",
    pricePerPerson: Math.max(0, enquiry.pricePerPerson ?? 0),
    userId,
    source,
    status: source === "custom_quote" ? "under_review" : "not_contacted",
    submittedAt: serverTimestamp(),
  });
}

export function subscribeToContactEnquiries(
  onEnquiries: (enquiries: ContactEnquiry[]) => void,
  onError: (message: string) => void,
) {
  return onSnapshot(
    collection(getFirebaseDb(), "contactEnquiries"),
    (snapshot) => {
      const enquiries = snapshot.docs
        .map((enquiryDocument) => mapEnquiry(enquiryDocument.id, enquiryDocument.data() as StoredEnquiry))
        .sort((a, b) => (b.submittedAt?.getTime() ?? 0) - (a.submittedAt?.getTime() ?? 0));
      onEnquiries(enquiries);
    },
    (error) => onError(
      error instanceof FirebaseError && error.code === "permission-denied"
        ? "This CRM account is not authorized to view contact enquiries."
        : error.message || "Contact enquiries could not be loaded.",
    ),
  );
}

export function subscribeToUserQuoteEnquiries(
  userId: string,
  onEnquiries: (enquiries: ContactEnquiry[]) => void,
  onError: (message: string) => void,
) {
  return onSnapshot(
    query(collection(getFirebaseDb(), "contactEnquiries"), where("userId", "==", userId)),
    (snapshot) => {
      const enquiries = snapshot.docs
        .map((enquiryDocument) => mapEnquiry(enquiryDocument.id, enquiryDocument.data() as StoredEnquiry))
        .filter((enquiry) => enquiry.source === "custom_quote")
        .sort((a, b) => (b.submittedAt?.getTime() ?? 0) - (a.submittedAt?.getTime() ?? 0));
      onEnquiries(enquiries);
    },
    (error) => onError(error.message || "Your customized quote requests could not be loaded."),
  );
}

export async function updateEnquiryStatus(enquiryId: string, status: EnquiryStatus) {
  await updateDoc(doc(getFirebaseDb(), "contactEnquiries", enquiryId), { status });
}

export async function deleteContactEnquiry(enquiryId: string) {
  await deleteDoc(doc(getFirebaseDb(), "contactEnquiries", enquiryId));
}

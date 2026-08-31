import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Timestamp,
} from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { getFirebaseDb } from "./client";

export type NewsletterSubscriber = {
  id: string;
  email: string;
  subscribedAt: Date | null;
};

type StoredSubscriber = {
  email?: unknown;
  subscribedAt?: Timestamp | null;
};

export async function saveNewsletterSubscription(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  await setDoc(doc(getFirebaseDb(), "newsletterSubscribers", encodeURIComponent(normalizedEmail)), {
    email: normalizedEmail,
    subscribedAt: serverTimestamp(),
  });
}

export async function deleteNewsletterSubscriber(subscriberId: string) {
  await deleteDoc(doc(getFirebaseDb(), "newsletterSubscribers", subscriberId));
}

export function subscribeToNewsletterSubscribers(
  onSubscribers: (subscribers: NewsletterSubscriber[]) => void,
  onError: (message: string) => void,
) {
  return onSnapshot(
    collection(getFirebaseDb(), "newsletterSubscribers"),
    (snapshot) => {
      const subscribers = snapshot.docs
        .map((subscriberDocument) => {
          const data = subscriberDocument.data() as StoredSubscriber;
          return {
            id: subscriberDocument.id,
            email: typeof data.email === "string" ? data.email : "",
            subscribedAt:
              data.subscribedAt && typeof data.subscribedAt.toDate === "function"
                ? data.subscribedAt.toDate()
                : null,
          } satisfies NewsletterSubscriber;
        })
        .sort((a, b) => (b.subscribedAt?.getTime() ?? 0) - (a.subscribedAt?.getTime() ?? 0));
      onSubscribers(subscribers);
    },
    (error) =>
      onError(
        error instanceof FirebaseError && error.code === "permission-denied"
          ? "This CRM account is not authorized to view newsletter subscribers."
          : error.message || "Newsletter subscribers could not be loaded.",
      ),
  );
}

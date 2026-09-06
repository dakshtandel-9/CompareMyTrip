"use client";

/* ------------------------------------------------------------------ */
/* The reviews pulled from Google, live from Firestore.                 */
/*                                                                      */
/* A second listener rather than part of siteContent/homepage, because  */
/* the two documents have different writers: the CRM publishes the      */
/* homepage, the sync job publishes this one. Keeping them apart is     */
/* what stops a sync from overwriting hand-written reviews and a CRM    */
/* save from wiping synced ones.                                        */
/*                                                                      */
/* An empty list is the answer to every failure here — a homepage that  */
/* renders its own reviews is a better outcome than one that breaks     */
/* because Google is unreachable.                                       */
/* ------------------------------------------------------------------ */

import { useSyncExternalStore } from "react";
import { doc, onSnapshot } from "firebase/firestore";

import { getFirebaseDb } from "@/lib/firebase/client";
import { GOOGLE_REVIEWS_DOC } from "@/lib/googleBusiness";
import type { Review } from "@/lib/siteContent";

const EMPTY: Review[] = [];

/* Deliberately not normalizeSiteContent(): its list helper treats an empty
   array as "nothing was published" and substitutes the shipped defaults,
   which is right for a homepage that has never been edited and quite wrong
   here — a profile with no reviews yet would render the sample travellers
   as though Google had returned them. */
function normalize(raw: unknown[]): Review[] {
  const reviews: Review[] = [];

  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null) continue;
    const item = entry as Record<string, unknown>;

    const quote = typeof item.quote === "string" ? item.quote : "";
    const name = typeof item.name === "string" ? item.name : "";
    const rating = typeof item.rating === "number" ? item.rating : 0;
    if (!quote || !name || rating < 1 || rating > 5) continue;

    reviews.push({
      id: typeof item.id === "string" && item.id ? item.id : `google-${reviews.length}`,
      quote,
      name,
      initials: typeof item.initials === "string" ? item.initials.slice(0, 3) : "",
      avatar: typeof item.avatar === "string" ? item.avatar : "",
      trip: typeof item.trip === "string" ? item.trip : "",
      travelled: typeof item.travelled === "string" ? item.travelled : "",
      rating: Math.round(rating),
    });
  }

  return reviews;
}

let current: Review[] = EMPTY;
let stop: (() => void) | undefined;
const listeners = new Set<() => void>();

function emit(next: Review[]) {
  current = next;
  listeners.forEach((listener) => listener());
}

function start() {
  if (stop) return;

  stop = onSnapshot(
    doc(getFirebaseDb(), GOOGLE_REVIEWS_DOC.collection, GOOGLE_REVIEWS_DOC.id),
    (snapshot) => {
      const stored = snapshot.data() as { items?: unknown } | undefined;
      if (!snapshot.exists() || !Array.isArray(stored?.items)) return emit(EMPTY);

      emit(normalize(stored.items));
    },
    (error) => {
      console.error("Unable to load Google reviews from Firestore", error);
      emit(EMPTY);
    },
  );
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  start();

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      stop?.();
      stop = undefined;
    }
  };
}

export function useGoogleReviews(): Review[] {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => EMPTY,
  );
}

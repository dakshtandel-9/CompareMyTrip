"use client";

import { useSyncExternalStore } from "react";

import { subscribeToHomepageContent } from "@/lib/firebase/homepageContent";
import { DEFAULT_SITE_CONTENT, type SiteContent } from "@/lib/siteContent";

export type SiteContentState = {
  content: SiteContent;
  loading: boolean;
  error: string;
  exists: boolean;
};

const SERVER_STATE: SiteContentState = {
  content: DEFAULT_SITE_CONTENT,
  loading: true,
  error: "",
  exists: false,
};

let currentState = SERVER_STATE;
let stopFirestoreListener: (() => void) | undefined;
const listeners = new Set<() => void>();

function emit(next: SiteContentState) {
  currentState = next;
  listeners.forEach((listener) => listener());
}

/* All homepage sections share this one Firestore listener. This keeps the
   document live across the page without opening a separate connection for
   every section component. */
function startFirestoreListener() {
  if (stopFirestoreListener) return;

  stopFirestoreListener = subscribeToHomepageContent(
    (content, exists) => emit({ content, loading: false, error: "", exists }),
    (error) =>
      emit({ content: DEFAULT_SITE_CONTENT, loading: false, error, exists: false }),
  );
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  startFirestoreListener();

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      stopFirestoreListener?.();
      stopFirestoreListener = undefined;
    }
  };
}

const getSnapshot = () => currentState;
const getServerSnapshot = () => SERVER_STATE;

export function useSiteContentState(): SiteContentState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useSiteContent(): SiteContent {
  return useSiteContentState().content;
}

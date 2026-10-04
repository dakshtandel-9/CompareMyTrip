"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

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

/* The root layout provides the published document from the server, so
   public pages paint with it and never open Firestore for it. Admin screens
   edit the live document and reset this to null (LiveSiteContent), which
   puts them back on the shared listener below. */
export const SiteContentContext = createContext<SiteContentState | null>(null);

let currentState = SERVER_STATE;
let stopFirestoreListener: (() => void) | undefined;
const listeners = new Set<() => void>();

function emit(next: SiteContentState) {
  currentState = next;
  listeners.forEach((listener) => listener());
}

const failClosed = (error: string) =>
  emit({ ...currentState, content: currentState.loading
    ? { ...DEFAULT_SITE_CONTENT, comingSoon: { ...DEFAULT_SITE_CONTENT.comingSoon, enabled: true } }
    : currentState.content, loading: false, error });

/* All sections share this one Firestore listener. This keeps the document
   live across the page without opening a separate connection for every
   section component. Imported on demand so the Firestore SDK only reaches
   pages that need the live document. */
function startFirestoreListener() {
  if (stopFirestoreListener) return;

  let stopped = false;
  let stop: (() => void) | undefined;
  stopFirestoreListener = () => {
    stopped = true;
    stop?.();
  };
  import("@/lib/firebase/homepageContent")
    .then(({ subscribeToHomepageContent }) => {
      if (stopped) return;
      stop = subscribeToHomepageContent(
        (content, exists) => emit({ content, loading: false, error: "", exists }),
        failClosed,
      );
    })
    .catch(() => {
      if (!stopped) failClosed("Could not connect to the homepage content database.");
    });
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

const noSubscription = () => () => {};
const getSnapshot = () => currentState;
const getServerSnapshot = () => SERVER_STATE;

export function useSiteContentState(): SiteContentState {
  const initial = useContext(SiteContentContext);
  return useSyncExternalStore(initial ? noSubscription : subscribe,
    () => initial ?? getSnapshot(),
    () => initial ?? getServerSnapshot());
}

export function useSiteContent(): SiteContent {
  return useSiteContentState().content;
}

"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";

import { DEFAULT_SITE_CONTENT, type SiteContent } from "@/lib/siteContent";

export type SiteContentState = {
  content: SiteContent;
  loading: boolean;
  error: string;
  exists: boolean;
  /** The sections the server published into this page. Any other section
      holds its default, so a component that reads one shows stale copy. */
  sections?: readonly (keyof SiteContent)[];
};

const SERVER_STATE: SiteContentState = {
  content: DEFAULT_SITE_CONTENT,
  loading: true,
  error: "",
  exists: false,
};

/* The root layout and each page provide the published sections from the
   server, so public pages paint with them and never open Firestore. Admin screens
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

/* Development only: name the section a page forgot to request, rather than
   letting it quietly render the default copy until someone notices. */
function warnOnUnpublishedSections(state: SiteContentState, sections: readonly (keyof SiteContent)[]): SiteContentState {
  const content = new Proxy(state.content, {
    get(target, key, receiver) {
      if (typeof key === "string" && key in target && !sections.includes(key as keyof SiteContent)) {
        console.error(`Site content "${key}" was not published into this page, so it shows its default. Add it to the page's <PageSiteContent sections>.`);
      }
      return Reflect.get(target, key, receiver);
    },
  });
  return { ...state, content };
}

export function useSiteContentState(): SiteContentState {
  const initial = useContext(SiteContentContext);
  const state = useSyncExternalStore(initial ? noSubscription : subscribe,
    () => initial ?? getSnapshot(),
    () => initial ?? getServerSnapshot());
  const sections = initial?.sections;
  return useMemo(() => process.env.NODE_ENV !== "production" && sections
    ? warnOnUnpublishedSections(state, sections)
    : state, [state, sections]);
}

export function useSiteContent(): SiteContent {
  return useSiteContentState().content;
}

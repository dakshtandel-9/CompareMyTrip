"use client";

import { useCallback, useEffect, useState } from "react";

/* ------------------------------------------------------------------ */
/* The comparison tray, shared by every page.                           */
/*                                                                       */
/* Three fixed slots. Picking a package fills the first empty one; once  */
/* all three are full the picks wrap round — slot 1, then 2, then 3,     */
/* then back over slot 1 — so a fourth pick always replaces the oldest   */
/* choice rather than being silently dropped. Picking a package that is  */
/* already in the tray takes it out and leaves that slot empty until     */
/* something else is chosen for it.                                      */
/*                                                                       */
/* Held in localStorage so the catalogue and the homepage comparison see */
/* the same tray, with a window event for same-tab listeners and the     */
/* native storage event for other tabs — the same pattern the admin      */
/* package store already uses.                                          */
/* ------------------------------------------------------------------ */

export const COMPARE_SLOTS = 3;
export const COMPARE_STORAGE_KEY = "comparemytrip-compare";
export const COMPARE_UPDATE_EVENT = "comparemytrip-compare-updated";

/* What the tray holds before anyone has touched it, so the homepage
   comparison opens on a real, populated table rather than three holes. */
export const DEFAULT_COMPARE_IDS = [
  "dummy-kerala-backwaters",
  "dummy-dharamshala-break",
  "dummy-goa-island-cruise",
];

export type CompareState = {
  /** One entry per slot; null is an empty slot waiting to be filled. */
  slots: (string | null)[];
  /** The slot the next pick overwrites once every slot is full. */
  cursor: number;
};

const initialState = (): CompareState => ({
  slots: [...DEFAULT_COMPARE_IDS],
  cursor: 0,
});

function normalise(value: unknown): CompareState {
  const parsed = (value ?? {}) as Partial<CompareState>;

  const slots = Array.isArray(parsed.slots) ? parsed.slots.slice(0, COMPARE_SLOTS) : [];
  while (slots.length < COMPARE_SLOTS) slots.push(null);

  const cursor = Number.isInteger(parsed.cursor)
    ? (((parsed.cursor as number) % COMPARE_SLOTS) + COMPARE_SLOTS) % COMPARE_SLOTS
    : 0;

  return {
    slots: slots.map((slot) => (typeof slot === "string" && slot ? slot : null)),
    cursor,
  };
}

export function readCompare(): CompareState {
  if (typeof window === "undefined") return initialState();

  try {
    const stored = window.localStorage.getItem(COMPARE_STORAGE_KEY);
    return stored ? normalise(JSON.parse(stored)) : initialState();
  } catch {
    return initialState();
  }
}

function writeCompare(state: CompareState) {
  try {
    window.localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* Private browsing and full quotas still get a working tray for the
       life of the page — the event below keeps this tab in sync. */
  }

  window.dispatchEvent(new Event(COMPARE_UPDATE_EVENT));
}

export function useCompare() {
  /* Starts on the default tray so the server render and the first client
     render agree; the effect then swaps in whatever localStorage holds. */
  const [state, setState] = useState<CompareState>(initialState);

  useEffect(() => {
    const refresh = () => setState(readCompare());
    const handleStorage = (event: StorageEvent) => {
      if (event.key === COMPARE_STORAGE_KEY) refresh();
    };

    refresh();
    window.addEventListener(COMPARE_UPDATE_EVENT, refresh);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(COMPARE_UPDATE_EVENT, refresh);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  /* Every mutation re-reads storage first: several cards are mounted at
     once, and stale closures would otherwise undo each other's picks. */
  const commit = useCallback((update: (current: CompareState) => CompareState) => {
    const next = update(readCompare());
    writeCompare(next);
    setState(next);
  }, []);

  const toggle = useCallback(
    (packageId: string) =>
      commit((current) => {
        const held = current.slots.indexOf(packageId);

        if (held !== -1) {
          const slots = [...current.slots];
          slots[held] = null;
          /* The freed slot is the one the next pick should land in. */
          return { slots, cursor: held };
        }

        const empty = current.slots.indexOf(null);
        const target = empty === -1 ? current.cursor : empty;
        const slots = [...current.slots];
        slots[target] = packageId;

        return { slots, cursor: (target + 1) % COMPARE_SLOTS };
      }),
    [commit],
  );

  /* Used by the comparison's own column picker, which names its slot. */
  const setSlot = useCallback(
    (index: number, packageId: string | null) =>
      commit((current) => {
        const slots = current.slots.map((slot, position) => {
          if (position === index) return packageId;
          /* A package never sits in two slots at once. */
          return slot === packageId ? null : slot;
        });

        return {
          slots,
          cursor: packageId ? (index + 1) % COMPARE_SLOTS : index,
        };
      }),
    [commit],
  );

  const isCompared = useCallback(
    (packageId: string) => state.slots.includes(packageId),
    [state.slots],
  );

  return {
    slots: state.slots,
    count: state.slots.filter(Boolean).length,
    toggle,
    setSlot,
    isCompared,
  };
}

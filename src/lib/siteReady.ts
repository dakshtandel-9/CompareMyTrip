/* "The page has finished loading", for anything that must not interrupt a
   visitor during their first load — the trip prompt's timer. Marked by
   SiteReadySignal in the root layout. Module state, so every importer shares
   it for the life of the document; client navigation never re-arms it. */

let ready = false;
const readyListeners = new Set<() => void>();

export function markSiteReady() {
  if (ready) return;
  ready = true;
  readyListeners.forEach((listener) => listener());
  readyListeners.clear();
}

/** Runs now if the page has already loaded, otherwise once it does. */
export function onSiteReady(listener: () => void): () => void {
  if (ready) {
    listener();
    return () => {};
  }
  readyListeners.add(listener);
  return () => readyListeners.delete(listener);
}

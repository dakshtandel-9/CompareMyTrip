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

/* "The hero clip no longer needs the connection" — it has downloaded,
   failed, or is not coming. Below-the-fold photos wait for this before
   loading ahead of the visitor, so they never slow the clip down. Marked by
   the homepage hero. If nothing marks it (hero switched off, or a slow line
   still downloading), listeners run a few seconds after the page loads. */

const HERO_FALLBACK_MS = 8000;
let heroSettled = false;
const heroListeners = new Set<() => void>();

export function markHeroSettled() {
  if (heroSettled) return;
  heroSettled = true;
  heroListeners.forEach((listener) => listener());
  heroListeners.clear();
}

/** Runs now if the hero clip has settled, otherwise once it does. */
export function onHeroSettled(listener: () => void): () => void {
  if (heroSettled) {
    listener();
    return () => {};
  }
  heroListeners.add(listener);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const stopWaiting = onSiteReady(() => {
    timer = setTimeout(markHeroSettled, HERO_FALLBACK_MS);
  });
  return () => {
    heroListeners.delete(listener);
    stopWaiting();
    clearTimeout(timer);
  };
}

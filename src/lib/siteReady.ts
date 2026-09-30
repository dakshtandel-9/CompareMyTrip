/* One gate for the first-load screen (@/components/WebsiteLoader). The
   document's own load event is not enough on the homepage: the hero video is
   what visitors wait on, so it holds the screen open until it can scrub.
   Anything that must not appear while the screen is up — the trip prompt's
   timer — waits on onSiteReady. Module state, so every importer shares it
   for the life of the document; client navigation never re-arms it. */

let holds = 0;
let ready = false;
const releaseListeners = new Set<() => void>();
const readyListeners = new Set<() => void>();

/** Keeps the loader up until the returned release is called. Safe to call
    more than once; a hold taken after the site is ready does nothing. */
export function holdSiteLoader(): () => void {
  if (ready) return () => {};
  holds++;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    holds--;
    if (holds === 0) releaseListeners.forEach((listener) => listener());
  };
}

export const siteLoaderHeld = () => holds > 0;

/** Fires whenever the last outstanding hold is released. */
export function onSiteLoaderReleased(listener: () => void): () => void {
  releaseListeners.add(listener);
  return () => releaseListeners.delete(listener);
}

export function markSiteReady() {
  if (ready) return;
  ready = true;
  readyListeners.forEach((listener) => listener());
  readyListeners.clear();
  releaseListeners.clear();
}

/** Runs now if the loader has already lifted, otherwise once it does. */
export function onSiteReady(listener: () => void): () => void {
  if (ready) {
    listener();
    return () => {};
  }
  readyListeners.add(listener);
  return () => readyListeners.delete(listener);
}

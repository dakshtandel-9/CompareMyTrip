type ScrollLockOptions = { root?: boolean };

let phoneLocks = 0;
let restorePhoneScroll: (() => void) | undefined;

/** Phone overlays share a lock, so closing one cannot strand another's lock. */
export function lockPageScroll({ root: lockRoot = false }: ScrollLockOptions = {}) {
  const root = document.documentElement;
  const body = document.body;
  const phone = window.matchMedia("(max-width: 767px)").matches;

  const acquire = (includeRoot: boolean) => {
    const bodyOverflow = body.style.overflow;
    const rootOverflow = root.style.overflow;
    const overscroll = root.style.overscrollBehavior;
    body.style.overflow = "hidden";
    if (includeRoot) {
      root.style.overflow = "hidden";
      root.style.overscrollBehavior = "none";
    }
    return () => {
      body.style.overflow = bodyOverflow;
      if (includeRoot) {
        root.style.overflow = rootOverflow;
        root.style.overscrollBehavior = overscroll;
      }
    };
  };

  // Keep the existing desktop overlay behavior.
  if (!phone && phoneLocks === 0) return acquire(lockRoot);

  if (phoneLocks === 0) restorePhoneScroll = acquire(true);
  phoneLocks++;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    phoneLocks--;
    if (phoneLocks === 0) {
      restorePhoneScroll?.();
      restorePhoneScroll = undefined;
    }
  };
}

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

  if (phoneLocks === 0) {
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const bodyStyles = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    const rootOverflow = root.style.overflow;
    const overscroll = root.style.overscrollBehavior;

    // Overflow alone still allows the background to move on touch browsers.
    // Fix it at its current offset, without creating a horizontal scroll box.
    Object.assign(body.style, {
      position: "fixed",
      top: `${-scrollY}px`,
      left: "0",
      right: "0",
      width: "100vw",
      overflow: "clip",
    });
    root.style.overflow = "hidden";
    root.style.overscrollBehavior = "none";

    restorePhoneScroll = () => {
      Object.assign(body.style, bodyStyles);
      root.style.overflow = rootOverflow;
      root.style.overscrollBehavior = overscroll;
      window.scrollTo({ left: scrollX, top: scrollY, behavior: "instant" });
    };
  }
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

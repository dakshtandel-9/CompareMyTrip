type ScrollLockOptions = { root?: boolean };

type ScrollLockState = {
  count: number;
  rootCount: number;
  fixed: boolean;
  scrollX: number;
  scrollY: number;
  bodyStyles: Pick<CSSStyleDeclaration, "position" | "top" | "left" | "right" | "width" | "overflow">;
  rootOverflow: string;
  rootOverscroll: string;
};

let activeLock: ScrollLockState | undefined;

/** Overlays share the original page styles, regardless of close order or width. */
export function lockPageScroll({ root: lockRoot = false }: ScrollLockOptions = {}) {
  const root = document.documentElement;
  const body = document.body;
  const phone = window.matchMedia("(max-width: 767px)").matches;

  if (!activeLock) {
    activeLock = {
      count: 0,
      rootCount: 0,
      fixed: false,
      scrollX: 0,
      scrollY: 0,
      bodyStyles: {
        position: body.style.position,
        top: body.style.top,
        left: body.style.left,
        right: body.style.right,
        width: body.style.width,
        overflow: body.style.overflow,
      },
      rootOverflow: root.style.overflow,
      rootOverscroll: root.style.overscrollBehavior,
    };
  }
  const state = activeLock;
  state.count++;
  if (lockRoot) state.rootCount++;

  if (phone && !state.fixed) {
    // Overflow alone still allows the background to move on touch browsers.
    // A phone overlay can join a desktop lock after a resize. Keep the first
    // lock's clean styles, then hold this position until every overlay closes.
    state.fixed = true;
    state.scrollX = window.scrollX;
    state.scrollY = window.scrollY;
    Object.assign(body.style, {
      position: "fixed",
      top: `${-state.scrollY}px`,
      left: "0",
      right: "0",
      width: "100vw",
    });
  }

  const applyOverflow = () => {
    body.style.overflow = state.fixed ? "clip" : "hidden";
    const includeRoot = state.fixed || state.rootCount > 0;
    root.style.overflow = includeRoot ? "hidden" : state.rootOverflow;
    root.style.overscrollBehavior = includeRoot ? "none" : state.rootOverscroll;
  };
  applyOverflow();

  let released = false;
  return () => {
    if (released) return;
    released = true;
    state.count--;
    if (lockRoot) state.rootCount--;
    if (state.count > 0) {
      applyOverflow();
      return;
    }

    activeLock = undefined;
    body.style.overflow = state.bodyStyles.overflow;
    root.style.overflow = state.rootOverflow;
    root.style.overscrollBehavior = state.rootOverscroll;
    if (state.fixed) {
      Object.assign(body.style, state.bodyStyles);
      window.scrollTo({ left: state.scrollX, top: state.scrollY, behavior: "instant" });
    }
  };
}

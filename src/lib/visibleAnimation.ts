/** Run decorative rail motion only while visible. Mobile motion is opt-in;
 * every rail respects reduced motion and pauses in background tabs. */
export function startVisibleAnimation(
  element: HTMLElement,
  draw: (now: number, elapsed: number) => void,
  { allowMobile = false }: { allowMobile?: boolean } = {},
) {
  const desktopMotion = "(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)";
  const motion = window.matchMedia(allowMobile
    ? `(prefers-reduced-motion: no-preference) and (max-width: 767px), ${desktopMotion}`
    : desktopMotion);
  let visible = false;
  let frame = 0;
  let last = 0;

  const tick = (now: number) => {
    // Reset after every pause so returning to a tab cannot jump the rail.
    const elapsed = last ? Math.min(64, now - last) : 0;
    last = now;
    draw(now, elapsed);
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    if (visible && !document.hidden && motion.matches) frame = requestAnimationFrame(tick);
  };
  const observer = new IntersectionObserver(([entry]) => {
    visible = Boolean(entry?.isIntersecting);
    sync();
  });
  observer.observe(element);
  document.addEventListener("visibilitychange", sync);
  motion.addEventListener("change", sync);
  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    document.removeEventListener("visibilitychange", sync);
    motion.removeEventListener("change", sync);
  };
}

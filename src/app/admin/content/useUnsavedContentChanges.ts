"use client";

import { useEffect } from "react";

/** Keep a draft safe when an editor follows the admin navigation or reloads. */
export function useUnsavedContentChanges(hasUnsavedChanges: boolean) {
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    const confirmNavigation = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element
        ? event.target.closest<HTMLAnchorElement>("a[href]")
        : null;
      if (!anchor || anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self")) return;

      const destination = new URL(anchor.href, window.location.href);
      // External navigation already triggers beforeunload. Hash links and
      // section buttons stay inside this editor and keep its draft intact.
      if (destination.origin !== window.location.origin) return;
      if (destination.pathname === window.location.pathname && destination.search === window.location.search) return;

      if (!window.confirm("Leave this editor? Your unpublished changes will be lost. Choose Cancel to stay and save your changes first.")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", warnBeforeUnload);
    document.addEventListener("click", confirmNavigation, true);
    return () => {
      window.removeEventListener("beforeunload", warnBeforeUnload);
      document.removeEventListener("click", confirmNavigation, true);
    };
  }, [hasUnsavedChanges]);
}

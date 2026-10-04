"use client";

import { useEffect } from "react";
import { markSiteReady } from "@/lib/siteReady";

/** Marks the site ready once the document has loaded. Renders nothing. */
export default function SiteReadySignal() {
  useEffect(() => {
    if (document.readyState === "complete") {
      markSiteReady();
      return;
    }
    window.addEventListener("load", markSiteReady, { once: true });
    return () => window.removeEventListener("load", markSiteReady);
  }, []);

  return null;
}

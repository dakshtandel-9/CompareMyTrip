"use client";

import BrandLogo from "@/components/BrandLogo";
import { markSiteReady, onSiteLoaderReleased, onSiteReady, siteLoaderHeld } from "@/lib/siteReady";
import { useEffect, useState } from "react";

/* The branded first-load screen. Server-rendered, so it is the very first
   thing painted, and mounted once in the root layout, so it only ever covers
   a hard load or refresh — never client-side navigation.

   It lifts when the document has loaded and nothing holds it (the homepage
   hero holds it until its video can scrub), or after MAX_WAIT_MS regardless:
   a slow network gets the poster frame, never an endless spinner. */

const MAX_WAIT_MS = 8000;
/* Matches the opacity/visibility transition on .cmt-site-loader--leaving. */
const LEAVE_MS = 300;

export default function WebsiteLoader() {
  const [phase, setPhase] = useState<"visible" | "leaving" | "hidden">("visible");

  useEffect(() => {
    let frame = 0;
    /* One frame after the last check, so holds taken by effects in the same
       hydration pass are counted before we decide. */
    const settle = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (document.readyState === "complete" && !siteLoaderHeld()) markSiteReady();
      });
    };

    const cap = window.setTimeout(markSiteReady, MAX_WAIT_MS);
    const stopReleased = onSiteLoaderReleased(settle);
    if (document.readyState === "complete") settle();
    else window.addEventListener("load", settle, { once: true });

    let hideTimer = 0;
    const stopReady = onSiteReady(() => {
      setPhase("leaving");
      hideTimer = window.setTimeout(() => setPhase("hidden"), LEAVE_MS);
    });

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(cap);
      window.clearTimeout(hideTimer);
      window.removeEventListener("load", settle);
      stopReleased();
      stopReady();
    };
  }, []);

  if (phase === "hidden") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading CompareMyTrip"
      aria-busy={phase === "visible"}
      className={`cmt-site-loader ${phase === "leaving" ? "cmt-site-loader--leaving" : ""}`}
    >
      {/* Without JavaScript nothing would ever lift the screen. */}
      <noscript>
        <style>{".cmt-site-loader{display:none}"}</style>
      </noscript>

      <div className="cmt-site-loader__content">
        <BrandLogo className="cmt-site-loader__logo" sizes="(max-width: 372px) 78vw, 290px" fetchPriority="high" />

        <div className="cmt-site-loader__track" aria-hidden="true">
          <span className="cmt-site-loader__progress" />
        </div>

        <p className="cmt-site-loader__label">Preparing your journey…</p>
      </div>
    </div>
  );
}

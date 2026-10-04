"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { onSiteReady } from "@/lib/siteReady";
import { hasSubmittedTripPrompt } from "@/lib/tripPrompt";

/* ------------------------------------------------------------------ */
/* The timed pop-up. It asks a browsing visitor what trip they want and  */
/* files the answer as a lead for the travel desk — it is not a sign-in  */
/* surface. Accounts still exist and still matter (checkout, saved trips,*/
/* quote history), but they live on /login and /signup; a visitor who is */
/* only browsing should not be asked for a password to get a quote.      */
/*                                                                      */
/* It only ever opens by itself on the homepage, a few seconds after the */
/* visitor starts browsing (their first scroll, tap or key press once    */
/* the page has loaded), and at most once per document load: closing it  */
/* lasts until the next refresh. A visitor who has already sent the form */
/* is remembered in localStorage and never prompted again.               */
/*                                                                      */
/* This part is mounted on every page and only decides when to open. The */
/* form, with the catalogue and Firestore code it needs, loads the first */
/* time it opens.                                                        */
/* ------------------------------------------------------------------ */

const TripPlanPromptForm = dynamic(() => import("./TripPlanPromptForm"), { ssr: false });

const HOME_PATH = "/";
const PROMPT_DELAY_MS = 6000;
/* What counts as the visitor starting to browse. */
const ENGAGEMENT_EVENTS = ["scroll", "pointerdown", "keydown"] as const;
/* When the timer lands while the visitor is typing or another modal is up,
   wait this long and look again rather than interrupting them. */
const PROMPT_RETRY_MS = 3000;

/* Lives for the document, not the component: SiteExperience can remount the
   dialog, and neither that nor a trip back to the homepage should re-arm it. */
let promptedThisLoad = false;

const visitorIsBusy = () => {
  const active = document.activeElement;
  return (
    document.querySelector("dialog[open]") !== null ||
    (active instanceof HTMLElement && active.matches("input, textarea, select, [contenteditable='true']"))
  );
};

export default function TripPlanPromptDialog() {
  const pathname = usePathname();

  /* "auto" is the homepage timer; "request" is an explicit open from a
     product action, which is allowed on any page. */
  const [trigger, setTrigger] = useState<"auto" | "request" | null>(null);
  const [formLoaded, setFormLoaded] = useState(false);

  /* The timer starts once the visitor is on the homepage, the page has
     loaded and they have started browsing it, so a page still loading or
     not yet looked at is never covered. It is dropped the moment they
     leave, so it can never fire over another page. */
  useEffect(() => {
    if (pathname !== HOME_PATH || promptedThisLoad || hasSubmittedTripPrompt()) return;

    let timer = 0;
    const attempt = () => {
      if (promptedThisLoad || hasSubmittedTripPrompt()) return;
      if (visitorIsBusy()) {
        timer = window.setTimeout(attempt, PROMPT_RETRY_MS);
        return;
      }
      promptedThisLoad = true;
      setTrigger((current) => current ?? "auto");
    };
    const stopListening = () => ENGAGEMENT_EVENTS.forEach((type) => window.removeEventListener(type, engaged));
    function engaged() {
      stopListening();
      timer = window.setTimeout(attempt, PROMPT_DELAY_MS);
    }
    const stopWaiting = onSiteReady(() => {
      ENGAGEMENT_EVENTS.forEach((type) => window.addEventListener(type, engaged, { passive: true }));
    });
    return () => {
      stopWaiting();
      stopListening();
      window.clearTimeout(timer);
    };
  }, [pathname]);

  /* Product actions can open this same form immediately, so there is one
     enquiry experience across the site. */
  useEffect(() => {
    const handleRequest = () => setTrigger("request");
    window.addEventListener("cmt:open-trip-prompt", handleRequest);
    return () => window.removeEventListener("cmt:open-trip-prompt", handleRequest);
  }, []);

  /* Leaving the homepage (e.g. the back button) takes the timed prompt with
     it, and it does not come back on return. */
  if (trigger === "auto" && pathname !== HOME_PATH) setTrigger(null);

  const open = trigger !== null;
  if (open && !formLoaded) setFormLoaded(true);
  if (!formLoaded) return null;

  return <TripPlanPromptForm open={open} onClosed={() => setTrigger(null)} />;
}

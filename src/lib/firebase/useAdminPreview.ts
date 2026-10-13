"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { ADMIN_PREVIEW_SESSION_PATH } from "@/lib/adminPreview";
import { useAuthUser } from "./useAuthUser";

type PreviewStatus = "checking" | "authorized" | "denied";
type PreviewCheck = { user: User | null; status: PreviewStatus };

// Serialize cookie writes across token refreshes and account switches, so an
// older sign-in cannot finish after the sign-out that clears it.
let sessionQueue: Promise<void> = Promise.resolve();
// Whether this tab was issued a preview cookie, so signing out clears it
// without every signed-out visitor calling the server on the off chance.
let previewCookieIssued = false;

/* Whether the signed-in account is a verified admin, for coming-soon mode and
   to spare admins the customer prompts. Checked when the account or its token
   changes, not on every page: each check is a server call, and since the
   coming-soon middleware went nothing reads the preview cookie on a request.
   Signed-out visitors are never checked; signing out clears the cookie. */
export function useAdminPreview() {
  const user = useAuthUser();
  const [check, setCheck] = useState<PreviewCheck | null>(null);

  useEffect(() => {
    let active = true;
    let generation = 0;
    let unsubscribe: (() => void) | undefined;
    if (user === undefined) return;
    if (user === null) {
      sessionQueue = sessionQueue.catch(() => {}).then(async () => {
        if (!active || !previewCookieIssued) return;
        try {
          const response = await fetch(ADMIN_PREVIEW_SESSION_PATH, {
            method: "DELETE", credentials: "same-origin", cache: "no-store",
            signal: AbortSignal.timeout(10000),
          });
          if (response.ok) previewCookieIssued = false;
        } catch { /* It expires within the hour regardless. */ }
      });
      return () => { active = false; };
    }
    async function connect() {
      try {
        const [{ onIdTokenChanged }, { getFirebaseAuth }] = await Promise.all([import("firebase/auth"), import("./clientAuth")]);
        if (!active) return;
        const auth = getFirebaseAuth();
        unsubscribe = onIdTokenChanged(auth, currentUser => {
          if (!active) return;
          const currentGeneration = ++generation;
          setCheck({ user: currentUser, status: currentUser ? "checking" : "denied" });
          sessionQueue = sessionQueue.catch(() => {}).then(async () => {
            if (!active || currentGeneration !== generation) return;
            let status: PreviewStatus = "denied";
            try {
              const token = currentUser ? await currentUser.getIdToken() : null;
              if (!active || currentGeneration !== generation) return;
              const response = await fetch(ADMIN_PREVIEW_SESSION_PATH, {
                method: token ? "POST" : "DELETE",
                headers: token ? { authorization: `Bearer ${token}` } : undefined,
                credentials: "same-origin",
                cache: "no-store",
                signal: AbortSignal.timeout(10000),
              });
              if (token && response.ok && (await response.json()).authorized === true) status = "authorized";
              // The session route sets the cookie only for a verified admin and clears it otherwise.
              if (token) previewCookieIssued = status === "authorized";
              else if (response.ok) previewCookieIssued = false;
            } catch {
              // An unavailable session service cannot grant preview access.
            }
            if (active && currentGeneration === generation) setCheck({ user: currentUser, status });
          });
        }, () => {
          if (!active) return;
          generation++;
          setCheck({ user: auth.currentUser, status: "denied" });
        });
      } catch {
        queueMicrotask(() => { if (active) setCheck({ user: null, status: "denied" }); });
      }
    }
    void connect();
    return () => { active = false; unsubscribe?.(); };
  }, [user]);

  if (user === null) return "denied";
  return check && check.user === user ? check.status : "checking";
}

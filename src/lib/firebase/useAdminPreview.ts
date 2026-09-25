"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { ADMIN_PREVIEW_SESSION_PATH } from "@/lib/adminPreview";
import { useAuthUser } from "./useAuthUser";

type PreviewStatus = "checking" | "authorized" | "denied";
type PreviewCheck = { user: User | null; pathname: string; status: PreviewStatus };

// Serialize cookie writes across token refreshes, account switches and route
// changes, so an older sign-in cannot finish after the sign-out that clears it.
let sessionQueue: Promise<void> = Promise.resolve();
let anonymousSessionCleared = false;

export function useAdminPreview(pathname: string) {
  const user = useAuthUser();
  const [check, setCheck] = useState<PreviewCheck | null>(null);

  useEffect(() => {
    let active = true;
    let generation = 0;
    let unsubscribe: (() => void) | undefined;
    if (user === undefined) return;
    if (user === null) {
      // Clear any old httpOnly cookie once, without loading preview/auth code.
      sessionQueue = sessionQueue.catch(() => {}).then(async () => {
        if (!active || anonymousSessionCleared) return;
        try {
          const response = await fetch(ADMIN_PREVIEW_SESSION_PATH, {
            method: "DELETE", credentials: "same-origin", cache: "no-store",
            signal: AbortSignal.timeout(10000),
          });
          if (response.ok) anonymousSessionCleared = true;
        } catch { /* Retry on the next navigation. */ }
      });
      return () => { active = false; };
    }
    anonymousSessionCleared = false;
    async function connect() {
      try {
        const [{ onIdTokenChanged }, { getFirebaseAuth }] = await Promise.all([import("firebase/auth"), import("./client")]);
        if (!active) return;
        const auth = getFirebaseAuth();
        unsubscribe = onIdTokenChanged(auth, currentUser => {
          if (!active) return;
          const currentGeneration = ++generation;
          setCheck({ user: currentUser, pathname, status: currentUser ? "checking" : "denied" });
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
              if (!token && response.ok) anonymousSessionCleared = true;
              if (token && response.ok && (await response.json()).authorized === true) status = "authorized";
            } catch {
              // An unavailable session service cannot grant preview access.
            }
            if (active && currentGeneration === generation) setCheck({ user: currentUser, pathname, status });
          });
        }, () => {
          if (!active) return;
          generation++;
          setCheck({ user: auth.currentUser, pathname, status: "denied" });
        });
      } catch {
        queueMicrotask(() => { if (active) setCheck({ user: null, pathname, status: "denied" }); });
      }
    }
    void connect();
    return () => { active = false; unsubscribe?.(); };
  }, [pathname, user]);

  if (user === null) return "denied";
  return check?.user === user && check?.pathname === pathname ? check.status : "checking";
}

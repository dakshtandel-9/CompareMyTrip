"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";

/* The Auth SDK loads once the page is idle, not with its first bundle: no
   visible content waits on it, and on phones it also fetches Google's
   sign-in frame. The header shows its neutral placeholder until then. */
function whenIdle(run: () => void) {
  if (typeof window.requestIdleCallback === "function") {
    const handle = window.requestIdleCallback(run, { timeout: 2000 });
    return () => window.cancelIdleCallback(handle);
  }
  const handle = window.setTimeout(run, 200);
  return () => window.clearTimeout(handle);
}

// undefined = auth state not yet resolved, null = signed out, User = signed in.
export function useAuthUser() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    const cancel = whenIdle(() => {
      Promise.all([import("firebase/auth"), import("./clientAuth")])
        .then(([{ onAuthStateChanged }, { getFirebaseAuth }]) => {
          if (!active) return;
          unsubscribe = onAuthStateChanged(getFirebaseAuth(), setUser, () => setUser(null));
        })
        .catch(() => {
          // Missing deployment configuration must not crash public pages. A sign-in
          // attempt still surfaces the corresponding actionable error on its form.
          if (active) setUser(null);
        });
    });
    return () => {
      active = false;
      cancel();
      unsubscribe?.();
    };
  }, []);

  return user;
}

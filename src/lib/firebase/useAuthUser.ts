"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getFirebaseAuth } from "./client";

// undefined = auth state not yet resolved, null = signed out, User = signed in.
export function useAuthUser() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    try {
      return onAuthStateChanged(getFirebaseAuth(), setUser, () => setUser(null));
    } catch {
      // Missing deployment configuration must not crash public pages. A sign-in
      // attempt still surfaces the corresponding actionable error on its form.
      queueMicrotask(() => setUser(null));
    }
  }, []);

  return user;
}

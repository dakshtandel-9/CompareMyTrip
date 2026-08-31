"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { getFirebaseDb } from "./client";
import { useAuthUser } from "./useAuthUser";

export type UserProfile = {
  name: string;
  email: string;
  phone: string;
};

type ProfileState =
  // undefined = auth state or profile not yet resolved, null = signed out.
  | { status: "loading"; profile: undefined }
  | { status: "signedOut"; profile: null }
  | { status: "ready"; profile: UserProfile };

function textValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * The current user's contact details, drawn from the Firestore `users/{uid}`
 * document with the Auth record as a fallback. ProfileCompletionGate guarantees
 * name/email/phone are filled for a signed-in user, so `status: "ready"` fields
 * are safe to prefill forms with. Firestore reads that fail (offline, rules)
 * degrade to whatever the Auth record carries rather than erroring.
 */
export function useUserProfile(): ProfileState {
  const user = useAuthUser();
  // Keyed by uid so a stale profile from a previous session is never returned
  // as the current user's.
  const [entry, setEntry] = useState<{ uid: string; profile: UserProfile } | null>(null);

  useEffect(() => {
    if (!user) return;

    let active = true;
    const unsubscribe = onSnapshot(
      doc(getFirebaseDb(), "users", user.uid),
      (snapshot) => {
        if (!active) return;
        const data = snapshot.data();
        setEntry({
          uid: user.uid,
          profile: {
            name: textValue(data?.name) || textValue(user.displayName),
            email: textValue(data?.email) || textValue(user.email),
            phone: textValue(data?.phone),
          },
        });
      },
      () => {
        if (!active) return;
        setEntry({
          uid: user.uid,
          profile: {
            name: textValue(user.displayName),
            email: textValue(user.email),
            phone: "",
          },
        });
      },
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [user]);

  if (user === undefined) return { status: "loading", profile: undefined };
  if (user === null) return { status: "signedOut", profile: null };
  if (entry?.uid !== user.uid) return { status: "loading", profile: undefined };
  return { status: "ready", profile: entry.profile };
}

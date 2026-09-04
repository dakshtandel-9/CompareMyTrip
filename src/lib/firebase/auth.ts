import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb, createGoogleProvider } from "./client";
import {
  COMPLETED_PROFILE_UID_KEY,
  USER_PROFILE_SAVED_EVENT,
} from "./profileEvents";

export async function signUpWithEmail({
  name,
  email,
  phone,
  password,
}: {
  name: string;
  email: string;
  phone: string;
  password: string;
}) {
  const auth = getFirebaseAuth();
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });
  await setDoc(doc(getFirebaseDb(), "users", credential.user.uid), {
    name,
    email,
    phone,
    provider: "password",
    createdAt: serverTimestamp(),
  });
  sessionStorage.setItem(COMPLETED_PROFILE_UID_KEY, credential.user.uid);
  window.dispatchEvent(
    new CustomEvent(USER_PROFILE_SAVED_EVENT, {
      detail: { uid: credential.user.uid },
    }),
  );
  return credential.user;
}

/* A 25-character password drawn from crypto.getRandomValues: upper, lower,
   digits and symbols. Rejection sampling on a 256-value byte range keeps the
   distribution uniform — `% alphabet.length` alone would quietly favour the
   first few characters. */
const GUEST_PASSWORD_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}<>?";

function randomPassword(length = 25) {
  const alphabet = GUEST_PASSWORD_ALPHABET;
  // Largest multiple of the alphabet size that fits in a byte; bytes at or
  // above it are discarded rather than folded, which would skew the result.
  const limit = Math.floor(256 / alphabet.length) * alphabet.length;
  let out = "";
  while (out.length < length) {
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    for (const byte of bytes) {
      if (byte >= limit) continue;
      out += alphabet[byte % alphabet.length];
      if (out.length === length) break;
    }
  }
  return out;
}

/**
 * Creates an account for a visitor paying at checkout who never signed up.
 *
 * The password is generated here, handed to Firebase over TLS, and dropped —
 * it is never returned, logged, stored or displayed, so neither the visitor
 * nor the operator can ever know it. Firebase hashes it (scrypt) on their
 * side; that is the only place it exists after this call.
 *
 * The account is therefore reachable afterwards only by "Add a password" in
 * /account while still signed in, or by signing in with Google on the same
 * email — both already handled by the existing account screen.
 */
export async function signUpGuest({
  name,
  email,
  phone,
}: {
  name: string;
  email: string;
  phone: string;
}) {
  const auth = getFirebaseAuth();
  await setPersistence(auth, browserLocalPersistence);
  const credential = await createUserWithEmailAndPassword(auth, email, randomPassword());
  await updateProfile(credential.user, { displayName: name });
  await setDoc(doc(getFirebaseDb(), "users", credential.user.uid), {
    name,
    email,
    phone,
    provider: "guest",
    createdAt: serverTimestamp(),
  });
  sessionStorage.setItem(COMPLETED_PROFILE_UID_KEY, credential.user.uid);
  window.dispatchEvent(
    new CustomEvent(USER_PROFILE_SAVED_EVENT, {
      detail: { uid: credential.user.uid },
    }),
  );
  return credential.user;
}

export async function signInWithEmail({
  email,
  password,
  remember,
}: {
  email: string;
  password: string;
  remember: boolean;
}) {
  const auth = getFirebaseAuth();
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function requestPasswordReset(email: string) {
  await sendPasswordResetEmail(getFirebaseAuth(), email.trim().toLowerCase());
}

export async function signInWithGoogle({ remember = true }: { remember?: boolean } = {}) {
  const auth = getFirebaseAuth();
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
  const credential = await signInWithPopup(auth, createGoogleProvider());
  const userRef = doc(getFirebaseDb(), "users", credential.user.uid);
  const existingUser = await getDoc(userRef);
  await setDoc(
    userRef,
    {
      name: credential.user.displayName,
      email: credential.user.email,
      provider: "google",
      ...(!existingUser.exists() || !existingUser.data().createdAt
        ? { createdAt: serverTimestamp() }
        : {}),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  return credential.user;
}

const ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-email": "That email address doesn't look right.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/user-not-found": "Incorrect email or password.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/email-already-in-use": "An account already exists with this email.",
  "auth/credential-already-in-use": "This email and password are already connected to another account.",
  "auth/provider-already-linked": "A password is already connected to this account.",
  "auth/requires-recent-login": "Please log out, sign in again, and retry this security change.",
  "auth/weak-password": "Password is too weak — use at least 8 characters.",
  "auth/popup-closed-by-user": "Google sign-in was closed before completing.",
  "auth/network-request-failed": "Network error — check your connection and try again.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
};

export function getAuthErrorMessage(error: unknown): string {
  const code = (error as { code?: string } | undefined)?.code ?? "";
  return ERROR_MESSAGES[code] ?? "Something went wrong. Please try again.";
}

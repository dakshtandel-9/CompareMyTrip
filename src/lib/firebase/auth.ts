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
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb, createGoogleProvider } from "./client";
import { markProfileCompleted } from "./profileEvents";

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
  markProfileCompleted(credential.user.uid);
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
  markProfileCompleted(credential.user.uid);
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
  // Firebase queues persistence changes before committing the signed-in user.
  // Start the popup in the click handler without first waiting on browser storage.
  const persistence = setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
  const [, credential] = await Promise.all([
    persistence,
    signInWithPopup(auth, createGoogleProvider()),
  ]);
  // ProfileCompletionGate collects and saves a new account's required details.
  // A Firestore outage must not turn successful Google authentication into a
  // failed login, or overwrite an existing customer's chosen profile name.
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
  "auth/popup-blocked": "Your browser blocked Google sign-in. Allow pop-ups for this site and try again, or use email and password.",
  "auth/cancelled-popup-request": "Another Google sign-in is already open. Complete that window or try again.",
  "auth/unauthorized-domain": "Google sign-in is not configured for this website address. Please use email and password or contact CompareMyTrip.",
  "auth/operation-not-allowed": "This sign-in method is currently unavailable. Please use another method or contact CompareMyTrip.",
  "auth/account-exists-with-different-credential": "This email already uses another sign-in method. Sign in using your original method, or reset your password.",
  "auth/web-storage-unsupported": "Your browser is blocking the storage needed to sign in. Allow site storage or try another browser.",
  "auth/operation-not-supported-in-this-environment": "Open this website in Safari, Chrome or another browser to sign in.",
  "auth/invalid-api-key": "Sign-in is temporarily unavailable. Please contact CompareMyTrip.",
  "auth/auth-domain-config-required": "Google sign-in is temporarily unavailable. Please contact CompareMyTrip.",
  "auth/configuration-not-found": "Sign-in is temporarily unavailable. Please contact CompareMyTrip.",
  "auth/network-request-failed": "Network error — check your connection and try again.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
};

export function getAuthErrorMessage(error: unknown): string {
  const code = (error as { code?: string } | undefined)?.code ?? "";
  return ERROR_MESSAGES[code] ?? "Something went wrong. Please try again.";
}

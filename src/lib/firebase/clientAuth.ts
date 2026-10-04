import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirebaseApp } from "./app";

/* Kept apart from ./client so the sign-in state, which the header reads on
   every page, loads without the Firestore, Storage and App Check SDKs. */

// getAuth() validates the API key eagerly and throws if it's missing/malformed.
let authInstance: Auth | undefined;
export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    authInstance = getAuth(getFirebaseApp());
  }
  return authInstance;
}

export function createGoogleProvider(): GoogleAuthProvider {
  return new GoogleAuthProvider();
}

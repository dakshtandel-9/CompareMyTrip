/* ------------------------------------------------------------------ */
/* Firebase Admin (server only).                                        */
/*                                                                      */
/* This module must never be imported into a client component: the      */
/* service account key it reads can mint tokens for any user and        */
/* bypasses every Firestore rule.                                       */
/*                                                                      */
/* It exists because the payment record is a trust boundary. Only the   */
/* server sees PayU's verified response hash, so only the server may    */
/* write paymentStatus — the `trips` rules deny client writes to it     */
/* outright. Admin writes here bypass those rules by design.            */
/* ------------------------------------------------------------------ */

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { initializeFirestore } from "firebase-admin/firestore";

let app: App | undefined;

/** Null when the service account key has not been supplied yet. */
function getAdminApp(): App | null {
  if (app) return app;
  if (getApps().length) {
    app = getApps()[0]!;
    return app;
  }

  // Stored base64-encoded, not as raw JSON: the key contains a PEM private
  // key with embedded quotes and \n sequences that dotenv-style parsers
  // (Next's included) cannot round-trip inside a quoted value. Base64 has
  // no characters such a file needs to escape.
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;
  if (!encoded) return null;

  let serviceAccount: Record<string, unknown>;
  try {
    serviceAccount = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
  } catch {
    console.error(
      "FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 is not valid base64-encoded JSON — trip records are disabled.",
    );
    return null;
  }

  app = initializeApp({ credential: cert(serviceAccount) });
  return app;
}

export function getAdminAuth() {
  const instance = getAdminApp();
  return instance ? getAuth(instance) : null;
}

export function getAdminDb() {
  const instance = getAdminApp();
  // Workers supports HTTP transport; Firestore gRPC is not required here.
  return instance ? initializeFirestore(instance, { preferRest: true }) : null;
}

/**
 * The uid behind a Firebase ID token, or "" when the token is missing,
 * expired or forged. Checkout passes one so the trip can be tied to the
 * buyer's account; a bad token costs them the link, never the booking.
 */
export async function uidFromIdToken(idToken: string): Promise<string> {
  if (!idToken) return "";
  const auth = getAdminAuth();
  if (!auth) return "";
  try {
    return (await auth.verifyIdToken(idToken)).uid;
  } catch {
    return "";
  }
}

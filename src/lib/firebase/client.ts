import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import type { FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getFirebaseApp } from "./app";

export { createGoogleProvider, getFirebaseAuth } from "./clientAuth";

// App Check protects Firestore; Authentication is not enforced. It starts with Firestore rather
// than with the app, because its reCAPTCHA script (~400 KB, over a second of phone CPU) would
// otherwise load on every page: the header reads the sign-in state everywhere. Firestore picks up
// a provider registered after it, but registering first means its very first request already
// carries a token. (Uploads go to Cloudflare R2; the client never uses Firebase Storage.)
let appCheckInitialized = false;
function getProtectedApp(): FirebaseApp {
  const app = getFirebaseApp();
  if (typeof window !== "undefined" && !appCheckInitialized) {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY;
    if (siteKey) {
      initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(siteKey),
        isTokenAutoRefreshEnabled: true,
      });
      appCheckInitialized = true;
    }
  }
  return app;
}

let dbInstance: Firestore | undefined;
export function getFirebaseDb(): Firestore {
  if (!dbInstance) {
    dbInstance = getFirestore(getProtectedApp());
  }
  return dbInstance;
}

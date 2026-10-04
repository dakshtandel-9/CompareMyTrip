import { getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Every service getter is lazy so importing a Firebase module (e.g. during SSR of the auth pages)
// never crashes the page before NEXT_PUBLIC_FIREBASE_* is actually configured — the throw only
// happens when a service is first used, where the caller's try/catch turns it into an on-page error.
let app: FirebaseApp | undefined;
export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
  }
  return app;
}

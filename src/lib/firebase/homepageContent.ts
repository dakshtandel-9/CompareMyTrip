import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";

import {
  DEFAULT_SITE_CONTENT,
  normalizeSiteContent,
  type SiteContent,
} from "@/lib/siteContent";
import { uploadImageToCloudflare } from "@/lib/cloudflareUpload";
import { getFirebaseAuth, getFirebaseDb } from "./client";

const HOMEPAGE_COLLECTION = "siteContent";
const HOMEPAGE_DOCUMENT = "homepage";

type StoredHomepageDocument = {
  content?: unknown;
};

export function subscribeToHomepageContent(
  onContent: (content: SiteContent, exists: boolean) => void,
  onError: (message: string) => void,
) {
  return onSnapshot(
    doc(getFirebaseDb(), HOMEPAGE_COLLECTION, HOMEPAGE_DOCUMENT),
    (snapshot) => {
      const stored = snapshot.data() as StoredHomepageDocument | undefined;
      onContent(
        snapshot.exists() ? normalizeSiteContent(stored?.content) : DEFAULT_SITE_CONTENT,
        snapshot.exists(),
      );
    },
    (error) => {
      console.error("Unable to load homepage content from Firestore", error);
      onError("Could not connect to the homepage content database.");
    },
  );
}

/** Publishes the complete normalized homepage as one atomic Firestore document. */
export async function saveHomepageContent(content: SiteContent) {
  const auth = getFirebaseAuth();
  await auth.authStateReady();

  await setDoc(doc(getFirebaseDb(), HOMEPAGE_COLLECTION, HOMEPAGE_DOCUMENT), {
    content: normalizeSiteContent(content),
    updatedAt: serverTimestamp(),
    updatedByUid: auth.currentUser?.uid ?? null,
    schemaVersion: 1,
  });
}

/** Images live in Cloudflare R2; Firestore stores only their durable URL. */
export async function uploadHomepageImage(file: File): Promise<string> {
  return uploadImageToCloudflare(file, "homepage");
}

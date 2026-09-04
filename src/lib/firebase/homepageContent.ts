import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";

import {
  DEFAULT_SITE_CONTENT,
  normalizeSiteContent,
  type SiteContent,
} from "@/lib/siteContent";
import { uploadImageToCloudflare } from "@/lib/cloudflareUpload";
import { getFirebaseAuth, getFirebaseDb } from "./client";

const HOMEPAGE_COLLECTION = "siteContent";
/* Deliberately still "homepage" even though the CRM is now the whole site's
   content editor at /admin/content: this is where every published document
   already lives, and renaming it would strand that content behind a key
   nothing reads. The path is storage, not a label anyone sees. */
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

/**
 * Publishes one slice of the document, leaving the rest untouched.
 *
 * The whole-document write above is right for the content editor, which
 * holds a draft of everything; it is wrong for a screen that owns one
 * section — /admin/banners publishing its own copy of the homepage would
 * quietly roll back anything edited elsewhere since it loaded. A merge
 * write keeps each screen to its own slice.
 */
export async function saveSiteContentSection<Key extends keyof SiteContent>(
  key: Key,
  value: SiteContent[Key],
) {
  const auth = getFirebaseAuth();
  await auth.authStateReady();

  /* Normalised as part of a whole document and then narrowed, so a slice
     goes through exactly the same validation as a full publish. */
  const normalized = normalizeSiteContent({ [key]: value })[key];

  await setDoc(
    doc(getFirebaseDb(), HOMEPAGE_COLLECTION, HOMEPAGE_DOCUMENT),
    {
      content: { [key]: normalized },
      updatedAt: serverTimestamp(),
      updatedByUid: auth.currentUser?.uid ?? null,
      schemaVersion: 1,
    },
    { merge: true },
  );
}

/** Images live in Cloudflare R2; Firestore stores only their durable URL. */
export async function uploadHomepageImage(file: File): Promise<string> {
  return uploadImageToCloudflare(file, "homepage");
}

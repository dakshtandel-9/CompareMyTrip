import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { uploadImageToCloudflare } from "@/lib/cloudflareUpload";
import { getFirebaseAuth, getFirebaseDb } from "./client";

/* Cover artwork for the public /destinations grid. Destinations themselves
   are derived from the package catalogue (see lib/destinations.ts) — this
   collection only carries the one thing that cannot be derived: the picture
   an editor chose for the card. A destination with no document here simply
   falls back to the first package photo. */

const COLLECTION = "destinationCovers";

/* Destination names are free text and may contain "/", which is not legal in
   a document id. Encoding matches how newsletter subscribers key on email. */
const coverId = (name: string) => encodeURIComponent(name.trim());

function requireUser() {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Sign in to the CRM before changing destination covers.");
  return user;
}

export function subscribeToDestinationCovers(
  onCovers: (covers: Record<string, string>) => void,
  onError: (message: string) => void,
) {
  return onSnapshot(
    collection(getFirebaseDb(), COLLECTION),
    (snapshot) => {
      const covers: Record<string, string> = {};
      for (const coverDocument of snapshot.docs) {
        const data = coverDocument.data() as { name?: unknown; image?: unknown };
        /* The name is stored alongside the image so reading never depends on
           decoding the document id. */
        const name = typeof data.name === "string" ? data.name.trim() : "";
        const image = typeof data.image === "string" ? data.image.trim() : "";
        if (name && image) covers[name] = image;
      }
      onCovers(covers);
    },
    (error) =>
      onError(
        error instanceof FirebaseError && error.code === "permission-denied"
          ? "This CRM account is not authorized to manage destination covers."
          : error.message || "Destination covers could not be loaded.",
      ),
  );
}

export async function saveDestinationCover(name: string, image: string) {
  const user = requireUser();
  const destination = name.trim();
  if (!destination) throw new Error("A destination name is required.");
  await setDoc(doc(getFirebaseDb(), COLLECTION, coverId(destination)), {
    name: destination,
    image: image.trim(),
    updatedAt: serverTimestamp(),
    updatedByUid: user.uid,
  });
}

export async function clearDestinationCover(name: string) {
  requireUser();
  await deleteDoc(doc(getFirebaseDb(), COLLECTION, coverId(name)));
}

/** Same route, limits and compression as package photography. */
export async function uploadDestinationImage(file: File) {
  return uploadImageToCloudflare(file, "destinations");
}

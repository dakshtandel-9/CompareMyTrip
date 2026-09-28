import { revalidatePublicContent } from "./revalidateContent";
import {
  collection,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { uploadImageToCloudflare } from "@/lib/cloudflareUpload";
import { getFirebaseAuth, getFirebaseDb } from "./client";

// Destination records also reserve catalogue names before packages are added.
export type DestinationRecord = { name: string; region: "India" | "International" };

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
  onCovers: (
    covers: Record<string, string>,
    destinations: DestinationRecord[],
    descriptions: Record<string, string>,
  ) => void,
  onError: (message: string) => void,
) {
  return onSnapshot(
    collection(getFirebaseDb(), COLLECTION),
    (snapshot) => {
      const covers: Record<string, string> = {};
      const destinations: DestinationRecord[] = [];
      const descriptions: Record<string, string> = {};
      for (const coverDocument of snapshot.docs) {
        const data = coverDocument.data() as { name?: unknown; image?: unknown; region?: unknown; description?: unknown };
        /* The name is stored alongside the image so reading never depends on
           decoding the document id. */
        const name = typeof data.name === "string" ? data.name.trim() : "";
        const image = typeof data.image === "string" ? data.image.trim() : "";
        if (name && image) covers[name] = image;
        const description = typeof data.description === "string" ? data.description.trim() : "";
        if (name && description) descriptions[name] = description;
        if (name && (data.region === "India" || data.region === "International")) destinations.push({ name, region: data.region });
      }
      onCovers(covers, destinations, descriptions);
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
  }, { merge: true });
  await revalidatePublicContent();
}

export const MAX_DESTINATION_DESCRIPTION = 600;

/** The paragraph under a destination page's title. Empty restores the default. */
export async function saveDestinationDescription(name: string, description: string) {
  const user = requireUser();
  const destination = name.trim();
  if (!destination) throw new Error("A destination name is required.");
  const text = description.trim();
  if (text.length > MAX_DESTINATION_DESCRIPTION) {
    throw new Error(`Keep the description to ${MAX_DESTINATION_DESCRIPTION} characters or fewer.`);
  }
  await setDoc(doc(getFirebaseDb(), COLLECTION, coverId(destination)), {
    name: destination,
    description: text,
    updatedAt: serverTimestamp(),
    updatedByUid: user.uid,
  }, { merge: true });
  await revalidatePublicContent();
}

export async function clearDestinationCover(name: string) {
  await saveDestinationCover(name, "");
}

/** Same route, limits and compression as package photography. */
export async function uploadDestinationImage(file: File) {
  return uploadImageToCloudflare(file, "destinations");
}

export async function createDestination(name: string, region: DestinationRecord["region"]) {
  const user = requireUser();
  const destination = name.trim();
  if (!destination || destination.length > 100) throw new Error("Enter a destination name of 1–100 characters.");
  if (region !== "India" && region !== "International") throw new Error("Choose a valid region.");
  const db = getFirebaseDb();
  const ref = doc(db, COLLECTION, coverId(destination));
  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(ref);
    if (existing.data()?.region) throw new Error("This destination already exists.");
    transaction.set(ref, { name: destination, region, updatedAt: serverTimestamp(), updatedByUid: user.uid }, { merge: true });
  });
}

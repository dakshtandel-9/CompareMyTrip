import { revalidatePublicContent } from "./revalidateContent";
import { collection, doc, onSnapshot, serverTimestamp, writeBatch } from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import type { CruiseListing } from "@/lib/cruiseListings";
import { getFirebaseAuth, getFirebaseDb } from "./client";

const COLLECTION = "cruises";

function requireUser() {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Sign in to the CRM before changing cruises.");
  return user;
}

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export function subscribeToCruises(
  onChange: (cruises: CruiseListing[]) => void,
  onError: (message: string) => void,
) {
  return onSnapshot(
    collection(getFirebaseDb(), COLLECTION),
    (snapshot) => {
      const cruises = snapshot.docs
        .map((item) => {
          const data = item.data() as Record<string, unknown>;
          const price = Number(data.fromPrice);
          return {
            id: item.id,
            name: text(data.name),
            route: text(data.route),
            image: text(data.image),
            fromPrice: Number.isFinite(price) ? Math.max(0, price) : 0,
            pitch: text(data.pitch),
            badge: text(data.badge),
            brochureUrl: text(data.brochureUrl),
            status: data.status === "draft" ? "draft" as const : "published" as const,
            position: Number(data.position) || 0,
          };
        })
        // Newest first, as the packages list orders itself.
        .sort((a, b) => (b.position ?? 0) - (a.position ?? 0));
      onChange(cruises);
    },
    (error) =>
      onError(
        error instanceof FirebaseError && error.code === "permission-denied"
          ? "This CRM account is not authorized to manage cruises."
          : error.message || "Cruises could not be loaded.",
      ),
  );
}

export async function saveCruise(cruise: CruiseListing) {
  const user = requireUser();
  if (!cruise.name.trim()) throw new Error("A cruise name is required.");
  const db = getFirebaseDb();
  await writeBatch(db)
    .set(doc(db, COLLECTION, cruise.id), {
      name: cruise.name.trim(),
      route: cruise.route.trim(),
      image: cruise.image.trim(),
      fromPrice: Math.max(0, Number(cruise.fromPrice) || 0),
      pitch: cruise.pitch.trim(),
      badge: cruise.badge.trim(),
      brochureUrl: cruise.brochureUrl.trim(),
      status: cruise.status ?? "published",
      position: cruise.position ?? Date.now(),
      updatedAt: serverTimestamp(),
      updatedByUid: user.uid,
    }, { merge: true })
    .commit();
  try {
    await revalidatePublicContent();
    return { refreshWarning: "" };
  } catch {
    // The document is already durable; a refresh failure is not a lost save.
    return { refreshWarning: "The cruise was saved, but public pages could not be refreshed immediately." };
  }
}

/** One batch, so a failed bulk delete cannot remove only some rows. */
export async function deleteCruises(cruiseIds: string[]) {
  requireUser();
  const ids = [...new Set(cruiseIds)].filter(Boolean);
  if (!ids.length) return { refreshWarning: "" };
  if (ids.length > 500) throw new Error("Select up to 500 cruises at a time.");
  if (ids.some((id) => id.includes("/"))) throw new Error("Invalid cruise selection.");
  const db = getFirebaseDb();
  const batch = writeBatch(db);
  ids.forEach((id) => batch.delete(doc(db, COLLECTION, id)));
  await batch.commit();
  try {
    await revalidatePublicContent();
    return { refreshWarning: "" };
  } catch {
    return { refreshWarning: "The cruises were deleted, but public pages could not be refreshed immediately." };
  }
}

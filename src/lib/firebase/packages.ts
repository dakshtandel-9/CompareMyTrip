import { revalidatePublicContent } from "./revalidateContent";
import { collection, deleteDoc, deleteField, doc, onSnapshot, serverTimestamp, writeBatch } from "firebase/firestore";
import type { TravelPackage } from "@/lib/packageData";
import { WEEKEND_TRACKS, WEEKEND_TREKS_CATEGORY, type WeekendTrackId } from "@/lib/weekendTracks";
import { uploadImageToCloudflare } from "@/lib/cloudflareUpload";
import { getFirebaseAuth, getFirebaseDb } from "./client";

const CATALOG_MARKER = "_catalog";

function requireUser() {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Sign in to the CRM before changing packages.");
  return user;
}

const clean = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function subscribeToPackages(
  onChange: (packages: TravelPackage[], initialized: boolean) => void,
  onError: (message: string) => void,
) {
  return onSnapshot(
    // Keeping the records in a collection gives every package its own edit and
    // delete operation instead of rewriting the complete catalogue each time.
    collection(getFirebaseDb(), "packages"),
    (snapshot) => {
      const initialized = snapshot.docs.some((item) => item.id === CATALOG_MARKER);
      const packages = snapshot.docs
        .filter((item) => item.id !== CATALOG_MARKER)
        .map((item) => ({ id: item.id, ...item.data().package, _position: item.data().position }))
        .sort((a, b) => (a._position ?? Number.MAX_SAFE_INTEGER) - (b._position ?? Number.MAX_SAFE_INTEGER))
        .map((item) => {
          const result = { ...item };
          delete (result as { _position?: number })._position;
          return result as TravelPackage;
        });
      onChange(packages, initialized);
    },
    (error: { message: string }) => onError(error.message),
  );
}

export async function savePackage(pkg: TravelPackage) {
  const user = requireUser();
  const db = getFirebaseDb();
  const batch = writeBatch(db);
  batch.set(doc(db, "packages", pkg.id), {
      package: clean({ ...pkg, status: pkg.status ?? "published" }),
      position: Date.now(),
      updatedAt: serverTimestamp(),
      updatedByUid: user.uid,
    }, { merge: true });
  batch.set(doc(db, "packages", CATALOG_MARKER), { initialized: true, updatedAt: serverTimestamp() }, { merge: true });
  await batch.commit();
  try {
    await revalidatePublicContent();
    return { refreshWarning: "" };
  } catch {
    // The document and its image references are already durable. Callers
    // must not treat a refresh failure as an unsaved, disposable draft.
    return { refreshWarning: "The package was saved, but public pages could not be refreshed immediately." };
  }
}

export async function deletePackage(packageId: string) {
  requireUser();
  await deleteDoc(doc(getFirebaseDb(), "packages", packageId));
  await revalidatePublicContent();
}

/** A single batch keeps a failed bulk delete from removing only some rows. */
export async function deletePackages(packageIds: string[]) {
  requireUser();
  const ids = [...new Set(packageIds)];
  if (!ids.length) return { refreshWarning: "" };
  if (ids.length > 500) throw new Error("Select up to 500 packages at a time.");
  if (ids.some((id) => !id || id === CATALOG_MARKER || id.includes("/"))) {
    throw new Error("Invalid package selection.");
  }
  const db = getFirebaseDb();
  const batch = writeBatch(db);
  ids.forEach((id) => batch.delete(doc(db, "packages", id)));
  await batch.commit();
  try {
    await revalidatePublicContent();
    return { refreshWarning: "" };
  } catch {
    return { refreshWarning: "The packages were deleted, but public pages could not be refreshed immediately." };
  }
}

/** Files several treks under one weekend track, or clears the assignment when
    `track` is null so they fall back to keyword matching. Writes only the two
    affected fields, leaving the rest of each package untouched — a bulk action
    must not overwrite edits made elsewhere in the catalogue meanwhile.

    The Weekend Treks tag is added where it is missing, since a package with no
    tag would be filed under a track nothing ever reads. */
export async function assignWeekendTrack(
  packages: TravelPackage[],
  track: WeekendTrackId | null,
) {
  const user = requireUser();
  if (!packages.length) return { refreshWarning: "" };
  if (packages.length > 500) throw new Error("Select up to 500 packages at a time.");
  if (track && !WEEKEND_TRACKS.some((item) => item.id === track)) {
    throw new Error("Unknown weekend track.");
  }

  const db = getFirebaseDb();
  const batch = writeBatch(db);
  packages.forEach((pkg) => {
    const tags = track && !pkg.tags.includes(WEEKEND_TREKS_CATEGORY)
      ? [...pkg.tags, WEEKEND_TREKS_CATEGORY]
      : pkg.tags;
    batch.set(doc(db, "packages", pkg.id), {
      // Firestore rejects undefined, so a cleared track is stored as a
      // deletion rather than left behind as a stale value.
      package: { weekendTrack: track ?? deleteField(), tags: clean(tags) },
      updatedAt: serverTimestamp(),
      updatedByUid: user.uid,
    }, { merge: true });
  });
  await batch.commit();
  try {
    await revalidatePublicContent();
    return { refreshWarning: "" };
  } catch {
    return { refreshWarning: "The treks were moved, but public pages could not be refreshed immediately." };
  }
}

export async function seedPackages(packages: TravelPackage[]) {
  const user = requireUser();
  const db = getFirebaseDb();
  const batch = writeBatch(db);
  packages.forEach((pkg, position) => {
    batch.set(doc(db, "packages", pkg.id), {
      package: clean({ ...pkg, status: pkg.status ?? "published" }), position, updatedAt: serverTimestamp(), updatedByUid: user.uid,
    });
  });
  batch.set(doc(db, "packages", CATALOG_MARKER), { initialized: true, updatedAt: serverTimestamp(), updatedByUid: user.uid });
  await batch.commit();
  await revalidatePublicContent();
}

export async function uploadPackageImage(file: File) {
  return uploadImageToCloudflare(file, "packages");
}

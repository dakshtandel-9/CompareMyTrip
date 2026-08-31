import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import type { TravelPackage } from "@/lib/packageData";
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
  await Promise.all([
    setDoc(doc(db, "packages", pkg.id), {
      package: clean(pkg),
      position: Date.now(),
      updatedAt: serverTimestamp(),
      updatedByUid: user.uid,
    }, { merge: true }),
    setDoc(doc(db, "packages", CATALOG_MARKER), { initialized: true, updatedAt: serverTimestamp() }, { merge: true }),
  ]);
}

export async function deletePackage(packageId: string) {
  requireUser();
  await deleteDoc(doc(getFirebaseDb(), "packages", packageId));
}

export async function seedPackages(packages: TravelPackage[]) {
  const user = requireUser();
  const db = getFirebaseDb();
  const batch = writeBatch(db);
  packages.forEach((pkg, position) => {
    batch.set(doc(db, "packages", pkg.id), {
      package: clean(pkg), position, updatedAt: serverTimestamp(), updatedByUid: user.uid,
    });
  });
  batch.set(doc(db, "packages", CATALOG_MARKER), { initialized: true, updatedAt: serverTimestamp(), updatedByUid: user.uid });
  await batch.commit();
}

export async function uploadPackageImage(file: File) {
  return uploadImageToCloudflare(file, "packages");
}

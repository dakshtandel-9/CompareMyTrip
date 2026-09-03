import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { FirebaseError } from "firebase/app";

import { normaliseCode, toCoupon, type Coupon } from "@/lib/coupons";
import { getFirebaseAuth, getFirebaseDb } from "./client";

/* ------------------------------------------------------------------ */
/* Coupons, from the CRM's side.                                        */
/*                                                                      */
/* Only admins read or write this collection (see firestore.rules): the  */
/* checkout never fetches it from the browser, because a public read     */
/* would hand every visitor the full list of codes — including ones cut  */
/* for a single campaign or a single traveller. Validation happens on    */
/* the server instead, through lib/firebase/serverCoupons.               */
/*                                                                      */
/* The document id is the code itself, so a second coupon with the same  */
/* code overwrites the first rather than quietly shadowing it.           */
/* ------------------------------------------------------------------ */

const COLLECTION = "coupons";

function requireUser() {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Sign in to the CRM before changing coupons.");
  return user;
}

export function subscribeToCoupons(
  onCoupons: (coupons: Coupon[]) => void,
  onError: (message: string) => void,
) {
  return onSnapshot(
    collection(getFirebaseDb(), COLLECTION),
    (snapshot) => {
      const coupons = snapshot.docs.map((entry) => toCoupon(entry.id, entry.data()));
      coupons.sort((a, b) => a.code.localeCompare(b.code));
      onCoupons(coupons);
    },
    (error) =>
      onError(
        error instanceof FirebaseError && error.code === "permission-denied"
          ? "This CRM account is not authorized to manage coupons."
          : error.message || "Coupons could not be loaded.",
      ),
  );
}

/** Creates or replaces a coupon. `previousCode` lets an edit rename the
    code without leaving the old document behind. */
export async function saveCoupon(coupon: Coupon, previousCode = "") {
  const user = requireUser();
  const code = normaliseCode(coupon.code);
  if (!code) throw new Error("A coupon needs a code.");

  const db = getFirebaseDb();
  await setDoc(doc(db, COLLECTION, code), {
    ...coupon,
    code,
    label: coupon.label.trim(),
    updatedAt: serverTimestamp(),
    updatedByUid: user.uid,
  });

  const previous = normaliseCode(previousCode);
  if (previous && previous !== code) {
    await deleteDoc(doc(db, COLLECTION, previous));
  }
}

export async function deleteCoupon(code: string) {
  requireUser();
  await deleteDoc(doc(getFirebaseDb(), COLLECTION, normaliseCode(code)));
}

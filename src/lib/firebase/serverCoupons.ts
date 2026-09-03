import { getAdminDb } from "./admin";
import { normaliseCode, toCoupon, type Coupon } from "@/lib/coupons";

/* ------------------------------------------------------------------ */
/* Coupons, from the server's side. Never import into a client          */
/* component — it reaches Firestore through the Admin SDK, which        */
/* bypasses every security rule.                                        */
/*                                                                      */
/* Usage is counted off the `trips` collection rather than a counter on  */
/* the coupon: a booking that PayU settled as successful is the only     */
/* honest definition of "used", and counting it live means a replayed    */
/* callback or a failed payment can never inflate the tally.             */
/* ------------------------------------------------------------------ */

/** How many trips are scanned when counting usage. Well past any sane
    campaign limit, and it keeps a runaway query from stalling checkout. */
const COUNT_SCAN_LIMIT = 2000;

export async function fetchCoupon(rawCode: string): Promise<Coupon | null> {
  const db = getAdminDb();
  const code = normaliseCode(rawCode);
  if (!db || !code) return null;

  const snapshot = await db.collection("coupons").doc(code).get();
  if (!snapshot.exists) return null;

  return toCoupon(snapshot.id, snapshot.data());
}

/** Every coupon that would apply itself without being typed. */
export async function fetchAutoCoupons(): Promise<Coupon[]> {
  const db = getAdminDb();
  if (!db) return [];

  const snapshot = await db
    .collection("coupons")
    .where("autoApply", "==", true)
    .where("active", "==", true)
    .limit(50)
    .get();

  return snapshot.docs.map((entry) => toCoupon(entry.id, entry.data()));
}

/** Successful redemptions of a code: everyone's, and this traveller's.
    One query, split in memory — the second half needs the same rows. */
export async function countCouponUses(
  code: string,
  identity: { userId: string; email: string },
): Promise<{ total: number; byUser: number }> {
  const db = getAdminDb();
  const normalised = normaliseCode(code);
  if (!db || !normalised) return { total: 0, byUser: 0 };

  const snapshot = await db
    .collection("trips")
    .where("couponCode", "==", normalised)
    .where("paymentStatus", "==", "successful")
    .limit(COUNT_SCAN_LIMIT)
    .get();

  const email = identity.email.trim().toLowerCase();
  const byUser = snapshot.docs.filter((entry) => {
    const data = entry.data() as { userId?: unknown; email?: unknown };
    const sameUid = identity.userId !== "" && data.userId === identity.userId;
    const sameEmail =
      email !== "" && typeof data.email === "string" && data.email.trim().toLowerCase() === email;
    return sameUid || sameEmail;
  }).length;

  return { total: snapshot.size, byUser };
}

/**
 * Whether this is the traveller's first booking — the question behind a
 * "first payment" offer.
 *
 * Matched on uid *and* email, because a guest account is created at the
 * moment of checkout: someone who paid as a guest last month has a
 * different uid today but the same address. Null when nobody has been
 * identified yet, which reads as "unknown" rather than "yes".
 */
export async function isFirstBooking(identity: {
  userId: string;
  email: string;
}): Promise<boolean | null> {
  const db = getAdminDb();
  if (!db) return null;

  const email = identity.email.trim().toLowerCase();
  if (!identity.userId && !email) return null;

  const queries = [];
  if (identity.userId) {
    queries.push(
      db
        .collection("trips")
        .where("userId", "==", identity.userId)
        .where("paymentStatus", "==", "successful")
        .limit(1)
        .get(),
    );
  }
  if (email) {
    queries.push(
      db
        .collection("trips")
        .where("email", "==", email)
        .where("paymentStatus", "==", "successful")
        .limit(1)
        .get(),
    );
  }

  const results = await Promise.all(queries);
  return results.every((result) => result.empty);
}

import { FieldPath, FieldValue, Timestamp, type DocumentData } from "firebase-admin/firestore";
import { getAdminDb } from "./firebase/admin";
import { settleTrip } from "./firebase/serverTrips";
import { buildRequestHash, getPayuConfig, newTransactionId, type Udf } from "./payu";
import { verifyPayuPayments, type VerifiedPayment } from "./payuVerification";
import { PENDING_PAYMENT_TTL_MS, PAYMENT_RETRY_COOLDOWN_MS, type PaymentReport } from "./pendingPayments";

export class PaymentActionError extends Error {
  constructor(message: string, public status = 409) { super(message); }
}
export const validTripId = (id: string) => /^[A-Za-z0-9_-]{1,100}$/.test(id);
const millis = (date: unknown): number => date instanceof Date ? date.getTime() :
  date && typeof (date as Timestamp).toMillis === "function" ? (date as Timestamp).toMillis() : NaN;
const expired = (data: DocumentData, now = Date.now()) => Number.isFinite(millis(data.createdAt)) && now >= millis(data.createdAt) + PENDING_PAYMENT_TTL_MS;
const activeId = (data: DocumentData) => String(data.activePaymentId || data.txnid);
const attemptIds = (data: DocumentData) => [...new Set<string>([data.txnid, ...(Array.isArray(data.paymentAttemptIds) ? data.paymentAttemptIds : []), activeId(data)])];

function database() {
  const db = getAdminDb();
  if (!db) throw new PaymentActionError("Booking storage is temporarily unavailable.", 503);
  return db;
}

async function ownedTrip(tripId: string, uid: string) {
  if (!validTripId(tripId)) throw new PaymentActionError("Booking not found.", 404);
  const ref = database().collection("trips").doc(tripId);
  const snapshot = await ref.get();
  if (!snapshot.exists || snapshot.data()?.userId !== uid) throw new PaymentActionError("Booking not found.", 404);
  return { ref, data: snapshot.data()! };
}

function verificationConfig(data: DocumentData) {
  const config = getPayuConfig();
  if (!config || (data.payuEnvironment && data.payuEnvironment !== config.mode)) {
    throw new PaymentActionError("This payment cannot be checked right now. Please contact support.", 503);
  }
  return config;
}

async function applySuccess(tripId: string, data: DocumentData, result: VerifiedPayment) {
  // Invalid amounts are not proof of payment, even if a gateway status says success.
  if (!result.amount || !Number.isFinite(Number(result.amount))) throw new PaymentActionError("PayU returned an incomplete payment result. Please contact support.", 503);
  await settleTrip({
    tripId, txnid: result.txnid, paymentStatus: "successful", payuPaymentId: result.payuPaymentId,
    paymentMode: result.paymentMode, failureReason: "", reportedAmount: result.amount,
    recovery: { userId: data.userId || "", packageId: data.packageId || "", packageTitle: data.packageTitle || "",
      travellers: data.travellers || 0, name: data.name || "", email: data.email || "" },
  });
}

export async function retryPendingPayment(tripId: string, uid: string, origin: string) {
  const { ref, data } = await ownedTrip(tripId, uid);
  if (data.paymentStatus !== "pending") throw new PaymentActionError("This booking no longer has a pending payment.");
  if (expired(data)) throw new PaymentActionError("This pending booking has expired. Please choose your package again.", 410);
  if (data.paymentReportStatus === "open") throw new PaymentActionError("Your payment is under review. Please wait for the travel team before paying again.");
  if (Date.now() - millis(data.retryStartedAt) < PAYMENT_RETRY_COOLDOWN_MS) throw new PaymentActionError("A payment attempt was just opened. Please wait five minutes before trying again.");
  const config = verificationConfig(data);
  const results = await verifyPayuPayments(attemptIds(data), config);
  const paid = [...results.values()].filter(result => result.state === "successful");
  if (paid.length) {
    for (const result of paid) await applySuccess(tripId, data, result);
    return { message: "PayU has confirmed your payment. Your booking has been updated; there is no need to pay again." };
  }
  if ([...results.values()].some(result => result.state === "unknown")) throw new PaymentActionError("We could not confirm the previous payment. Please try checking again shortly.", 503);
  if ([...results.values()].some(result => result.state === "pending")) throw new PaymentActionError("PayU is still processing your payment. Please wait, or use ‘I’ve already paid’ if money was deducted.");
  if (!Number.isFinite(data.amount) || data.amount <= 0 || !data.name || !data.email || !data.phone) throw new PaymentActionError("This booking needs the travel team’s help before it can be paid.");
  if (attemptIds(data).length >= 10) throw new PaymentActionError("Please contact support for help completing this booking.");

  const txnid = newTransactionId();
  await database().runTransaction(async tx => {
    const latest = await tx.get(ref);
    const current = latest.data();
    if (!current || current.userId !== uid || current.paymentStatus !== "pending" || activeId(current) !== activeId(data) ||
      current.paymentReportStatus === "open" || expired(current) || Date.now() - millis(current.retryStartedAt) < PAYMENT_RETRY_COOLDOWN_MS) {
      throw new PaymentActionError("This booking was updated. Refresh your trips before continuing.");
    }
    tx.update(ref, { activePaymentId: txnid, paymentAttemptIds: [...attemptIds(current), txnid],
      retryStartedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  });
  const amount = data.amount.toFixed(2);
  const udf: Udf = [data.packageId || "", String(data.travellers), data.couponCode || "", tripId, uid];
  const hash = buildRequestHash({ key: config.key, salt: config.salt, txnid, amount,
    productinfo: data.packageTitle, firstname: data.name, email: data.email, udf });
  return { endpoint: config.endpoint, fields: {
    key: config.key, txnid, amount, productinfo: data.packageTitle, firstname: data.name,
    email: data.email, phone: data.phone, surl: `${origin}/api/payu/callback`, furl: `${origin}/api/payu/callback`,
    udf1: udf[0], udf2: udf[1], udf3: udf[2], udf4: udf[3], udf5: udf[4], hash,
  } };
}

export async function reportPendingPayment(tripId: string, uid: string, reference: string, message: string) {
  if (reference.length < 4 || reference.length > 120 || message.length > 2000) throw new PaymentActionError("Enter your bank transaction reference (4–120 characters) and a message of up to 2,000 characters.", 400);
  const { ref } = await ownedTrip(tripId, uid);
  const db = database();
  const reportRef = db.collection("paymentReports").doc(tripId);
  await db.runTransaction(async tx => {
    const snapshot = await tx.get(ref);
    const report = await tx.get(reportRef);
    const data = snapshot.data();
    if (!data || data.userId !== uid) throw new PaymentActionError("Booking not found.", 404);
    if (report.exists) return; // One durable request per booking; repeat taps cannot spam the desk.
    if (data.paymentStatus !== "pending" || expired(data)) throw new PaymentActionError("This booking is no longer pending. Please contact support with your payment reference.");
    tx.create(reportRef, { tripId, userId: uid, reference, message, status: "open", adminNote: "",
      booking: data, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    tx.update(ref, { paymentReportStatus: "open", updatedAt: FieldValue.serverTimestamp() });
  });
  return { message: "Your request has been sent to the travel team. Please do not pay again while it is being reviewed." };
}

export async function checkBookingPayment(tripId: string, uid?: string) {
  const db = database();
  if (!validTripId(tripId)) throw new PaymentActionError("Booking not found.", 404);
  const snapshot = await db.collection("trips").doc(tripId).get();
  const report = await db.collection("paymentReports").doc(tripId).get();
  const data = snapshot.data() ?? report.data()?.booking;
  if (!data || (uid && data.userId !== uid)) throw new PaymentActionError("Booking not found.", 404);
  if (data.paymentStatus === "successful") return { message: "Your payment is confirmed." };
  const results = await verifyPayuPayments(attemptIds(data), verificationConfig(data));
  const paid = [...results.values()].filter(result => result.state === "successful");
  for (const result of paid) await applySuccess(tripId, data, result);
  return { message: paid.length ? "Payment confirmed by PayU. The booking has been updated." : "PayU has not confirmed a successful payment yet. Any submitted request remains with the travel team." };
}

export async function listPaymentReports(uid?: string): Promise<PaymentReport[]> {
  const collection = database().collection("paymentReports");
  // A customer's own requests use the existing single-field index, so the
  // account remains usable while a deployment's cleanup index is building.
  const result = uid ? await collection.where("userId", "==", uid).get() : await collection.orderBy("createdAt", "desc").limit(100).get();
  return result.docs.map<PaymentReport>(doc => {
    const data = doc.data();
    const booking = data.booking || {};
    return { id: doc.id, tripId: data.tripId, packageTitle: booking.packageTitle || "Travel package",
      name: booking.name || "", email: booking.email || "", phone: booking.phone || "", amount: booking.amount || 0,
      reference: data.reference || "", message: data.message || "", status: data.status === "resolved" ? "resolved" : "open",
      adminNote: data.adminNote || "", createdAt: Number.isFinite(millis(data.createdAt)) ? new Date(millis(data.createdAt)).toISOString() : "" };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 100);
}

export async function resolvePaymentReport(tripId: string, note: string) {
  if (!validTripId(tripId) || note.length < 4 || note.length > 2000) throw new PaymentActionError("Enter a reply of 4–2,000 characters for the traveller.", 400);
  const db = database();
  const ref = db.collection("paymentReports").doc(tripId);
  await db.runTransaction(async tx => {
    const report = await tx.get(ref);
    const tripRef = db.collection("trips").doc(tripId);
    const trip = await tx.get(tripRef);
    if (!report.exists) throw new PaymentActionError("Request not found.", 404);
    tx.update(ref, { status: "resolved", adminNote: note, updatedAt: FieldValue.serverTimestamp() });
    if (trip.exists) tx.update(tripRef, { paymentReportStatus: "resolved", updatedAt: FieldValue.serverTimestamp() });
  });
}

/** Delete only expired pending rows, after reconciling every known attempt. */
export async function cleanupPendingPayments() {
  const db = database();
  const cutoff = Timestamp.fromMillis(Date.now() - PENDING_PAYMENT_TTL_MS);
  // Continue past retained rows on the next run; a gateway outage for one
  // old payment must not prevent cleanup of every newer expired booking.
  const cursorRef = db.collection("maintenance").doc("pending-payment-cleanup");
  const cursor = (await cursorRef.get()).data();
  let query = db.collection("trips").where("paymentStatus", "==", "pending")
    .where("createdAt", "<=", cutoff).orderBy("createdAt").orderBy(FieldPath.documentId());
  if (cursor?.createdAt && cursor?.tripId) query = query.startAfter(cursor.createdAt, cursor.tripId);
  const records = await query.limit(50).get();
  if (records.empty) {
    await cursorRef.delete();
    return { deleted: 0, recovered: 0, retained: 0 };
  }
  const config = getPayuConfig();
  const eligible = records.docs.filter(doc => !doc.data().payuEnvironment || doc.data().payuEnvironment === config?.mode);
  const ids = [...new Set(eligible.flatMap(doc => attemptIds(doc.data())))];
  const verified = new Map<string, VerifiedPayment>();
  for (let i = 0; i < ids.length; i += 100) {
    for (const [id, result] of await verifyPayuPayments(ids.slice(i, i + 100), config)) verified.set(id, result);
  }
  let deleted = 0, recovered = 0, retained = records.size - eligible.length;
  await Promise.all(eligible.map(async record => {
    const data = record.data();
    const results = attemptIds(data).map(id => verified.get(id));
    const paid = results.filter((result): result is VerifiedPayment => result?.state === "successful");
    if (paid.length) {
      for (const result of paid) await applySuccess(record.id, data, result);
      recovered++;
      return;
    }
    if (results.some(result => !result || result.state === "unknown")) { retained++; return; }
    // Guest custom payments need their reference for receipts and late callbacks.
    if (data.paymentKind === "custom") { retained++; return; }
    const removed = await db.runTransaction(async tx => {
      const latest = await tx.get(record.ref);
      const current = latest.data();
      if (!current || current.paymentStatus !== "pending" || !expired(current) || activeId(current) !== activeId(data)) return false;
      // Reports are separate records with their own booking snapshot.
      tx.delete(record.ref);
      return true;
    });
    if (removed) deleted++;
  }));
  const last = records.docs[records.docs.length - 1];
  if (records.size < 50) await cursorRef.delete();
  else await cursorRef.set({ createdAt: last.data().createdAt, tripId: last.id });
  return { deleted, recovered, retained };
}

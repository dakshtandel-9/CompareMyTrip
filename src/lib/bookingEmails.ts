import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "./firebase/admin";
import { BUSINESS_DETAILS } from "./legalPolicies";
import { CUSTOM_PAYMENT_PACKAGE_ID } from "./customPayment";
import { getSiteUrl } from "./seo";

/* ------------------------------------------------------------------ */
/* Emails sent once a payment is verified: an acknowledgement to the    */
/* traveller and a notification to the travel desk. Server-only — it    */
/* reads RESEND_API_KEY.                                                */
/*                                                                      */
/* settleTrip calls notifyPaidBooking exactly once per booking, on the  */
/* transition to "successful", whichever path got there first (PayU's   */
/* redirect, the custom-payment callback or reconciliation).            */
/*                                                                      */
/* The traveller's email acknowledges the payment; it does not confirm  */
/* the trip. The terms say a payment acknowledgement alone does not     */
/* confirm availability — the desk confirms in writing afterwards.      */
/* ------------------------------------------------------------------ */

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "CompareMyTrip <bookings@comparemytrip.in>";

/** The settled trip document, as settleTrip last wrote it. */
export type PaidBooking = {
  txnid?: string;
  name?: string;
  email?: string;
  phone?: string;
  packageId?: string;
  packageTitle?: string;
  travellers?: number;
  perPerson?: number;
  subtotal?: number;
  discount?: number;
  couponCode?: string;
  amount?: number;
  tripDate?: string;
  payuEnvironment?: "test" | "live";
  paymentKind?: "custom";
  paymentReference?: string;
  payuPaymentId?: string;
  paymentMode?: string;
  amountMismatch?: boolean;
  /** What PayU reported as charged. Shown in place of `amount` when they differ. */
  reportedAmount?: number;
};

export type EmailMessage = { to: string[]; subject: string; html: string; text: string };
type Outcome = "sent" | "failed" | "skipped";

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

const rupees = (value: number) =>
  `₹${value.toLocaleString("en-IN", { minimumFractionDigits: Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2 })}`;

function travelDay(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  });
}

const recipients = (value: string | undefined) =>
  (value ?? "").split(",").map((item) => item.trim()).filter((item) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item));

function rowsTable(rows: [string, string][]) {
  return `<table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:16px 0">${rows
    .map(([label, value]) => `<tr><td style="padding:8px 12px 8px 0;color:#64748b;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td><td style="padding:8px 0;color:#0f172a;font-weight:600">${escapeHtml(value)}</td></tr>`)
    .join("")}</table>`;
}

function layout(heading: string, body: string) {
  return `<!doctype html><html lang="en"><body style="margin:0;background:#f8fafc;font:15px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a">
<div style="max-width:560px;margin:0 auto;padding:24px 16px"><div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:24px">
<p style="margin:0 0 4px;font-size:13px;font-weight:700;letter-spacing:0.04em;color:#a37c0b">${escapeHtml(BUSINESS_DETAILS.brand)}</p>
<h1 style="margin:0 0 16px;font-size:20px;line-height:1.35">${escapeHtml(heading)}</h1>${body}</div>
<p style="margin:16px 0 0;font-size:12px;color:#64748b;text-align:center">${escapeHtml(BUSINESS_DETAILS.legalName)} · ${escapeHtml(BUSINESS_DETAILS.address)}</p></div></body></html>`;
}

/** Pure: the two messages for a paid booking. Kept separate from sending so it can be tested. */
export function buildBookingEmails(tripId: string, booking: PaidBooking, siteUrl = "https://comparemytrip.in") {
  const custom = booking.paymentKind === "custom" || booking.packageId === CUSTOM_PAYMENT_PACKAGE_ID;
  const testMode = booking.payuEnvironment === "test";
  const tag = testMode ? "[TEST] " : "";
  const charged = Number.isFinite(booking.reportedAmount) ? booking.reportedAmount! : Number(booking.amount) || 0;
  const title = booking.packageTitle?.trim() || (custom ? "Custom payment" : "Your trip");
  const firstName = booking.name?.trim().split(/\s+/)[0] || "there";
  const date = travelDay(booking.tripDate);
  const support = `${BUSINESS_DETAILS.supportEmail} or ${BUSINESS_DETAILS.supportPhone}`;

  const details: [string, string][] = [
    ["Booking reference", tripId],
    [custom ? "Payment for" : "Package", title],
    ...(!custom && booking.travellers ? [["Travellers", String(booking.travellers)] as [string, string]] : []),
    ...(!custom && date ? [["Preferred date", date] as [string, string]] : []),
    ...(booking.couponCode && booking.discount ? [["Coupon", `${booking.couponCode} (−${rupees(booking.discount)})`] as [string, string]] : []),
    ["Amount paid", rupees(charged)],
    ...(booking.payuPaymentId ? [["PayU payment ID", booking.payuPaymentId] as [string, string]] : []),
  ];

  const nextStep = custom
    ? "Our travel team has been notified and will match this payment to your booking."
    : "Our travel desk will now check availability and confirm your itinerary in writing. Your booking is confirmed only once you receive that written confirmation.";

  const traveller: EmailMessage | null = recipients(booking.email).length ? {
    to: recipients(booking.email),
    subject: `${tag}Payment received — ${title} (Ref ${tripId})`,
    html: layout("We've received your payment", `<p style="margin:0 0 12px">Hi ${escapeHtml(firstName)},</p>
<p style="margin:0 0 12px">Thank you — your payment to ${escapeHtml(BUSINESS_DETAILS.brand)} was successful.</p>
${rowsTable(details)}
<p style="margin:0 0 12px">${escapeHtml(nextStep)}</p>
<p style="margin:0">Questions? Reply to this email or contact us at ${escapeHtml(support)}. Please quote your booking reference.</p>`),
    text: [
      `Hi ${firstName},`, "",
      `Thank you — your payment to ${BUSINESS_DETAILS.brand} was successful.`, "",
      ...details.map(([label, value]) => `${label}: ${value}`), "",
      nextStep, "",
      `Questions? Reply to this email or contact us at ${support}. Please quote your booking reference.`,
    ].join("\n"),
  } : null;

  const opsDetails: [string, string][] = [
    ...details,
    ["Traveller", booking.name?.trim() || "—"],
    ["Email", booking.email?.trim() || "—"],
    ["Phone", booking.phone?.trim() || "—"],
    ...(custom && booking.paymentReference ? [["Reference given", booking.paymentReference] as [string, string]] : []),
    ...(booking.paymentMode ? [["Payment mode", booking.paymentMode] as [string, string]] : []),
    ["PayU environment", testMode ? "TEST" : "Live"],
  ];
  const warning = booking.amountMismatch
    ? `PayU reported ${rupees(charged)}, which does not match the expected ${rupees(Number(booking.amount) || 0)}. Check this payment before confirming.`
    : "";
  const adminUrl = new URL("/admin/trips", siteUrl).toString();

  const ops: EmailMessage = {
    to: recipients(process.env.BOOKING_NOTIFICATION_EMAIL || BUSINESS_DETAILS.supportEmail),
    subject: `${tag}${booking.amountMismatch ? "⚠ CHECK AMOUNT — " : ""}New ${custom ? "custom payment" : "paid booking"}: ${title} — ${rupees(charged)}`,
    html: layout(custom ? "New custom payment" : "New paid booking", `${warning ? `<p style="margin:0 0 12px;padding:12px;border-radius:8px;background:#fef2f2;color:#991b1b;font-weight:600">${escapeHtml(warning)}</p>` : ""}
${rowsTable(opsDetails)}
<p style="margin:0">Status: awaiting confirmation. <a href="${escapeHtml(adminUrl)}" style="color:#a37c0b">Open trips in the admin panel</a>.</p>`),
    text: [
      ...(warning ? [warning, ""] : []),
      ...opsDetails.map(([label, value]) => `${label}: ${value}`), "",
      `Status: awaiting confirmation. Admin: ${adminUrl}`,
    ].join("\n"),
  };

  return { traveller, ops };
}

async function send(message: EmailMessage, idempotencyKey: string, apiKey: string): Promise<Outcome> {
  if (!message.to.length) return "skipped";
  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
      body: JSON.stringify({
        from: process.env.BOOKING_EMAIL_FROM?.trim() || DEFAULT_FROM,
        to: message.to,
        reply_to: BUSINESS_DETAILS.supportEmail,
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (response.ok) return "sent";
    // The body names the problem (unverified domain, bad key) without echoing the key.
    console.error(`Booking email was rejected (${response.status}): ${(await response.text()).slice(0, 300)}`);
    return "failed";
  } catch (cause) {
    console.error("Booking email could not be sent", cause instanceof Error ? cause.message : cause);
    return "failed";
  }
}

/** Sends both emails and records the outcome on the trip. Never throws: a
    failed email must not cost the traveller their payment confirmation page. */
export async function notifyPaidBooking(tripId: string, booking: PaidBooking) {
  try {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const { traveller, ops } = buildBookingEmails(tripId, booking, getSiteUrl().origin);
    let result: { traveller: Outcome; ops: Outcome };
    if (!apiKey) {
      console.warn("RESEND_API_KEY is not set; booking emails were not sent.");
      result = { traveller: "skipped", ops: "skipped" };
    } else {
      const [travellerOutcome, opsOutcome] = await Promise.all([
        traveller ? send(traveller, `booking-${tripId}-traveller`, apiKey) : Promise.resolve<Outcome>("skipped"),
        send(ops, `booking-${tripId}-ops`, apiKey),
      ]);
      result = { traveller: travellerOutcome, ops: opsOutcome };
    }
    await getAdminDb()?.collection("trips").doc(tripId).update({
      confirmationEmail: { ...result, at: FieldValue.serverTimestamp() },
    });
  } catch (cause) {
    console.error("Booking notification failed", cause instanceof Error ? cause.message : cause);
  }
}

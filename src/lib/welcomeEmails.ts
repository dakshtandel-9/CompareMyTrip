import { createHash } from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { emailApiKey, emailButton, emailLayout, escapeHtml, recipients, sendEmail, type EmailMessage, type Outcome } from "./email";
import { getAdminAuth, getAdminDb } from "./firebase/admin";
import { BUSINESS_DETAILS } from "./legalPolicies";
import { getSiteUrl } from "./seo";

/* ------------------------------------------------------------------ */
/* Welcome emails for a new account and a new newsletter subscriber.    */
/* Server-only. Each address or account is welcomed at most once: a     */
/* Firestore transaction claims the welcome before anything is sent.    */
/* ------------------------------------------------------------------ */

/** Only an account created this recently is welcomed; older ones are existing customers signing in. */
const NEW_ACCOUNT_WINDOW_MS = 60 * 60 * 1000;
const NEWSLETTER_LIMIT_PER_HOUR = 10;

const firstNameOf = (name: string | undefined) => name?.trim().split(/\s+/)[0] || "there";
const support = `${BUSINESS_DETAILS.supportEmail} or ${BUSINESS_DETAILS.supportPhone}`;

/** Pure: the welcome for a new account. `guest` accounts were created for them at checkout. */
export function buildAccountWelcomeEmail(
  { name, email, guest = false }: { name?: string; email: string; guest?: boolean },
  siteUrl = "https://comparemytrip.in",
): EmailMessage | null {
  const to = recipients(email);
  if (!to.length) return null;
  const firstName = firstNameOf(name);
  const packagesUrl = new URL("/packages", siteUrl).toString();
  const accountUrl = new URL("/account", siteUrl).toString();
  const resetUrl = new URL("/forgot-password", siteUrl).toString();

  const intro = guest
    ? `We created a ${BUSINESS_DETAILS.brand} account for ${email} when you checked out, so your bookings and payments stay in one place.`
    : `Thanks for creating your ${BUSINESS_DETAILS.brand} account. You're all set to compare trips and book with us.`;
  const points = [
    "Compare tour packages side by side — price, inclusions and itinerary.",
    "Save your details once for faster quotes and checkout.",
    "Track your bookings and payments from your account.",
  ];
  const guestNote = `To sign in later, set a password from ${resetUrl}, or continue with Google using this email.`;

  return {
    to,
    subject: `Welcome to ${BUSINESS_DETAILS.brand}, ${firstName}!`,
    html: emailLayout(`Welcome to ${BUSINESS_DETAILS.brand}`, `<p style="margin:0 0 12px">Hi ${escapeHtml(firstName)},</p>
<p style="margin:0 0 12px">${escapeHtml(intro)}</p>
<ul style="margin:0 0 12px;padding-left:20px">${points.map((point) => `<li style="margin:0 0 6px">${escapeHtml(point)}</li>`).join("")}</ul>
${guest ? `<p style="margin:0 0 12px">To sign in later, <a href="${escapeHtml(resetUrl)}" style="color:#a37c0b">set a password</a>, or continue with Google using this email.</p>` : ""}
${emailButton(guest ? accountUrl : packagesUrl, guest ? "Open my account" : "Explore packages")}
<p style="margin:0">Questions? Just reply to this email or reach us at ${escapeHtml(support)}.</p>`),
    text: [
      `Hi ${firstName},`, "",
      intro, "",
      ...points.map((point) => `- ${point}`), "",
      ...(guest ? [guestNote, ""] : []),
      guest ? `Open your account: ${accountUrl}` : `Explore packages: ${packagesUrl}`, "",
      `Questions? Just reply to this email or reach us at ${support}.`,
    ].join("\n"),
  };
}

/** Pure: the welcome for a new newsletter subscriber. */
export function buildNewsletterWelcomeEmail(email: string, siteUrl = "https://comparemytrip.in"): EmailMessage | null {
  const to = recipients(email);
  if (!to.length) return null;
  const packagesUrl = new URL("/packages", siteUrl).toString();
  const unsubscribe = `mailto:${BUSINESS_DETAILS.supportEmail}?subject=Unsubscribe`;
  const points = [
    "Handpicked deals and limited-time offers on tour packages.",
    "Destination guides and travel tips from our team.",
    "Early word on new trips, before they fill up.",
  ];

  return {
    to,
    subject: `You're subscribed to ${BUSINESS_DETAILS.brand} travel deals`,
    html: emailLayout("Thanks for subscribing!", `<p style="margin:0 0 12px">Hi there,</p>
<p style="margin:0 0 12px">You're now on the ${escapeHtml(BUSINESS_DETAILS.brand)} newsletter. Here's what you'll get:</p>
<ul style="margin:0 0 12px;padding-left:20px">${points.map((point) => `<li style="margin:0 0 6px">${escapeHtml(point)}</li>`).join("")}</ul>
${emailButton(packagesUrl, "Browse current deals")}
<p style="margin:0 0 12px">Questions? Just reply to this email or reach us at ${escapeHtml(support)}.</p>
<p style="margin:0;font-size:12px;color:#64748b">Didn't sign up, or changed your mind? <a href="${escapeHtml(unsubscribe)}" style="color:#64748b">Unsubscribe</a> by replying "unsubscribe".</p>`),
    text: [
      "Hi there,", "",
      `You're now on the ${BUSINESS_DETAILS.brand} newsletter. Here's what you'll get:`, "",
      ...points.map((point) => `- ${point}`), "",
      `Browse current deals: ${packagesUrl}`, "",
      `Questions? Just reply to this email or reach us at ${support}.`, "",
      `Didn't sign up, or changed your mind? Reply "unsubscribe" to this email.`,
    ].join("\n"),
    headers: { "List-Unsubscribe": `<${unsubscribe}>` },
  };
}

/** Welcomes a newly created account once. Never throws. */
export async function welcomeNewAccount(uid: string, { guest = false }: { guest?: boolean } = {}): Promise<Outcome> {
  try {
    const auth = getAdminAuth();
    const db = getAdminDb();
    const apiKey = emailApiKey();
    if (!auth || !db || !apiKey) return "skipped";

    const user = await auth.getUser(uid);
    const created = Date.parse(user.metadata.creationTime);
    if (!user.email || !(Date.now() - created < NEW_ACCOUNT_WINDOW_MS)) return "skipped";
    const message = buildAccountWelcomeEmail({ name: user.displayName, email: user.email, guest }, getSiteUrl().origin);
    if (!message) return "skipped";

    // Admin-only collection: the customer's own `users` document is client-writable.
    const marker = db.collection("welcomeEmails").doc(uid);
    const claimed = await db.runTransaction(async (tx) => {
      if ((await tx.get(marker)).exists) return false;
      tx.create(marker, { email: user.email, guest, state: "sending", at: FieldValue.serverTimestamp() });
      return true;
    });
    if (!claimed) return "skipped";

    const outcome = await sendEmail(message, `welcome-${uid}`, apiKey);
    await marker.update({ state: outcome, at: FieldValue.serverTimestamp() });
    return outcome;
  } catch (cause) {
    console.error("Welcome email failed", cause instanceof Error ? cause.message : cause);
    return "failed";
  }
}

export type NewsletterResult = "subscribed" | "already-subscribed" | "rate-limited";

/**
 * Records a newsletter subscriber and welcomes them the first time only.
 * Throws when the subscription itself cannot be saved; a failed welcome
 * email is logged and does not undo the subscription.
 */
export async function subscribeToNewsletter(rawEmail: string, clientIp: string): Promise<NewsletterResult> {
  const db = getAdminDb();
  if (!db) throw new Error("Newsletter storage is not configured.");
  const email = rawEmail.trim().toLowerCase();
  const now = Date.now();

  // Each address is welcomed only once, but someone could still feed in many
  // different addresses. A per-IP hourly cap keeps the welcome from being spam.
  const limitKey = createHash("sha256").update(`${process.env.CRON_SECRET ?? ""}:${clientIp}:${Math.floor(now / 3_600_000)}`).digest("hex");
  const limitRef = db.collection("newsletterLimits").doc(limitKey);
  const subscriberRef = db.collection("newsletterSubscribers").doc(encodeURIComponent(email));

  const result = await db.runTransaction<NewsletterResult>(async (tx) => {
    const [limit, subscriber] = await Promise.all([tx.get(limitRef), tx.get(subscriberRef)]);
    if (subscriber.exists) return "already-subscribed";
    const count = limit.data()?.count || 0;
    if (count >= NEWSLETTER_LIMIT_PER_HOUR) return "rate-limited";
    tx.set(limitRef, { count: count + 1, expiresAt: Timestamp.fromMillis(now + 3_600_000) });
    // Same shape the admin subscriber list reads.
    tx.create(subscriberRef, { email, subscribedAt: FieldValue.serverTimestamp() });
    return "subscribed";
  });
  if (result !== "subscribed") return result;

  const apiKey = emailApiKey();
  const message = buildNewsletterWelcomeEmail(email, getSiteUrl().origin);
  if (!apiKey) console.warn("RESEND_API_KEY is not set; the newsletter welcome email was not sent.");
  else if (message) await sendEmail(message, `newsletter-${createHash("sha256").update(email).digest("hex")}`, apiKey);
  return result;
}

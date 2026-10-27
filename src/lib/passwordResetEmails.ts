import { createHash, randomUUID } from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";

import { emailApiKey, emailButton, emailContact, emailLayout, escapeHtml, recipients, sendEmail, type EmailMessage } from "./email";
import { getAdminAuth, getAdminDb } from "./firebase/admin";
import { BUSINESS_DETAILS } from "./legalPolicies";

/* ------------------------------------------------------------------ */
/* The password-reset email, sent through Resend in our own template    */
/* instead of Firebase's. Server-only. The link still comes from        */
/* Firebase Auth. Whenever this cannot send, the browser falls back to  */
/* Firebase's own email, so a reset never depends on Resend alone.      */
/* ------------------------------------------------------------------ */

const PER_ADDRESS_PER_HOUR = 3;
const PER_CONNECTION_PER_HOUR = 10;

export type PasswordResetResult = "sent" | "no-account" | "rate-limited" | "unavailable";

/** Pure: the reset email around a Firebase reset link. */
export function buildPasswordResetEmail({ name, email, link }: { name?: string; email: string; link: string }): EmailMessage | null {
  const to = recipients(email);
  if (!to.length) return null;
  const firstName = name?.trim().split(/\s+/)[0] || "there";
  const support = `${BUSINESS_DETAILS.supportEmail} or ${BUSINESS_DETAILS.supportPhone}`;
  const intro = `We received a request to reset the password for your ${BUSINESS_DETAILS.brand} account (${email}).`;
  const note = "The link works once and expires after a short while. If you didn't ask to reset your password, you can ignore this email — your password won't change.";

  return {
    to,
    subject: `Reset your ${BUSINESS_DETAILS.brand} password`,
    html: emailLayout("Reset your password", `<p style="margin:0 0 12px">Hi ${escapeHtml(firstName)},</p>
<p style="margin:0 0 12px">${escapeHtml(intro)}</p>
${emailButton(link, "Reset Password →")}
<p style="margin:0 0 12px">${escapeHtml(note)}</p>
${emailContact()}`, intro),
    text: [
      `Hi ${firstName},`, "",
      intro, "",
      `Reset your password: ${link}`, "",
      note, "",
      `Questions? Contact us at ${support}.`,
    ].join("\n"),
  };
}

/**
 * Sends a reset link to the account behind `rawEmail`. "no-account" must look
 * the same as "sent" to the caller, so the form never reveals who has an
 * account. Never throws.
 */
export async function sendPasswordReset(rawEmail: string, clientIp: string): Promise<PasswordResetResult> {
  const email = rawEmail.trim().toLowerCase();
  try {
    const auth = getAdminAuth();
    const db = getAdminDb();
    const apiKey = emailApiKey();
    if (!auth || !db || !apiKey) return "unavailable";

    // Caps per address and per connection keep the form from flooding an inbox.
    const hour = Math.floor(Date.now() / 3_600_000);
    const limitRef = (value: string) => db.collection("passwordResetLimits").doc(
      createHash("sha256").update(`${process.env.CRON_SECRET ?? ""}:${value}:${hour}`).digest("hex"),
    );
    const limits = [
      { ref: limitRef(`email:${email}`), max: PER_ADDRESS_PER_HOUR },
      { ref: limitRef(`ip:${clientIp}`), max: PER_CONNECTION_PER_HOUR },
    ];
    const allowed = await db.runTransaction(async (tx) => {
      const counts = await Promise.all(limits.map(async ({ ref }) => (await tx.get(ref)).data()?.count || 0));
      if (counts.some((count, index) => count >= limits[index].max)) return false;
      const expiresAt = Timestamp.fromMillis((hour + 1) * 3_600_000);
      limits.forEach(({ ref }, index) => tx.set(ref, { count: counts[index] + 1, expiresAt }));
      return true;
    });
    if (!allowed) return "rate-limited";

    const user = await auth.getUserByEmail(email).catch((cause: { code?: string }) => {
      if (cause?.code === "auth/user-not-found") return null;
      throw cause;
    });
    if (!user) return "no-account";
    const message = buildPasswordResetEmail({ name: user.displayName, email, link: await auth.generatePasswordResetLink(email) });
    if (!message) return "no-account";

    // Every request is a fresh link, so each send gets its own key.
    return (await sendEmail(message, `password-reset-${randomUUID()}`, apiKey)) === "sent" ? "sent" : "unavailable";
  } catch (cause) {
    console.error("Password reset email failed", cause instanceof Error ? cause.message : cause);
    return "unavailable";
  }
}

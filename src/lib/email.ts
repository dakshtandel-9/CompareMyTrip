import { BUSINESS_DETAILS } from "./legalPolicies";

/* ------------------------------------------------------------------ */
/* Transactional email through Resend. Server-only — it reads           */
/* RESEND_API_KEY. Every message goes out from support@ (override with  */
/* EMAIL_FROM) and replies land in the support inbox.                   */
/*                                                                      */
/* Resend refuses a From address on a domain it has not verified, so    */
/* comparemytrip.in must stay verified in the Resend dashboard.         */
/* ------------------------------------------------------------------ */

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = `CompareMyTrip <${BUSINESS_DETAILS.supportEmail}>`;

export type EmailMessage = {
  to: string[];
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
};
export type Outcome = "sent" | "failed" | "skipped";

export const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

export const recipients = (value: string | undefined) =>
  (value ?? "").split(",").map((item) => item.trim()).filter((item) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item));

export function emailLayout(heading: string, body: string) {
  return `<!doctype html><html lang="en"><body style="margin:0;background:#f8fafc;font:15px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a">
<div style="max-width:560px;margin:0 auto;padding:24px 16px"><div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:24px">
<p style="margin:0 0 4px;font-size:13px;font-weight:700;letter-spacing:0.04em;color:#a37c0b">${escapeHtml(BUSINESS_DETAILS.brand)}</p>
<h1 style="margin:0 0 16px;font-size:20px;line-height:1.35">${escapeHtml(heading)}</h1>${body}</div>
<p style="margin:16px 0 0;font-size:12px;color:#64748b;text-align:center">${escapeHtml(BUSINESS_DETAILS.legalName)} · ${escapeHtml(BUSINESS_DETAILS.address)}</p></div></body></html>`;
}

export const emailButton = (href: string, label: string) =>
  `<p style="margin:20px 0"><a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#a37c0b;color:#ffffff;font-weight:700;text-decoration:none">${escapeHtml(label)}</a></p>`;

/** The configured key, or null when email is switched off (local dev, previews). */
export const emailApiKey = () => process.env.RESEND_API_KEY?.trim() || null;

/** Sends one message. Never throws. Resend drops a repeat of the same
    idempotency key within 24 hours, so a retried request cannot double-send. */
export async function sendEmail(message: EmailMessage, idempotencyKey: string, apiKey: string): Promise<Outcome> {
  if (!message.to.length) return "skipped";
  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM?.trim() || DEFAULT_FROM,
        to: message.to,
        reply_to: BUSINESS_DETAILS.supportEmail,
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(message.headers ? { headers: message.headers } : {}),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (response.ok) return "sent";
    // The body names the problem (unverified domain, bad key) without echoing the key.
    console.error(`Email was rejected (${response.status}): ${(await response.text()).slice(0, 300)}`);
    return "failed";
  } catch (cause) {
    console.error("Email could not be sent", cause instanceof Error ? cause.message : cause);
    return "failed";
  }
}

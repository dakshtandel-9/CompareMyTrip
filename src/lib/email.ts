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

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const GOLD = "#a37c0b";
const LINK = "#1a73e8";

/* The logo, banner and icons live in public/email/. They load from the live
   site even when a local or preview build sends, because a mail client
   cannot reach localhost. Bump the version after replacing one, so inbox
   image caches pick up the new file. */
const asset = (file: string) => `${BUSINESS_DETAILS.website}/email/${file}?v=1`;

export type EmailIcon = "circle-check" | "compass" | "headphones" | "tag" | "map";
export type EmailFeature = { icon: EmailIcon; title: string; text: string };

/** Every email shares this frame: logo, banner, the message, then the address and policy links. */
export function emailLayout(heading: string, body: string, preheader = "") {
  const site = BUSINESS_DETAILS.website;
  const footerLink = "color:#6b7280;text-decoration:underline";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${escapeHtml(heading)}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font:15px/1.6 ${FONT};color:#374151">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;font:15px/1.6 ${FONT};color:#374151">
<tr><td style="padding:20px 24px"><a href="${site}"><img src="${asset("logo.png")}" width="220" height="26" alt="${escapeHtml(BUSINESS_DETAILS.brand)}" style="display:block;border:0;width:220px;height:auto"></a></td></tr>
<tr><td style="padding:0"><a href="${site}"><img src="${asset("banner.jpg")}" width="600" alt="Travel Beyond Expectations. Explore curated treks, weekend getaways and holiday packages across India and abroad." style="display:block;border:0;width:100%;max-width:600px;height:auto"></a></td></tr>
<tr><td style="padding:24px 24px 28px">
<h1 style="margin:0 0 12px;font-size:20px;line-height:1.35;color:#111827">${escapeHtml(heading)}</h1>${body}</td></tr>
<tr><td style="padding:18px 24px 20px;background:#f8fafc;border-top:1px solid #e5e7eb;text-align:center;font-size:12px;line-height:1.7;color:#6b7280">
<a href="${escapeHtml(BUSINESS_DETAILS.mapsUrl)}" style="color:#6b7280;text-decoration:none">${escapeHtml(`${BUSINESS_DETAILS.brand}, ${BUSINESS_DETAILS.address}`)}</a><br>
<a href="${site}/privacy" style="${footerLink}">Privacy Policy</a> · <a href="${site}/terms" style="${footerLink}">Terms &amp; Conditions</a>
</td></tr></table></td></tr></table></body></html>`;
}

/** A full-width gold call to action. */
export const emailButton = (href: string, label: string) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 16px"><tr><td align="center" style="border-radius:8px;background:${GOLD}"><a href="${escapeHtml(href)}" style="display:block;padding:14px 20px;border-radius:8px;background:${GOLD};color:#ffffff;font-size:15px;font-weight:700;text-align:center;text-decoration:none">${escapeHtml(label)}</a></td></tr></table>`;

/** A bold section title over icon rows, each a title and one line of detail. */
export function emailFeatures(title: string, features: EmailFeature[]) {
  return `<p style="margin:20px 0 4px;font-weight:700;color:#111827">${escapeHtml(title)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${features
    .map((feature) => `<tr><td width="30" valign="top" style="padding:11px 0 0"><img src="${asset(`icon-${feature.icon}.png`)}" width="18" height="18" alt="" style="display:block;border:0"></td><td style="padding:8px 0"><p style="margin:0;font-weight:700;color:#111827">${escapeHtml(feature.title)}</p><p style="margin:2px 0 0;font-size:14px;color:#4b5563">${escapeHtml(feature.text)}</p></td></tr>`)
    .join("")}</table>`;
}

/** The support email and phone as links, for a sentence that already says how to reach us. */
export const emailSupportLinks = () =>
  `<a href="mailto:${BUSINESS_DETAILS.supportEmail}" style="color:${LINK}">${BUSINESS_DETAILS.supportEmail}</a> or <a href="tel:${BUSINESS_DETAILS.supportPhone.replace(/\s+/g, "")}" style="color:${LINK};white-space:nowrap">${escapeHtml(BUSINESS_DETAILS.supportPhone)}</a>`;

/** "Questions? Contact us at support@… or +91…." */
export const emailContact = (lead = "Questions?") =>
  `<p style="margin:0">${escapeHtml(lead)} Contact us at ${emailSupportLinks()}.</p>`;

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

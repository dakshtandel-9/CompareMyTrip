/* ------------------------------------------------------------------ */
/* The WhatsApp line.                                                   */
/*                                                                       */
/* Two places hold the number, and the CRM wins. Fill Contact → Phone in  */
/* the CRM's "Reach us directly" list and the header's WhatsApp link and  */
/* the /contact page speak with one voice, changed without a deploy;      */
/* leave it blank and the chat still opens on the support number below.   */
/* ------------------------------------------------------------------ */

import type { ContactChannel } from "@/lib/siteContent";

/* The support WhatsApp line: digits only, country code first. */
const SUPPORT_NUMBER = "919535976868";

/** Opens the chat with the first line already written, so the traveller
    does not have to introduce themselves twice. */
const GREETING = "Hi CompareMyTrip, I would like help picking a package.";

/* wa.me wants bare digits. A ten-digit local number is Indian — the rest
   of the site prices in ₹ — so it gets the country code it is missing. */
function toWhatsAppNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;

  return digits;
}

/** The chat link for the CRM's phone channel, or the support line when that
    is empty. Empty string if neither is dialable — nothing to link to. */
export function whatsAppHref(channels: ContactChannel[]): string {
  const configured = channels.find(
    (channel) => channel.kind === "phone" && channel.value.trim() !== "",
  );

  /* A CRM entry too short to dial is a half-typed edit, not an override. */
  const fromCrm = toWhatsAppNumber(configured?.value ?? "");
  const number = fromCrm.length >= 10 ? fromCrm : SUPPORT_NUMBER;

  /* Only if someone empties the constant too. */
  if (number.length < 10) return "";

  return `https://wa.me/${number}?text=${encodeURIComponent(GREETING)}`;
}

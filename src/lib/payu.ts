/* ------------------------------------------------------------------ */
/* PayU (India) server helpers.                                         */
/*                                                                      */
/* This module must never be imported into a client component: it reads  */
/* PAYU_SALT, and the salt leaking to the browser would let anyone forge */
/* a payment request. Everything here runs in route handlers or server   */
/* components only.                                                     */
/* ------------------------------------------------------------------ */

import { getSiteUrl } from "@/lib/seo";
import { LEGAL_POLICIES_APPROVED } from "@/lib/legalPolicies";

import { createHash, randomUUID } from "node:crypto";

import { DUMMY_PACKAGES, type TravelPackage } from "@/lib/packageData";

const ENDPOINTS = {
  test: "https://test.payu.in/_payment",
  live: "https://secure.payu.in/_payment",
} as const;

export type PayuConfig = {
  key: string;
  salt: string;
  mode: keyof typeof ENDPOINTS;
  endpoint: string;
};

/** Null when the merchant credentials have not been supplied yet. */
export function getPayuConfig(): PayuConfig | null {
  const key = process.env.PAYU_MERCHANT_KEY;
  const salt = process.env.PAYU_SALT;
  if (!key || !salt) return null;

  const mode = process.env.PAYU_MODE === "live" ? "live" : "test";
  // Never accept production money with placeholder policies or sandbox settings.
  if (mode === "live" && (
    !LEGAL_POLICIES_APPROVED ||
    process.env.PAYU_LIVE_PAYMENTS_ENABLED !== "true" ||
    process.env.NEXT_PUBLIC_SITE_URL !== "https://comparemytrip.in"
  )) return null;
  return { key, salt, mode, endpoint: ENDPOINTS[mode] };
}

/* The catalogue the server can vouch for. Admin-created packages live in
   the visitor's own localStorage, so the server cannot price them — see
   resolvePackage. */
export function resolvePackage(id: string): TravelPackage | null {
  return DUMMY_PACKAGES.find((item) => item.id === id) ?? null;
}

export const MAX_TRAVELLERS = 20;

export function normaliseTravellers(raw: string | number | null | undefined) {
  const parsed = Math.trunc(Number(raw));
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.min(parsed, MAX_TRAVELLERS);
}

/** A calendar day in YYYY-MM-DD, or "" when the browser sent nothing
    usable. Stored as a plain day rather than a timestamp for the reason
    given on Trip.tripDate: the 14th is the 14th wherever it is read.

    A day's grace on the lower bound is deliberate. The server may be running
    in UTC while the traveller is a day ahead of it, and refusing the date
    someone just picked out of a calendar — because it is still yesterday in
    Greenwich — would be an error they cannot act on. The travel desk sees
    the requested date and confirms it either way, so leniency here costs
    nothing and a false rejection costs the booking. */
export function normaliseTravelDate(raw: string | null | undefined) {
  const value = String(raw ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  // Rejects the 31st of a 30-day month, which Date would roll into the 1st.
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return "";
  }

  const floor = Date.now() - 24 * 60 * 60 * 1000;
  return parsed.getTime() < floor ? "" : value;
}

/** The only place an amount is ever decided. Anything posted by a browser
    is treated as a hint about *which* package, never about the price — and
    a coupon is a hint about which code to check, never about how much it
    takes off. The discount passed here is the one the server worked out
    itself, in @/lib/couponServer. */
export function priceOrder(pkg: TravelPackage, travellers: number, discount = 0) {
  const count = normaliseTravellers(travellers);
  const subtotal = pkg.price * count;
  /* Defence in depth: the discount arrives already clamped by
     discountFor(), and is clamped again here so no caller can drive the
     amount below what the gateway will take. */
  const applied = Math.max(0, Math.min(Math.floor(discount), Math.max(0, subtotal - 1)));
  const total = subtotal - applied;

  return {
    travellers: count,
    perPerson: pkg.price,
    subtotal,
    discount: applied,
    total,
    amount: total.toFixed(2),
  };
}

export function newTransactionId() {
  return `CMT${Date.now().toString(36)}${randomUUID().replace(/-/g, "").slice(0, 10)}`.toUpperCase();
}

const sha512 = (value: string) =>
  createHash("sha512").update(value, "utf8").digest("hex");

export type Udf = [string, string, string, string, string];

/** key|txnid|amount|productinfo|firstname|email|udf1..udf5|||||| salt */
export function buildRequestHash(input: {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  udf: Udf;
  salt: string;
}) {
  return sha512(
    [
      input.key,
      input.txnid,
      input.amount,
      input.productinfo,
      input.firstname,
      input.email,
      ...input.udf,
      "",
      "",
      "",
      "",
      "",
      input.salt,
    ].join("|"),
  );
}

/** salt|status||||||udf5..udf1|email|firstname|productinfo|amount|txnid|key
    PayU prefixes additionalCharges when it applied any. */
export function buildResponseHash(input: {
  salt: string;
  status: string;
  udf: Udf;
  email: string;
  firstname: string;
  productinfo: string;
  amount: string;
  txnid: string;
  key: string;
  additionalCharges?: string;
}) {
  const base = [
    input.salt,
    input.status,
    "",
    "",
    "",
    "",
    "",
    ...[...input.udf].reverse(),
    input.email,
    input.firstname,
    input.productinfo,
    input.amount,
    input.txnid,
    input.key,
  ].join("|");

  return sha512(input.additionalCharges ? `${input.additionalCharges}|${base}` : base);
}

/** Constant-time compare so a mismatched hash cannot be probed byte by byte. */
export function hashesMatch(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** PayU needs absolute surl/furl. Prefer the configured site URL, fall back
    to whatever host the request actually arrived on. */
export function siteOrigin(request: Request) {
  if (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_SITE_URL) {
    return getSiteUrl().origin;
  }
  return new URL(request.url).origin;
}

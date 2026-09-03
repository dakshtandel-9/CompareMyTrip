/* ------------------------------------------------------------------ */
/* Discount coupons.                                                    */
/*                                                                      */
/* The shape of a coupon and the one function that decides whether it    */
/* applies. Pure on purpose: the checkout preview, the /api/coupons      */
/* validator and the PayU initiate route all run this same code, so what */
/* the traveller is quoted and what the server signs can never drift.    */
/*                                                                      */
/* Nothing here reads Firestore or the network — see                     */
/* lib/firebase/coupons.ts (CRM writes) and lib/firebase/serverCoupons   */
/* (the server's reads and counts).                                      */
/*                                                                      */
/* One coupon per order. Stacking two offers is a pricing decision no    */
/* CRM field here expresses, so the checkout applies the single best     */
/* one rather than quietly summing them.                                 */
/* ------------------------------------------------------------------ */

/** How the discount is worked out.

    `percent` covers both "12% off" and "12% off, up to ₹2,000" — the cap
    is `maxDiscount`, and 0 means uncapped. `flat` is a straight rupee
    amount off, usually paired with `minOrderValue`. */
export type CouponType = "percent" | "flat";

export type Coupon = {
  /** Uppercase, no spaces. Doubles as the Firestore document id. */
  code: string;
  /** What this offer is, in the CRM list and on the checkout line. */
  label: string;
  type: CouponType;
  /** percent only, 0–100. */
  percentOff: number;
  /** flat only, in rupees. */
  flatOff: number;
  /** percent only: the rupee ceiling on the discount. 0 = uncapped. */
  maxDiscount: number;
  /** The order must reach this before the coupon applies. 0 = no floor. */
  minOrderValue: number;
  /** Only on a traveller's first paid booking. */
  firstBookingOnly: boolean;
  /** Applied without anyone typing it, whenever the order qualifies. */
  autoApply: boolean;
  /** Off means the code is refused, whatever else it says. */
  active: boolean;
  /** YYYY-MM-DD, inclusive, in IST. Empty either side = open-ended. */
  startsOn: string;
  endsOn: string;
  /** Successful redemptions allowed across everyone. 0 = unlimited. */
  usageLimit: number;
  /** Successful redemptions allowed per traveller. 0 = unlimited. */
  perUserLimit: number;
  /** Empty = every package. Otherwise only these package ids. */
  packageIds: string[];
};

export const BLANK_COUPON: Coupon = {
  code: "",
  label: "",
  type: "percent",
  percentOff: 10,
  flatOff: 0,
  maxDiscount: 0,
  minOrderValue: 0,
  firstBookingOnly: false,
  autoApply: false,
  active: true,
  startsOn: "",
  endsOn: "",
  usageLimit: 0,
  perUserLimit: 1,
  packageIds: [],
};

/** PayU will not take a ₹0 order, so a coupon can take an order down to
    this and no further. A discount that would clear the whole bill is
    trimmed by a rupee rather than refused — the traveller keeps the offer,
    and the gateway still has something to charge. */
export const MIN_PAYABLE = 1;

/** Codes are typed by hand, often off a poster. Case and stray spaces are
    not part of the code. */
export const normaliseCode = (raw: string) =>
  raw.toUpperCase().replace(/\s+/g, "").replace(/[^A-Z0-9_-]/g, "").slice(0, 32);

/** Today in IST as YYYY-MM-DD. The business runs on Indian dates, so a
    coupon that ends "on the 30th" ends at midnight in Delhi, not UTC. */
export function todayInIndia(now: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** The money off, before any eligibility question is asked. Whole rupees,
    rounded down, never more than the order can give up. */
export function discountFor(coupon: Coupon, subtotal: number): number {
  const raw =
    coupon.type === "percent"
      ? Math.floor((subtotal * clampPercent(coupon.percentOff)) / 100)
      : Math.floor(Math.max(0, coupon.flatOff));

  const capped =
    coupon.type === "percent" && coupon.maxDiscount > 0
      ? Math.min(raw, Math.floor(coupon.maxDiscount))
      : raw;

  const ceiling = Math.max(0, subtotal - MIN_PAYABLE);
  return Math.max(0, Math.min(capped, ceiling));
}

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

/* What the checkout knows about the order and the traveller when it asks
   whether a coupon holds. `isFirstBooking` is null when nobody has been
   identified yet — a signed-out visitor typing a code before their account
   exists. That is treated as eligible for the preview, and re-asked for
   real in /api/payu/initiate once there is an account to check against. */
export type CouponContext = {
  subtotal: number;
  packageId: string;
  /** YYYY-MM-DD in IST. */
  today: string;
  isFirstBooking: boolean | null;
  /** Successful bookings this traveller has already used the code on. */
  timesUsedByUser: number;
  /** Successful bookings anyone has used the code on. */
  timesUsedTotal: number;
};

/** A coupon as the checkout shows it: the outcome of a server decision,
    carried to the browser. Lives here rather than in couponServer so a
    client component can name the type without importing the Admin SDK. */
export type AppliedCoupon = {
  code: string;
  label: string;
  headline: string;
  discount: number;
  /** True when nobody typed it — the offer found the order, not the other
      way round. Worth saying on the checkout line. */
  auto: boolean;
};

export type CouponCheck =
  | { ok: true; discount: number }
  | { ok: false; reason: string };

const formatINR = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;

/**
 * The whole eligibility rulebook, in the order a traveller would want to
 * hear it: the code itself first, then the calendar, then the order, then
 * how often it has been used.
 *
 * Reasons are written to be shown as-is at checkout, so they say what to do
 * about it where there is anything to do.
 */
export function checkCoupon(coupon: Coupon, context: CouponContext): CouponCheck {
  if (!coupon.active) {
    return { ok: false, reason: "That code is no longer being accepted." };
  }

  if (coupon.startsOn && context.today < coupon.startsOn) {
    return { ok: false, reason: "That code has not started yet." };
  }

  if (coupon.endsOn && context.today > coupon.endsOn) {
    return { ok: false, reason: "That code has expired." };
  }

  if (coupon.packageIds.length > 0 && !coupon.packageIds.includes(context.packageId)) {
    return { ok: false, reason: "That code does not apply to this package." };
  }

  if (coupon.minOrderValue > 0 && context.subtotal < coupon.minOrderValue) {
    return {
      ok: false,
      reason: `That code needs an order of ${formatINR(coupon.minOrderValue)} or more.`,
    };
  }

  if (coupon.firstBookingOnly && context.isFirstBooking === false) {
    return { ok: false, reason: "That code is only for a first booking." };
  }

  if (coupon.usageLimit > 0 && context.timesUsedTotal >= coupon.usageLimit) {
    return { ok: false, reason: "That code has been fully claimed." };
  }

  if (coupon.perUserLimit > 0 && context.timesUsedByUser >= coupon.perUserLimit) {
    return { ok: false, reason: "You have already used that code." };
  }

  const discount = discountFor(coupon, context.subtotal);
  if (discount <= 0) {
    return { ok: false, reason: "That code takes nothing off this order." };
  }

  return { ok: true, discount };
}

/** The offer in one line — "12% off, up to ₹2,000" — for the CRM list and
    the applied-coupon row at checkout. */
export function couponHeadline(coupon: Coupon): string {
  const base =
    coupon.type === "percent"
      ? `${clampPercent(coupon.percentOff)}% off`
      : `${formatINR(coupon.flatOff)} off`;

  const parts = [base];
  if (coupon.type === "percent" && coupon.maxDiscount > 0) {
    parts.push(`up to ${formatINR(coupon.maxDiscount)}`);
  }
  if (coupon.minOrderValue > 0) {
    parts.push(`on ${formatINR(coupon.minOrderValue)}+`);
  }
  if (coupon.firstBookingOnly) {
    parts.push("first booking only");
  }

  return parts.join(" · ");
}

/** Reads an untrusted Firestore document into a Coupon, with the blank as
    the floor. Both the CRM and the server go through here, so a document
    written before a field existed still loads. */
export function toCoupon(id: string, raw: unknown): Coupon {
  const data = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const str = (value: unknown, fallback = "") =>
    typeof value === "string" ? value.trim() : fallback;
  const num = (value: unknown, fallback = 0) =>
    typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;
  const bool = (value: unknown, fallback: boolean) =>
    typeof value === "boolean" ? value : fallback;

  return {
    code: normaliseCode(str(data.code) || id),
    label: str(data.label),
    type: data.type === "flat" ? "flat" : "percent",
    percentOff: clampPercent(num(data.percentOff)),
    flatOff: num(data.flatOff),
    maxDiscount: num(data.maxDiscount),
    minOrderValue: num(data.minOrderValue),
    firstBookingOnly: bool(data.firstBookingOnly, false),
    autoApply: bool(data.autoApply, false),
    active: bool(data.active, true),
    startsOn: str(data.startsOn),
    endsOn: str(data.endsOn),
    usageLimit: num(data.usageLimit),
    perUserLimit: num(data.perUserLimit),
    packageIds: Array.isArray(data.packageIds)
      ? data.packageIds.filter((item): item is string => typeof item === "string")
      : [],
  };
}

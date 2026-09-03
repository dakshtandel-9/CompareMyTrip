/* ------------------------------------------------------------------ */
/* Deciding a coupon, server-side.                                      */
/*                                                                      */
/* Never import into a client component: it reaches Firestore through    */
/* the Admin SDK. Both /api/coupons/validate (what the traveller is      */
/* quoted) and /api/payu/initiate (what actually gets signed) call this  */
/* one function, so the price on the screen and the price at the         */
/* gateway are decided by the same code path, from the same data, at     */
/* two moments — and initiate is the one that counts.                    */
/* ------------------------------------------------------------------ */

import {
  checkCoupon,
  couponHeadline,
  todayInIndia,
  type AppliedCoupon,
  type Coupon,
  type CouponContext,
} from "@/lib/coupons";
import {
  countCouponUses,
  fetchAutoCoupons,
  fetchCoupon,
  isFirstBooking,
} from "@/lib/firebase/serverCoupons";

export type CouponResolution = {
  applied: AppliedCoupon | null;
  /** Why a typed code was refused. Empty when nothing was typed: an
      auto-apply offer that does not fit is simply not mentioned. */
  error: string;
};

type Identity = { userId: string; email: string };

export async function resolveCoupon(input: {
  /** Empty looks for an auto-apply offer instead. */
  requestedCode: string;
  packageId: string;
  subtotal: number;
  identity: Identity;
}): Promise<CouponResolution> {
  const today = todayInIndia();

  /* Both of these cost a query, and most coupons need neither. Resolved at
     most once per request, and only if some candidate actually asks. */
  let firstBooking: Promise<boolean | null> | undefined;
  const firstBookingOnce = () => {
    firstBooking ??= isFirstBooking(input.identity);
    return firstBooking;
  };

  const contextFor = async (coupon: Coupon): Promise<CouponContext> => {
    const counts =
      coupon.usageLimit > 0 || coupon.perUserLimit > 0
        ? await countCouponUses(coupon.code, input.identity)
        : { total: 0, byUser: 0 };

    return {
      subtotal: input.subtotal,
      packageId: input.packageId,
      today,
      isFirstBooking: coupon.firstBookingOnly ? await firstBookingOnce() : null,
      timesUsedByUser: counts.byUser,
      timesUsedTotal: counts.total,
    };
  };

  if (input.requestedCode) {
    const coupon = await fetchCoupon(input.requestedCode);
    if (!coupon) {
      return { applied: null, error: "We don't recognise that code." };
    }

    const verdict = checkCoupon(coupon, await contextFor(coupon));
    if (!verdict.ok) return { applied: null, error: verdict.reason };

    return { applied: describe(coupon, verdict.discount, false), error: "" };
  }

  /* Nothing typed: the best standing offer this order qualifies for. Best
     by rupees off, so an order that clears two auto offers gets the one
     the traveller would have picked. */
  const candidates = await fetchAutoCoupons();
  let best: AppliedCoupon | null = null;

  for (const coupon of candidates) {
    const verdict = checkCoupon(coupon, await contextFor(coupon));
    if (!verdict.ok) continue;
    if (!best || verdict.discount > best.discount) {
      best = describe(coupon, verdict.discount, true);
    }
  }

  return { applied: best, error: "" };
}

const describe = (coupon: Coupon, discount: number, auto: boolean): AppliedCoupon => ({
  code: coupon.code,
  label: coupon.label || couponHeadline(coupon),
  headline: couponHeadline(coupon),
  discount,
  auto,
});

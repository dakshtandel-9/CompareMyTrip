"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "@/components/SiteImage";
import { Minus, Plus, TriangleAlert, X } from "lucide-react";

import type { AppliedCoupon } from "@/lib/coupons";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { useAuthUser } from "@/lib/firebase/useAuthUser";
import { formatTripDate } from "@/lib/firebase/trips";
import CheckoutForm from "./CheckoutForm";
import CouponCard from "./CouponCard";

/* ------------------------------------------------------------------ */
/* The two checkout panels, and the one thing they share.               */
/*                                                                      */
/* The coupon is entered and shown inside the summary, then posted by    */
/* the buyer form, so the applied coupon is held here — one owner, no     */
/* duplicated state, and the summary can never disagree with the code    */
/* that is actually going to be submitted.                               */
/*                                                                      */
/* Everything money-related is still the server's word: this asks        */
/* /api/coupons/validate what a code is worth and displays the answer.   */
/* The amount that gets signed is worked out again in                    */
/* /api/payu/initiate, from the catalogue price, whatever is on screen.  */
/* ------------------------------------------------------------------ */

const formatINR = (value: number) => `₹${value.toLocaleString("en-IN")}`;

type Props = {
  packageId: string;
  packageTitle: string;
  packageLocation: string;
  packageImage: string;
  nights: number;
  days: number;
  perPerson: number;
  maxTravellers: number;
  travelDate: string;
  configured: boolean;
};

export default function CheckoutPanels({
  packageId,
  packageTitle,
  packageLocation,
  packageImage,
  nights,
  days,
  perPerson,
  maxTravellers,
  travelDate,
  configured,
}: Props) {
  const user = useAuthUser();

  const [applied, setApplied] = useState<AppliedCoupon | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  /* Checkout always opens on one traveller, whatever was picked on the
     package page; the traveller sets the real number here. */
  const [travellers, setTravellers] = useState(1);
  const [summaryOpen, setSummaryOpen] = useState(true);
  /* A standing offer this order qualifies for. It is only ever suggested:
     the traveller applies it themselves, like any other code. */
  const [offer, setOffer] = useState<AppliedCoupon | null>(null);

  const validate = useCallback(
    async (code: string, count: number) => {
      let idToken = "";
      try {
        idToken = (await getFirebaseAuth().currentUser?.getIdToken()) ?? "";
      } catch {
        // Coupons keyed to a first booking simply go unrecognised without a
        // token; initiate re-checks with one in hand.
      }

      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code, packageId, travellers: count, idToken }),
      });

      return (await response.json()) as {
        ok: boolean;
        coupon?: AppliedCoupon;
        message?: string;
      };
    },
    [packageId],
  );

  // Standing offers, looked for once the auth state has settled — an offer
  // for a first booking needs to know whose booking it is.
  useEffect(() => {
    if (user === undefined) return;

    let cancelled = false;
    void (async () => {
      try {
        const result = await validate("", travellers);
        if (!cancelled) setOffer(result.ok && result.coupon ? result.coupon : null);
      } catch {
        // No standing offer is the normal case; a failure looks the same.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, validate, travellers]);

  const handleApply = async (code: string) => {
    setBusy(true);
    setError("");
    try {
      const result = await validate(code, travellers);
      if (result.ok && result.coupon) {
        setApplied(result.coupon);
      } else {
        setError(result.message || "That code could not be applied.");
      }
    } catch {
      setError("We couldn't check that code just now. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  /* A coupon's worth depends on the order, so a held code is checked again
     for the new head-count; if it no longer fits it comes off and says why. */
  const changeTravellers = async (next: number) => {
    const count = Math.min(maxTravellers, Math.max(1, next));
    if (count === travellers) return;
    setTravellers(count);
    if (!applied) return;
    setBusy(true);
    setError("");
    try {
      const result = await validate(applied.code, count);
      if (result.ok && result.coupon) setApplied(result.coupon);
      else {
        setApplied(null);
        setError(result.message || `${applied.code} no longer applies to this order.`);
      }
    } catch {
      setApplied(null);
      setError("We couldn't re-check your coupon. Apply it again to continue.");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = () => {
    setApplied(null);
    setError("");
  };

  const subtotal = perPerson * travellers;
  const discount = applied?.discount ?? 0;
  const total = subtotal - discount;

  return (
    <div className="cmt-checkout-panels mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
      {/* Buyer details */}
      <section className="cmt-checkout-form min-w-0 lg:col-span-7">
        <div className="rounded-cmt-md border border-cmt-neutral-200 bg-white p-6 shadow-cmt-sm sm:p-8">
          <h2 className="font-display text-xl font-semibold sm:text-2xl">Who is travelling?</h2>
          <p className="mt-2 max-w-[52ch] text-sm leading-[1.6] text-cmt-neutral-600">
            Your booking confirmation and travel support details go to these contact details.
          </p>

          {!configured ? (
            <p className="mt-6 flex items-start gap-2 rounded-cmt-control border border-cmt-error-500/40 bg-cmt-error-100/50 p-4 text-sm leading-[1.55] text-cmt-error-700">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
              Payments are not switched on yet — PAYU_MERCHANT_KEY and PAYU_SALT
              are missing from the environment.
            </p>
          ) : null}

          <div className="mt-6">
            <CheckoutForm
              packageId={packageId}
              travellers={travellers}
              travelDate={travelDate}
              couponCode={applied?.code ?? ""}
              disabled={!configured}
            />
          </div>
        </div>
      </section>

      {/* Order summary */}
      <aside className="cmt-order-summary min-w-0 lg:col-span-5" data-expanded={summaryOpen}>
        <button type="button" aria-expanded={summaryOpen} aria-controls="checkout-order-summary" onClick={() => setSummaryOpen(value => !value)} className="cmt-summary-toggle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 md:hidden">
          <span><span className="block text-xs font-medium text-cmt-neutral-500">Your trip total</span><strong className="mt-1 block text-xl">{formatINR(total)}</strong><span className="mt-1 block line-clamp-1 text-xs text-cmt-neutral-600">{packageTitle}</span></span>
          <span className="shrink-0 text-xs font-semibold">{summaryOpen ? "Hide details −" : "View details +"}</span>
        </button>
        <div id="checkout-order-summary" className="rounded-cmt-md border border-cmt-neutral-200 bg-white p-6 shadow-cmt-sm sm:p-8">
          <h2 className="font-display text-xl font-semibold">Order summary</h2>

          <div className="mt-5 flex gap-4">
            <span className="relative h-20 w-24 shrink-0 overflow-hidden rounded-cmt-sm bg-cmt-neutral-100">
              <Image src={packageImage} alt="" fill sizes="96px" className="object-cover" />
            </span>
            <div className="min-w-0">
              <p className="break-words font-display text-[15px] font-semibold leading-snug">{packageTitle}</p>
              <p className="mt-1 text-sm text-cmt-neutral-600">{packageLocation}</p>
              <p className="mt-1 text-xs text-cmt-neutral-500">
                {nights} nights / {days} days
              </p>
            </div>
          </div>

          <dl className="mt-6 space-y-3 border-t border-cmt-neutral-200 pt-5 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-cmt-neutral-600">Per person</dt>
              <dd className="whitespace-nowrap tabular-nums font-medium">{formatINR(perPerson)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-cmt-neutral-600">Travellers</dt>
              <dd className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => changeTravellers(travellers - 1)}
                  disabled={busy || travellers <= 1}
                  aria-label="Fewer travellers"
                  className="grid size-8 place-items-center rounded-cmt-full border border-cmt-neutral-300 bg-white text-cmt-neutral-900 transition-colors hover:border-cmt-neutral-400 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
                >
                  <Minus className="size-4" strokeWidth={2.5} aria-hidden="true" />
                </button>
                <output aria-live="polite" className="w-8 text-center tabular-nums font-semibold">{travellers}</output>
                <button
                  type="button"
                  onClick={() => changeTravellers(travellers + 1)}
                  disabled={busy || travellers >= maxTravellers}
                  aria-label="More travellers"
                  className="grid size-8 place-items-center rounded-cmt-full border border-cmt-neutral-300 bg-white text-cmt-neutral-900 transition-colors hover:border-cmt-neutral-400 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
                >
                  <Plus className="size-4" strokeWidth={2.5} aria-hidden="true" />
                </button>
              </dd>
            </div>
            {/* Only when the traveller actually picked one — an empty row
                reads as missing information rather than an open date. */}
            {travelDate ? (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-cmt-neutral-600">Travel date</dt>
                <dd className="text-right font-medium">{formatTripDate(travelDate)}</dd>
              </div>
            ) : null}

            {applied && (
              <>
                <div className="flex items-center justify-between">
                  <dt className="text-cmt-neutral-600">Subtotal</dt>
                  <dd className="whitespace-nowrap tabular-nums font-medium">{formatINR(subtotal)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  {/* Wraps rather than truncates: the code is the one thing here
                      the traveller has to be able to read. */}
                  <dt className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-cmt-success-700">
                    <span>Coupon {applied.code}</span>
                    <button
                      type="button"
                      onClick={handleRemove}
                      disabled={busy}
                      className="inline-flex shrink-0 items-center gap-0.5 rounded px-1 py-0.5 text-[11px] font-semibold text-cmt-neutral-500 transition-colors hover:bg-cmt-neutral-100 hover:text-cmt-neutral-900 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cmt-primary-500"
                      aria-label={`Remove coupon ${applied.code}`}
                    >
                      <X className="size-3" strokeWidth={2.5} aria-hidden="true" />
                      Remove
                    </button>
                  </dt>
                  <dd className="shrink-0 whitespace-nowrap tabular-nums font-medium text-cmt-success-700">
                    −{formatINR(discount)}
                  </dd>
                </div>
              </>
            )}
          </dl>

          {!applied && (
            <CouponCard
              offer={offer}
              error={error}
              busy={busy}
              onApply={handleApply}
              disabled={!configured}
            />
          )}

          <div className="mt-5 flex items-baseline justify-between gap-4 border-t border-cmt-neutral-200 pt-5">
            <span className="font-display text-base font-semibold">Total payable</span>
            <span className="whitespace-nowrap tabular-nums font-display text-2xl font-bold">
              {formatINR(total)}
            </span>
          </div>

          {applied && (
            <p className="mt-2 text-right text-xs font-semibold text-cmt-success-700">
              You save {formatINR(discount)}
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}

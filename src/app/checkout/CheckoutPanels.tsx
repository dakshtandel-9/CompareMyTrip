"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ShieldCheck, TriangleAlert, X } from "lucide-react";

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
  travellers: number;
  travelDate: string;
  subtotal: number;
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
  travellers,
  travelDate,
  subtotal,
  configured,
}: Props) {
  const user = useAuthUser();

  const [applied, setApplied] = useState<AppliedCoupon | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  /* An auto-applied offer that the traveller took off stays off, rather
     than reappearing the next time this component asks the server. */
  const dismissedAuto = useRef(false);

  const validate = useCallback(
    async (code: string) => {
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
        body: JSON.stringify({ code, packageId, travellers, idToken }),
      });

      return (await response.json()) as {
        ok: boolean;
        coupon?: AppliedCoupon;
        message?: string;
      };
    },
    [packageId, travellers],
  );

  // Standing offers, looked for once the auth state has settled — an offer
  // for a first booking needs to know whose booking it is.
  useEffect(() => {
    if (user === undefined || applied || dismissedAuto.current) return;

    let cancelled = false;
    void (async () => {
      try {
        const result = await validate("");
        if (!cancelled && result.ok && result.coupon) setApplied(result.coupon);
      } catch {
        // No standing offer is the normal case; a failure looks the same.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applied, user, validate]);

  const handleApply = async (code: string) => {
    setBusy(true);
    setError("");
    try {
      const result = await validate(code);
      if (result.ok && result.coupon) {
        setApplied(result.coupon);
        dismissedAuto.current = false;
      } else {
        setError(result.message || "That code could not be applied.");
      }
    } catch {
      setError("We couldn't check that code just now. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = () => {
    if (applied?.auto) dismissedAuto.current = true;
    setApplied(null);
    setError("");
  };

  const discount = applied?.discount ?? 0;
  const total = subtotal - discount;

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-12 lg:gap-8">
      {/* Buyer details */}
      <section className="lg:col-span-7">
        <div className="rounded-cmt-md border border-cmt-neutral-200 bg-white p-6 shadow-cmt-sm sm:p-8">
          <h2 className="font-display text-xl font-semibold sm:text-2xl">Who is travelling?</h2>
          <p className="mt-2 max-w-[52ch] text-sm leading-[1.6] text-cmt-neutral-600">
            The booking confirmation and operator contact go to these details.
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
      <aside className="lg:col-span-5">
        <div className="rounded-cmt-md border border-cmt-neutral-200 bg-white p-6 shadow-cmt-sm sm:p-8">
          <h2 className="font-display text-xl font-semibold">Order summary</h2>

          <div className="mt-5 flex gap-4">
            <span className="relative h-20 w-24 shrink-0 overflow-hidden rounded-cmt-sm bg-cmt-neutral-100">
              <Image src={packageImage} alt="" fill sizes="96px" className="object-cover" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-[15px] font-semibold leading-snug">{packageTitle}</p>
              <p className="mt-1 text-sm text-cmt-neutral-600">{packageLocation}</p>
              <p className="mt-1 text-xs text-cmt-neutral-500">
                {nights} nights / {days} days · {packageLocation}
              </p>
            </div>
          </div>

          <dl className="mt-6 space-y-3 border-t border-cmt-neutral-200 pt-5 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-cmt-neutral-600">Per person</dt>
              <dd className="tabular-nums font-medium">{formatINR(perPerson)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-cmt-neutral-600">Travellers</dt>
              <dd className="tabular-nums font-medium">{travellers}</dd>
            </div>
            {/* Only when the traveller actually picked one — an empty row
                reads as missing information rather than an open date. */}
            {travelDate ? (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-cmt-neutral-600">Travel date</dt>
                <dd className="font-medium">{formatTripDate(travelDate)}</dd>
              </div>
            ) : null}

            {applied && (
              <>
                <div className="flex items-center justify-between">
                  <dt className="text-cmt-neutral-600">Subtotal</dt>
                  <dd className="tabular-nums font-medium">{formatINR(subtotal)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="flex min-w-0 items-center gap-1.5 text-cmt-success-700">
                    <span className="truncate">Coupon {applied.code}</span>
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
                  <dd className="tabular-nums font-medium text-cmt-success-700">
                    −{formatINR(discount)}
                  </dd>
                </div>
              </>
            )}
          </dl>

          {!applied && (
            <CouponCard
              error={error}
              busy={busy}
              onApply={handleApply}
              disabled={!configured}
            />
          )}

          <div className="mt-5 flex items-baseline justify-between border-t border-cmt-neutral-200 pt-5">
            <span className="font-display text-base font-semibold">Total payable</span>
            <span className="tabular-nums font-display text-2xl font-bold">
              {formatINR(total)}
            </span>
          </div>

          {applied && (
            <p className="mt-2 text-right text-xs font-semibold text-cmt-success-700">
              You save {formatINR(discount)}
            </p>
          )}

          <p className="mt-4 flex items-center gap-1.5 text-xs text-cmt-neutral-600">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-cmt-success-700" strokeWidth={2.25} aria-hidden="true" />
            Free cancellation
          </p>
        </div>
      </aside>
    </div>
  );
}

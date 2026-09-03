"use client";

import { useState } from "react";
import { BadgePercent, Check, Loader2, TicketPercent, X } from "lucide-react";

import type { AppliedCoupon } from "@/lib/coupons";

/* ------------------------------------------------------------------ */
/* "Have a coupon code?" — its own card, deliberately.                  */
/*                                                                      */
/* It sits beside the traveller details rather than inside them: a code  */
/* is a different decision from who is going, it fails on its own terms, */
/* and a rejected code must never look like a rejected booking form.     */
/*                                                                      */
/* The card only ever shows what the server said. Nothing here works out */
/* a discount — see /api/coupons/validate, and the real decision in      */
/* /api/payu/initiate.                                                   */
/* ------------------------------------------------------------------ */

const formatINR = (value: number) => `₹${value.toLocaleString("en-IN")}`;

type Props = {
  applied: AppliedCoupon | null;
  /** Server message for the last refused code, if any. */
  error: string;
  busy: boolean;
  onApply: (code: string) => void;
  onRemove: () => void;
  disabled?: boolean;
};

export default function CouponCard({
  applied,
  error,
  busy,
  onApply,
  onRemove,
  disabled,
}: Props) {
  const [code, setCode] = useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = code.trim();
    if (trimmed) onApply(trimmed);
  };

  return (
    <div className="mt-6 rounded-cmt-md border border-cmt-neutral-200 bg-white p-6 shadow-cmt-sm sm:p-8">
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-cmt-control bg-cmt-primary-50 text-cmt-primary-900">
          <TicketPercent className="size-[18px]" strokeWidth={2} aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-xl font-semibold sm:text-2xl">Coupon code</h2>
          <p className="text-sm text-cmt-neutral-600">
            Paste a code to take it off the total before you pay.
          </p>
        </div>
      </div>

      {applied ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-cmt-control border border-cmt-success-500/40 bg-cmt-success-100/50 p-4">
          <div className="flex min-w-0 items-start gap-2.5">
            <Check
              className="mt-0.5 size-4 shrink-0 text-cmt-success-700"
              strokeWidth={2.5}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-cmt-neutral-900">
                {applied.code} applied — you save {formatINR(applied.discount)}
              </p>
              <p className="mt-0.5 text-xs leading-[1.5] text-cmt-neutral-600">
                {applied.auto ? "Applied automatically · " : ""}
                {applied.label}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onRemove}
            disabled={busy}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-cmt-control border border-cmt-neutral-200 bg-white px-3 text-sm font-semibold text-cmt-neutral-700 transition-colors hover:border-cmt-neutral-300 hover:bg-cmt-neutral-50 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
          >
            <X className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
            Remove
          </button>
        </div>
      ) : (
        /* Its own <form>: the checkout form posts to PayU, and pressing
           Enter on a coupon must never start a payment. */
        <form onSubmit={submit} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            id="checkout-coupon"
            name="couponInput"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="MONSOON12"
            autoComplete="off"
            spellCheck={false}
            aria-label="Coupon code"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "checkout-coupon-error" : undefined}
            disabled={disabled || busy}
            className={`h-12 w-full rounded-cmt-control border bg-white px-4 font-body text-base uppercase tracking-[0.06em] text-cmt-neutral-900 placeholder:normal-case placeholder:tracking-normal placeholder:text-cmt-neutral-400 transition-colors duration-150 focus:border-cmt-primary-500 focus:outline-2 focus:-outline-offset-2 focus:outline-cmt-primary-500 disabled:cursor-not-allowed disabled:bg-cmt-neutral-100 ${
              error ? "border-cmt-error-500" : "border-cmt-neutral-200 hover:border-cmt-neutral-300"
            }`}
          />
          <button
            type="submit"
            disabled={disabled || busy || code.trim() === ""}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-cmt-control border border-cmt-neutral-300 bg-white px-6 font-body text-base font-semibold text-cmt-neutral-900 transition-colors hover:border-cmt-neutral-400 hover:bg-cmt-neutral-50 disabled:cursor-not-allowed disabled:border-cmt-neutral-200 disabled:text-cmt-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 sm:w-auto"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" strokeWidth={2.5} aria-hidden="true" />
            ) : (
              <BadgePercent className="size-4" strokeWidth={2.5} aria-hidden="true" />
            )}
            {busy ? "Checking…" : "Apply"}
          </button>
        </form>
      )}

      {error && !applied && (
        <p
          id="checkout-coupon-error"
          role="status"
          className="mt-2.5 text-xs leading-[1.5] text-cmt-error-700"
        >
          {error}
        </p>
      )}
    </div>
  );
}

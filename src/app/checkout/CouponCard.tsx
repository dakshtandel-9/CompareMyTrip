"use client";

import { useState } from "react";
import { BadgePercent, Loader2, TicketPercent } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Compact coupon control inside the order summary.                     */
/*                                                                      */
/* It remains its own form so pressing Enter applies the code rather than */
/* submitting the payment form.                                         */
/*                                                                      */
/* The card only ever shows what the server said. Nothing here works out */
/* a discount — see /api/coupons/validate, and the real decision in      */
/* /api/payu/initiate.                                                   */
/* ------------------------------------------------------------------ */

type Props = {
  /** Server message for the last refused code, if any. */
  error: string;
  busy: boolean;
  onApply: (code: string) => void;
  disabled?: boolean;
};

export default function CouponCard({
  error,
  busy,
  onApply,
  disabled,
}: Props) {
  const [code, setCode] = useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = code.trim();
    if (trimmed) onApply(trimmed);
  };

  return (
    <div className="mt-5 border-t border-cmt-neutral-200 pt-5">
      <label
        htmlFor="checkout-coupon"
        className="inline-flex items-center gap-2 text-sm font-semibold text-cmt-neutral-900"
      >
        <TicketPercent className="size-4 text-cmt-primary-900" strokeWidth={2.25} aria-hidden="true" />
        Coupon code
      </label>

      <form onSubmit={submit} className="mt-3 flex gap-2">
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
          className={`h-10 min-w-0 flex-1 rounded-cmt-control border bg-white px-3 font-body text-sm uppercase tracking-[0.06em] text-cmt-neutral-900 placeholder:normal-case placeholder:tracking-normal placeholder:text-cmt-neutral-400 transition-colors duration-150 focus:border-cmt-primary-500 focus:outline-2 focus:-outline-offset-2 focus:outline-cmt-primary-500 disabled:cursor-not-allowed disabled:bg-cmt-neutral-100 ${
            error ? "border-cmt-error-500" : "border-cmt-neutral-200 hover:border-cmt-neutral-300"
          }`}
        />
        <button
          type="submit"
          disabled={disabled || busy || code.trim() === ""}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-cmt-control bg-cmt-primary-500 px-4 font-body text-sm font-semibold text-cmt-neutral-900 transition-colors hover:bg-cmt-primary-600 disabled:cursor-not-allowed disabled:bg-cmt-neutral-200 disabled:text-cmt-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" strokeWidth={2.5} aria-hidden="true" />
          ) : (
            <BadgePercent className="size-4" strokeWidth={2.5} aria-hidden="true" />
          )}
          {busy ? "Checking…" : "Apply"}
        </button>
      </form>

      {error && (
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

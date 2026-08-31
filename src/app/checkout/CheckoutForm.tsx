"use client";

import { useState } from "react";
import { AlertCircle, Lock } from "lucide-react";
import { signUpGuest } from "@/lib/firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { useUserProfile } from "@/lib/firebase/useUserProfile";

/* Buyer details only. The package and the amount are decided server-side in
   /api/payu/initiate — this form just carries the id along.

   Signed-in visitors get name/email/phone prefilled from their profile
   (useUserProfile — backed by ProfileCompletionGate, so all three are
   populated whenever status is "ready"). Email is locked to the account's
   address since that's where the receipt and login both live; name and
   phone stay editable because a traveller often books on someone else's
   behalf.

   A signed-out visitor instead gets an account created silently on submit
   (signUpGuest, with a random 25-character password nobody ever sees), and
   only then does the native <form> POST to /api/payu/initiate proceed. They
   can set their own password or link Google to that same account later from
   /account. */

type Props = { packageId: string; travellers: number; disabled?: boolean };

const FIELD =
  "mt-2 h-12 w-full rounded-cmt-control border bg-white px-4 text-base text-cmt-neutral-900 placeholder:text-cmt-neutral-400 transition-colors duration-150 focus:border-cmt-primary-500 focus:outline-2 focus:-outline-offset-2 focus:outline-cmt-primary-500";

const LABEL = "block font-body text-sm font-semibold text-cmt-neutral-900";

export default function CheckoutForm({ packageId, travellers, disabled }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [provisioning, setProvisioning] = useState(false);
  const { status, profile } = useUserProfile();
  const signedIn = status === "ready";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const data = new FormData(form);
    const next: Record<string, string> = {};

    const firstname = String(data.get("firstname") ?? "").trim();
    if (!firstname) {
      next.firstname = "We need a name for the booking.";
    }
    const email = String(data.get("email") ?? "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      next.email = "Enter a valid email — the receipt goes here.";
    }
    const phone = String(data.get("phone") ?? "");
    if (phone.replace(/\D/g, "").length < 10) {
      next.phone = "Enter a 10-digit mobile number.";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) {
      event.preventDefault();
      document.getElementById(`checkout-${Object.keys(next)[0]}`)?.focus();
      return;
    }

    // Always hold the native submit: a signed-out visitor needs an account
    // created first, and either way we attach a fresh ID token so the
    // server can file the booking under their uid in My Trips.
    event.preventDefault();
    setProvisioning(true);
    (async () => {
      try {
        if (!signedIn) await signUpGuest({ name: firstname, email, phone });
      } catch {
        // Non-fatal: the email may already have an account (we cannot sign
        // them into it without their password), or the network may be down.
        // The payment is what the visitor came for.
      }

      try {
        const user = getFirebaseAuth().currentUser;
        if (user) {
          const field = form.elements.namedItem("idToken");
          if (field instanceof HTMLInputElement) field.value = await user.getIdToken();
        }
      } catch {
        // Without a token the booking is still recorded, just unlinked.
      }

      setProvisioning(false);
      form.submit();
    })();
  }

  const error = (name: string) =>
    errors[name] ? (
      <p
        id={`checkout-${name}-error`}
        className="mt-1.5 flex items-start gap-1.5 text-xs leading-[1.5] text-cmt-error-700"
      >
        <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
        {errors[name]}
      </p>
    ) : null;

  const border = (name: string) =>
    errors[name] ? "border-cmt-error-500" : "border-cmt-neutral-200 hover:border-cmt-neutral-300";

  return (
    <form action="/api/payu/initiate" method="post" onSubmit={handleSubmit} noValidate>
      <input type="hidden" name="packageId" value={packageId} />
      <input type="hidden" name="travellers" value={travellers} />
      {/* Filled in by handleSubmit just before the POST, so the token is
          always fresh rather than minted on render and possibly expired. */}
      <input type="hidden" name="idToken" defaultValue="" />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="checkout-firstname" className={LABEL}>
            Full name <span className="text-cmt-error-500">*</span>
          </label>
          <input
            key={signedIn ? profile.name : "firstname-empty"}
            id="checkout-firstname"
            name="firstname"
            autoComplete="name"
            placeholder="Priya Sharma"
            defaultValue={signedIn ? profile.name : undefined}
            aria-invalid={Boolean(errors.firstname)}
            aria-describedby={errors.firstname ? "checkout-firstname-error" : undefined}
            className={`${FIELD} ${border("firstname")}`}
          />
          {error("firstname")}
        </div>

        <div>
          <label htmlFor="checkout-email" className={LABEL}>
            Email <span className="text-cmt-error-500">*</span>
          </label>
          <input
            key={signedIn ? profile.email : "email-empty"}
            id="checkout-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            defaultValue={signedIn ? profile.email : undefined}
            readOnly={signedIn}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "checkout-email-error" : undefined}
            className={`${FIELD} ${border("email")} ${signedIn ? "cursor-not-allowed bg-cmt-neutral-100 text-cmt-neutral-600" : ""}`}
          />
          {signedIn ? (
            <p className="mt-1.5 text-xs leading-[1.5] text-cmt-neutral-500">
              Your receipt goes to your account email.
            </p>
          ) : (
            error("email")
          )}
        </div>

        <div>
          <label htmlFor="checkout-phone" className={LABEL}>
            Mobile <span className="text-cmt-error-500">*</span>
          </label>
          <input
            key={signedIn ? profile.phone : "phone-empty"}
            id="checkout-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="98765 43210"
            defaultValue={signedIn ? profile.phone : undefined}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "checkout-phone-error" : undefined}
            className={`${FIELD} ${border("phone")}`}
          />
          {error("phone")}
        </div>
      </div>

      <button
        type="submit"
        disabled={disabled || provisioning}
        className="mt-7 inline-flex h-[52px] w-full items-center justify-center gap-2.5 rounded-cmt-control bg-cmt-primary-500 px-8 font-body text-[18px] font-semibold text-cmt-neutral-900 shadow-cmt-xs transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:bg-cmt-primary-600 hover:shadow-cmt-primary active:translate-y-0 active:bg-cmt-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 disabled:cursor-not-allowed disabled:bg-cmt-neutral-200 disabled:text-cmt-neutral-500 disabled:shadow-none disabled:hover:translate-y-0"
      >
        <Lock className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
        {provisioning ? "Preparing your account…" : "Pay securely with PayU"}
      </button>

      <p className="mt-3 text-center text-xs leading-[1.5] text-cmt-neutral-500">
        You&apos;ll be taken to PayU to complete the payment. We never see your
        card details.
      </p>
    </form>
  );
}

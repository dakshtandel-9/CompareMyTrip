"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { MAX_CUSTOM_PAYMENT, MIN_CUSTOM_PAYMENT } from "@/lib/customPayment";
import { getFirebaseAuth } from "@/lib/firebase/client";

const fieldClass = "mt-2 h-12 w-full rounded-cmt-control border border-cmt-neutral-300 bg-white px-4 text-base text-cmt-neutral-900 focus:border-cmt-primary-500 focus:outline-2 focus:-outline-offset-2 focus:outline-cmt-primary-500";

export default function CustomPaymentForm({ enabled }: { enabled: boolean }) {
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    const reset = () => setSubmitting(false);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);
  return (
    <form action="/api/payu/custom" method="post" className="mt-7 space-y-5" onSubmit={async (event) => {
      event.preventDefault();
      if (submitting || !enabled) return;
      const form = event.currentTarget;
      setSubmitting(true);
      setError("");
      try {
        const auth = getFirebaseAuth();
        await auth.authStateReady();
        const field = form.elements.namedItem("idToken") as HTMLInputElement;
        field.value = auth.currentUser ? await auth.currentUser.getIdToken() : "";
        form.submit();
      } catch {
        setError("We could not verify your session. Please try again before continuing to payment.");
        setSubmitting(false);
      }
    }}>
      <input type="hidden" name="idToken" defaultValue="" />
      <fieldset disabled={!enabled} className="space-y-5 disabled:opacity-60">
        <legend className="sr-only">Payment details</legend>
        <label className="block text-sm font-semibold">
          Amount to pay (₹)
          <input name="amount" type="number" inputMode="decimal" min={MIN_CUSTOM_PAYMENT} max={MAX_CUSTOM_PAYMENT} step="0.01" required value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Enter agreed amount" className={`${fieldClass} text-xl font-semibold`} aria-describedby="amount-help" />
          <span id="amount-help" className="mt-2 block text-xs font-normal text-cmt-neutral-600">₹1–₹10,00,000 · Payments in Indian rupees</span>
        </label>
        <label className="block text-sm font-semibold">Full name
          <input name="firstname" autoComplete="name" required maxLength={80} className={fieldClass} />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-semibold">Email address
            <input name="email" type="email" autoComplete="email" required maxLength={254} className={fieldClass} />
          </label>
          <label className="block text-sm font-semibold">Phone number
            <input name="phone" type="tel" autoComplete="tel" required minLength={10} maxLength={25} pattern="[+0-9 ()\-]{10,25}" className={fieldClass} />
          </label>
        </div>
        <label className="block text-sm font-semibold">Booking reference or payment note <span className="font-normal text-cmt-neutral-500">(optional)</span>
          <input name="reference" maxLength={120} placeholder="e.g. Kerala trip advance · 20 October" className={fieldClass} />
        </label>
        <label className="flex items-start gap-3 text-sm leading-6 text-cmt-neutral-600">
          <input type="checkbox" name="agreed" value="yes" required className="mt-1 h-4 w-4 shrink-0 accent-cmt-primary-500" />
          <span>I confirm this amount was agreed with the team and accept the <Link href="/terms" className="underline">terms</Link> and <Link href="/refund-policy" className="underline">refund policy</Link>.</span>
        </label>
      </fieldset>
      {error && <p role="alert" className="text-sm text-cmt-error-700">{error}</p>}
      <button type="submit" disabled={!enabled || submitting} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-cmt-control bg-cmt-primary-500 px-5 py-3 font-semibold text-cmt-neutral-900 hover:bg-cmt-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 disabled:cursor-not-allowed disabled:opacity-60">
        <LockKeyhole className="h-4 w-4" aria-hidden="true" />
        {submitting ? "Opening payment…" : Number(amount) > 0 ? `Pay ₹${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "Continue to payment"}
      </button>
      <p className="text-center text-xs leading-5 text-cmt-neutral-500" role="status">{submitting ? "Please wait while we connect you to PayU." : "Secure checkout with PayU. Keep your transaction reference for our team."}</p>
    </form>
  );
}

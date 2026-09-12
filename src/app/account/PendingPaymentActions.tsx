"use client";

import { useState } from "react";
import Link from "next/link";
import { CreditCard, LoaderCircle, MessageSquareText, RefreshCw } from "lucide-react";
import type { Trip } from "@/lib/firebase/trips";
import { paymentRequest, PAYMENT_REPORT_CHANGED_EVENT } from "@/lib/paymentClient";

const BUTTON = "inline-flex min-h-11 items-center justify-center gap-2 rounded-cmt-control border px-4 text-xs font-semibold text-cmt-neutral-900 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 disabled:cursor-wait disabled:opacity-50";
const SECONDARY_BUTTON = `${BUTTON} border-cmt-neutral-200 bg-white hover:border-cmt-neutral-400`;
const FIELD = "mt-2 min-h-11 w-full rounded-cmt-control border border-cmt-neutral-200 bg-white px-3 py-2 text-sm font-normal text-cmt-neutral-900 outline-none focus:border-cmt-primary-500 focus:ring-2 focus:ring-cmt-primary-500/20";

type PaymentResponse = { message?: string; endpoint?: string; fields?: Record<string, string> };

export default function PendingPaymentActions({ trip }: { trip: Trip }) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showReport, setShowReport] = useState(false);
  const [reference, setReference] = useState("");
  const [message, setMessage] = useState("");
  const [reported, setReported] = useState(false);
  const underReview = trip.paymentReportStatus !== "resolved" && (reported || trip.paymentReportStatus === "open");

  async function act(action: "retry" | "check" | "report") {
    if (busy) return;
    setBusy(action); setError(""); setNotice("");
    try {
      const result = await paymentRequest<PaymentResponse>(`/api/account/payments/${encodeURIComponent(trip.id)}`, { action, ...(action === "report" ? { reference, message } : {}) });
      if (result.endpoint && result.fields) {
        if (!["https://test.payu.in/_payment", "https://secure.payu.in/_payment"].includes(result.endpoint)) throw new Error("Payment could not be opened.");
        const form = document.createElement("form");
        form.method = "POST"; form.action = result.endpoint;
        Object.entries(result.fields).forEach(([name, value]) => {
          const input = document.createElement("input"); input.type = "hidden"; input.name = name; input.value = value; form.appendChild(input);
        });
        document.body.appendChild(form); form.submit(); form.remove();
      } else setNotice(result.message || "Payment details updated.");
      if (action === "report") {
        setReported(true); setShowReport(false);
        window.dispatchEvent(new Event(PAYMENT_REPORT_CHANGED_EVENT));
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Please try again shortly."); }
    finally { setBusy(""); }
  }

  return (
    <div className="border-t border-cmt-neutral-200 bg-cmt-primary-50/60 p-4 sm:p-5">
      <p className="text-xs leading-relaxed text-cmt-neutral-600">{underReview ? "Your payment request is with the travel team. Please wait for their update before paying again." : "Payment still pending? Check the status first. If money was deducted, send us your payment reference."}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {!underReview ? <button type="button" disabled={Boolean(busy)} onClick={() => void act("retry")} className={`${BUTTON} border-cmt-primary-500 bg-cmt-primary-500 hover:border-cmt-primary-600 hover:bg-cmt-primary-600`}>
          {busy === "retry" ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <CreditCard className="size-4" aria-hidden="true" />}Pay again
        </button> : null}
        <button type="button" disabled={Boolean(busy)} onClick={() => void act("check")} className={SECONDARY_BUTTON}><RefreshCw className={`size-4 ${busy === "check" ? "animate-spin" : ""}`} aria-hidden="true" />Check payment status</button>
        {!underReview && trip.paymentReportStatus !== "resolved" ? <button type="button" disabled={Boolean(busy)} onClick={() => setShowReport(!showReport)} aria-expanded={showReport} aria-controls={`report-${trip.id}`} className={SECONDARY_BUTTON}><MessageSquareText className="size-4" aria-hidden="true" />I’ve already paid</button> : <Link href="/contact" className={SECONDARY_BUTTON}>Contact support</Link>}
      </div>
      {showReport ? <form id={`report-${trip.id}`} onSubmit={event => { event.preventDefault(); void act("report"); }} className="mt-4 space-y-4 rounded-cmt-control border border-cmt-neutral-200 bg-white p-4">
        <h4 className="font-display text-base font-semibold text-cmt-neutral-900">Ask us to check your payment</h4>
        <label className="block text-xs font-semibold text-cmt-neutral-700">Bank transaction ID / UTR<input required minLength={4} maxLength={120} value={reference} onChange={event => setReference(event.target.value)} placeholder="Reference from your bank or UPI app" className={FIELD} /></label>
        <label className="block text-xs font-semibold text-cmt-neutral-700">Payment details (optional)<textarea maxLength={2000} rows={3} value={message} onChange={event => setMessage(event.target.value)} placeholder="When you paid and the payment method you used" className={FIELD} /></label>
        <p className="text-xs leading-relaxed text-cmt-neutral-500">Your booking ID and amount are included automatically. This request stays available for review even after the pending booking expires.</p>
        <div className="flex flex-wrap gap-2"><button type="submit" disabled={Boolean(busy)} className={SECONDARY_BUTTON}>{busy === "report" ? "Sending…" : "Send payment request"}</button><button type="button" disabled={Boolean(busy)} onClick={() => setShowReport(false)} className={SECONDARY_BUTTON}>Cancel</button></div>
      </form> : null}
      {error ? <p role="alert" className="mt-3 text-xs leading-relaxed text-cmt-error-700">{error}</p> : null}
      {notice ? <p role="status" className="mt-3 text-xs leading-relaxed text-cmt-neutral-700">{notice}</p> : null}
      <p className="mt-3 text-[11px] leading-relaxed text-cmt-neutral-500">Pending bookings are removed from your trips after 48 hours.</p>
    </div>
  );
}

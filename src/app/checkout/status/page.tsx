import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, TriangleAlert, XCircle } from "lucide-react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Payment Status",
  robots: { index: false, follow: false },
};

/* Reached only via the verified callback, or by the initiate route when it
   refuses to sign an order. Nothing here decides an outcome — it reports the
   one the server already checked. */

const REASONS: Record<string, string> = {
  "not-configured":
    "Payments are not switched on yet — the PayU merchant key and salt are missing from the environment.",
  "unknown-package":
    "We could not price that package on the server, so no payment was started.",
  "invalid-details": "Some of the booking details were missing or malformed.",
  "hash-mismatch":
    "The response signature did not match, so we did not treat it as paid. If money left your account, contact us with the transaction id and we will trace it.",
  "no-result": "No payment result was received.",
  "coupon-rejected":
    "That coupon is no longer valid for this order, so we stopped before charging you. Open the checkout again to see the current total.",
};

export default async function PaymentStatusPage({
  searchParams,
}: {
  searchParams: Promise<{
    state?: string;
    txnid?: string;
    amount?: string;
    item?: string;
    reason?: string;
  }>;
}) {
  const { state, txnid, amount, item, reason } = await searchParams;
  const success = state === "success";
  const failed = state === "failed";

  const Icon = success ? CheckCircle2 : failed ? XCircle : TriangleAlert;
  const tone = success
    ? "bg-cmt-success-100 text-cmt-success-700"
    : failed
      ? "bg-cmt-error-100 text-cmt-error-700"
      : "bg-cmt-primary-100 text-cmt-neutral-900";

  const heading = success
    ? "Payment received."
    : failed
      ? "Payment did not go through."
      : "We could not start that payment.";

  const body = success
    ? "Your booking is with the operator. A confirmation is on its way to the email you gave us."
    : failed
      ? "Nothing has been charged. You can try again, or send an enquiry and we will raise a fresh payment link."
      : (reason && REASONS[reason]) || reason || "Something went wrong before payment started.";

  return (
    <>
      <Header />
      <main className="w-full bg-cmt-neutral-50 font-body text-cmt-neutral-900">
        <div className="mx-auto w-full max-w-[640px] px-4 py-16 sm:px-5 sm:py-24 lg:px-6">
          <div className="rounded-cmt-md border border-cmt-neutral-200 bg-white p-8 text-center shadow-cmt-sm sm:p-10">
            <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-cmt-full ${tone}`}>
              <Icon className="h-7 w-7" strokeWidth={2} aria-hidden="true" />
            </span>

            <h1 className="mt-6 font-display text-3xl font-semibold leading-[1.15] tracking-tight">
              {heading}
            </h1>
            <p className="mx-auto mt-3 max-w-[46ch] text-pretty text-sm leading-[1.6] text-cmt-neutral-600 sm:text-base">
              {body}
            </p>

            {txnid ? (
              <dl className="mt-7 space-y-2 rounded-cmt-control bg-cmt-neutral-50 p-4 text-left text-sm">
                {item ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-cmt-neutral-600">Package</dt>
                    <dd className="text-right font-medium">{item}</dd>
                  </div>
                ) : null}
                {amount ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-cmt-neutral-600">Amount</dt>
                    <dd className="tabular-nums font-medium">₹{amount}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-4">
                  <dt className="text-cmt-neutral-600">Transaction</dt>
                  <dd className="font-mono text-xs">{txnid}</dd>
                </div>
              </dl>
            ) : null}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/packages"
                className="inline-flex h-12 items-center justify-center rounded-cmt-control bg-cmt-primary-500 px-6 text-base font-semibold text-cmt-neutral-900 shadow-cmt-xs transition-colors hover:bg-cmt-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
              >
                Browse packages
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-12 items-center justify-center rounded-cmt-control border border-cmt-neutral-300 bg-white px-6 text-base font-semibold text-cmt-neutral-900 transition-colors hover:border-cmt-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
              >
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

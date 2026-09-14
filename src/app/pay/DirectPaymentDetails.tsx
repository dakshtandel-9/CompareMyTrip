"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Copy, Download, Landmark, QrCode } from "lucide-react";

const bankDetails = [
  ["Account name", "COMPAREMYTRIP"],
  ["Account type", "Current Account"],
  ["Account number", "42930200001679"],
  ["Bank name", "Bank Of Baroda"],
  ["Branch name", "Kalyan Nagar, Bengaluru - 560043, Karnataka, IND"],
  ["IFSC code", "BARB0KALBAN"],
  ["MICR code", "560012034"],
] as const;
const upiId = "rajrl4444-1@oksbi";
const qrImage = "/payments/comparemytrip-upi-qr.jpeg";
const buttonClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-cmt-control border border-cmt-neutral-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-cmt-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500";

export default function DirectPaymentDetails() {
  return <section aria-labelledby="direct-payment-heading" className="min-w-0 rounded-cmt-md border border-cmt-neutral-200 bg-white p-6 shadow-cmt-sm sm:p-9 lg:col-span-2">
    <p className="text-xs font-semibold uppercase tracking-wider text-cmt-neutral-500">More ways to pay</p>
    <h2 id="direct-payment-heading" className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-3xl">Bank transfer or UPI</h2>
    <p className="mt-3 text-sm leading-6 text-cmt-neutral-600">Pay the amount agreed with our travel team using the account details or QR code below.</p>

    <div className="mt-7 grid gap-8 md:grid-cols-2 md:gap-10">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-cmt-primary-100"><Landmark className="size-5" aria-hidden="true" /></span>
          <h3 className="font-display text-xl font-semibold">Bank account details</h3>
        </div>
        <dl className="mt-5 divide-y divide-cmt-neutral-200">
          {bankDetails.map(([label, value]) => <div key={label} className="grid gap-1 py-3.5 sm:grid-cols-[130px_minmax(0,1fr)] sm:gap-4">
            <dt className="text-sm text-cmt-neutral-500">{label}</dt>
            <dd className={`min-w-0 break-words text-sm font-semibold leading-6 ${label === "Account number" || label === "IFSC code" || label === "MICR code" ? "font-mono tabular-nums" : ""}`}>{value}</dd>
          </div>)}
        </dl>
        <div className="mt-5"><CopyButton label="Copy bank details" value={bankDetails.map(([label, value]) => `${label}: ${value}`).join("\n")} /></div>
      </div>

      <div className="min-w-0 border-t border-cmt-neutral-200 pt-7 md:border-t-0 md:border-l md:pt-0 md:pl-10">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-cmt-primary-100"><QrCode className="size-5" aria-hidden="true" /></span>
          <h3 className="font-display text-xl font-semibold">Scan to pay with UPI</h3>
        </div>
        <p className="mt-3 text-sm leading-6 text-cmt-neutral-600">Scan with your UPI app, or download the QR code to pay from your phone.</p>
        <a href={qrImage} target="_blank" rel="noopener noreferrer" aria-label="Open CompareMyTrip payment QR code at full size" className="relative mx-auto mt-5 block aspect-square w-full max-w-72 overflow-hidden rounded-cmt-control border border-cmt-neutral-200 bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500">
          {/* Frame the original image's 480px square QR area, including its white margin. */}
          <Image src={qrImage} width={1080} height={1246} unoptimized alt="Compare My Trip payment QR code. UPI ID: rajrl4444-1@oksbi." className="absolute top-[-66.6667%] left-[-62.5%] h-auto w-[225%] max-w-none" />
        </a>
        <p className="mt-3 text-center text-sm font-semibold">Compare My Trip</p>
        <p className="mt-4 text-center text-sm text-cmt-neutral-600">UPI ID: <span className="break-all font-semibold text-cmt-neutral-900">{upiId}</span></p>
        <div className="mt-4 flex flex-wrap items-start justify-center gap-3">
          <CopyButton label="Copy UPI ID" value={upiId} />
          <a href={qrImage} download="CompareMyTrip-UPI-QR.jpeg" className={buttonClass}><Download className="size-4" aria-hidden="true" />Download QR</a>
        </div>
      </div>
    </div>

    <p className="mt-7 rounded-cmt-control bg-cmt-primary-100 px-4 py-3 text-sm leading-6 text-cmt-neutral-700">After paying, share your payment receipt and booking reference with <Link href="/contact" className="font-semibold underline underline-offset-2">our travel team</Link> so we can confirm your payment and match it to your trip.</p>
  </section>;
}

function CopyButton({ label, value }: { label: string; value: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    if (status === "idle") return;
    const timer = window.setTimeout(() => setStatus("idle"), 3000);
    return () => window.clearTimeout(timer);
  }, [status]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
  }

  return <div>
    <button type="button" onClick={copy} className={buttonClass}>
      {status === "copied" ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
      {status === "copied" ? "Copied!" : label}
    </button>
    <span role="status" className={status === "error" ? "mt-2 block max-w-64 text-xs text-cmt-error-700" : "sr-only"}>
      {status === "copied" ? `${label.replace("Copy ", "")} copied to clipboard.` : status === "error" ? "Could not copy. Please select and copy the details above." : ""}
    </span>
  </div>;
}

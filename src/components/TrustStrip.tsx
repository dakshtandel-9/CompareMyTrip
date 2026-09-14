"use client";

import Image from "next/image";
import { ShieldCheck, Star } from "lucide-react";
import { useSiteContent } from "@/lib/useSiteContent";
import type { FooterBadgesContent } from "@/lib/siteContent";

/* ------------------------------------------------------------------ */
/* Payment modes + accreditations, the band that sits above the footer  */
/* copyright line. Two halves on one row at desktop width, stacked      */
/* below it, on the same light fill as the rest of the footer.          */
/*                                                                      */
/* Every logo here is a third-party mark shown to say which methods     */
/* PayU accepts at checkout — nominative use, so each keeps its own      */
/* colours on a white chip rather than being recoloured to the brand.   */
/* Sources and licences are listed in public/payments/CREDITS.txt.      */
/* ------------------------------------------------------------------ */

/* Intrinsic dimensions come from each file, so a card mark and a long
   wordmark keep their own ratio inside one uniform chip instead of being
   stretched to a common box. */
export const PAYMENT_METHODS: {
  id: string;
  name: string;
  src: string;
  width: number;
  height: number;
}[] = [
  { id: "visa", name: "Visa", src: "/payments/visa.svg", width: 780, height: 500 },
  { id: "mastercard", name: "Mastercard", src: "/payments/mastercard.svg", width: 780, height: 500 },
  { id: "amex", name: "American Express", src: "/payments/amex.svg", width: 780, height: 500 },
  { id: "upi", name: "UPI", src: "/payments/upi.svg", width: 370, height: 131 },
  { id: "googlePay", name: "Google Pay", src: "/payments/google-pay.svg", width: 64, height: 24 },
  { id: "phonepe", name: "PhonePe", src: "/payments/phonepe.svg", width: 24, height: 24 },
  { id: "paytm", name: "Paytm", src: "/payments/paytm.svg", width: 48, height: 15 },
];

const headingClass =
  "text-xs font-semibold uppercase tracking-wider text-cmt-neutral-900";

/* Chip geometry is shared so a wordmark and a round seal still line up
   on the same baseline whatever their own aspect ratio. */
const chipClass =
  "flex h-11 items-center justify-center rounded-cmt-sm border border-cmt-neutral-200 bg-white px-3";

/* Payment chips are one fixed width so the row grids up the way the card
   marks do; the accreditation marks beside them stay auto-width. */
const paymentChipClass = `${chipClass} w-[78px] shrink-0`;

/* ------------------------------------------------------------------ */
/* Accreditation marks.                                                 */
/*                                                                      */
/* Google's is the real wordmark; the rest are drawn here rather than    */
/* copied, because IATA, ISO and the PCI Council all licence their       */
/* certification marks to holders under their own brand rules — a badge  */
/* in our own type says the same thing without lifting theirs.           */
/* ------------------------------------------------------------------ */

function GoogleReviewsMark() {
  return (
    <span className="flex flex-col items-center gap-1">
      <Image
        src="/badges/google.svg"
        alt="Google"
        width={272}
        height={92}
        unoptimized
        className="h-[18px] w-auto"
      />
      <span className="flex items-center gap-0.5" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((index) => (
          <Star
            key={index}
            className="h-2.5 w-2.5 fill-cmt-primary-500 text-cmt-primary-500"
            strokeWidth={2}
          />
        ))}
      </span>
    </span>
  );
}

/* Globe and wings — the shape an airline accreditation mark reads as,
   in the two-tone treatment the trust icons upstairs already use. */
function IataMark() {
  return (
    <span className="flex items-center gap-2">
      <svg viewBox="0 0 32 24" className="h-6 w-8 shrink-0" aria-hidden="true">
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          className="text-cmt-secondary-900"
        >
          <circle cx="16" cy="12" r="6.4" />
          <path d="M16 5.6c2.6 2.9 2.6 9.9 0 12.8-2.6-2.9-2.6-9.9 0-12.8Z" />
          <path d="M9.9 9.6h12.2M9.9 14.4h12.2" />
        </g>
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          className="text-cmt-primary-600"
        >
          <path d="M7.6 8.4 1.6 10.8l6 1.2M24.4 8.4l6 2.4-6 1.2" />
        </g>
      </svg>
      <span className="font-display text-lg font-bold tracking-[0.08em] text-cmt-secondary-900">
        IATA
      </span>
    </span>
  );
}

/* Scalloped certification seal, the same 12-point rosette the guarantee
   trust mark uses, so the two read as one family. */
function IsoMark() {
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 24 24" className="h-8 w-8 shrink-0" aria-hidden="true">
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
          className="text-cmt-primary-600"
          d="M12 1.9 14.15 3.98 17.05 3.25 17.87 6.13 20.75 6.95 20.02 9.85 22.1 12 20.02 14.15 20.75 17.05 17.87 17.87 17.05 20.75 14.15 20.02 12 22.1 9.85 20.02 6.95 20.75 6.13 17.87 3.25 17.05 3.98 14.15 1.9 12 3.98 9.85 3.25 6.95 6.13 6.13 6.95 3.25 9.85 3.98Z"
        />
        <text
          x="12"
          y="13.4"
          textAnchor="middle"
          className="fill-cmt-secondary-900 font-display text-[7px] font-bold"
        >
          ISO
        </text>
        <text
          x="12"
          y="17.6"
          textAnchor="middle"
          className="fill-cmt-neutral-500 text-[4px] font-semibold"
        >
          CERTIFIED
        </text>
      </svg>
      <span className="leading-tight">
        <span className="block font-display text-sm font-bold text-cmt-secondary-900">
          ISO 9001:2015
        </span>
        <span className="block text-xs font-semibold uppercase tracking-wider text-cmt-neutral-500">
          Quality certified
        </span>
      </span>
    </span>
  );
}

function PciMark() {
  return (
    <span className="leading-tight">
      <span className="block font-display text-sm font-bold tracking-tight text-cmt-secondary-900">
        PCI DSS
      </span>
      <span className="block text-xs font-semibold uppercase tracking-wider text-cmt-neutral-500">
        Compliant
      </span>
    </span>
  );
}

function SecureMark() {
  return (
    <span className="flex items-center gap-2">
      <ShieldCheck
        className="h-5 w-5 shrink-0 text-cmt-success-500"
        strokeWidth={2.2}
        aria-hidden="true"
      />
      <span className="font-display text-sm font-bold text-cmt-secondary-900">
        100% Secure
      </span>
    </span>
  );
}

/* Read aloud in place of the drawing — the label is the whole claim. */
export const ACCREDITATIONS: { id: string; label: string; mark: () => React.JSX.Element }[] = [
  { id: "google", label: "Google Reviews", mark: GoogleReviewsMark },
  { id: "iata", label: "IATA accredited", mark: IataMark },
  { id: "iso", label: "ISO 9001:2015 certified", mark: IsoMark },
  { id: "pci", label: "PCI DSS compliant payments", mark: PciMark },
  { id: "secure", label: "100% secure checkout", mark: SecureMark },
];

export default function TrustStrip() {
  const { footerBadges } = useSiteContent();
  return <TrustStripPreview value={footerBadges} />;
}

export function TrustStripPreview({ value }: { value: FooterBadgesContent }) {
  if (!value.enabled) return null;
  const verified = ACCREDITATIONS.filter(({ id }) => value.verifiedAccreditations?.includes(id));
  return (
    <div className="mt-12 grid gap-8 border-t border-cmt-neutral-200 pt-8 lg:mt-8 lg:grid-cols-2 lg:gap-10 lg:pt-7">
      <section aria-labelledby="footer-payment-modes">
        <h2 id="footer-payment-modes" className={headingClass}>
          Payment Mode
        </h2>

        <ul className="mt-4 flex flex-wrap items-center gap-2.5">
          {PAYMENT_METHODS.map((method) => (
            <li key={method.name} className={paymentChipClass}>
              {/* Capped on both axes: a tall card mark tops out at 24px, a
                  wide wordmark at 54px, and neither crops the other's chip. */}
              <Image
                src={value.paymentImages[method.id] || method.src}
                alt={method.name}
                width={method.width}
                height={method.height}
                unoptimized
                className="h-6 w-[54px] object-contain"
              />
            </li>
          ))}
        </ul>
      </section>

      {verified.length > 0 && <section aria-labelledby="footer-accreditations" className="lg:justify-self-end">
        <h2 id="footer-accreditations" className={headingClass}>
          Verified credentials
        </h2>

        <ul className="mt-4 flex flex-wrap items-center gap-2.5">
          {verified.map(({ id, label, mark: Mark }) => (
            <li key={label} className={chipClass} title={label}>
              <span className="sr-only">{label}</span>
              <span aria-hidden="true" className="flex items-center">
                {value.accreditationImages[id] ? (
                  <Image
                    src={value.accreditationImages[id]}
                    alt=""
                    width={160}
                    height={32}
                    unoptimized
                    className="h-8 w-auto max-w-[160px] object-contain"
                  />
                ) : <Mark />}
              </span>
            </li>
          ))}
        </ul>
      </section>}
    </div>
  );
}

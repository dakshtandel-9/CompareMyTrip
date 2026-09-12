import BrandLogo from "@/components/BrandLogo";
import { Fragment } from "react";
import Link from "next/link";
import { ArrowUpRight, CreditCard, Mail, MapPin, Phone } from "lucide-react";

import PartnerMarquee from "@/components/PartnerMarquee";
import SupportPhones from "@/components/SupportPhones";
import TrustStrip from "@/components/TrustStrip";

/* ------------------------------------------------------------------ */
/* Site footer. Light on purpose: the newsletter block directly above   */
/* is a dark card, so a dark footer here would merge with it and steal  */
/* the CTA's emphasis. Alternating fill #F8FAFC per §3.7, same          */
/* container and gutters as every other section.                        */
/* ------------------------------------------------------------------ */

/* ── FILL IN when the business details are confirmed ────────────────
   requirements/01-Project-Requirements.md still lists these as PENDING
   (registered address, support email, phone, social handles). Anything
   left empty is simply not rendered, so nothing invented ships. */
const CONTACT = {
  email: "", // e.g. "support@comparemytrip.com"
  phone: "", // e.g. "+91 98765 43210"
  address: "", // registered business address
};

const SOCIAL_LINKS: { label: string; href: string; path: string }[] = [
  // Paste the real profile URLs in to switch this row on, e.g.
  // { label: "Instagram", href: "https://instagram.com/…", path: INSTAGRAM },
];

/* lucide-react v1 no longer ships brand marks, so these are inline. */
export const INSTAGRAM =
  "M12 2.2c3.2 0 3.6 0 4.9.07 1.2.06 1.8.25 2.2.41.6.22 1 .48 1.4.9.4.4.68.8.9 1.4.16.4.35 1 .41 2.2.06 1.3.07 1.7.07 4.9s0 3.6-.07 4.9c-.06 1.2-.25 1.8-.41 2.2a3.9 3.9 0 0 1-.9 1.4c-.4.4-.8.68-1.4.9-.4.16-1 .35-2.2.41-1.3.06-1.7.07-4.9.07s-3.6 0-4.9-.07c-1.2-.06-1.8-.25-2.2-.41a3.9 3.9 0 0 1-1.4-.9 3.9 3.9 0 0 1-.9-1.4c-.16-.4-.35-1-.41-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.9c.06-1.2.25-1.8.41-2.2.22-.6.48-1 .9-1.4.4-.4.8-.68 1.4-.9.4-.16 1-.35 2.2-.41C8.4 2.2 8.8 2.2 12 2.2Zm0 3.05a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5Zm0 2.2a4.55 4.55 0 1 1 0 9.1 4.55 4.55 0 0 1 0-9.1Zm6.99-2.45a1.58 1.58 0 1 1-3.15 0 1.58 1.58 0 0 1 3.15 0Z";
export const FACEBOOK =
  "M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 22 12Z";
export const YOUTUBE =
  "M21.58 7.19a2.51 2.51 0 0 0-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42a2.51 2.51 0 0 0-1.77 1.77A26.2 26.2 0 0 0 2 12a26.2 26.2 0 0 0 .42 4.81 2.51 2.51 0 0 0 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42a2.51 2.51 0 0 0 1.77-1.77A26.2 26.2 0 0 0 22 12a26.2 26.2 0 0 0-.42-4.81ZM10 15.02V8.98L15.2 12 10 15.02Z";
export const LINKEDIN =
  "M6.94 8.5H3.56V21h3.38V8.5ZM5.25 3a1.96 1.96 0 1 0 0 3.92 1.96 1.96 0 0 0 0-3.92ZM20.44 21v-6.86c0-3.36-1.79-4.92-4.19-4.92a3.6 3.6 0 0 0-3.27 1.8h-.05V8.5H9.68V21h3.38v-6.19c0-1.63.31-3.21 2.33-3.21 1.99 0 2.02 1.86 2.02 3.31V21h3.03Z";

type FooterLink = { label: string; href: string };

const linkColumns: { heading: string; links: FooterLink[] }[] = [
  {
    heading: "Explore",
    links: [
      { label: "All Packages", href: "/packages" },
      { label: "Weekend Treks", href: "/packages?category=weekend-treks" },
      { label: "Domestic", href: "/packages?region=india" },
      { label: "International", href: "/packages?region=international" },
      { label: "Compare Packages", href: "/compare" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Contact", href: "/contact" },
      { label: "FAQs", href: "/#faq" },
      { label: "Travel Guide", href: "/blog" },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "Sign In", href: "/login" },
      { label: "Create Account", href: "/signup" },
      { label: "My Bookings", href: "/account" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Refund & Cancellation", href: "/refund-policy" },
    ],
  },
];

const linkClass =
  "rounded-cmt-sm text-sm leading-6 text-cmt-neutral-600 transition-colors duration-150 hover:text-cmt-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500";

/* The catalogue carries the compare bar (@/components/FloatingActions)
   over the bottom of the screen; only that page asks for the extra room
   at the foot, so the bar does not land on the copyright line. */
export default function Footer({
  clearsCompareBar = false,
}: {
  clearsCompareBar?: boolean;
} = {}) {
  const contactRows = [
    CONTACT.email
      ? { icon: Mail, text: CONTACT.email, href: `mailto:${CONTACT.email}` }
      : null,
    CONTACT.phone
      ? {
          icon: Phone,
          text: CONTACT.phone,
          href: `tel:${CONTACT.phone.replace(/[^\d+]/g, "")}`,
        }
      : null,
    CONTACT.address
      ? { icon: MapPin, text: CONTACT.address, href: null }
      : null,
  ].filter((row) => row !== null);

  return (
    <footer className="cmt-footer w-full border-t border-cmt-neutral-200 bg-cmt-neutral-50">
      {/* Full bleed, so the boards run right out to both page edges — the
          gutters below start under it. */}
      <PartnerMarquee />

      <div
        className={`px-4 pt-12 sm:px-5 sm:pt-16 lg:px-6 lg:pt-14 ${
          clearsCompareBar
            ? "pb-28 sm:pb-32 lg:pb-32"
            : "pb-12 sm:pb-16 lg:pb-8"
        }`}
      >
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:gap-10 lg:grid-cols-[minmax(0,1.5fr)_repeat(4,minmax(0,1fr))] lg:gap-x-10 lg:gap-y-10 xl:gap-x-14">
            {/* Brand */}
            <div className="col-span-2 lg:col-span-1">
              <Link href="/" className="inline-flex">
                <BrandLogo className="w-[235px] max-w-full" />
              </Link>

              <p className="mt-5 max-w-[38ch] text-pretty text-sm leading-[1.6] text-cmt-neutral-600">
                Compare curated travel packages side by side — full itinerary,
                inclusions and final pricing before you book.
              </p>

              {contactRows.length > 0 ? (
                <ul className="mt-6 space-y-3">
                  {contactRows.map((row) => (
                    <li key={row.text} className="flex items-start gap-2.5">
                      <row.icon
                        className="mt-0.5 h-4 w-4 shrink-0 text-cmt-primary-700"
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                      {row.href ? (
                        <a href={row.href} className={linkClass}>
                          {row.text}
                        </a>
                      ) : (
                        <span className="text-sm leading-6 text-cmt-neutral-600">
                          {row.text}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : null}

              {SOCIAL_LINKS.length > 0 ? (
                <ul className="mt-6 flex items-center gap-2.5">
                  {SOCIAL_LINKS.map((social) => (
                    <li key={social.label}>
                      <a
                        href={social.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        aria-label={social.label}
                        className="flex h-10 w-10 items-center justify-center rounded-cmt-full border border-cmt-neutral-200 bg-white text-cmt-neutral-700 transition-colors duration-150 hover:border-cmt-primary-500 hover:text-cmt-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-[18px] w-[18px]"
                          aria-hidden="true"
                        >
                          <path d={social.path} fill="currentColor" />
                        </svg>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="col-span-2 pb-7 md:pb-0 lg:order-last lg:col-span-5 lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center lg:gap-7 lg:rounded-cmt-md lg:border lg:border-cmt-neutral-200 lg:bg-white lg:p-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-8 xl:px-8">
              <section aria-labelledby="footer-support">
                <h2 id="footer-support" className="mb-5 hidden font-display text-lg font-semibold text-cmt-neutral-900 lg:block">
                  Talk to our travel team
                </h2>
                <SupportPhones compact footerRow />
              </section>
              <div className="mt-6 max-w-sm rounded-cmt-md border border-cmt-neutral-200 bg-white p-4 lg:mt-0 lg:max-w-none lg:rounded-none lg:border-0 lg:border-l lg:py-0 lg:pl-7 lg:pr-0 xl:pl-8">
                <p className="flex items-center gap-2 text-sm font-semibold text-cmt-neutral-900">
                  <CreditCard className="h-4 w-4" aria-hidden="true" />
                  Agreed on a payment?
                </p>
                <p className="mt-2 text-sm leading-5 text-cmt-neutral-600">
                  Pay the amount discussed with our team.
                </p>
                <Link href="/pay" className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-cmt-control bg-cmt-primary-500 px-4 py-2 text-sm font-semibold text-cmt-neutral-900 transition-colors hover:bg-cmt-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500">
                  Pay an amount <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>

            {/* Link columns */}
            {linkColumns.map((column) => (
              <Fragment key={column.heading}>
              <details className="cmt-footer-group col-span-2 md:hidden">
                <summary>{column.heading}<span aria-hidden="true">+</span></summary>
                <nav aria-label={`${column.heading} links`}>
                  {column.links.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}
                </nav>
              </details>
              <nav
                className="max-md:hidden"
                aria-labelledby={`footer-${column.heading}`}
              >
                <h2
                  id={`footer-${column.heading}`}
                  className="text-xs font-semibold uppercase tracking-wider text-cmt-neutral-900"
                >
                  {column.heading}
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className={linkClass}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              </Fragment>
            ))}
          </div>

          <TrustStrip />

          <div className="mt-8 flex flex-col gap-3 border-t border-cmt-neutral-200 pt-6 text-xs leading-6 text-cmt-neutral-500 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <p>
              &copy; {new Date().getFullYear()} CompareMyTrip. All rights
              reserved.
            </p>
            <p>Every package listed comes from a trusted operator.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

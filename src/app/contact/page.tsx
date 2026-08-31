import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, Mail, MapPin, Phone } from "lucide-react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EnquiryForm from "./EnquiryForm";

/* ------------------------------------------------------------------ */
/* Contact — built to the Page blueprints entry in the design system:   */
/* 2-column 7 + 5, compact hero → enquiry form + contact card →         */
/* offices → FAQ link, primary CTA "Send Enquiry".                      */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "Contact | CompareMyTrip",
  description:
    "Send an enquiry and our travel desk will come back with package options that match the trip you have in mind.",
};

/* ── FILL IN when the business details are confirmed ────────────────
   requirements/01-Project-Requirements.md still lists the registered
   address, support email and phone as PENDING. Anything left empty is
   not rendered, so nothing invented ships. */
const CHANNELS = [
  {
    icon: Mail,
    label: "Email",
    value: "", // e.g. "support@comparemytrip.com"
    href: (value: string) => `mailto:${value}`,
  },
  {
    icon: Phone,
    label: "Phone",
    value: "", // e.g. "+91 98765 43210"
    href: (value: string) => `tel:${value.replace(/[^\d+]/g, "")}`,
  },
].filter((channel) => channel.value !== "");

const HOURS = ""; // e.g. "Mon–Sat, 9:30am – 7:00pm IST"

const OFFICES: { city: string; address: string; note?: string }[] = [
  // { city: "Mumbai", address: "…registered address…", note: "Head office" },
];

const NEXT_STEPS = [
  {
    title: "Your enquiry reaches the travel desk",
    description:
      "It lands with the team that handles the destination you asked about.",
  },
  {
    title: "We come back with matching packages",
    description:
      "Options from GST-verified operators, with inclusions and final pricing spelled out.",
  },
  {
    title: "You compare, then decide",
    description:
      "Line the options up side by side and book the one that actually fits.",
  },
];

export default function ContactPage() {
  return (
    <>
      <Header />

      <main className="w-full bg-white font-body text-cmt-neutral-900">
        {/* Compact hero */}
        <section className="w-full border-b border-cmt-neutral-100 bg-cmt-neutral-50 px-4 py-12 sm:px-5 sm:py-16 lg:px-6">
          <div className="mx-auto w-full max-w-[1440px]">
            <p className="text-xs font-semibold uppercase tracking-wider text-cmt-primary-700 sm:text-sm">
              Contact
            </p>
            <h1 className="mt-2 max-w-[18ch] font-display text-3xl font-semibold leading-[1.15] tracking-tight text-cmt-neutral-900 sm:text-5xl">
              Tell us about the trip.
            </h1>
            <p className="mt-3 max-w-xl text-pretty text-sm leading-relaxed text-cmt-neutral-600 sm:text-base">
              Send one enquiry and our travel desk comes back with packages that
              match your dates, your pace and your budget — no obligation to book.
            </p>
          </div>
        </section>

        {/* Enquiry form + contact card — the blueprint's 7 + 5 split */}
        <section className="w-full px-4 py-12 sm:px-5 sm:py-16 lg:px-6 lg:py-20">
          <div className="mx-auto grid w-full max-w-[1440px] gap-10 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-7">
              <h2 className="font-display text-2xl font-semibold leading-[1.2] text-cmt-neutral-900 sm:text-[28px]">
                Send an enquiry
              </h2>
              <p className="mt-2 max-w-[52ch] text-pretty text-sm leading-[1.6] text-cmt-neutral-600 sm:text-base">
                The more you tell us, the closer the first set of options will be.
              </p>

              <div className="mt-8">
                <EnquiryForm />
              </div>
            </div>

            <aside className="lg:col-span-5">
              <div className="rounded-cmt-lg border border-cmt-neutral-200 bg-cmt-neutral-50 p-6 sm:p-8">
                <h2 className="font-display text-xl font-semibold leading-[1.25] text-cmt-neutral-900 sm:text-2xl">
                  What happens next
                </h2>

                <ol className="mt-6 space-y-6">
                  {NEXT_STEPS.map((step, index) => (
                    <li key={step.title} className="flex gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-cmt-full bg-cmt-primary-500 font-display text-sm font-bold text-cmt-neutral-900">
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="font-display text-[15px] font-semibold leading-snug text-cmt-neutral-900">
                          {step.title}
                        </h3>
                        <p className="mt-1 text-pretty text-sm leading-[1.55] text-cmt-neutral-600">
                          {step.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>

                {CHANNELS.length > 0 || HOURS ? (
                  <div className="mt-8 border-t border-cmt-neutral-200 pt-6">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-cmt-neutral-900">
                      Reach us directly
                    </h3>
                    <ul className="mt-4 space-y-3">
                      {CHANNELS.map((channel) => (
                        <li key={channel.label} className="flex items-start gap-3">
                          <channel.icon
                            className="mt-0.5 h-4 w-4 shrink-0 text-cmt-primary-700"
                            strokeWidth={2}
                            aria-hidden="true"
                          />
                          <div>
                            <span className="sr-only">{channel.label}: </span>
                            <a
                                href={channel.href(channel.value)}
                                className="rounded-cmt-sm text-sm text-cmt-neutral-700 transition-colors hover:text-cmt-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
                              >
                                {channel.value}
                              </a>
                          </div>
                        </li>
                      ))}
                      {HOURS ? (
                        <li className="flex items-start gap-3">
                          <Clock
                            className="mt-0.5 h-4 w-4 shrink-0 text-cmt-primary-700"
                            strokeWidth={2}
                            aria-hidden="true"
                          />
                          <span className="text-sm text-cmt-neutral-700">{HOURS}</span>
                        </li>
                      ) : null}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-8 border-t border-cmt-neutral-200 pt-6">
                  <p className="text-sm leading-[1.6] text-cmt-neutral-600">
                    Would rather look around first?
                  </p>
                  {/* Text button (§06) — the page's one primary button is
                      "Send Enquiry", so this stays a text variant. */}
                  <Link
                    href="/packages"
                    className="group mt-2 inline-flex w-fit items-center gap-2 rounded-cmt-control font-body text-sm font-semibold text-cmt-neutral-900 transition-colors duration-150 hover:text-cmt-primary-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 sm:text-base"
                  >
                    Browse packages
                    <ArrowRight
                      className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1"
                      strokeWidth={2.5}
                      aria-hidden="true"
                    />
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* Offices */}
        {OFFICES.length > 0 ? (
          <section className="w-full border-t border-cmt-neutral-100 px-4 py-12 sm:px-5 sm:py-16 lg:px-6">
            <div className="mx-auto w-full max-w-[1440px]">
              <h2 className="font-display text-2xl font-semibold leading-[1.2] tracking-tight text-cmt-neutral-900 sm:text-[32px]">
                Where we are
              </h2>
              <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {OFFICES.map((office) => (
                  <li
                    key={office.city}
                    className="rounded-cmt-md border border-cmt-neutral-200 bg-white p-6 shadow-cmt-sm"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-cmt-full bg-cmt-primary-100">
                      <MapPin className="h-6 w-6 text-cmt-neutral-900" strokeWidth={2} aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 font-display text-lg font-semibold leading-[1.3] text-cmt-neutral-900">
                      {office.city}
                    </h3>
                    {office.note ? (
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-cmt-primary-700">
                        {office.note}
                      </p>
                    ) : null}
                    <p className="mt-2 text-pretty text-sm leading-[1.55] text-cmt-neutral-600">
                      {office.address}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        {/* FAQ link */}
        <section className="w-full border-t border-cmt-neutral-100 bg-cmt-neutral-50 px-4 py-12 sm:px-5 sm:py-14 lg:px-6">
          <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
            <div>
              <h2 className="font-display text-xl font-semibold leading-[1.25] tracking-tight text-cmt-neutral-900 sm:text-2xl">
                Question already answered?
              </h2>
              <p className="mt-2 max-w-[52ch] text-pretty text-sm leading-[1.6] text-cmt-neutral-600 sm:text-base">
                Payments, cancellations, what a package includes — the common
                ones are covered in our FAQs.
              </p>
            </div>
            {/* Outline button (§06), so the yellow stays unique to the form. */}
            <Link
              href="/faqs"
              className="inline-flex h-11 w-fit shrink-0 items-center gap-2 rounded-cmt-control border border-cmt-neutral-300 bg-white px-5 font-body text-sm font-semibold text-cmt-neutral-900 transition-colors duration-150 hover:border-cmt-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 sm:h-12 sm:text-base"
            >
              Read the FAQs
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

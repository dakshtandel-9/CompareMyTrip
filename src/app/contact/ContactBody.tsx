"use client";

import Link from "next/link";
import { ArrowRight, Clock, MapPin } from "lucide-react";

import { Glyph } from "@/lib/adminIcons";
import { useSiteContent } from "@/lib/useSiteContent";
import Faq from "@/app/home/_sections/Faq";
import EnquiryForm from "./EnquiryForm";
import SupportPhones from "@/components/SupportPhones";

/* ------------------------------------------------------------------ */
/* Contact — built to the Page blueprints entry in the design system:   */
/* 2-column 7 + 5, compact hero → enquiry form + contact card →         */
/* offices → FAQ, primary CTA "Send Enquiry".                           */
/*                                                                      */
/* Split out of page.tsx so that file can stay a server component and   */
/* keep exporting `metadata`, while everything it says comes from the   */
/* CRM. The enquiry form is untouched: its fields, validation and       */
/* submission are code, and the two link targets are wiring rather than */
/* copy — only their wording is editable.                               */
/* ------------------------------------------------------------------ */

/** mailto: for an email, tel: for a phone, and no link at all for plain
    text — an editor picks which by choosing the row's kind. */
const channelHref = (kind: string, value: string) => {
  if (kind === "email") return `mailto:${value}`;
  if (kind === "phone") return `tel:${value.replace(/[^\d+]/g, "")}`;
  return "";
};

export default function ContactBody() {
  const { contact } = useSiteContent();

  /* Business details shipped empty as PENDING, so every block that depends on
     them still hides itself until it is filled in. */
  const channels = contact.channels.filter((channel) => channel.value.trim() !== "");
  const offices = contact.offices.items.filter(
    (office) => office.city.trim() !== "" || office.address.trim() !== "",
  );
  const showOffices = contact.offices.enabled && offices.length > 0;
  const showDirect = channels.length > 0 || contact.hours.trim() !== "";

  return (
    <main className="w-full bg-white font-body text-cmt-neutral-900">
      {/* Compact hero */}
      <section className="w-full border-b border-cmt-neutral-100 bg-cmt-neutral-50 px-4 py-12 sm:px-5 sm:py-16 lg:px-6">
        <div className="mx-auto w-full max-w-[1440px]">
          <p className="text-xs font-semibold uppercase tracking-wider text-cmt-primary-700 sm:text-sm">
            {contact.eyebrow}
          </p>
          <h1 className="mt-2 max-w-[18ch] font-display text-3xl font-semibold leading-[1.15] tracking-tight text-cmt-neutral-900 sm:text-5xl">
            {contact.title}
          </h1>
          <p className="mt-3 max-w-xl text-pretty text-sm leading-relaxed text-cmt-neutral-600 sm:text-base">
            {contact.description}
          </p>
        </div>
      </section>

      {/* Enquiry form + contact card — the blueprint's 7 + 5 split. Without
          the card the form takes the whole width rather than leaving a gap. */}
      <section className="w-full px-4 py-12 sm:px-5 sm:py-16 lg:px-6 lg:py-20">
        <div className="mx-auto grid w-full max-w-[1440px] gap-10 lg:grid-cols-12 lg:gap-8">
          <div className={contact.enabled ? "lg:col-span-7" : "lg:col-span-12"}>
            <h2 className="font-display text-2xl font-semibold leading-[1.2] text-cmt-neutral-900 sm:text-[28px]">
              {contact.formTitle}
            </h2>
            <p className="mt-2 max-w-[52ch] text-pretty text-sm leading-[1.6] text-cmt-neutral-600 sm:text-base">
              {contact.formDescription}
            </p>

            <div className="mt-8">
              <EnquiryForm />
            </div>
          </div>

          {contact.enabled && (
            <aside className="lg:col-span-5">
              <div className="rounded-cmt-lg border border-cmt-neutral-200 bg-cmt-neutral-50 p-6 sm:p-8">
                <h2 className="font-display text-xl font-semibold leading-[1.25] text-cmt-neutral-900 sm:text-2xl">
                  {contact.sidebarTitle}
                </h2>

                <ol className="mt-6 space-y-6">
                  {contact.steps.map((step, index) => (
                    <li key={step.id} className="flex gap-4">
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

                {showDirect ? (
                  <div className="mt-8 border-t border-cmt-neutral-200 pt-6">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-cmt-neutral-900">
                      {contact.directTitle}
                    </h3>
                    <ul className="mt-4 space-y-3">
                      {channels.map((channel) => {
                        const href = channelHref(channel.kind, channel.value);
                        return (
                          <li key={channel.id} className="flex items-start gap-3">
                            <Glyph
                              name={channel.icon}
                              className="mt-0.5 h-4 w-4 shrink-0 text-cmt-primary-700"
                            />
                            <div>
                              <span className="sr-only">{channel.label}: </span>
                              {href ? (
                                <a
                                  href={href}
                                  className="rounded-cmt-sm text-sm text-cmt-neutral-700 transition-colors hover:text-cmt-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
                                >
                                  {channel.value}
                                </a>
                              ) : (
                                <span className="text-sm text-cmt-neutral-700">
                                  {channel.value}
                                </span>
                              )}
                            </div>
                          </li>
                        );
                      })}
                      {contact.hours.trim() !== "" ? (
                        <li className="flex items-start gap-3">
                          <Clock
                            className="mt-0.5 h-4 w-4 shrink-0 text-cmt-primary-700"
                            strokeWidth={2}
                            aria-hidden="true"
                          />
                          <span className="text-sm text-cmt-neutral-700">{contact.hours}</span>
                        </li>
                      ) : null}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-8 border-t border-cmt-neutral-200 pt-6">
                  <p className="text-sm leading-[1.6] text-cmt-neutral-600">
                    {contact.browsePrompt}
                  </p>
                  {/* Text button (§06) — the page's one primary button is
                      "Send Enquiry", so this stays a text variant. */}
                  <Link
                    href="/packages"
                    className="group mt-2 inline-flex w-fit items-center gap-2 rounded-cmt-control font-body text-sm font-semibold text-cmt-neutral-900 transition-colors duration-150 hover:text-cmt-primary-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 sm:text-base"
                  >
                    {contact.browseLabel}
                    <ArrowRight
                      className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1"
                      strokeWidth={2.5}
                      aria-hidden="true"
                    />
                  </Link>
                </div>
              </div>
            </aside>
          )}
        </div>
      </section>

      <section className="w-full border-t border-cmt-neutral-100 px-4 py-12 sm:px-5 sm:py-16 lg:px-6">
        <div className="mx-auto w-full max-w-[1440px]">
          <h2 className="font-display text-2xl font-semibold leading-[1.2] tracking-tight text-cmt-neutral-900 sm:text-[32px]">
            Call our team
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-cmt-neutral-600 sm:text-base">
            Get help with your travel plans, booking support or weekend treks.
          </p>
          <SupportPhones />
        </div>
      </section>

      {/* Offices */}
      {showOffices ? (
        <section className="w-full border-t border-cmt-neutral-100 px-4 py-12 sm:px-5 sm:py-16 lg:px-6">
          <div className="mx-auto w-full max-w-[1440px]">
            <h2 className="font-display text-2xl font-semibold leading-[1.2] tracking-tight text-cmt-neutral-900 sm:text-[32px]">
              {contact.offices.title}
            </h2>
            <ul className="mt-8 grid gap-6">
              {offices.map((office) => (
                <li
                  key={office.id}
                  className="grid gap-6 rounded-cmt-md border border-cmt-neutral-200 bg-white p-6 shadow-cmt-sm md:grid-cols-2 md:items-center"
                >
                  <div>
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
                    <address className="mt-2 whitespace-pre-line text-pretty text-sm not-italic leading-[1.55] text-cmt-neutral-600">
                      {office.address}
                    </address>
                    {office.address.trim() ? (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${office.address}, ${office.city}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-2 rounded-cmt-sm text-sm font-semibold text-cmt-primary-700 hover:text-cmt-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
                      >
                        Open in Google Maps
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </a>
                    ) : null}
                  </div>
                  {office.address.trim() ? (
                    <iframe
                      title={`Google map for ${office.city || "our office"}: ${office.address}`}
                      src={`https://www.google.com/maps?q=${encodeURIComponent(`${office.address}, ${office.city}`)}&output=embed`}
                      className="h-64 w-full rounded-cmt-md border-0 bg-cmt-neutral-50"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      allowFullScreen
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* The homepage's FAQ section itself, not a link to a page that does
          not exist. It reads the same content, so editing the questions in
          the CRM's FAQ section updates both places at once — and its help
          card drops out here, since it points at this page. */}
      <Faq />
    </main>
  );
}

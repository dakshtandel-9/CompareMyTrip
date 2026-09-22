"use client";

import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import Image from "next/image";
import { ArrowDown, Check, ClipboardList, Clock3, ShieldCheck } from "lucide-react";
import { useSiteContent } from "@/lib/useSiteContent";

import AddOnForm from "./AddOnForm";
import AirlineBrands from "./AirlineBrands";
import VisaDestinationStamps from "./VisaDestinationStamps";
import QuoteGuarantee from "./QuoteGuarantee";
import { SERVICES, toServiceId, type ServiceId } from "./services";

/* ------------------------------------------------------------------ */
/* Add On — flights, hotels, visas, transport and Bring Your Quote.    */
/* One page, one tab each, in that order.                              */
/*                                                                      */
/* Split out of page.tsx so that file stays a server component and keeps */
/* exporting `metadata`. All panels are mounted at once and the         */
/* inactive ones are `hidden`: that is the ARIA tabs pattern, and it     */
/* means opening Hotels to check a date and coming back to Flights does  */
/* not wipe what was already typed.                                     */
/*                                                                      */
/* The tab is in the URL so the header's Add On menu can point straight  */
/* at one. Clicking a tab rewrites the query string with                 */
/* history.replaceState rather than routing, which keeps every panel     */
/* mounted — a route change here would empty the forms.                  */
/* ------------------------------------------------------------------ */

const REASSURANCE = [
  { icon: Clock3, title: "A reply the same day", body: "Enquiries in before 6pm IST are answered the same working day." },
  { icon: ShieldCheck, title: "No booking, no fee", body: "Asking costs nothing. You only pay once you have picked something." },
  { icon: Check, title: "Real options, not one", body: "You get a shortlist with the trade-offs spelled out, not a single quote." },
];

const HOTEL_LOGOS = [
  { src: "/hotelLogo/original/leela.webp", name: "The Leela" },
  { src: "/hotelLogo/original/sarovar.webp", name: "Sarovar Hotels & Resorts" },
  { src: "/hotelLogo/original/fern.webp", name: "The Fern Hotels & Resorts" },
  { src: "/hotelLogo/original/hyatt.webp", name: "Hyatt" },
  { src: "/hotelLogo/original/lemon-tree.webp", name: "Lemon Tree Hotels" },
  { src: "/hotelLogo/original/hilton.webp", name: "Hilton Hotels & Resorts" },
  { src: "/hotelLogo/original/oberoi.webp", name: "Oberoi Hotels & Resorts" },
  { src: "/hotelLogo/original/itc.webp", name: "ITC Hotels" },
  { src: "/hotelLogo/original/marriott.webp", name: "Marriott" },
  { src: "/hotelLogo/original/taj-gold.webp", name: "Taj" },
];

const SERVICE_LOGOS = {
  hotels: { title: "Hotel brands", logos: HOTEL_LOGOS },
};

export default function AddOnBody({ initialService }: { initialService: ServiceId }) {
  const [active, setActive] = useState<ServiceId>(() => toServiceId(initialService));
  const { addOn } = useSiteContent();
  const hero = addOn.services[active];
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const open = (id: ServiceId) => {
    setActive(id);
    /* Supported by the App Router, and unlike a route change it leaves the
       other panels mounted with whatever is typed in them. */
    window.history.replaceState(null, "", `/add-on?service=${id}`);
  };

  const openQuoteForm = () => {
    // Reveal the panel before scrolling, keeping every form's current values.
    flushSync(() => open("byq"));
    const panel = document.getElementById("add-on-panel-byq");
    panel?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      block: "start",
    });
    panel?.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true });
  };

  /* Arrow keys move between tabs, Home and End jump to the ends — the
     roving-focus half of the tabs pattern. */
  const onTabKeyDown = (event: React.KeyboardEvent, index: number) => {
    const step =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : event.key === "Home" ? -index : event.key === "End" ? SERVICES.length - 1 - index : null;
    if (step === null) return;
    event.preventDefault();
    const next = SERVICES[(index + step + SERVICES.length) % SERVICES.length];
    open(next.id);
    tabRefs.current[next.id]?.focus();
  };

  return (
    <main className="cmt-addon w-full bg-white font-body text-cmt-neutral-900">
      {/* Compact hero */}
      {addOn.enabled && (
        <section className="w-full border-b border-cmt-neutral-100 bg-cmt-neutral-50 px-4 py-12 sm:px-5 sm:py-16 lg:px-6">
          <div className="mx-auto w-full max-w-[1440px]">
            <p className="text-xs font-semibold uppercase tracking-wider text-cmt-primary-700 sm:text-sm">
              {hero.eyebrow}
            </p>
            <h1 className="mt-2 max-w-[20ch] font-display text-3xl font-semibold leading-[1.15] tracking-tight text-cmt-neutral-900 sm:text-5xl">
              {hero.title}
            </h1>
            <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-cmt-neutral-600 sm:text-base">
              {hero.description}
            </p>
          </div>
        </section>
      )}

      {/* Tabs + the open panel */}
      <section id="add-on-enquiry" className="scroll-mt-28 w-full px-4 py-10 sm:px-5 sm:py-14 lg:px-6 lg:py-16">
        <div className="mx-auto w-full max-w-[1440px]">
          <a href="#quote-guarantee" className="mb-6 flex w-fit items-center gap-2 rounded-cmt-control border border-cmt-primary-500/40 bg-cmt-primary-100/50 px-4 py-3 text-sm font-semibold text-cmt-neutral-900 transition-colors hover:bg-cmt-primary-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500">
            <ShieldCheck size={18} className="shrink-0 text-cmt-primary-700" aria-hidden="true" />
            Already have a quote? See our price-beat guarantee ↓
          </a>
          <div
            role="tablist"
            aria-label="Choose what you need"
            className="flex w-full gap-2 overflow-x-auto rounded-cmt-md border border-cmt-neutral-200 bg-cmt-neutral-50 p-1.5 sm:w-auto sm:max-w-max"
          >
            {SERVICES.map((service, index) => {
              const isActive = service.id === active;
              const Icon = service.icon;
              return (
                <button
                  key={service.id}
                  ref={(node) => {
                    tabRefs.current[service.id] = node;
                  }}
                  type="button"
                  role="tab"
                  id={`add-on-tab-${service.id}`}
                  aria-selected={isActive}
                  aria-controls={`add-on-panel-${service.id}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => open(service.id)}
                  onKeyDown={(event) => onTabKeyDown(event, index)}
                  className={`flex h-11 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-cmt-control px-2 font-body text-sm font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 sm:flex-none sm:gap-2 sm:px-5 sm:text-[15px] ${
                    isActive
                      ? "bg-white text-cmt-neutral-900 shadow-cmt-xs"
                      : "text-cmt-neutral-600 hover:bg-white/70 hover:text-cmt-neutral-900"
                  }`}
                >
                  <Icon
                    size={17}
                    strokeWidth={2}
                    className={isActive ? "text-cmt-primary-700" : "text-cmt-neutral-500"}
                    aria-hidden="true"
                  />
                  {service.label}
                </button>
              );
            })}
          </div>

          {SERVICES.map((service) => (
            <div
              key={service.id}
              role="tabpanel"
              id={`add-on-panel-${service.id}`}
              aria-labelledby={`add-on-tab-${service.id}`}
              hidden={service.id !== active}
              className="mt-8 scroll-mt-28 sm:mt-10"
            >
              {/* The blueprint's 7 + 5 split: the form, and what we come back
                  with beside it. */}
              <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
                <div className="min-w-0 lg:col-span-7">
                  <h2 className="font-display text-2xl font-semibold leading-[1.2] text-cmt-neutral-900 sm:text-[28px]">
                    {service.title}
                  </h2>
                  <p className="mt-2 max-w-[56ch] text-pretty text-sm leading-[1.6] text-cmt-neutral-600 sm:text-base">
                    {service.description}
                  </p>

                  <div className="mt-8">
                    {service.id === "byq" && (
                      <p className="mb-5 text-sm leading-6 text-cmt-neutral-600">
                        The quote-beating service uses a Token of Interest, adjustable against your final booking.
                        {" "}<a href="#quote-guarantee" className="font-semibold underline underline-offset-4">See the process and guarantee terms</a>.
                      </p>
                    )}
                    <AddOnForm service={service} />
                  </div>
                </div>

                <aside className={service.id === "transport" ? "flex min-w-0 flex-col lg:col-span-5" : "lg:col-span-5"}>
                  <div className="rounded-cmt-lg border border-cmt-neutral-200 bg-cmt-neutral-50 p-6 sm:p-8">
                    <h3 className="font-display text-xl font-semibold leading-[1.25] text-cmt-neutral-900 sm:text-2xl">
                      What comes back
                    </h3>
                    <ul className="mt-6 space-y-4">
                      {service.promises.map((promise) => (
                        <li key={promise} className="flex gap-3">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-cmt-full bg-cmt-primary-500">
                            <Check className="h-3 w-3 text-cmt-neutral-900" strokeWidth={3} aria-hidden="true" />
                          </span>
                          <span className="text-pretty text-sm leading-[1.55] text-cmt-neutral-700">
                            {promise}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-8 space-y-5 border-t border-cmt-neutral-200 pt-6">
                      {REASSURANCE.filter((item) => service.id !== "byq" || item.title !== "No booking, no fee").map((item) => (
                        <div key={item.title} className="flex gap-3">
                          <item.icon
                            size={16}
                            strokeWidth={2}
                            className="mt-0.5 shrink-0 text-cmt-primary-700"
                            aria-hidden="true"
                          />
                          <div>
                            <h4 className="font-display text-[15px] font-semibold leading-snug text-cmt-neutral-900">
                              {item.title}
                            </h4>
                            <p className="mt-1 text-pretty text-sm leading-[1.55] text-cmt-neutral-600">
                              {item.body}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                    {service.id === "byq" && (
                      <section aria-labelledby="byq-checklist-heading" className="mt-6 overflow-hidden rounded-cmt-lg border border-cmt-neutral-200 bg-white">
                        <div className="border-b border-cmt-neutral-200 bg-cmt-primary-100/40 p-6 sm:p-8">
                          <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-cmt-control border border-cmt-primary-500/40 bg-cmt-primary-100">
                            <ClipboardList size={22} className="text-cmt-primary-700" aria-hidden="true" />
                          </span>
                          <h3 id="byq-checklist-heading" className="font-display text-xl font-semibold leading-[1.25] text-cmt-neutral-900 sm:text-2xl">
                            A better comparison starts here
                          </h3>
                          <p className="mt-2 text-sm leading-relaxed text-cmt-neutral-600">
                            Keep these details handy so we can compare the whole trip, down to the little things.
                          </p>
                        </div>
                        <ul className="space-y-6 p-6 sm:p-8">
                          {[
                            { title: "Same dates, same travellers", body: "Include your travel dates, number of guests and children’s ages, if any." },
                            { title: "The stay details", body: "Share hotel names, room categories, number of nights and meal plans." },
                            { title: "Everything that’s included", body: "List flights, baggage, transfers, sightseeing and any entry tickets." },
                            { title: "The full price", body: "Mention the currency, taxes, extra charges and whether the total is per person or for everyone." },
                          ].map((item, index) => (
                            <li key={item.title} className="flex gap-4">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-cmt-full bg-cmt-neutral-50 text-xs font-semibold text-cmt-primary-700">
                                {String(index + 1).padStart(2, "0")}
                              </span>
                              <div>
                                <h4 className="font-display text-[15px] font-semibold text-cmt-neutral-900">{item.title}</h4>
                                <p className="mt-1 text-sm leading-relaxed text-cmt-neutral-600">{item.body}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                        <div className="mx-6 border-t border-cmt-neutral-200 py-6 sm:mx-8">
                          <p className="text-sm leading-relaxed text-cmt-neutral-600">
                            Don’t have every detail? Share what you have and mention what matters most to you.
                          </p>
                          <a href="#quote-guarantee" className="mt-4 inline-flex items-center gap-2 rounded-cmt-control text-sm font-semibold text-cmt-neutral-900 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cmt-primary-500">
                            How the price-beat guarantee works
                            <ArrowDown size={16} aria-hidden="true" />
                          </a>
                        </div>
                      </section>
                    )}
                    {service.id === "transport" && (
                      <section aria-labelledby="transport-banner-heading" className="relative isolate mt-6 flex min-h-[420px] flex-col justify-end overflow-hidden rounded-cmt-lg bg-cmt-neutral-900 p-6 sm:min-h-[480px] sm:p-8 lg:flex-1">
                        <Image
                          src="/destinations/ladakh.jpg"
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 40vw, 100vw"
                          className="-z-20 object-cover object-[65%_center]"
                        />
                        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(15,23,42,0.05)_10%,rgba(15,23,42,0.45)_45%,rgba(15,23,42,0.96)_100%)]" />
                        <span className="mb-auto self-start rounded-cmt-full border border-white/30 bg-cmt-neutral-900/40 px-4 py-2 text-xs font-semibold tracking-wide text-white backdrop-blur-sm">
                          Every mile, made yours
                        </span>
                        <div className="mt-16">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cmt-primary-500">Enjoy the journey</p>
                          <h3 id="transport-banner-heading" className="mt-3 max-w-[14ch] font-display text-3xl font-semibold leading-[1.15] tracking-tight text-white sm:text-4xl">
                            A great trip starts with the ride.
                          </h3>
                          <p className="mt-4 max-w-[36ch] text-sm leading-relaxed text-white/85">
                            Airport arrivals, weekend escapes or the scenic way home. Tell us where you’re headed — we’ll help you find your ride.
                          </p>
                          <div className="mt-6 flex flex-wrap gap-2 border-t border-white/20 pt-5">
                            {["Airport transfers", "Outstation trips", "Hourly rentals"].map((label) => (
                              <span key={label} className="rounded-cmt-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-medium text-white">{label}</span>
                            ))}
                          </div>
                        </div>
                      </section>
                    )}
                    {service.id === "visa" && <VisaDestinationStamps />}
                    {service.id === "flights" && <AirlineBrands />}
                    {service.id === "hotels" && <section aria-labelledby={`${service.id}-brands-heading`} className="mt-6 rounded-cmt-lg border border-cmt-neutral-200 bg-cmt-neutral-50 p-6 sm:p-8">
                      <h3 id={`${service.id}-brands-heading`} className="font-display text-xl font-semibold leading-[1.25] text-cmt-neutral-900 sm:text-2xl">
                        {SERVICE_LOGOS[service.id].title}
                      </h3>
                      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5 lg:grid-cols-2">
                        {SERVICE_LOGOS[service.id].logos.map((brand) => (
                          <li key={brand.src} className="flex items-center justify-center overflow-hidden rounded-cmt-control border border-cmt-neutral-200 bg-white px-2">
                            <Image
                              src={brand.src}
                              alt={brand.name}
                              width={480}
                              height={280}
                              sizes="192px"
                              className="h-28 w-full max-w-48 object-contain"
                            />
                          </li>
                        ))}
                      </ul>
                    </section>}
                </aside>
              </div>
            </div>
          ))}
        </div>
      </section>
      <QuoteGuarantee onOpenQuote={openQuoteForm} />
    </main>
  );
}

"use client";

import { useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { Check, Clock3, ShieldCheck } from "lucide-react";

import AddOnForm from "./AddOnForm";
import { SERVICES, toServiceId, type ServiceId } from "./services";

/* ------------------------------------------------------------------ */
/* Add On — the three things people book around a trip: a flight, a     */
/* hotel, a visa. One page, one tab each, in that order.                */
/*                                                                      */
/* Split out of page.tsx so that file stays a server component and keeps */
/* exporting `metadata`. All three panels are mounted at once and the    */
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
  { src: "/hotelLogo/hotel11.png", name: "The Leela" },
  { src: "/hotelLogo/hotel12.png", name: "Sarovar Hotels & Resorts" },
  { src: "/hotelLogo/hotel13.png", name: "The Fern Hotels & Resorts" },
  { src: "/hotelLogo/hotel14.png", name: "Hyatt" },
  { src: "/hotelLogo/hotel15.png", name: "Lemon Tree Hotels" },
  { src: "/hotelLogo/hotel16.png", name: "Hilton Hotels & Resorts" },
  { src: "/hotelLogo/hotel17.png", name: "Oberoi Hotels & Resorts" },
  { src: "/hotelLogo/hotel18.png", name: "ITC Hotels" },
  { src: "/hotelLogo/hotel19.png", name: "Marriott" },
  { src: "/hotelLogo/hotel110.png", name: "Taj" },
];

const FLIGHT_LOGOS = [
  { src: "/Flight/Flight1.png", name: "SpiceJet" },
  { src: "/Flight/Flight2.png", name: "Air India Express" },
  { src: "/Flight/Flight3.png", name: "Oman Air" },
  { src: "/Flight/Flight4.png", name: "Gulf Air" },
  { src: "/Flight/Flight5.png", name: "Saudia" },
  { src: "/Flight/Flight6.png", name: "SpiceJet" },
  { src: "/Flight/Flight7.png", name: "Air India Express" },
  { src: "/Flight/Flight8.png", name: "Air India" },
  { src: "/Flight/Flight9.png", name: "Akasa Air" },
  { src: "/Flight/Flight10.png", name: "IndiGo" },
];

const VISA_LOGOS = [
  { src: "/visaLogo/visa1.png", name: "New Zealand" },
  { src: "/visaLogo/visa2.png", name: "Maldives" },
  { src: "/visaLogo/visa3.png", name: "Malaysia" },
  { src: "/visaLogo/visa4.png", name: "Japan" },
  { src: "/visaLogo/visa5.png", name: "Hong Kong" },
  { src: "/visaLogo/visa6.png", name: "Antarctica" },
  { src: "/visaLogo/visa7.png", name: "Bali, Indonesia" },
  { src: "/visaLogo/visa8.png", name: "Sri Lanka" },
  { src: "/visaLogo/visa9.png", name: "Thailand" },
  { src: "/visaLogo/visa10.png", name: "Vietnam" },
];

const SERVICE_LOGOS = {
  hotels: { title: "Hotel brands", logos: HOTEL_LOGOS },
  flights: { title: "Airlines", logos: FLIGHT_LOGOS },
  visa: { title: "Destinations", logos: VISA_LOGOS },
};

export default function AddOnBody({ initialService, children }: { initialService: ServiceId; children?: ReactNode }) {
  const [active, setActive] = useState<ServiceId>(() => toServiceId(initialService));
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const open = (id: ServiceId) => {
    setActive(id);
    /* Supported by the App Router, and unlike a route change it leaves the
       other two panels mounted with whatever is typed in them. */
    window.history.replaceState(null, "", `/add-on?service=${id}`);
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
    <main className="w-full bg-white font-body text-cmt-neutral-900">
      {/* Compact hero */}
      <section className="w-full border-b border-cmt-neutral-100 bg-cmt-neutral-50 px-4 py-12 sm:px-5 sm:py-16 lg:px-6">
        <div className="mx-auto w-full max-w-[1440px]">
          <p className="text-xs font-semibold uppercase tracking-wider text-cmt-primary-700 sm:text-sm">
            Add On
          </p>
          <h1 className="mt-2 max-w-[20ch] font-display text-3xl font-semibold leading-[1.15] tracking-tight text-cmt-neutral-900 sm:text-5xl">
            Flights, hotels and visas — asked for in one place.
          </h1>
          <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-cmt-neutral-600 sm:text-base">
            Book them alongside a package or entirely on their own. Tell us what
            you need and our desk comes back with options you can actually
            compare — the fare, the rate, the visa route, and what each one
            leaves out.
          </p>
        </div>
      </section>

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
                  className={`flex h-11 shrink-0 items-center gap-2 rounded-cmt-control px-4 font-body text-[15px] font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 sm:px-5 ${
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
              className="mt-8 sm:mt-10"
            >
              {/* The blueprint's 7 + 5 split: the form, and what we come back
                  with beside it. */}
              <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
                <div className="lg:col-span-7">
                  <h2 className="font-display text-2xl font-semibold leading-[1.2] text-cmt-neutral-900 sm:text-[28px]">
                    {service.title}
                  </h2>
                  <p className="mt-2 max-w-[56ch] text-pretty text-sm leading-[1.6] text-cmt-neutral-600 sm:text-base">
                    {service.description}
                  </p>

                  <div className="mt-8">
                    <AddOnForm service={service} />
                  </div>
                </div>

                <aside className="lg:col-span-5">
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
                      {REASSURANCE.map((item) => (
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
                    <section aria-labelledby={`${service.id}-brands-heading`} className="mt-6 rounded-cmt-lg border border-cmt-neutral-200 bg-cmt-neutral-50 p-6 sm:p-8">
                      <h3 id={`${service.id}-brands-heading`} className="font-display text-xl font-semibold leading-[1.25] text-cmt-neutral-900 sm:text-2xl">
                        {SERVICE_LOGOS[service.id].title}
                      </h3>
                      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5 lg:grid-cols-2">
                        {SERVICE_LOGOS[service.id].logos.map((brand) => (
                          <li key={brand.src} className="flex items-center justify-center overflow-hidden rounded-cmt-control border border-cmt-neutral-200 bg-white px-2">
                            <Image
                              src={brand.src}
                              alt={brand.name}
                              width={service.id === "flights" ? 1448 : 1254}
                              height={service.id === "flights" ? 1086 : 1254}
                              sizes={service.id === "flights" ? "150px" : "112px"}
                              className={service.id === "flights" ? "h-28 w-full object-contain" : "h-28 w-28 object-contain"}
                            />
                          </li>
                        ))}
                      </ul>
                    </section>
                </aside>
              </div>
            </div>
          ))}
        </div>
      </section>
      {children}
    </main>
  );
}

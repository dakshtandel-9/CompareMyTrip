import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { DUMMY_PACKAGES } from "@/lib/packageData";
import PackageGallery from "../_components/PackageGallery";
import KeralaBookingActions from "./KeralaBookingActions";
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  CalendarDays,
  Car,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Coffee,
  Heart,
  MapPin,
  MessageCircle,
  Plane,
  RotateCcw,
  ShieldCheck,
  Star,
  Users,
  Utensils,
  X,
  Zap,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Kerala Backwaters & Hills Escape | CompareMyTrip",
  description:
    "Explore a 4 night Kerala package through Munnar, Thekkady and Alleppey with verified stays and transfers.",
};

const quickFacts = [
  { icon: Clock3, label: "Duration", value: "4 nights / 5 days" },
  { icon: Users, label: "Group size", value: "2–10 travellers" },
  { icon: BedDouble, label: "Stay", value: "3★ verified hotels" },
  { icon: Car, label: "Transfers", value: "Private cab included" },
  { icon: Utensils, label: "Meals", value: "Daily breakfast" },
  { icon: Plane, label: "Flights", value: "Not included" },
];

const highlights = [
  "Stay among Munnar's tea gardens with a guided plantation walk",
  "Explore Periyar's forest landscapes and spice-growing countryside",
  "Spend a night aboard a private Alleppey backwater houseboat",
  "Travel comfortably throughout in a private air-conditioned cab",
  "Choose relaxed sightseeing with room for personal recommendations",
  "Book with a GST-verified operator and transparent inclusions",
];

const itinerary = [
  {
    day: "Day 01",
    title: "Kochi to Munnar",
    route: "Kochi → Munnar",
    copy: "Meet your driver in Kochi and begin a scenic climb into the Western Ghats. Stop at waterfalls and viewpoints before checking into your Munnar hotel.",
    meals: "No meals",
  },
  {
    day: "Day 02",
    title: "Munnar tea country",
    route: "Munnar local sightseeing",
    copy: "Visit a tea estate, Mattupetty Dam, Echo Point and the region's green valley viewpoints. The evening is free for the market or a quiet café.",
    meals: "Breakfast",
  },
  {
    day: "Day 03",
    title: "Munnar to Thekkady",
    route: "Munnar → Thekkady",
    copy: "Drive through spice plantations to Thekkady. Join a guided spice-garden visit and keep the afternoon open for an optional lake or cultural experience.",
    meals: "Breakfast",
  },
  {
    day: "Day 04",
    title: "Thekkady to Alleppey",
    route: "Thekkady → Alleppey",
    copy: "Arrive at the backwaters and board your private houseboat. Cruise past coconut groves and village life, then dine and stay overnight on board.",
    meals: "Breakfast, lunch & dinner",
  },
  {
    day: "Day 05",
    title: "Return to Kochi",
    route: "Alleppey → Kochi",
    copy: "Enjoy breakfast on the water before disembarking. Your driver will take you to Kochi airport or railway station for the journey home.",
    meals: "Breakfast",
  },
];

const included = [
  "Four nights' accommodation on double sharing",
  "Daily breakfast and all houseboat meals",
  "Private air-conditioned vehicle for the full route",
  "Kochi arrival and departure transfers",
  "Tea-estate and spice-garden experiences",
  "All hotel taxes, tolls and driver allowances",
];

const excluded = [
  "Flights or train tickets to and from Kochi",
  "Entry fees and optional activities",
  "Lunches and dinners not specifically listed",
  "Personal expenses, tips and travel insurance",
  "Anything not mentioned under inclusions",
];

const relatedPackages = DUMMY_PACKAGES.slice(1, 9);

const formatINR = (value: number) => `₹${value.toLocaleString("en-IN")}`;

function SectionHeading({ eyebrow, title, copy }: { eyebrow: string; title: string; copy?: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cmt-primary-800">{eyebrow}</p>
      <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-cmt-neutral-900 sm:text-3xl">
        {title}
      </h2>
      {copy && <p className="mt-3 max-w-2xl text-sm leading-6 text-cmt-neutral-600 sm:text-base">{copy}</p>}
    </div>
  );
}

export default function KeralaPackagePage() {
  return (
    <>
      <Header />
      <main className="bg-cmt-neutral-50 font-body text-cmt-neutral-900">
        <div className="border-b border-cmt-neutral-200 bg-white">
          <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-cmt-neutral-500 sm:text-sm">
              <Link href="/" className="hover:text-cmt-neutral-900">Home</Link>
              <span>/</span>
              <Link href="/packages" className="hover:text-cmt-neutral-900">Packages</Link>
              <span>/</span>
              <span className="font-medium text-cmt-neutral-700">Kerala Backwaters & Hills Escape</span>
            </nav>
          </div>
        </div>

        <section className="bg-white">
          <div className="mx-auto max-w-[1440px] px-4 pb-10 pt-7 sm:px-6 lg:px-8 lg:pb-14 lg:pt-10">
            <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-4xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-cmt-full bg-cmt-primary-50 px-3 py-1 text-xs font-semibold text-cmt-primary-900">Bestseller</span>
                  <span className="rounded-cmt-full border border-cmt-neutral-200 px-3 py-1 text-xs font-medium text-cmt-neutral-600">Mountains</span>
                  <span className="rounded-cmt-full border border-cmt-neutral-200 px-3 py-1 text-xs font-medium text-cmt-neutral-600">Backwaters</span>
                </div>
                <h1 className="mt-4 font-display text-3xl font-semibold leading-[1.12] tracking-tight text-cmt-neutral-900 sm:text-5xl">
                  Kerala Backwaters &amp; Hills Escape
                </h1>
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-cmt-neutral-600">
                  <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" /> Kochi · Munnar · Thekkady · Alleppey</span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-cmt-neutral-800">
                    <Star className="size-4 fill-cmt-primary-500 text-cmt-primary-500" /> 4.8
                    <span className="font-normal text-cmt-neutral-500">124 traveller reviews</span>
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" className="inline-flex h-11 items-center gap-2 rounded-cmt-control border border-cmt-neutral-200 bg-white px-4 text-sm font-semibold text-cmt-neutral-700 shadow-cmt-xs">
                  <Heart className="size-4" /> Save
                </button>
                <Link href="/packages" className="inline-flex h-11 items-center gap-2 rounded-cmt-control border border-cmt-neutral-200 bg-white px-4 text-sm font-semibold text-cmt-neutral-700 shadow-cmt-xs">
                  <ArrowLeft className="size-4" /> All packages
                </Link>
              </div>
            </div>

            <PackageGallery />
          </div>
        </section>

        <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,2fr)_360px] xl:gap-12">
            <div className="min-w-0 space-y-8">
              <section aria-label="Package quick facts" className="grid grid-cols-2 gap-px overflow-hidden rounded-cmt-md border border-cmt-neutral-200 bg-cmt-neutral-200 shadow-cmt-sm sm:grid-cols-3">
                {quickFacts.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="bg-white p-4 sm:p-5">
                    <Icon className="size-5 text-cmt-primary-700" />
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-cmt-neutral-400">{label}</p>
                    <p className="mt-1 text-sm font-semibold text-cmt-neutral-800">{value}</p>
                  </div>
                ))}
              </section>

              <section id="overview" className="scroll-mt-28 rounded-cmt-md border border-cmt-neutral-200 bg-white p-5 shadow-cmt-sm sm:p-7">
                <SectionHeading eyebrow="The journey" title="A slower side of Kerala" copy="Move from cool tea-covered hills to forested spice country and finish on the calm backwaters. This package balances guided highlights with enough unplanned time to settle into each place." />
                <p className="mt-5 text-sm leading-7 text-cmt-neutral-600 sm:text-base">
                  Designed for couples, families and small groups, the route keeps daily driving comfortable and includes a private vehicle throughout. Hotels are selected for location and verified service standards, while the houseboat night gives the trip its most memorable change of pace.
                </p>
                <div className="mt-6 rounded-cmt-control border border-cmt-primary-100 bg-cmt-primary-50 p-4 text-sm leading-6 text-cmt-neutral-700">
                  <span className="font-semibold text-cmt-neutral-900">Good to know:</span> The itinerary can be adjusted around your arrival time, preferred hotel category and travel pace before you confirm.
                </div>
              </section>

              <section className="rounded-cmt-md border border-cmt-neutral-200 bg-white p-5 shadow-cmt-sm sm:p-7">
                <SectionHeading eyebrow="Trip highlights" title="What makes this route special" />
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {highlights.map((highlight) => (
                    <div key={highlight} className="flex gap-3 rounded-cmt-control bg-cmt-neutral-50 p-4">
                      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-cmt-primary-500 text-cmt-neutral-900"><Check className="size-3.5" strokeWidth={2.5} /></span>
                      <p className="text-sm leading-6 text-cmt-neutral-700">{highlight}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section id="itinerary" className="scroll-mt-28 rounded-cmt-md border border-cmt-neutral-200 bg-white p-5 shadow-cmt-sm sm:p-7">
                <SectionHeading eyebrow="Day by day" title="Your Kerala itinerary" copy="A balanced route with clear travel times and flexible evenings." />
                <div className="mt-7 divide-y divide-cmt-neutral-200 border-y border-cmt-neutral-200">
                  {itinerary.map((item, index) => (
                    <details key={item.day} open={index === 0} className="group py-1">
                      <summary className="flex cursor-pointer list-none items-center gap-4 py-4 [&::-webkit-details-marker]:hidden">
                        <span className="grid size-11 shrink-0 place-items-center rounded-cmt-control bg-cmt-neutral-900 text-[11px] font-bold text-white">{item.day.replace("Day ", "D")}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-display text-base font-semibold text-cmt-neutral-900 sm:text-lg">{item.title}</span>
                          <span className="mt-0.5 block truncate text-xs text-cmt-neutral-500">{item.route}</span>
                        </span>
                        <ChevronDown className="size-5 shrink-0 text-cmt-neutral-400 transition-transform duration-300 group-open:rotate-180" />
                      </summary>
                      <div className="pb-5 pl-[60px]">
                        <p className="text-sm leading-6 text-cmt-neutral-600">{item.copy}</p>
                        <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-cmt-neutral-600"><Coffee className="size-3.5 text-cmt-primary-700" /> {item.meals}</p>
                      </div>
                    </details>
                  ))}
                </div>
              </section>

              <section id="stay-and-meals" className="scroll-mt-28 rounded-cmt-md border border-cmt-neutral-200 bg-white p-5 shadow-cmt-sm sm:p-7">
                <SectionHeading eyebrow="Stay & meals" title="Comfortable stays, thoughtfully placed" />
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="overflow-hidden rounded-cmt-md border border-cmt-neutral-200">
                    <div className="relative aspect-[16/9]"><Image src="/destinations/kerala.jpg" alt="Green waterfront setting in Kerala" fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover object-[80%_center]" /></div>
                    <div className="p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-cmt-primary-800">3 nights</p>
                      <h3 className="mt-1 font-display text-lg font-semibold">Munnar &amp; Thekkady hotels</h3>
                      <p className="mt-2 text-sm leading-6 text-cmt-neutral-500">Verified 3-star stays with breakfast, private bathroom and hillside or garden settings.</p>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-cmt-md border border-cmt-neutral-200">
                    <div className="relative aspect-[16/9]"><Image src="/destinations/kerala.jpg" alt="Houseboat on the Alleppey backwaters" fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" /></div>
                    <div className="p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-cmt-primary-800">1 night</p>
                      <h3 className="mt-1 font-display text-lg font-semibold">Private Alleppey houseboat</h3>
                      <p className="mt-2 text-sm leading-6 text-cmt-neutral-500">Air-conditioned room with lunch, dinner and breakfast prepared fresh on board.</p>
                    </div>
                  </div>
                </div>
              </section>

              <section id="inclusions" className="scroll-mt-28 grid gap-5 md:grid-cols-2">
                <div className="rounded-cmt-md border border-cmt-success-500/20 bg-white p-5 shadow-cmt-sm sm:p-6">
                  <h2 className="flex items-center gap-2 font-display text-xl font-semibold"><CheckCircle2 className="size-5 text-cmt-success-500" /> Included</h2>
                  <ul className="mt-5 space-y-3">
                    {included.map((item) => <li key={item} className="flex gap-2.5 text-sm leading-6 text-cmt-neutral-600"><Check className="mt-1 size-4 shrink-0 text-cmt-success-500" /> {item}</li>)}
                  </ul>
                </div>
                <div className="rounded-cmt-md border border-cmt-neutral-200 bg-white p-5 shadow-cmt-sm sm:p-6">
                  <h2 className="flex items-center gap-2 font-display text-xl font-semibold"><X className="size-5 text-cmt-coral-500" /> Not included</h2>
                  <ul className="mt-5 space-y-3">
                    {excluded.map((item) => <li key={item} className="flex gap-2.5 text-sm leading-6 text-cmt-neutral-600"><X className="mt-1 size-4 shrink-0 text-cmt-coral-500" /> {item}</li>)}
                  </ul>
                </div>
              </section>

              <section id="policies" className="scroll-mt-28 rounded-cmt-md border border-cmt-neutral-200 bg-white p-5 shadow-cmt-sm sm:p-7">
                <SectionHeading eyebrow="Clear policies" title="Plan with confidence" />
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-cmt-control bg-cmt-neutral-50 p-4"><RotateCcw className="size-5 text-cmt-primary-700" /><h3 className="mt-3 text-sm font-semibold">Free cancellation</h3><p className="mt-1 text-xs leading-5 text-cmt-neutral-500">Cancel up to 15 days before departure for a full package refund.</p></div>
                  <div className="rounded-cmt-control bg-cmt-neutral-50 p-4"><CalendarDays className="size-5 text-cmt-primary-700" /><h3 className="mt-3 text-sm font-semibold">Flexible dates</h3><p className="mt-1 text-xs leading-5 text-cmt-neutral-500">Move your dates once without a change fee, subject to availability.</p></div>
                  <div className="rounded-cmt-control bg-cmt-neutral-50 p-4"><ShieldCheck className="size-5 text-cmt-primary-700" /><h3 className="mt-3 text-sm font-semibold">Verified operator</h3><p className="mt-1 text-xs leading-5 text-cmt-neutral-500">Operator credentials and GST registration have been checked.</p></div>
                </div>
              </section>

            </div>

            <aside className="lg:sticky lg:top-24">
              <div className="rounded-cmt-md border border-cmt-neutral-200 bg-white p-5 shadow-cmt-lg sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-cmt-neutral-400 line-through">₹14,999</p>
                    <p className="mt-0.5 font-display text-3xl font-bold text-cmt-neutral-900">₹12,999</p>
                    <p className="mt-1 text-xs text-cmt-neutral-500">per person · taxes included</p>
                  </div>
                  <span className="rounded-cmt-full bg-cmt-coral-100 px-2.5 py-1 text-xs font-semibold text-cmt-coral-700">13% off</span>
                </div>

                <KeralaBookingActions />

                <div className="mt-5 space-y-3 border-t border-cmt-neutral-200 pt-5 text-xs text-cmt-neutral-600">
                  <p className="flex items-center gap-2"><ShieldCheck className="size-4 text-cmt-success-500" /> GST-verified travel operator</p>
                  <p className="flex items-center gap-2"><RotateCcw className="size-4 text-cmt-success-500" /> Free cancellation up to 15 days</p>
                  <p className="flex items-center gap-2"><Zap className="size-4 text-cmt-success-500" /> Confirmation within 24 hours</p>
                </div>
              </div>

              <div className="mt-4 rounded-cmt-md bg-cmt-neutral-900 p-5 text-white shadow-cmt-md">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-cmt-primary-500 text-cmt-neutral-900"><MessageCircle className="size-4" /></span>
                  <div><p className="text-sm font-semibold">Need help deciding?</p><p className="mt-0.5 text-xs text-cmt-neutral-300">Talk to a Kerala specialist</p></div>
                </div>
                <button type="button" className="mt-4 h-10 w-full rounded-cmt-control border border-white/20 text-sm font-semibold text-white transition-colors hover:bg-white/10">Request a callback</button>
              </div>
            </aside>
          </div>
        </div>

        <section className="border-t border-cmt-neutral-200 bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between gap-6">
              <SectionHeading eyebrow="Keep exploring" title="You may also like" />
              <Link href="/packages" className="hidden items-center gap-1.5 text-sm font-semibold text-cmt-neutral-700 sm:inline-flex">View all packages <ArrowRight className="size-4" /></Link>
            </div>
            <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {relatedPackages.map((pkg) => (
                <article key={pkg.title} className="group flex min-w-0 flex-col overflow-hidden rounded-cmt-md border border-cmt-neutral-200 bg-white shadow-cmt-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-cmt-neutral-300 hover:shadow-cmt-md">
                  <div className="relative aspect-[4/3] overflow-hidden bg-cmt-neutral-100">
                    <Image src={pkg.image} alt={pkg.location} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.035]" />
                    <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3">
                      <span className="rounded-cmt-full border border-cmt-coral-500/30 bg-cmt-coral-100 px-2.5 py-1 text-[11px] font-semibold text-cmt-coral-700">{pkg.discount}% off</span>
                      <button type="button" aria-label={`Save ${pkg.title}`} className="grid size-9 place-items-center rounded-full border border-white/70 bg-white/95 text-cmt-neutral-700 shadow-cmt-xs transition-colors hover:text-cmt-coral-700">
                        <Heart className="size-4" strokeWidth={2} />
                      </button>
                    </div>
                    <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-cmt-full border border-cmt-success-500/20 bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-cmt-success-700 shadow-cmt-xs">
                      <ShieldCheck className="size-3.5 text-cmt-success-500" strokeWidth={2.5} /> GST Verified
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex min-w-0 items-center justify-between gap-3">
                      <p className="flex min-w-0 items-center gap-1 text-xs font-medium text-cmt-neutral-500"><MapPin className="size-3.5 shrink-0" /><span className="truncate">{pkg.location}</span></p>
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-cmt-neutral-700"><Star className="size-3.5 fill-cmt-primary-500 text-cmt-primary-500" />{pkg.rating}<span className="font-normal text-cmt-neutral-400">({pkg.reviews})</span></span>
                    </div>
                    <h3 className="mt-2 line-clamp-2 min-h-[44px] font-display text-base font-semibold leading-[1.35] text-cmt-neutral-900">{pkg.title}</h3>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-cmt-neutral-600">
                      <span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" />{pkg.nights}N / {pkg.days}D</span>
                      <span className="inline-flex items-center gap-1"><Users className="size-3.5" />{pkg.pax}</span>
                      <span className="inline-flex items-center gap-1"><BedDouble className="size-3.5" />{pkg.hotelStars}★ hotels</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {pkg.tags.map((tag) => <span key={tag} className="rounded-cmt-full border border-cmt-neutral-200 bg-cmt-neutral-50 px-2 py-0.5 text-[11px] font-medium text-cmt-neutral-700">{tag}</span>)}
                    </div>
                    {/* Operating partner deliberately not named — see BookingCard. */}
                    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-cmt-neutral-500">
                      <span className="inline-flex items-center gap-1"><RotateCcw className="size-3" /> Free cancellation</span>
                      <span className="inline-flex items-center gap-1"><Zap className="size-3" /> Instant confirm</span>
                    </div>
                    <div className="mt-4 flex items-end justify-between gap-3 border-t border-cmt-neutral-100 pt-4">
                      <div className="min-w-0"><p className="text-xs text-cmt-neutral-400 line-through">{formatINR(pkg.originalPrice)}</p><p className="whitespace-nowrap font-display text-lg font-bold text-cmt-neutral-900">{formatINR(pkg.price)}<span className="ml-1 font-body text-[11px] font-normal text-cmt-neutral-500">/person</span></p></div>
                      <Link href={`/packages/${pkg.id}`} className="inline-flex h-10 shrink-0 items-center justify-center rounded-cmt-control bg-cmt-primary-500 px-4 text-sm font-semibold text-cmt-neutral-900 shadow-cmt-xs transition-colors hover:bg-cmt-primary-600">View package</Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-cmt-neutral-200 bg-white/95 p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
            <div><p className="text-[10px] text-cmt-neutral-500">Starting from</p><p className="font-display text-lg font-bold">₹12,999 <span className="font-body text-[10px] font-normal text-cmt-neutral-500">/person</span></p></div>
            <KeralaBookingActions mobile />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

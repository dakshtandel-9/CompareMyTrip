"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, BedDouble, Car, Check, Clock3, Coffee, MapPin, Plane, ShieldCheck, Star, Users, X } from "lucide-react";
import { getDiscountPercent, getPackageDetails } from "@/lib/packageData";
import PackageGallery from "../_components/PackageGallery";
import BookingCard from "./BookingCard";
import QuoteModal from "./QuoteModal";
import { useAuthUser } from "@/lib/firebase/useAuthUser";
import type { TravelPackage } from "@/lib/packageData";
import { usePackagesState } from "@/lib/usePackages";

const formatINR = (value: number) => `₹${value.toLocaleString("en-IN")}`;

export default function PackageDetailClient({ initialPackage }: { initialPackage: TravelPackage }) {
  const { packageId } = useParams<{ packageId: string }>();
  const authUser = useAuthUser();
  const packageState = usePackagesState();
  const [travellers, setTravellers] = useState(2);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const router = useRouter();
  const livePackage = packageState.packages.find((item) => item.id === packageId);
  const pkg = packageState.loading || packageState.error
    ? livePackage ?? initialPackage
    : livePackage;

  if (!pkg) {
    return <main className="grid min-h-[60vh] place-items-center bg-cmt-neutral-50 px-4"><div className="text-center"><h1 className="font-display text-3xl font-semibold">Package not found</h1><Link href="/packages" className="mt-5 inline-flex h-11 items-center gap-2 rounded-cmt-control bg-cmt-primary-500 px-5 text-sm font-semibold"><ArrowLeft className="size-4" /> All packages</Link></div></main>;
  }

  const details = getPackageDetails(pkg);
  const discount = getDiscountPercent(pkg);
  const facts = [
    { icon: Clock3, label: "Duration", value: `${pkg.nights} nights / ${pkg.days} days` },
    { icon: Users, label: "Group size", value: pkg.pax },
    { icon: BedDouble, label: "Stay", value: `${pkg.hotelStars}★ verified stays` },
    { icon: Car, label: "Transfers", value: details.transfers },
    { icon: Coffee, label: "Meals", value: details.meals },
    { icon: Plane, label: "Flights", value: details.flights },
  ];
  /* A customized quote is filed against the customer's account, so it needs a
     real sign-in — the timed pop-up captures leads and cannot supply one. */
  const requestQuote = () => {
    if (authUser === null) {
      router.push(`/login?next=${encodeURIComponent(`/packages/${packageId}`)}`);
      return;
    }
    if (authUser === undefined) return;
    setQuoteOpen(true);
  };

  return (
    <main className="bg-cmt-neutral-50 pb-24 font-body text-cmt-neutral-900 lg:pb-0">
      <div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs text-cmt-neutral-500"><Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/packages">Packages</Link><span aria-hidden="true">/</span>{pkg.destination ? <><Link href={`/packages?destination=${encodeURIComponent(pkg.destination)}`} className="hover:text-cmt-neutral-900">{pkg.destination}</Link><span aria-hidden="true">/</span></> : null}<span className="line-clamp-1">{pkg.title}</span></nav><h1 className="max-w-5xl font-display text-3xl font-semibold tracking-tight sm:text-5xl">{pkg.title}</h1><div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-cmt-neutral-600"><span className="inline-flex items-center gap-1.5"><MapPin className="size-4" aria-hidden="true" />{pkg.location}</span>{pkg.reviews > 0 && pkg.rating > 0 ? <span className="inline-flex items-center gap-1.5"><Star className="size-4 fill-cmt-primary-500 text-cmt-primary-500" aria-hidden="true" /><b className="text-cmt-neutral-900">{pkg.rating}</b> {pkg.reviews} traveller reviews</span> : <span className="text-cmt-neutral-500">Newly listed &middot; no traveller reviews yet</span>}</div></div>
          <Link href="/packages" className="inline-flex h-11 shrink-0 items-center gap-2 self-start rounded-cmt-control border border-cmt-neutral-200 bg-white px-4 text-sm font-semibold shadow-cmt-xs"><ArrowLeft className="size-4" /> All packages</Link>
        </div>
        <div className="mt-7"><PackageGallery images={details.gallery} /></div>

        <section className="mt-6 grid gap-3 rounded-cmt-md border border-cmt-neutral-200 bg-white p-4 shadow-cmt-sm sm:grid-cols-2 lg:grid-cols-6 lg:p-5">
          {facts.map(({ icon: Icon, label, value }) => <div key={label} className="rounded-cmt-control bg-cmt-neutral-50 p-3"><Icon className="size-5 text-cmt-primary-700" /><p className="mt-2 text-[10px] uppercase tracking-wider text-cmt-neutral-400">{label}</p><p className="mt-1 text-xs font-semibold leading-5">{value}</p></div>)}
        </section>

        <div className="mt-7 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_370px]">
          <div className="space-y-6">
            <Section title="About this trip"><p className="text-sm leading-7 text-cmt-neutral-600">{details.summary}</p><div className="mt-5 flex flex-wrap gap-2">{details.places.map((place) => <span key={place} className="rounded-full border border-cmt-neutral-200 bg-cmt-neutral-50 px-3 py-1.5 text-xs font-semibold"><MapPin className="mr-1 inline size-3.5 text-cmt-primary-700" />{place}</span>)}</div></Section>
            <Section title="Trip highlights"><div className="grid gap-3 sm:grid-cols-2">{details.highlights.map((item) => <div key={item} className="flex gap-3 rounded-cmt-control bg-cmt-primary-50 p-4 text-sm font-medium"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-cmt-primary-500"><Check className="size-3.5" /></span>{item}</div>)}</div></Section>
            <Section title="Day-by-day itinerary" eyebrow={`${details.itinerary.length} DAY PLAN`}><div className="space-y-3">{details.itinerary.map((day) => <details key={day.day} open={day.day === 1} className="group rounded-cmt-md border border-cmt-neutral-200 bg-white"><summary className="flex cursor-pointer list-none items-start gap-4 p-4 sm:p-5"><span className="grid size-10 shrink-0 place-items-center rounded-cmt-control bg-cmt-primary-500 text-xs font-bold">D{day.day}</span><span className="min-w-0"><b className="block font-display text-base">{day.title}</b><span className="mt-1 block text-xs text-cmt-neutral-500">{day.route || details.places[Math.min(day.day - 1, details.places.length - 1)]}</span></span><span className="ml-auto text-xl text-cmt-neutral-400 group-open:rotate-45">+</span></summary><div className="border-t border-cmt-neutral-100 px-4 py-4 text-sm leading-7 text-cmt-neutral-600 sm:px-[76px]"><p>{day.description}</p><p className="mt-2 text-xs font-semibold text-cmt-neutral-900">Meals: {day.meals || "Not specified"}</p></div></details>)}</div></Section>
            <Section title="Comfort stays"><div className="grid gap-4 sm:grid-cols-2">{details.stays.map((stay, index) => <article key={`${stay.name}-${index}`} className="rounded-cmt-md border border-cmt-neutral-200 p-5"><BedDouble className="size-6 text-cmt-primary-700" /><h3 className="mt-4 font-display text-lg font-semibold">{stay.name}</h3><p className="mt-1 text-sm text-cmt-neutral-500">{stay.place} · {stay.nights} night{stay.nights === 1 ? "" : "s"}</p><p className="mt-3 text-sm leading-6 text-cmt-neutral-600">{stay.comfort}</p></article>)}</div></Section>
            <div className="grid gap-6 sm:grid-cols-2"><ListSection title="Included" items={details.inclusions} positive /><ListSection title="Not included" items={details.exclusions} /></div>
            <Section title="Cancellation policy"><div className="flex gap-3 rounded-cmt-control bg-cmt-success-100 p-4"><ShieldCheck className="size-5 shrink-0 text-cmt-success-700" /><p className="text-sm leading-6 text-cmt-neutral-700">{details.cancellationPolicy}</p></div></Section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <BookingCard pkg={pkg} details={details} travellers={travellers} onTravellersChange={setTravellers} onRequestQuote={requestQuote} />
            <div className="rounded-cmt-md bg-cmt-neutral-900 p-5 text-white"><p className="font-semibold">Why book here</p><p className="mt-1 text-xs leading-5 text-cmt-neutral-300">Your request is shared securely with our partners, so you can compare quotes before you pay.</p></div>
          </aside>
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-cmt-neutral-200 bg-white/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] text-cmt-neutral-500">Per person</p>
            <p className="mt-0.5 flex items-baseline gap-1.5"><span className="font-display text-lg font-bold">{formatINR(pkg.price)}</span>{discount > 0 && <span className="rounded-cmt-full bg-cmt-success-100 px-2 py-0.5 text-[10px] font-semibold text-cmt-success-700">{discount}% off</span>}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link href={`/checkout?pkg=${encodeURIComponent(pkg.id)}&travellers=${travellers}`} className="flex h-11 items-center rounded-cmt-control border border-cmt-neutral-300 px-4 text-sm font-semibold">Book</Link>
            <button type="button" onClick={requestQuote} className="flex h-11 items-center rounded-cmt-control bg-cmt-primary-500 px-4 text-sm font-semibold">Get customized quote</button>
          </div>
        </div>
      </div>
      {quoteOpen ? <QuoteModal pkg={pkg} initialTravellers={travellers} onClose={() => setQuoteOpen(false)} /> : null}
    </main>
  );
}

function Section({ title, eyebrow, children }: { title: string; eyebrow?: string; children: React.ReactNode }) {
  return <section className="rounded-cmt-md border border-cmt-neutral-200 bg-white p-5 shadow-cmt-sm sm:p-7">{eyebrow && <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-cmt-primary-800">{eyebrow}</p>}<h2 className="mb-5 font-display text-2xl font-semibold">{title}</h2>{children}</section>;
}
function ListSection({ title, items, positive = false }: { title: string; items: string[]; positive?: boolean }) {
  return <Section title={title}><ul className="space-y-3">{items.map((item) => <li key={item} className="flex gap-2.5 text-sm leading-6 text-cmt-neutral-600">{positive ? <Check className="mt-1 size-4 shrink-0 text-cmt-success-700" /> : <X className="mt-1 size-4 shrink-0 text-cmt-coral-700" />}{item}</li>)}</ul></Section>;
}

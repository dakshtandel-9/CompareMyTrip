"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { usePackages } from "@/lib/usePackages";
import { startsInBengaluru, TRAVELLER_TYPES } from "@/lib/bengaluruTravel";
import { BENGALURU_COLLECTIONS } from "@/lib/bengaluruCollections";
import { Glyph } from "@/lib/adminIcons";
import PackageCard from "../_components/PackageCard";

export default function BengaluruTravel() {
  const packages = usePackages().filter(startsInBengaluru).sort((a, b) => a.days - b.days || a.price - b.price).slice(0, 4);
  return <section className="bg-cmt-neutral-50 px-4 py-12 sm:px-6 sm:py-16" aria-labelledby="bengaluru-travel-title">
    <div className="mx-auto max-w-[1440px]">
      <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-semibold uppercase tracking-wider text-cmt-primary-700">Start close. Go further.</p><h2 id="bengaluru-travel-title" className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Your next break starts in Bengaluru</h2><p className="mt-3 max-w-2xl leading-7 text-cmt-neutral-600">Sunrise trails, weekend escapes and time away together. Explore published Bengaluru departures and confirm your preferred date.</p></div><Link href="/bengaluru" className="inline-flex min-h-11 items-center gap-2 font-semibold">Explore Bengaluru trips <ArrowRight className="size-4" /></Link></div>
      <div className="mt-6 flex flex-wrap gap-3">{BENGALURU_COLLECTIONS.map(item => <Link key={item.slug} href={`/bengaluru/${item.slug}`} className="rounded-full border border-cmt-neutral-300 bg-white px-4 py-3 text-sm font-medium hover:border-cmt-primary-500">{item.title.replace(" from Bengaluru", "")}</Link>)}</div>
      {packages.length > 0 ? <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{packages.map(pkg => <PackageCard key={pkg.id} pkg={pkg} />)}</div> : <p className="mt-8 rounded-xl bg-white p-6">Planning a local break? <Link href="/contact" className="font-semibold underline">Share your dates with our team.</Link></p>}
      <div className="mt-14"><h2 className="font-display text-2xl font-semibold sm:text-3xl">Who are you travelling with?</h2><p className="mt-3 text-cmt-neutral-600">Find a starting point for your plans, then check the package details for your group.</p><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{TRAVELLER_TYPES.map(type => <Link href={type.value === "corporate" ? "/corporate-group-trips" : `/packages?audience=${type.value}`} key={type.value} className="group rounded-2xl border border-cmt-neutral-200 bg-white p-5 transition hover:border-cmt-primary-500 hover:shadow-cmt-sm"><Glyph name={type.icon} className="size-6 text-cmt-primary-700" /><h3 className="mt-4 font-semibold">{type.label}</h3><p className="mt-2 text-sm leading-6 text-cmt-neutral-600">{type.description}</p></Link>)}</div></div>
    </div>
  </section>;
}

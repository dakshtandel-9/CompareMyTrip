"use client";
import { useSiteContent } from "@/lib/useSiteContent";
import { usePackages } from "@/lib/usePackages";
import { startsInBengaluru } from "@/lib/bengaluruTravel";
import PackageCard from "../_components/PackageCard";
import SectionHeader from "../_components/SectionHeader";

export default function WeekendTreks() {
  const { weekendTreks } = useSiteContent();
  const packages = usePackages().filter(pkg => startsInBengaluru(pkg) && pkg.tags.some(tag => tag === "Treks" || tag === "Weekend Treks")).slice(0, 4);
  if (!weekendTreks.enabled || !packages.length) return null;
  return <section id="weekend-treks" aria-labelledby="weekend-treks-title" className="border-t border-cmt-neutral-100 bg-white px-4 py-12 sm:px-6 sm:py-16"><div className="mx-auto max-w-[1440px]">
    <SectionHeader eyebrow="Make time for a trail" title={<span id="weekend-treks-title">Weekend treks from Bengaluru</span>} description={weekendTreks.header.description} actionLabel="Explore all Bengaluru treks" actionHref="/bengaluru/treks" />
    <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{packages.map(pkg => <PackageCard key={pkg.id} pkg={pkg} />)}</div>
  </div></section>;
}

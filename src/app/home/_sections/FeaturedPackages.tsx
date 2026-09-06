"use client";

import { useState } from "react";

import { usePackages } from "@/lib/usePackages";
import { useSiteContent } from "@/lib/useSiteContent";
import PackageCard from "../_components/PackageCard";
import SectionHeader from "../_components/SectionHeader";

/* ------------------------------------------------------------------ */
/* Featured packages — the catalogue's front door. Tab row filters the   */
/* same grid rather than navigating away, so the visitor never loses     */
/* their place on the homepage (design.md §15.3 tab row + §8.3 cards).   */
/* ------------------------------------------------------------------ */

export default function FeaturedPackages() {
  const { featured } = useSiteContent();
  const packages = usePackages();
  /* null until the visitor picks one, so the first tab stays selected even
     when the CRM reorders or renames the row underneath them. */
  const [chosenTab, setChosenTab] = useState<string | null>(null);

  const tabs = featured.tabs;
  const activeTab = chosenTab && tabs.includes(chosenTab) ? chosenTab : (tabs[0] ?? "");

  const filtered = packages.filter((pkg) => {
    if (activeTab === "India" || activeTab === "International") {
      return pkg.region === activeTab;
    }
    /* A tab naming a category the catalogue does not use filters to nothing,
       and the fallback below shows the unfiltered set rather than a gap. */
    return (pkg.tags as string[]).includes(activeTab);
  });
  const visible = (filtered.length > 0 ? filtered : packages).slice(0, featured.maxCards);

  if (!featured.enabled) return null;

  return (
    <section
      id="featured-packages"
      aria-labelledby="featured-packages-title"
      className="w-full border-t border-cmt-neutral-100 bg-white px-3 py-12 sm:px-4 sm:py-16 md:px-6 lg:py-20"
    >
      <div className="mx-auto w-full max-w-[1440px]">
        <SectionHeader
          eyebrow={featured.header.eyebrow}
          title={<span id="featured-packages-title">{featured.header.title}</span>}
          description={featured.header.description}
          actionLabel={featured.header.actionLabel}
          actionHref={featured.header.actionHref}
        />

        <div
          role="tablist"
          aria-label="Filter featured packages"
          className="mt-8 flex w-full items-center gap-6 overflow-x-auto border-b border-cmt-neutral-200 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:mt-10"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setChosenTab(tab)}
                className={`shrink-0 whitespace-nowrap border-b-[3px] pb-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 sm:text-base ${
                  isActive
                    ? "border-cmt-primary-500 text-cmt-neutral-900"
                    : "border-transparent font-medium text-cmt-neutral-500 hover:text-cmt-neutral-700"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <div className="cmt-mobile-rail mt-8 grid grid-cols-1 gap-6 sm:mt-10 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import {
  ArrowRight,
  ImageIcon,
  LayoutList,
  PackageSearch,
  PanelsTopLeft,
  Sparkles,
  Type,
} from "lucide-react";

import { SECTION_ORDER } from "@/lib/siteContent";
import { usePackages } from "@/lib/usePackages";
import { useSiteContent } from "@/lib/useSiteContent";

function Stat({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: typeof Type;
}) {
  return (
    <div className="rounded-cmt-md border border-cmt-neutral-200 bg-white p-5 shadow-cmt-xs">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-cmt-neutral-500">
          {label}
        </p>
        <span className="grid size-8 place-items-center rounded-cmt-full bg-cmt-primary-50 text-cmt-primary-900">
          <Icon className="size-4" strokeWidth={2} />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-cmt-neutral-500">{hint}</p>
    </div>
  );
}

function ShortcutCard({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: typeof Type;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-cmt-md border border-cmt-neutral-200 bg-white p-5 shadow-cmt-xs transition-[box-shadow,border-color,transform] hover:-translate-y-0.5 hover:border-cmt-neutral-300 hover:shadow-cmt-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-cmt-control bg-cmt-secondary-900 text-cmt-primary-500">
        <Icon className="size-5" strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 font-display text-base font-semibold text-cmt-neutral-900">
          {title}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </span>
        <span className="mt-1 block text-sm leading-6 text-cmt-neutral-600">{description}</span>
      </span>
    </Link>
  );
}

export default function DashboardHome() {
  const packages = usePackages();
  const content = useSiteContent();

  const liveSections = SECTION_ORDER.filter((key) => content[key].enabled).length;
  const picks =
    content.hero.topPicks.mode === "manual"
      ? content.hero.topPicks.packageIds.length
      : content.hero.topPicks.limit;

  return (
    <div>
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cmt-primary-700">
          CompareMyTrip CRM
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-cmt-neutral-600">
          Every section of the homepage is edited from here. Changes save straight to the
          live site — no rebuild, no deploy.
        </p>
      </header>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Sections live"
          value={`${liveSections}/${SECTION_ORDER.length}`}
          hint="Homepage bands currently visible"
          icon={LayoutList}
        />
        <Stat
          label="Hero slides"
          value={content.hero.copy.length}
          hint="Rotating title and description blocks"
          icon={Type}
        />
        <Stat
          label="Hero picks"
          value={picks}
          hint={
            content.hero.topPicks.mode === "manual"
              ? "Hand-picked packages on the shelf"
              : "Auto-selected by rating"
          }
          icon={Sparkles}
        />
        <Stat
          label="Packages live"
          value={packages.length}
          hint="Available in the shared catalogue"
          icon={PackageSearch}
        />
      </div>

      <h2 className="mt-9 font-display text-lg font-semibold">Jump back in</h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ShortcutCard
          href="/admin/content"
          title="Homepage content"
          description="All fifteen sections — headlines, photos, icons, cards, links and which ones show at all."
          icon={PanelsTopLeft}
        />
        <ShortcutCard
          href="/admin/packages"
          title="Build a package"
          description="Listing card, gallery, day-by-day itinerary, stays, inclusions and pricing — published as a live product page."
          icon={PackageSearch}
        />
      </div>

      <div className="mt-8 flex items-start gap-3 rounded-cmt-md border border-cmt-primary-100 bg-cmt-primary-50 p-5">
        <ImageIcon className="mt-0.5 size-5 shrink-0 text-cmt-primary-800" />
        <p className="text-sm leading-6 text-cmt-primary-900">
          <strong className="font-semibold">Where homepage content lives.</strong> Published
          homepage edits are stored in Firebase and shared with everyone who opens the site.
        </p>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BadgePercent } from "lucide-react";

import { usePackages } from "@/lib/usePackages";
import { useSiteContent } from "@/lib/useSiteContent";
import ContentImage from "../_components/ContentImage";
import PackageCard from "../_components/PackageCard";
import SectionHeader from "../_components/SectionHeader";

/* ------------------------------------------------------------------ */
/* Latest deals — design.md §15.4 D-4 dark promotional card, kept as a   */
/* 24px-radius inset block rather than a full-bleed band so the page's   */
/* dark surfaces stay budgeted, followed by the live discount grid.      */
/*                                                                       */
/* The countdown runs to the end of the current month, resolved after    */
/* mount: the server has no business guessing the visitor's clock, and   */
/* a hardcoded date would quietly go stale.                              */
/* ------------------------------------------------------------------ */

const endOfThisMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0).getTime();
};

type Remaining = { days: number; hours: number; minutes: number; seconds: number };

const split = (ms: number): Remaining => {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
};

const pad = (value: number) => String(value).padStart(2, "0");

function CountdownBox({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex min-w-0 flex-1 sm:min-w-[62px] flex-col items-center rounded-cmt-control border border-white/15 bg-white/10 px-2 py-2.5 backdrop-blur-sm sm:px-3">
      <span className="font-display text-2xl font-semibold tabular-nums leading-none text-white">
        {value}
      </span>
      <span className="mt-1 text-[11px] text-cmt-neutral-400">{label}</span>
    </div>
  );
}

export default function LatestDeals() {
  const { latestDeals } = useSiteContent();
  const packages = usePackages();
  const [remaining, setRemaining] = useState<Remaining | null>(null);

  useEffect(() => {
    const deadline = endOfThisMonth();
    const update = () => setRemaining(split(deadline - Date.now()));

    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, []);

  const deals = [...packages]
    .filter((pkg) => pkg.discount > 0)
    .sort((a, b) => b.discount - a.discount)
    .slice(0, latestDeals.maxCards);

  const topDiscount = deals[0]?.discount ?? 0;
  const { header, promo } = latestDeals;

  /* After the countdown effect, never before. */
  if (!latestDeals.enabled) return null;

  return (
    <section
      id="latest-deals"
      aria-labelledby="latest-deals-title"
      className="w-full border-t border-cmt-neutral-100 bg-white px-3 py-12 sm:px-4 sm:py-16 md:px-6 lg:py-20"
    >
      <div className="mx-auto w-full max-w-[1440px]">
        <SectionHeader
          eyebrow={header.eyebrow}
          title={<span id="latest-deals-title">{header.title}</span>}
          description={header.description}
          actionLabel={header.actionLabel}
          actionHref={header.actionHref}
        />

        {/* D-4 dark promotional card */}
        <div className="relative isolate mt-8 overflow-hidden rounded-cmt-md bg-cmt-neutral-900 p-6 sm:mt-10 sm:p-8 lg:p-10">
          <ContentImage
            src="/images/deals-mountain-backdrop.webp"
            alt=""
            fill
            sizes="(max-width: 1440px) 100vw, 1440px"
            className="-z-10 object-cover object-center"
          />
          {/* Two scrims, not a flat fill: one overall to hold the white text,
              one heavier on the left where the headline and code sit. */}
          <div className="pointer-events-none absolute inset-0 -z-10 bg-cmt-neutral-900/70" />
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-cmt-neutral-900 via-cmt-neutral-900/70 to-cmt-neutral-900/30" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
            <div className="lg:max-w-[520px]">
              <span className="inline-flex items-center gap-1.5 rounded-cmt-full bg-cmt-primary-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-cmt-neutral-900">
                <BadgePercent className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
                {promo.badge}
              </span>

              <h3 className="mt-4 text-balance font-display text-3xl font-semibold leading-[1.15] tracking-tight text-white sm:text-4xl">
                {promo.titlePrefix}{" "}
                <span className="tabular-nums text-cmt-primary-400">{topDiscount}% off</span>{" "}
                {promo.titleSuffix}
              </h3>

              <p className="mt-4 max-w-md text-sm leading-relaxed text-cmt-neutral-300">
                {promo.bodyPrefix}{" "}
                <span className="rounded-cmt-sm border border-white/20 bg-white/10 px-2 py-0.5 font-semibold tracking-wide text-white">
                  {promo.code}
                </span>{" "}
                {promo.bodySuffix}
              </p>

              <Link
                href={promo.ctaHref}
                className="group mt-6 inline-flex h-12 items-center gap-2 rounded-cmt-control bg-cmt-primary-500 px-7 text-base font-semibold text-cmt-neutral-900 shadow-cmt-xs transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:bg-cmt-primary-600 hover:shadow-cmt-primary active:translate-y-0 active:bg-cmt-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
              >
                {promo.ctaLabel}
                <ArrowRight
                  className="h-5 w-5 transition-transform group-hover:translate-x-1"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
              </Link>
            </div>

            <div className="shrink-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-cmt-neutral-400">
                {promo.countdownLabel}
              </p>

              <div className="mt-3 flex gap-2 sm:gap-3" aria-live="off">
                <CountdownBox value={remaining ? pad(remaining.days) : "--"} label="Days" />
                <CountdownBox value={remaining ? pad(remaining.hours) : "--"} label="Hours" />
                <CountdownBox value={remaining ? pad(remaining.minutes) : "--"} label="Mins" />
                <CountdownBox value={remaining ? pad(remaining.seconds) : "--"} label="Secs" />
              </div>

              <p className="mt-3 text-xs text-cmt-neutral-400">{promo.countdownNote}</p>
            </div>
          </div>
        </div>

        <div className="cmt-mobile-rail mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {deals.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              badge={{ label: `${pkg.discount}% off`, tone: "coral" }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Briefcase,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Gem,
  Heart,
  MapPin,
  Minus,
  Mountain,
  Plus,
  Sparkles,
  Star,
  TreePalm,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { type PackageCategory, type TravelPackage } from "@/lib/packageData";
import { usePackages } from "@/lib/usePackages";
import ContentImage from "./ContentImage";
import { useSiteContent } from "@/lib/useSiteContent";

// "" is the "no preference" option. Travel style lives only in the pill row
// above the fields — there's no second control for it to disagree with.
type TripType = "" | PackageCategory;

const TRIP_TABS: { label: string; value: TripType; icon: typeof Briefcase }[] = [
  { label: "All Trips", value: "", icon: Briefcase },
  { label: "Beaches", value: "Beaches", icon: TreePalm },
  { label: "Honeymoon", value: "Honeymoon", icon: Heart },
  { label: "Adventure", value: "Adventure", icon: Mountain },
  { label: "Family", value: "Family", icon: Users },
  { label: "Luxury", value: "Luxury", icon: Gem },
  { label: "Spiritual", value: "Spiritual", icon: Sparkles },
];

// Bands map onto the budget slider the packages catalog already uses, so a
// hero search lands on the catalog with the same range pre-applied.
const BUDGET_BANDS: { label: string; min: number | null; max: number }[] = [
  { label: "Any budget", min: null, max: 150000 },
  { label: "Under ₹15,000", min: 5000, max: 15000 },
  { label: "₹15,000 – ₹30,000", min: 15000, max: 30000 },
  { label: "₹30,000 – ₹60,000", min: 30000, max: 60000 },
  { label: "₹60,000+", min: 60000, max: 150000 },
];

const CONTROL =
  "cmt-search-control flex h-11 w-full min-w-0 items-center gap-2 rounded-cmt-control border border-white/10 bg-white/10 px-3 text-left font-body text-sm text-white outline-none transition-colors hover:border-white/25 hover:bg-white/[0.18] focus-visible:border-cmt-primary-500 focus-visible:ring-2 focus-visible:ring-cmt-primary-500/40";

const POPOVER =
  "cmt-search-popover absolute bottom-full z-30 mb-2 w-[min(260px,calc(100vw-3rem))] rounded-cmt-md border border-cmt-neutral-200 bg-white p-3 font-body text-cmt-neutral-900 shadow-cmt-xl";

const formatINR = (value: number) => `₹${value.toLocaleString("en-IN")}`;

const formatDay = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

function Field({
  label,
  className = "flex",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`cmt-search-field min-w-0 flex-col justify-end ${className}`}>
      <span className="mb-1.5 block px-1 font-body text-xs font-medium text-white/55">
        {label}
      </span>
      {children}
    </div>
  );
}

function PickCard({ pkg }: { pkg: TravelPackage }) {
  return (
    <Link
      href={pkg.href ?? `/packages/${pkg.id}`}
      className="cmt-hero-pick group flex w-[290px] shrink-0 items-center gap-3 rounded-cmt-md border border-white/15 bg-slate-900/70 p-2.5 transition-colors hover:border-white/30 hover:bg-slate-800/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
    >
      <div className="cmt-hero-pick-image relative size-14 shrink-0 overflow-hidden rounded-cmt-sm bg-white/10">
        <ContentImage
          src={pkg.image}
          alt=""
          fill
          sizes="(max-width: 767px) 64px, 56px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="cmt-hero-pick-title truncate font-body text-sm font-semibold text-white">
            {pkg.title}
          </p>
          <span className="cmt-hero-pick-from shrink-0 font-body text-xs text-white/55">From</span>
        </div>

        <div className="mt-0.5 flex items-baseline justify-between gap-2">
          <p className="cmt-hero-pick-meta truncate font-body text-xs text-white/65">
            {pkg.nights} Nights · {pkg.tags[0]}
          </p>
          <span className="cmt-hero-pick-price shrink-0 font-body text-sm font-semibold text-white">
            {formatINR(pkg.price)}
          </span>
        </div>

        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="cmt-hero-pick-rating inline-flex items-center gap-1 font-body text-xs font-medium text-white/85">
            {pkg.reviews > 0 && pkg.rating > 0 && <>
              <Star className="size-3 fill-cmt-primary-500 text-cmt-primary-500" aria-hidden="true" />
              <span aria-label={`${pkg.rating} out of 5 stars`}>{pkg.rating}</span>
            </>}
          </span>
          <span className="cmt-hero-pick-unit shrink-0 font-body text-xs text-white/55">/person</span>
        </div>
      </div>
    </Link>
  );
}

export default function HeroSearch({ picksTarget }: { picksTarget?: HTMLElement | null }) {
  const router = useRouter();
  const packages = usePackages();
  const { hero } = useSiteContent();
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const [tripType, setTripType] = useState<TripType>("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [adults, setAdults] = useState(2);
  const [kids, setKids] = useState(0);
  const [budgetIndex, setBudgetIndex] = useState(0);
  const [openField, setOpenField] = useState<string | null>(null);

  // Only one dropdown is ever open, and anything outside the panel — a click,
  // Escape, or scrolling the hero past it — puts it away.
  useEffect(() => {
    if (!openField) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpenField(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenField(null);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openField]);

  const toggleField = (field: string) =>
    setOpenField((current) => (current === field ? null : field));

  const travellers = adults + kids;
  const budget = BUDGET_BANDS[budgetIndex];

  const dateLabel =
    startDate && endDate
      ? `${formatDay(startDate)} – ${formatDay(endDate)}`
      : startDate
        ? `${formatDay(startDate)} – add return`
        : "Add dates";

  // Choose a seed after hydration, then keep the order stable while filling the form.
  const [pickSeed, setPickSeed] = useState(0);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPickSeed(crypto.getRandomValues(new Uint32Array(1))[0]);
  }, []);

  const { mode, packageIds, limit } = hero.topPicks;
  const topPicks = useMemo(() => {
    const matching = tripType
      ? packages.filter((pkg) => pkg.tags.includes(tripType))
      : packages;
    const pool = mode === "manual"
      ? packageIds.map((id) => packages.find((pkg) => pkg.id === id))
          .filter((pkg): pkg is TravelPackage => Boolean(pkg))
      : matching.length > 0 ? matching : packages;
    const shuffled = [...pool];
    let seed = pickSeed;
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const target = Math.floor((seed / 4294967296) * (index + 1));
      [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
    }
    return mode === "manual" ? shuffled : shuffled.slice(0, limit);
  }, [tripType, packages, mode, packageIds, limit, pickSeed]);

  useEffect(() => {
    const rail = scrollerRef.current;
    // Only the phone shelf opts into automatic motion. Desktop stays manual.
    if (!picksTarget || !rail || !hero.topPicks.enabled || topPicks.length < 2) return;
    const motion = window.matchMedia("(max-width: 767px) and (prefers-reduced-motion: no-preference)");
    let visible = false;
    let touching = false;
    let hovering = false;
    let direction = 1;
    let timer: ReturnType<typeof setInterval> | undefined;
    const sync = () => {
      clearInterval(timer);
      timer = undefined;
      if (!visible || document.hidden || !motion.matches || touching || hovering || rail.matches(":focus-within")) return;
      timer = setInterval(() => {
        const max = rail.scrollWidth - rail.clientWidth;
        if (max <= 0) return;
        if (rail.scrollLeft >= max - 2) direction = -1;
        else if (rail.scrollLeft <= 2) direction = 1;
        const step = (rail.firstElementChild?.getBoundingClientRect().width ?? 280)
          + (parseFloat(getComputedStyle(rail).columnGap) || 0);
        rail.scrollTo({ left: Math.max(0, Math.min(max, rail.scrollLeft + step * direction)), behavior: "smooth" });
      }, 4000);
    };
    const down = () => { touching = true; sync(); };
    const up = () => { if (touching) { touching = false; sync(); } };
    const enter = (event: PointerEvent) => { if (event.pointerType === "mouse") { hovering = true; sync(); } };
    const leave = () => { hovering = false; sync(); };
    const observer = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting && entry.intersectionRatio >= 0.5);
      sync();
    }, { threshold: 0.5 });
    observer.observe(rail);
    rail.addEventListener("pointerdown", down);
    rail.addEventListener("pointerenter", enter);
    rail.addEventListener("pointerleave", leave);
    rail.addEventListener("focusin", sync);
    rail.addEventListener("focusout", sync);
    document.addEventListener("pointerup", up);
    document.addEventListener("pointercancel", up);
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", sync);
    return () => {
      clearInterval(timer);
      observer.disconnect();
      rail.removeEventListener("pointerdown", down);
      rail.removeEventListener("pointerenter", enter);
      rail.removeEventListener("pointerleave", leave);
      rail.removeEventListener("focusin", sync);
      rail.removeEventListener("focusout", sync);
      document.removeEventListener("pointerup", up);
      document.removeEventListener("pointercancel", up);
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
    };
  }, [picksTarget, hero.topPicks.enabled, topPicks.length]);

  const scrollPicks = (direction: "previous" | "next") => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const atEnd =
      scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 8;
    const step = (scroller.firstElementChild?.getBoundingClientRect().width ?? 290) + 12;
    const left = direction === "previous"
      ? scroller.scrollLeft <= 8 ? scroller.scrollWidth - scroller.clientWidth : scroller.scrollLeft - step
      : atEnd ? 0 : scroller.scrollLeft + step;
    scroller.scrollTo({
      left,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params = new URLSearchParams();
    if (destination.trim()) params.set("q", destination.trim());
    if (tripType) params.set("category", tripType);
    if (budget.min !== null) {
      params.set("budgetMin", String(budget.min));
      params.set("budgetMax", String(budget.max));
    }
    if (startDate) params.set("start", startDate);
    if (endDate) params.set("end", endDate);
    params.set("travellers", String(travellers));

    router.push(`/packages?${params.toString()}`);
  };

  const picks = hero.topPicks.enabled && topPicks.length > 0 ? (
      <div role="region" aria-label={hero.topPicks.title} className="cmt-hero-picks mt-3 hidden items-center gap-4 md:flex lg:mt-4">
        <div className="cmt-hero-picks-heading hidden w-[186px] shrink-0 lg:block">
          <h2 className="inline-flex items-center gap-2 font-display text-lg font-semibold text-white">
            <Sparkles className="size-5 text-cmt-primary-500" strokeWidth={2} />
            {hero.topPicks.title}
          </h2>
          <p className="mt-1 font-body text-xs text-white/60">
            {hero.topPicks.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => scrollPicks("previous")}
          aria-label="Show previous picks"
          className="cmt-hero-picks-prev grid size-10 shrink-0 place-items-center rounded-cmt-full border border-white/20 bg-slate-900/70 text-white transition-colors hover:bg-slate-800/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
        >
          <ChevronLeft className="size-5" strokeWidth={2} aria-hidden="true" />
        </button>

        <div
          ref={scrollerRef}
          className="cmt-hero-picks-rail flex min-w-0 flex-1 gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {topPicks.map((pkg) => (
            <PickCard key={pkg.id} pkg={pkg} />
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollPicks("next")}
          aria-label="Show more picks"
          className="cmt-hero-picks-next grid size-10 shrink-0 place-items-center rounded-cmt-full border border-white/20 bg-slate-900/70 text-white transition-colors hover:bg-slate-800/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
        >
          <ChevronRight className="size-5" strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
  ) : null;

  return (
    <div ref={rootRef} className="cmt-hero-booking w-full">
      <form
        onSubmit={handleSubmit}
        className="cmt-hero-search w-full rounded-cmt-lg border border-white/15 bg-slate-950/75 p-2.5 shadow-[0_24px_60px_rgba(2,6,23,0.45)] sm:p-3"
      >
        {/* Travel style — doubles as the trip-type filter carried into search */}
        <div className="cmt-search-tabs flex items-center gap-2 overflow-x-auto pb-2.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:pb-3 [&::-webkit-scrollbar]:hidden">
          {TRIP_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tripType === tab.value;
            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => setTripType(tab.value)}
                aria-pressed={isActive}
                className={`inline-flex shrink-0 items-center gap-2 rounded-cmt-full px-3.5 py-2 font-body text-sm font-medium transition-colors sm:px-4 ${
                  isActive
                    ? "bg-cmt-primary-500 text-cmt-neutral-900 shadow-cmt-primary"
                    : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
                }`}
              >
                <Icon className="size-4" strokeWidth={2} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="cmt-search-fields rounded-cmt-md border border-white/10 bg-white/5 p-2.5">
          <div className="grid grid-cols-2 items-stretch gap-2.5 md:grid-cols-3 xl:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
            <Field label="Destination" className="col-span-2 flex md:col-span-1">
              <div className={CONTROL}>
                <MapPin className="size-4 shrink-0 text-white/55" strokeWidth={2} />
                <input
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  onFocus={() => setOpenField(null)}
                  placeholder="Where to?"
                  aria-label="Destination"
                  className="w-full min-w-0 bg-transparent outline-none placeholder:text-white/45"
                />
              </div>
            </Field>

            <Field label="Travel dates" className="flex">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleField("dates")}
                  aria-expanded={openField === "dates"}
                  className={CONTROL}
                >
                  <CalendarDays className="size-4 shrink-0 text-white/55" strokeWidth={2} />
                  <span className={`truncate ${startDate ? "" : "text-white/45"}`}>
                    {dateLabel}
                  </span>
                </button>

                {openField === "dates" && (
                  <div className={`${POPOVER} left-0`}>
                    <label className="block text-xs font-medium text-cmt-neutral-600">
                      Departure
                      <input
                        type="date"
                        value={startDate}
                        onChange={(event) => {
                          setStartDate(event.target.value);
                          if (endDate && event.target.value > endDate) setEndDate("");
                        }}
                        className="mt-1 w-full rounded-cmt-sm border border-cmt-neutral-200 px-2.5 py-2 text-sm text-cmt-neutral-900 outline-none focus:border-cmt-primary-500"
                      />
                    </label>
                    <label className="mt-3 block text-xs font-medium text-cmt-neutral-600">
                      Return
                      <input
                        type="date"
                        value={endDate}
                        min={startDate || undefined}
                        onChange={(event) => setEndDate(event.target.value)}
                        className="mt-1 w-full rounded-cmt-sm border border-cmt-neutral-200 px-2.5 py-2 text-sm text-cmt-neutral-900 outline-none focus:border-cmt-primary-500"
                      />
                    </label>
                  </div>
                )}
              </div>
            </Field>

            <Field label="Travellers" className="flex">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleField("travellers")}
                  aria-expanded={openField === "travellers"}
                  className={CONTROL}
                >
                  <UserRound className="size-4 shrink-0 text-white/55" strokeWidth={2} />
                  <span className="truncate">
                    {travellers} {travellers === 1 ? "Traveller" : "Travellers"}
                  </span>
                </button>

                {openField === "travellers" && (
                  <div className={`${POPOVER} right-0`}>
                    <Stepper
                      label="Adults"
                      hint="12+ years"
                      value={adults}
                      min={1}
                      max={12}
                      onChange={setAdults}
                    />
                    <div className="mt-3 border-t border-cmt-neutral-200 pt-3">
                      <Stepper
                        label="Children"
                        hint="Under 12"
                        value={kids}
                        min={0}
                        max={8}
                        onChange={setKids}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Field>

            <Field label="Budget" className="flex">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleField("budget")}
                  aria-expanded={openField === "budget"}
                  className={CONTROL}
                >
                  <Wallet className="size-4 shrink-0 text-white/55" strokeWidth={2} />
                  <span
                    className={`truncate ${budgetIndex === 0 ? "text-white/45" : ""}`}
                  >
                    {budget.label}
                  </span>
                </button>

                {openField === "budget" && (
                  <div className={`${POPOVER} right-0 p-1.5`}>
                    {BUDGET_BANDS.map((band, index) => (
                      <button
                        key={band.label}
                        type="button"
                        onClick={() => {
                          setBudgetIndex(index);
                          setOpenField(null);
                        }}
                        className={`block w-full rounded-cmt-sm px-2.5 py-2 text-left text-sm transition-colors hover:bg-cmt-neutral-100 ${
                          index === budgetIndex
                            ? "bg-cmt-primary-50 font-semibold text-cmt-primary-800"
                            : "text-cmt-neutral-700"
                        }`}
                      >
                        {band.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Field>

            <div className="col-span-2 flex items-end xl:col-span-1 xl:items-stretch">
              <button
                type="submit"
                className="group flex h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-cmt-control bg-cmt-primary-500 px-3 font-body text-sm font-semibold text-cmt-neutral-900 shadow-cmt-primary transition-[background-color,box-shadow,transform] hover:bg-cmt-primary-600 hover:shadow-cmt-xl active:scale-[0.99] xl:h-auto xl:gap-2.5 xl:px-6"
              >
                Find Smart Packages
                <span className="flex size-7 shrink-0 items-center justify-center rounded-cmt-full bg-cmt-secondary-900 text-white transition-transform duration-200 group-hover:translate-x-0.5">
                  <ArrowRight className="size-4 stroke-[2.5]" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {picksTarget ? createPortal(picks, picksTarget) : picks}
    </div>
  );
}

function Stepper({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}) {
  const buttonClass =
    "grid size-7 place-items-center rounded-cmt-full border border-cmt-neutral-200 text-cmt-neutral-700 transition-colors hover:border-cmt-neutral-300 hover:bg-cmt-neutral-100 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium text-cmt-neutral-900">
        {label}
        <span className="block text-xs font-normal text-cmt-neutral-500">{hint}</span>
      </span>
      <span className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Fewer ${label.toLowerCase()}`}
          className={buttonClass}
        >
          <Minus className="size-3.5" strokeWidth={2.5} />
        </button>
        <span className="w-4 text-center text-sm font-semibold tabular-nums">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`More ${label.toLowerCase()}`}
          className={buttonClass}
        >
          <Plus className="size-3.5" strokeWidth={2.5} />
        </button>
      </span>
    </div>
  );
}

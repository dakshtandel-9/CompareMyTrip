"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  PACKAGE_CATEGORIES,
  getDiscountPercent,
  type PackageCategory,
  type TravelPackage,
} from "@/lib/packageData";
import { usePackages } from "@/lib/usePackages";
import { useCompare } from "@/lib/useCompare";
import {
  ArrowDownUp,
  ArrowLeftRight,
  BadgePercent,
  BedDouble,
  Check,
  ChevronDown,
  Clock3,
  MapPin,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Users,
  X,
  Zap,
} from "lucide-react";

type Category = "All packages" | PackageCategory;

const categories: Category[] = ["All packages", ...PACKAGE_CATEGORIES];

/* Region has no control of its own on this page — the site header links into
   it. It lives in the URL so /packages?region=international stays shareable.
   Values are matched loosely: "international", "International", "overseas"
   and "abroad" all land in the same place. */
type Region = "All" | "India" | "International";

function parseRegion(value: string | null): Region {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "india" || normalized === "domestic") return "India";
  if (normalized === "international" || normalized === "abroad" || normalized === "overseas") {
    return "International";
  }
  return "All";
}

const formatINR = (value: number) => `₹${value.toLocaleString("en-IN")}`;

const durationOptions = [
  { label: "3–4 days", value: "3-4", matches: (days: number) => days >= 3 && days <= 4 },
  { label: "5–6 days", value: "5-6", matches: (days: number) => days >= 5 && days <= 6 },
  { label: "7–9 days", value: "7-9", matches: (days: number) => days >= 7 && days <= 9 },
  { label: "10+ days", value: "10+", matches: (days: number) => days >= 10 },
];

/* The card's one secondary action is the comparison tray, not a wishlist:
   picking it fills the next slot of the homepage comparison, and picking it
   again takes the package back out and leaves that slot empty. */
function PackageCard({
  pkg,
  isCompared,
  onToggleCompare,
}: {
  pkg: TravelPackage;
  isCompared: boolean;
  onToggleCompare: (packageId: string) => void;
}) {
  const discountPercent = getDiscountPercent(pkg);
  const hasReviews = pkg.reviews > 0 && pkg.rating > 0;

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-cmt-md border border-cmt-neutral-200 bg-white shadow-cmt-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-cmt-neutral-300 hover:shadow-cmt-md">
      <div className="relative aspect-[4/3] overflow-hidden bg-cmt-neutral-100">
        <Image
          src={pkg.image}
          alt={pkg.location}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1440px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.035]"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3">
          {/* Imported operator listings carry no pre-discount price, so the
              pill is dropped rather than showing an invented "0% off". */}
          {discountPercent > 0 ? (
            <span className="rounded-cmt-full border border-cmt-coral-500/30 bg-cmt-coral-100 px-2.5 py-1 text-[11px] font-semibold text-cmt-coral-700">
              {discountPercent}% off
            </span>
          ) : (
            <span />
          )}
          <button
            type="button"
            aria-pressed={isCompared}
            aria-label={
              isCompared
                ? `Remove ${pkg.title} from the comparison`
                : `Add ${pkg.title} to the comparison`
            }
            onClick={() => onToggleCompare(pkg.id)}
            className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-cmt-full border px-3 text-[11px] font-semibold shadow-cmt-xs transition-colors ${
              isCompared
                ? "border-cmt-primary-600 bg-cmt-primary-500 text-cmt-neutral-900"
                : "border-white/70 bg-white/95 text-cmt-neutral-700 hover:border-cmt-neutral-300 hover:text-cmt-neutral-900"
            } focus-visible:outline-none focus-visible:shadow-[var(--cmt-focus-ring)]`}
          >
            {isCompared ? (
              <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
            ) : (
              <ArrowLeftRight className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
            )}
            {isCompared ? "Added to compare" : "Compare"}
          </button>
        </div>
        <div className="absolute inset-x-3 bottom-3 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-cmt-full border border-cmt-success-500/20 bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-cmt-success-700 shadow-cmt-xs">
            <ShieldCheck className="size-3.5 text-cmt-success-500" strokeWidth={2.5} />
            GST Verified
          </span>
          {pkg.deal && (
            <span className="inline-flex items-center gap-1 rounded-cmt-full bg-cmt-neutral-900 px-2.5 py-1 text-[11px] font-semibold text-cmt-primary-400 shadow-cmt-xs">
              <BadgePercent className="size-3.5" strokeWidth={2.5} />
              Best deal
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <p className="flex min-w-0 items-center gap-1 text-xs font-medium text-cmt-neutral-500">
            <MapPin className="size-3.5 shrink-0" strokeWidth={2} />
            <span className="truncate">{pkg.location}</span>
          </p>
          {hasReviews ? (
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-cmt-neutral-700">
              <Star className="size-3.5 fill-cmt-primary-500 text-cmt-primary-500" />
              {pkg.rating}
              <span className="font-normal text-cmt-neutral-400">({pkg.reviews})</span>
            </span>
          ) : (
            /* No reviews yet is said in words — an empty star row reads as a
               bad score rather than as missing data. */
            <span className="shrink-0 text-xs font-medium text-cmt-neutral-400">
              Newly listed
            </span>
          )}
        </div>

        <h2 className="mt-2 line-clamp-2 min-h-[44px] font-display text-base font-semibold leading-[1.35] text-cmt-neutral-900">
          {pkg.title}
        </h2>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-cmt-neutral-600">
          <span className="inline-flex items-center gap-1">
            <Clock3 className="size-3.5" />
            {pkg.nights}N / {pkg.days}D
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5" />
            {pkg.pax}
          </span>
          <span className="inline-flex items-center gap-1">
            <BedDouble className="size-3.5" />
            {pkg.hotelStars}★ hotels
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {pkg.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-cmt-full border border-cmt-neutral-200 bg-cmt-neutral-50 px-2 py-0.5 text-[11px] font-medium text-cmt-neutral-700"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* The operating partner is deliberately not named on the card — the
            GST-verified badge carries the trust signal instead. */}
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-cmt-neutral-500">
          <span className="inline-flex items-center gap-1">
            <RotateCcw className="size-3" /> Free cancellation
          </span>
          <span className="inline-flex items-center gap-1">
            <Zap className="size-3" /> Instant confirm
          </span>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-cmt-neutral-100 pt-4">
          <div className="min-w-0">
            {discountPercent > 0 && (
              <p className="text-xs text-cmt-neutral-400 line-through">
                {formatINR(pkg.originalPrice)}
              </p>
            )}
            <p className="whitespace-nowrap font-display text-lg font-bold text-cmt-neutral-900">
              {formatINR(pkg.price)}
              <span className="ml-1 font-body text-[11px] font-normal text-cmt-neutral-500">
                /person
              </span>
            </p>
          </div>
            <Link
              href={`/packages/${pkg.id}`}
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-cmt-control bg-cmt-primary-500 px-4 text-sm font-semibold text-cmt-neutral-900 shadow-cmt-xs transition-colors hover:bg-cmt-primary-600 focus-visible:outline-none focus-visible:shadow-[var(--cmt-focus-ring)]"
            >
              View package
            </Link>
        </div>
      </div>
    </article>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-cmt-neutral-200 py-5 first:pt-0 last:border-b-0 last:pb-0">
      <h3 className="mb-3 text-sm font-semibold text-cmt-neutral-900">{title}</h3>
      {children}
    </div>
  );
}

/* The slider's range is read off the catalogue rather than hard-coded: a fixed
   ₹5k–₹1.5L window silently hid every trek under the floor and every long-haul
   package over the ceiling. Rounded outwards to a round number so the ends of
   the track read cleanly. */
const BUDGET_STEP = 500;

function budgetBounds(packages: TravelPackage[]): [number, number] {
  if (packages.length === 0) return [0, 100000];
  const prices = packages.map((pkg) => pkg.price);
  const floor = Math.floor(Math.min(...prices) / 1000) * 1000;
  const ceiling = Math.ceil(Math.max(...prices) / 1000) * 1000;
  return [Math.max(0, floor), Math.max(ceiling, floor + BUDGET_STEP)];
}

export default function PackagesCatalog() {
  const packages = usePackages();
  /* One subscription for the whole grid rather than one per card. */
  const { isCompared, toggle: toggleCompare } = useCompare();

  // Seeded from the URL so the homepage hero search lands here with the
  // destination, travel style and budget the visitor already picked.
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCategory = searchParams.get("category");
  const initialMinimum = Number(searchParams.get("budgetMin"));
  const initialMaximum = Number(searchParams.get("budgetMax"));

  const [region, setRegion] = useState<Region>(parseRegion(searchParams.get("region")));
  const [category, setCategory] = useState<Category>(
    initialCategory && PACKAGE_CATEGORIES.includes(initialCategory as PackageCategory)
      ? (initialCategory as Category)
      : "All packages",
  );
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [sort, setSort] = useState("recommended");

  /* Every count and the budget range are scoped to the region in the URL, so
     the panel describes the set the visitor is actually looking at. */
  const regionPackages = useMemo(
    () => (region === "All" ? packages : packages.filter((pkg) => pkg.region === region)),
    [packages, region],
  );
  const [floor, ceiling] = useMemo(() => budgetBounds(regionPackages), [regionPackages]);
  /* null means "the visitor has not touched the budget", which is not the same
     as a range that happens to span everything — only a real choice filters. */
  const [budget, setBudget] = useState<[number, number] | null>(
    initialMinimum > 0 || initialMaximum > 0
      ? [initialMinimum > 0 ? initialMinimum : 0, initialMaximum > 0 ? initialMaximum : Number.MAX_SAFE_INTEGER]
      : null,
  );
  const activeBudget: [number, number] = budget ?? [floor, ceiling];
  const [dealsOnly, setDealsOnly] = useState(searchParams.get("deals") === "1");
  /* /destinations links in one place at a time, but the param repeats so a
     multi-destination view stays shareable. Seeded like every other filter
     here: only the region control writes back to the URL. */
  const [destinations, setDestinations] = useState<string[]>(() =>
    searchParams.getAll("destination").map((value) => value.trim()).filter(Boolean),
  );
  const [destinationQuery, setDestinationQuery] = useState("");
  const [durations, setDurations] = useState<string[]>([]);
  const [hotelCategories, setHotelCategories] = useState<number[]>([]);
  const [minimumRating, setMinimumRating] = useState<number | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const dealCount = useMemo(
    () => regionPackages.filter((pkg) => pkg.deal).length,
    [regionPackages],
  );

  /* Built from the catalogue, biggest first, so the list is always exactly the
     places that have packages in the region being viewed. */
  const destinationOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const pkg of regionPackages) {
      counts.set(pkg.destination, (counts.get(pkg.destination) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [regionPackages]);

  const visibleDestinations = useMemo(() => {
    const needle = destinationQuery.trim().toLowerCase();
    if (!needle) return destinationOptions;
    return destinationOptions.filter((option) => option.name.toLowerCase().includes(needle));
  }, [destinationOptions, destinationQuery]);

  const toggleDestination = (value: string) => {
    setDestinations((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  const toggleDuration = (value: string) => {
    setDurations((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  const toggleHotelCategory = (value: number) => {
    setHotelCategories((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  /* Search and package type moved into this panel, so "Clear all" has to reset
     them too — otherwise a stale query keeps the grid empty after a clear. */
  const clearFilters = () => {
    setQuery("");
    setCategory("All packages");
    setDealsOnly(false);
    setDestinations([]);
    setDestinationQuery("");
    setBudget(null);
    setDurations([]);
    setHotelCategories([]);
    setMinimumRating(null);
  };

  /* With the tab row gone the masthead carries the region, so a visitor who
     arrived on ?region=international can still see what they are looking at. */
  const regionHeading =
    region === "India"
      ? "India holiday packages"
      : region === "International"
        ? "International holiday packages"
        : "Holiday packages";

  /* Reflect the choice in the URL so the state survives a refresh and stays
     shareable. router.replace keeps it out of the back stack while still going
     through the router, which window.history alone bypasses — the page is keyed
     on these params, so the URL and the filters must never disagree. */
  const chooseRegion = (next: Region) => {
    setRegion(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "All") params.delete("region");
    else params.set("region", next.toLowerCase());
    const queryString = params.toString();
    router.replace(queryString ? `/packages?${queryString}` : "/packages", { scroll: false });
  };

  const visiblePackages = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = packages.filter((pkg) => {
      const matchesRegion = region === "All" || pkg.region === region;
      const matchesDeal = !dealsOnly || pkg.deal === true;
      const matchesDestination =
        destinations.length === 0 || destinations.includes(pkg.destination);
      const matchesCategory =
        category === "All packages" || pkg.tags.includes(category);
      const matchesQuery =
        !normalized ||
        /* Operator is not searchable: it is never shown, so a match on it
           would return results the visitor cannot account for. */
        `${pkg.title} ${pkg.location} ${pkg.destination}`
          .toLowerCase()
          .includes(normalized);
      const matchesBudget =
        budget === null || (pkg.price >= budget[0] && pkg.price <= budget[1]);
      const matchesDuration =
        durations.length === 0 ||
        durationOptions.some(
          (option) => durations.includes(option.value) && option.matches(pkg.days),
        );
      const matchesHotel =
        hotelCategories.length === 0 || hotelCategories.includes(pkg.hotelStars);
      const matchesRating =
        minimumRating === null || pkg.rating >= minimumRating;

      return (
        matchesRegion &&
        matchesDeal &&
        matchesDestination &&
        matchesCategory &&
        matchesQuery &&
        matchesBudget &&
        matchesDuration &&
        matchesHotel &&
        matchesRating
      );
    });

    return [...filtered].sort((a, b) => {
      if (sort === "price-low") return a.price - b.price;
      if (sort === "price-high") return b.price - a.price;
      if (sort === "rating") return b.rating - a.rating;
      return b.reviews + b.rating * 10 - (a.reviews + a.rating * 10);
    });
  }, [budget, category, dealsOnly, destinations, durations, hotelCategories, minimumRating, packages, query, region, sort]);

  const activeFilterCount =
    durations.length +
    hotelCategories.length +
    (minimumRating === null ? 0 : 1) +
    (budget === null ? 0 : 1) +
    (dealsOnly ? 1 : 0) +
    (category === "All packages" ? 0 : 1) +
    destinations.length +
    (query.trim() === "" ? 0 : 1);

  const filtersContent = (
    <>
      {/* An on/off switch rather than a checkbox: it narrows the whole grid to
          the editorially picked deals, so it reads as a mode, not one more
          box to tick. */}
      <FilterGroup title="Best deals">
        <button
          type="button"
          role="switch"
          aria-checked={dealsOnly}
          onClick={() => setDealsOnly((current) => !current)}
          className="flex w-full items-center justify-between gap-3 text-left focus-visible:outline-none focus-visible:shadow-[var(--cmt-focus-ring)]"
        >
          <span className="min-w-0">
            <span className="block text-sm font-medium text-cmt-neutral-700">
              Show best deals only
            </span>
            <span className="mt-0.5 block text-xs text-cmt-neutral-500">
              {dealCount} {dealCount === 1 ? "package" : "packages"} hand-picked for value
            </span>
          </span>
          <span
            aria-hidden="true"
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
              dealsOnly ? "bg-cmt-primary-500" : "bg-cmt-neutral-300"
            }`}
          >
            <span
              className={`inline-block size-4 rounded-full bg-white shadow-cmt-xs transition-transform ${
                dealsOnly ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </span>
        </button>
      </FilterGroup>

      {/* Destinations are read off the catalogue, never a fixed list, so the
          panel can only ever offer somewhere we actually sell. */}
      <FilterGroup title="Destination">
        {destinationOptions.length > 8 && (
          <label className="relative mb-3 block">
            <span className="sr-only">Search destinations</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-cmt-neutral-400" />
            <input
              type="search"
              value={destinationQuery}
              onChange={(event) => setDestinationQuery(event.target.value)}
              placeholder="Search destinations…"
              className="h-9 w-full rounded-cmt-control border border-cmt-neutral-200 bg-white pl-8 pr-3 text-xs text-cmt-neutral-900 outline-none placeholder:text-cmt-neutral-400 focus:border-cmt-primary-500 focus:shadow-[var(--cmt-focus-ring)]"
            />
          </label>
        )}
        <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
          {visibleDestinations.length === 0 ? (
            <p className="text-xs text-cmt-neutral-500">No destination matches that.</p>
          ) : (
            visibleDestinations.map(({ name, count }) => (
              <label key={name} className="flex cursor-pointer items-center justify-between text-sm">
                <span className="flex min-w-0 items-center gap-2.5 text-cmt-neutral-700">
                  <input
                    type="checkbox"
                    checked={destinations.includes(name)}
                    onChange={() => toggleDestination(name)}
                    className="size-4 shrink-0 accent-[var(--cmt-color-primary-500)]"
                  />
                  <span className="truncate">{name}</span>
                </span>
                <span className="ml-2 shrink-0 text-xs text-cmt-neutral-400">{count}</span>
              </label>
            ))
          )}
        </div>
      </FilterGroup>

      {/* Travel style stays single-select — the chips read as one choice, and
          the counts are region-aware so a style that would empty the grid is
          visible as 0 before it is clicked. */}
      <FilterGroup title="Package type">
        <div className="flex flex-wrap gap-1.5">
          {categories.map((item) => {
            const isActive = category === item;
            const count =
              item === "All packages"
                ? regionPackages.length
                : regionPackages.filter((pkg) => pkg.tags.includes(item)).length;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`inline-flex h-8 items-center gap-1 rounded-cmt-full border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:shadow-[var(--cmt-focus-ring)] ${
                  isActive
                    ? "border-cmt-neutral-900 bg-cmt-neutral-900 text-white"
                    : "border-cmt-neutral-200 bg-white text-cmt-neutral-600 hover:border-cmt-neutral-300 hover:text-cmt-neutral-900"
                }`}
              >
                {isActive && <Check className="size-3" strokeWidth={3} />}
                {item}
                <span className={isActive ? "font-normal text-white/60" : "font-normal text-cmt-neutral-400"}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </FilterGroup>

      <FilterGroup title="Budget per person">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-cmt-sm border border-cmt-neutral-200 px-3 py-2">
            <span className="block text-[10px] uppercase tracking-wide text-cmt-neutral-400">Min</span>
            <span className="text-sm font-medium">{formatINR(activeBudget[0])}</span>
          </div>
          <div className="rounded-cmt-sm border border-cmt-neutral-200 px-3 py-2">
            <span className="block text-[10px] uppercase tracking-wide text-cmt-neutral-400">Max</span>
            <span className="text-sm font-medium">{formatINR(activeBudget[1])}</span>
          </div>
        </div>
        <div className="relative mt-5 h-5">
          <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-cmt-neutral-200" />
          <div
            className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-cmt-primary-500"
            style={{
              left: `${((activeBudget[0] - floor) / (ceiling - floor)) * 100}%`,
              right: `${100 - ((activeBudget[1] - floor) / (ceiling - floor)) * 100}%`,
            }}
          />
          <input
            aria-label="Minimum budget"
            type="range"
            min={floor}
            max={ceiling}
            step={BUDGET_STEP}
            value={activeBudget[0]}
            onChange={(event) => {
              const next = Number(event.target.value);
              setBudget((current) => {
                const [, maximum] = current ?? [floor, ceiling];
                return [Math.min(next, maximum - BUDGET_STEP), maximum];
              });
            }}
            className="pointer-events-none absolute inset-0 z-10 h-5 w-full appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-cmt-primary-500 [&::-moz-range-thumb]:bg-white [&::-moz-range-track]:bg-transparent [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-cmt-primary-500 [&::-webkit-slider-thumb]:bg-white"
          />
          <input
            aria-label="Maximum budget"
            type="range"
            min={floor}
            max={ceiling}
            step={BUDGET_STEP}
            value={activeBudget[1]}
            onChange={(event) => {
              const next = Number(event.target.value);
              setBudget((current) => {
                const [minimum] = current ?? [floor, ceiling];
                return [minimum, Math.max(next, minimum + BUDGET_STEP)];
              });
            }}
            className="pointer-events-none absolute inset-0 z-20 h-5 w-full appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-cmt-primary-500 [&::-moz-range-thumb]:bg-white [&::-moz-range-track]:bg-transparent [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-cmt-primary-500 [&::-webkit-slider-thumb]:bg-white"
          />
        </div>
      </FilterGroup>

      <FilterGroup title="Duration">
        {durationOptions.map((option) => (
          <label key={option.value} className="mb-3 flex cursor-pointer items-center justify-between text-sm last:mb-0">
            <span className="flex items-center gap-2.5 text-cmt-neutral-700">
              <input
                type="checkbox"
                checked={durations.includes(option.value)}
                onChange={() => toggleDuration(option.value)}
                className="size-4 accent-[var(--cmt-color-primary-500)]"
              />
              {option.label}
            </span>
            <span className="text-xs text-cmt-neutral-400">
              {regionPackages.filter((pkg) => option.matches(pkg.days)).length}
            </span>
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Hotel category">
        {[3, 4, 5].map((stars) => (
          <label key={stars} className="mb-3 flex cursor-pointer items-center justify-between text-sm last:mb-0">
            <span className="flex items-center gap-2.5 text-cmt-neutral-700">
              <input
                type="checkbox"
                checked={hotelCategories.includes(stars)}
                onChange={() => toggleHotelCategory(stars)}
                className="size-4 accent-[var(--cmt-color-primary-500)]"
              />
              {stars} star
            </span>
            <span className="text-xs text-cmt-neutral-400">
              {regionPackages.filter((pkg) => pkg.hotelStars === stars).length}
            </span>
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Traveller rating">
        {[4.5, 4].map((rating) => (
          <label key={rating} className="mb-3 flex cursor-pointer items-center gap-2.5 text-sm text-cmt-neutral-700 last:mb-0">
            <input
              name="rating"
              type="radio"
              checked={minimumRating === rating}
              onChange={() => setMinimumRating(rating)}
              className="size-4 accent-[var(--cmt-color-primary-500)]"
            />
            {rating.toFixed(1)} &amp; above
          </label>
        ))}
      </FilterGroup>
    </>
  );

  return (
    <main className="min-h-screen bg-cmt-neutral-50 font-body text-cmt-neutral-900">
      {/* No masthead: the grid starts straight under the site header. Search,
          package type and the rest live in the filter panel, and the region
          comes in on ?region= from the header links. */}
      <section className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* The visible title is gone, but the document still needs one h1 —
            screen readers and search results have nothing else to name the
            page by, since the cards below start at h2. */}
        <h1 className="sr-only">{regionHeading}</h1>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-cmt-neutral-900">
              {visiblePackages.length} holiday packages
              {/* The region arrives from the header link, so without this the
                  narrowed set would have no on-page way back out. */}
              {region !== "All" && (
                <button
                  type="button"
                  onClick={() => chooseRegion("All")}
                  className="inline-flex items-center gap-1 rounded-cmt-full border border-cmt-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-cmt-neutral-600 transition-colors hover:border-cmt-neutral-300 hover:text-cmt-neutral-900 focus-visible:outline-none focus-visible:shadow-[var(--cmt-focus-ring)]"
                >
                  {region === "India" ? "India only" : "International only"}
                  <X className="size-3" strokeWidth={2.5} aria-hidden="true" />
                  <span className="sr-only">Show all destinations</span>
                </button>
              )}
              {/* The hero search on the homepage still arrives as ?q=, and the
                  panel no longer has a search box to show it in — so it is
                  surfaced here rather than narrowing the grid invisibly. */}
              {query.trim() !== "" && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="inline-flex items-center gap-1 rounded-cmt-full border border-cmt-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-cmt-neutral-600 transition-colors hover:border-cmt-neutral-300 hover:text-cmt-neutral-900 focus-visible:outline-none focus-visible:shadow-[var(--cmt-focus-ring)]"
                >
                  “{query.trim()}”
                  <X className="size-3" strokeWidth={2.5} aria-hidden="true" />
                  <span className="sr-only">Clear the search</span>
                </button>
              )}
            </p>
            <p className="mt-1 text-xs text-cmt-neutral-500">
              Prices shown are per person and include applicable taxes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="inline-flex h-11 items-center gap-2 rounded-cmt-control border border-cmt-neutral-200 bg-white px-4 text-sm font-semibold text-cmt-neutral-700 shadow-cmt-xs lg:hidden"
            >
              <SlidersHorizontal className="size-4" /> Filters
              {activeFilterCount > 0 && (
                <span className="grid size-5 place-items-center rounded-full bg-cmt-neutral-900 text-[10px] text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <label className="relative">
              <span className="sr-only">Sort packages</span>
              <ArrowDownUp className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cmt-neutral-500" />
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="h-11 appearance-none rounded-cmt-control border border-cmt-neutral-200 bg-white pl-9 pr-9 text-sm font-semibold text-cmt-neutral-700 shadow-cmt-xs outline-none focus:border-cmt-primary-500 focus:shadow-[var(--cmt-focus-ring)]"
              >
                <option value="recommended">Recommended</option>
                <option value="price-low">Price: Low to high</option>
                <option value="price-high">Price: High to low</option>
                <option value="rating">Top rated</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-cmt-neutral-500" />
            </label>
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)]">
          {/* The panel is taller than the viewport once destinations are in it,
              so the column caps at the screen and scrolls its own body while
              the heading and "Clear all" stay pinned. */}
          <aside className="sticky top-24 hidden max-h-[calc(100vh-7rem)] flex-col overflow-hidden rounded-cmt-md border border-cmt-neutral-200 bg-white shadow-cmt-sm lg:flex">
            <div className="flex shrink-0 items-center justify-between border-b border-cmt-neutral-100 px-5 py-4">
              <h2 className="inline-flex items-center gap-2 font-display text-lg font-semibold">
                <SlidersHorizontal className="size-4" /> Filters
              </h2>
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-cmt-primary-900 hover:underline"
              >
                Clear all
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-1">{filtersContent}</div>
          </aside>

          <div>
            {visiblePackages.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {visiblePackages.map((pkg) => (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    isCompared={isCompared(pkg.id)}
                    onToggleCompare={toggleCompare}
                  />
                ))}
              </div>
            ) : (
              <div className="grid min-h-[420px] place-items-center rounded-cmt-md border border-dashed border-cmt-neutral-300 bg-white px-6 text-center">
                <div>
                  <div className="mx-auto grid size-12 place-items-center rounded-full bg-cmt-primary-50 text-cmt-primary-900">
                    <Search className="size-5" />
                  </div>
                  <h2 className="mt-4 font-display text-xl font-semibold">No packages found</h2>
                  <p className="mt-2 text-sm text-cmt-neutral-500">Try another destination or package type.</p>
                  <button
                    type="button"
                    onClick={() => {
                      chooseRegion("All");
                      clearFilters();
                    }}
                    className="mt-5 rounded-cmt-control bg-cmt-primary-500 px-5 py-2.5 text-sm font-semibold text-cmt-neutral-900"
                  >
                    View all packages
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Package filters">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setMobileFiltersOpen(false)}
            className="absolute inset-0 bg-cmt-neutral-900/45"
          />
          <div className="absolute inset-y-0 right-0 flex w-[min(90vw,380px)] flex-col bg-white shadow-cmt-xl">
            <div className="flex items-center justify-between border-b border-cmt-neutral-200 px-5 py-4">
              <h2 className="inline-flex items-center gap-2 font-display text-lg font-semibold">
                <SlidersHorizontal className="size-4" /> Filters
              </h2>
              <button
                type="button"
                aria-label="Close filters"
                onClick={() => setMobileFiltersOpen(false)}
                className="grid size-9 place-items-center rounded-full border border-cmt-neutral-200 text-cmt-neutral-600"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">{filtersContent}</div>
            <div className="grid grid-cols-2 gap-3 border-t border-cmt-neutral-200 bg-white p-4">
              <button
                type="button"
                onClick={clearFilters}
                className="h-11 rounded-cmt-control border border-cmt-neutral-200 text-sm font-semibold text-cmt-neutral-700"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="h-11 rounded-cmt-control bg-cmt-primary-500 text-sm font-semibold text-cmt-neutral-900"
              >
                Show {visiblePackages.length} packages
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

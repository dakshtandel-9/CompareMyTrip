"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowRight, Compass, MapPin, Mountain, MoveRight, Plane, Search } from "lucide-react";

import { buildDestinations, destinationHref, durationLabel } from "@/lib/destinations";
import { buildWeekendTrackSummaries, trackHref, weekendTreks } from "@/lib/weekendTracks";
import { bannerFor } from "@/lib/siteContent";
import { useSiteContent } from "@/lib/useSiteContent";
import { usePackagesState } from "@/lib/usePackages";
import { useDestinationCoversState } from "@/lib/useDestinationCovers";
import type { TravelPackage } from "@/lib/packageData";

/* ------------------------------------------------------------------ */
/* Destinations index. Every entry is derived from the live package     */
/* catalogue rather than a hardcoded list, so a place appears here the  */
/* moment a package is filed under it in /admin and drops off when the  */
/* last one goes. Cover artwork comes from /admin/destinations, falling  */
/* back to a package photo. Each card links into /packages with that     */
/* destination already ticked in the filter panel.                       */
/* Card follows the trending rail (design.md §15.4 D-1): photography-led */
/* with one yellow element — the "from" pill.                           */
/* ------------------------------------------------------------------ */

/* "Weekend Treks" is not a region — it swaps the grid of places for the
   three trek tracks. It rides the same control because to a reader it is
   just another way to narrow the same page. */
type Region = "All" | "India" | "International" | "Weekend Treks";

/* The tab lives in the address bar as a bare flag — /destinations?india,
   /destinations?weekend-treks — so a tab can be linked to and shared, and
   the back button walks through the tabs the way a reader expects. "All"
   is the plain /destinations, with ?all accepted for a link that says it
   out loud. Anything unrecognised falls back to All rather than an empty
   page. */
const REGION_TABS: { region: Region; slugs: string[] }[] = [
  { region: "India", slugs: ["india"] },
  { region: "International", slugs: ["international", "world"] },
  { region: "Weekend Treks", slugs: ["weekend-treks", "treks"] },
  { region: "All", slugs: ["all"] },
];

export default function DestinationsIndex(props: {
  initialPackages: TravelPackage[];
  initialCovers: Record<string, string>;
}) {
  const params = useSearchParams();
  return <DestinationsContent search={params.toString()} {...props} />;
}

const regionSlug = (region: Region) =>
  REGION_TABS.find((tab) => tab.region === region)?.slugs[0] ?? "all";

function regionFromParams(params: URLSearchParams): Region {
  const match = REGION_TABS.find((tab) => tab.slugs.some((slug) => params.has(slug)));
  return match?.region ?? "All";
}

/** Where a tab lives. All is the bare page — the tidiest URL for the view
    a visitor lands on anyway. */
export const destinationsTabHref = (region: Region) =>
  region === "All" ? "/destinations" : `/destinations?${regionSlug(region)}`;

type Sort = "packages" | "price" | "name";

const formatINR = (value: number) => `₹${value.toLocaleString("en-IN")}`;

const sortOptions: { value: Sort; label: string }[] = [
  { value: "packages", label: "Most packages" },
  { value: "price", label: "Lowest price" },
  { value: "name", label: "A–Z" },
];

export function DestinationsContent({
  initialPackages,
  initialCovers,
  search = "",
}: {
  initialPackages: TravelPackage[];
  initialCovers: Record<string, string>;
  search?: string;
}) {
  const packageState = usePackagesState();
  const coverState = useDestinationCoversState();
  const packages = packageState.loading || packageState.error
    ? initialPackages
    : packageState.packages;
  const covers = coverState.loading || coverState.error ? initialCovers : coverState.covers;
  /* Masthead copy and photography, edited in /admin/banners. */
  const banner = bannerFor(useSiteContent().banners, "destinations");
  /* Derived, not stored: the URL is the tab. A menu link or the back button
     changes the query string, useSearchParams re-renders with it, and the
     grid follows — without remounting, so the search box and the sort keep
     what the visitor put in them. */
  const router = useRouter();
  const region = regionFromParams(new URLSearchParams(search));

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("packages");

  /* replace, not push: a tab is a view of one page, and stacking every
     glance at International in the back stack would bury the page the
     visitor arrived from. */
  const chooseRegion = (next: Region) =>
    router.replace(destinationsTabHref(next), { scroll: false });

  const destinations = useMemo(() => buildDestinations(packages, covers), [covers, packages]);

  const trackCards = useMemo(() => buildWeekendTrackSummaries(packages), [packages]);
  const trekCount = useMemo(() => weekendTreks(packages).length, [packages]);

  const regionCounts = useMemo(
    () => ({
      All: destinations.length,
      India: destinations.filter((item) => item.region === "India").length,
      International: destinations.filter((item) => item.region === "International").length,
      "Weekend Treks": trekCount,
    }),
    [destinations, trekCount],
  );

  /* Search narrows the tracks too, so the box does not go dead on this tab. */
  const visibleTracks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = trackCards.filter(
      (track) => !needle || track.label.toLowerCase().includes(needle),
    );

    return [...filtered].sort((a, b) => {
      if (sort === "price") return a.fromPrice - b.fromPrice;
      if (sort === "name") return a.label.localeCompare(b.label);
      return b.count - a.count || a.label.localeCompare(b.label);
    });
  }, [query, sort, trackCards]);

  const showTracks = region === "Weekend Treks";

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = destinations.filter(
      (destination) =>
        (region === "All" || destination.region === region) &&
        (!needle || destination.name.toLowerCase().includes(needle)),
    );

    return [...filtered].sort((a, b) => {
      if (sort === "price") return a.fromPrice - b.fromPrice;
      if (sort === "name") return a.name.localeCompare(b.name);
      return b.count - a.count || a.name.localeCompare(b.name);
    });
  }, [destinations, query, region, sort]);

  const totalPackages = packages.length;
  const lowestPrice = packages.length ? Math.min(...packages.map((pkg) => pkg.price)) : 0;

  return (
    <main className="w-full bg-white font-body text-cmt-neutral-900">
      {/* Photography-led banner with a calm, shaded copy side, boxed on the
          page the way the homepage banners and the catalogue mastheads are —
          same gutter, same corners. */}
      <section className="flex w-full justify-center p-3 sm:p-4 md:p-6">
        <div className="relative isolate flex min-h-[360px] w-full max-w-[1440px] items-center overflow-hidden rounded-2xl bg-cmt-secondary-900 px-6 py-14 sm:min-h-[420px] sm:rounded-3xl sm:px-10 sm:py-20">
          <Image
            src={banner.image}
            alt=""
            fill
            sizes="(max-width: 1440px) 100vw, 1440px"
            fetchPriority="high"
            className="-z-20 object-cover object-center"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/90 via-black/65 to-black/10" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/45 via-transparent to-black/15" />

          <div className="w-full">
            <p className="text-xs font-semibold uppercase tracking-wider text-cmt-primary-400 sm:text-sm">
              {banner.eyebrow}
            </p>
            <h1 className="mt-2 max-w-[18ch] font-display text-3xl font-semibold leading-[1.15] tracking-tight text-white [text-shadow:0_3px_18px_rgba(0,0,0,0.35)] sm:text-5xl">
              {banner.title}
            </h1>
            <p className="mt-3 max-w-xl text-pretty text-sm leading-relaxed text-white/75 [text-shadow:0_2px_12px_rgba(0,0,0,0.35)] sm:text-base">
              {banner.description}
            </p>

            {destinations.length > 0 && (
              <dl className="mt-8 flex flex-wrap items-end gap-x-10 gap-y-5">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-white/55">
                    Destinations
                  </dt>
                  <dd className="mt-1 font-display text-2xl font-bold tabular-nums text-white sm:text-3xl">
                    {destinations.length}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-white/55">
                    Packages
                  </dt>
                  <dd className="mt-1 font-display text-2xl font-bold tabular-nums text-white sm:text-3xl">
                    {totalPackages}
                  </dd>
                </div>
                {lowestPrice > 0 && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-white/55">
                      Starting from
                    </dt>
                    <dd className="mt-1 font-display text-2xl font-bold tabular-nums text-white sm:text-3xl">
                      {formatINR(lowestPrice)}
                    </dd>
                  </div>
                )}
              </dl>
            )}
          </div>
        </div>
      </section>

      {/* Controls */}
      <section className="w-full px-4 py-8 sm:px-5 lg:px-6">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div
            role="group"
            aria-label="Filter destinations by region"
            className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-cmt-control border border-cmt-neutral-200 bg-cmt-neutral-50 p-1"
          >
            {(
              [
                "All",
                "India",
                "International",
                ...(trekCount > 0 ? (["Weekend Treks"] as const) : []),
              ] as Region[]
            ).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={region === value}
                onClick={() => chooseRegion(value)}
                className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-cmt-control px-3.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 sm:px-4 ${
                  region === value
                    ? "bg-white text-cmt-neutral-900 shadow-cmt-xs"
                    : "text-cmt-neutral-600 hover:text-cmt-neutral-900"
                }`}
              >
                {value === "All" ? "All" : value}
                <span className="tabular-nums text-cmt-neutral-400">{regionCounts[value]}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative block sm:w-72">
              <span className="sr-only">Search destinations</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cmt-neutral-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search destinations…"
                className="h-11 w-full rounded-cmt-control border border-cmt-neutral-200 bg-white pl-10 pr-4 text-sm outline-none transition-colors focus:border-cmt-primary-500 focus:shadow-[var(--cmt-focus-ring)]"
              />
            </label>

            <label className="flex min-w-0 items-center gap-2 text-sm">
              <span className="shrink-0 text-cmt-neutral-600">Sort</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as Sort)}
                className="h-11 min-w-0 flex-1 rounded-cmt-control border border-cmt-neutral-200 bg-white px-3 text-sm font-semibold outline-none transition-colors focus:border-cmt-primary-500 focus:shadow-[var(--cmt-focus-ring)]"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="w-full px-4 pb-14 sm:px-5 sm:pb-20 lg:px-6">
        <div className="mx-auto w-full max-w-[1440px]">
          {showTracks ? (
            visibleTracks.length > 0 ? (
              <ul className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
                {visibleTracks.map((track) => {
                  const duration =
                    track.minDays === 0
                      ? ""
                      : track.minDays === track.maxDays
                        ? `${track.minDays} ${track.minDays === 1 ? "day" : "days"}`
                        : `${track.minDays}–${track.maxDays} days`;

                  return (
                    <li key={track.id}>
                      <Link
                        href={trackHref(track.id)}
                        className="group relative flex aspect-[4/3] w-full min-[420px]:aspect-[3/5] sm:aspect-[4/5] overflow-hidden rounded-cmt-lg bg-cmt-secondary-900 shadow-cmt-sm transition-shadow hover:shadow-cmt-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
                      >
                        {track.image ? (
                          <Image
                            src={track.image}
                            alt={track.label}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <span className="absolute inset-0 grid place-items-center bg-gradient-to-br from-cmt-secondary-900 to-cmt-neutral-700">
                            <Mountain className="size-10 text-white/30" aria-hidden="true" />
                          </span>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent" />

                        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-cmt-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-cmt-neutral-900 backdrop-blur-sm">
                          <Mountain className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
                          Weekend Treks
                        </span>

                        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-4 sm:p-5">
                          <div>
                            <h2 className="font-display text-lg font-bold leading-tight text-white sm:text-xl">
                              {track.label}
                            </h2>
                            <p className="mt-0.5 text-[13px] font-medium text-white/75">
                              <span className="tabular-nums">{track.count}</span>{" "}
                              {track.count === 1 ? "trek" : "treks"}
                              {duration ? ` · ${duration}` : ""}
                            </p>
                          </div>

                          {track.styles.length > 0 && (
                            <ul className="flex flex-wrap gap-1.5">
                              {track.styles.map((style) => (
                                <li
                                  key={style}
                                  className="rounded-cmt-full bg-white/15 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm"
                                >
                                  {style}
                                </li>
                              ))}
                            </ul>
                          )}

                          <span className="inline-flex w-fit items-center gap-1.5 rounded-cmt-full bg-cmt-primary-500 py-1.5 pl-2.5 pr-3 text-[12px] font-semibold text-cmt-neutral-900 shadow-cmt-primary">
                            <Plane className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
                            <span className="tabular-nums">from {formatINR(track.fromPrice)}</span>
                          </span>
                        </div>

                        <span className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-cmt-full bg-white/15 text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
                          <MoveRight className="size-4" strokeWidth={2.5} aria-hidden="true" />
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="rounded-cmt-lg border border-cmt-neutral-200 bg-cmt-neutral-50 px-6 py-16 text-center">
                <Mountain className="mx-auto size-9 text-cmt-neutral-300" aria-hidden="true" />
                <p className="mt-4 font-display text-lg font-semibold text-cmt-neutral-900">
                  No tracks match “{query}”
                </p>
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="mt-4 inline-flex h-10 items-center gap-2 rounded-cmt-control border border-cmt-neutral-300 bg-white px-4 text-sm font-semibold text-cmt-neutral-900 transition-colors hover:border-cmt-neutral-400"
                >
                  Clear search
                </button>
              </div>
            )
          ) : visible.length > 0 ? (
            <ul className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {visible.map((destination) => {
                const duration = durationLabel(destination);
                return (
                  <li key={destination.name}>
                    <Link
                      /* The destination's own page, not the filtered
                         catalogue: it is the crawlable landing page for the
                         place, and it links on to the filter itself. */
                      href={destinationHref(destination.name)}
                      className="group relative flex aspect-[4/3] w-full min-[420px]:aspect-[3/5] sm:aspect-[4/5] overflow-hidden rounded-cmt-lg bg-cmt-secondary-900 shadow-cmt-sm transition-shadow hover:shadow-cmt-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
                    >
                      {destination.image ? (
                        <Image
                          src={destination.image}
                          alt={destination.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <span className="absolute inset-0 grid place-items-center bg-gradient-to-br from-cmt-secondary-900 to-cmt-neutral-700">
                          <Compass className="size-10 text-white/30" aria-hidden="true" />
                        </span>
                      )}

                      {/* Deeper than the trending rail's: this card stacks a
                          title, a meta line, chips and a price over the photo. */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent" />

                      <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-cmt-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-cmt-neutral-900 backdrop-blur-sm">
                        <MapPin className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
                        {destination.region}
                      </span>

                      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-4 sm:p-5">
                        <div>
                          <h2 className="font-display text-lg font-bold leading-tight text-white sm:text-xl">
                            {destination.name}
                          </h2>
                          <p className="mt-0.5 text-[13px] font-medium text-white/75">
                            <span className="tabular-nums">{destination.count}</span>{" "}
                            {destination.count === 1 ? "package" : "packages"}
                            {duration ? ` · ${duration}` : ""}
                          </p>
                        </div>

                        {destination.styles.length > 0 && (
                          <ul className="flex flex-wrap gap-1.5">
                            {destination.styles.map((style) => (
                              <li
                                key={style}
                                className="rounded-cmt-full bg-white/15 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm"
                              >
                                {style}
                              </li>
                            ))}
                          </ul>
                        )}

                        <span className="inline-flex w-fit items-center gap-1.5 rounded-cmt-full bg-cmt-primary-500 py-1.5 pl-2.5 pr-3 text-[12px] font-semibold text-cmt-neutral-900 shadow-cmt-primary">
                          <Plane className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
                          <span className="tabular-nums">from {formatINR(destination.fromPrice)}</span>
                        </span>
                      </div>

                      <span className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-cmt-full bg-white/15 text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
                        <MoveRight className="size-4" strokeWidth={2.5} aria-hidden="true" />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-cmt-lg border border-cmt-neutral-200 bg-cmt-neutral-50 px-6 py-16 text-center">
              <Compass className="mx-auto size-9 text-cmt-neutral-300" aria-hidden="true" />
              <p className="mt-4 font-display text-lg font-semibold text-cmt-neutral-900">
                {destinations.length === 0
                  ? "No destinations yet"
                  : "No destination matches that"}
              </p>
              <p className="mx-auto mt-2 max-w-[44ch] text-pretty text-sm leading-[1.6] text-cmt-neutral-600">
                {destinations.length === 0
                  ? "Destinations appear here as soon as packages are published to the catalogue."
                  : "Try a different spelling, or clear the region filter to see everywhere we cover."}
              </p>
              {destinations.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    chooseRegion("All");
                  }}
                  className="mt-6 inline-flex h-11 items-center gap-2 rounded-cmt-control border border-cmt-neutral-300 bg-white px-5 text-sm font-semibold text-cmt-neutral-900 transition-colors hover:border-cmt-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
                >
                  Show all destinations
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="w-full border-t border-cmt-neutral-100 bg-cmt-neutral-50 px-4 py-12 sm:px-5 sm:py-14 lg:px-6">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <div>
            <h2 className="font-display text-xl font-semibold leading-[1.25] tracking-tight text-cmt-neutral-900 sm:text-2xl">
              Not sure where yet?
            </h2>
            <p className="mt-2 max-w-[52ch] text-pretty text-sm leading-[1.6] text-cmt-neutral-600 sm:text-base">
              Browse the full catalogue and filter by budget, duration and travel
              style instead of by place.
            </p>
          </div>
          <Link
            href="/packages"
            className="inline-flex h-11 w-fit shrink-0 items-center gap-2 rounded-cmt-control border border-cmt-neutral-300 bg-white px-5 font-body text-sm font-semibold text-cmt-neutral-900 transition-colors duration-150 hover:border-cmt-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 sm:h-12 sm:text-base"
          >
            Browse all packages
            <ArrowRight className="size-4" strokeWidth={2.5} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}

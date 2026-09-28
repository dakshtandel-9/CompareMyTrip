"use client";

import { getPlanComparison as attributesFor, hasTravellerRating, type ComparedAttributes } from "@/lib/planComparison";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeftRight,
  ArrowRight,
  Check,
  Clock,
  Plus,
  X,
} from "lucide-react";

import ComparisonText from "@/components/ComparisonText";
import type { TravelPackage } from "@/lib/packageData";
import { usePackagesState } from "@/lib/usePackages";
import { useCompare } from "@/lib/useCompare";
import { useSiteContent } from "@/lib/useSiteContent";
import Price from "../_components/Price";
import Rating from "../_components/Rating";
import SectionHeader from "../_components/SectionHeader";

/* ------------------------------------------------------------------ */
/* Compare before you book — design.md §17.4.                           */
/*                                                                       */
/* Two halves. On top, one card per shortlisted package carrying the     */
/* things a reader decides on — image, identity, duration, price and the */
/* action. Underneath, a stripped-back matrix that holds only the        */
/* attribute values, so the table reads as data rather than as three     */
/* competing headers.                                                    */
/*                                                                       */
/* Every marker in this band is computed from the packages on screen and */
/* never sold: "Best value" is the lowest cost per night, "Lowest price" */
/* the smallest total, "Longest trip" the most days. A superlative is    */
/* only printed when one package wins it outright, at most one badge per */
/* card, and exactly one card is promoted (§17.4). Cells are highlighted */
/* only where the packages genuinely differ — everything else stays      */
/* plain, so the highlights keep their meaning.                          */
/*                                                                       */
/* The three slots are the shared comparison tray (@/lib/useCompare), so  */
/* the Compare control on any package card in the catalogue fills them    */
/* too. A slot emptied from either place stays visibly empty until        */
/* something is chosen for it.                                            */
/*                                                                       */
/* Attributes come from the saved plan details on both comparison views. */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Superlatives                                                         */
/* ------------------------------------------------------------------ */

/* A superlative is only worth printing when a single column wins it: a
   tie tells the reader nothing, so it is left off entirely. */
function strictBestIndex(values: number[], prefer: "max" | "min"): number {
  if (values.length < 2) return -1;

  const target = prefer === "max" ? Math.max(...values) : Math.min(...values);
  const first = values.indexOf(target);

  return values.lastIndexOf(target) === first ? first : -1;
}

type CardBadge = { label: string; promoted: boolean };

/* One badge per card, claimed in priority order, and each superlative
   spent only once — a package that is both the best value and the
   cheapest keeps the stronger claim and frees no badge for anyone else. */
function badgesFor(columns: TravelPackage[]) {
  const badges: (CardBadge | null)[] = columns.map(() => null);

  const claims: Array<[number, CardBadge]> = [
    [
      strictBestIndex(
        columns.map((pkg) => pkg.price / Math.max(pkg.nights, 1)),
        "min",
      ),
      { label: "Best value", promoted: true },
    ],
    [
      strictBestIndex(
        columns.map((pkg) => pkg.price),
        "min",
      ),
      { label: "Lowest price", promoted: false },
    ],
    [
      strictBestIndex(
        columns.map((pkg) => pkg.days),
        "max",
      ),
      { label: "Longest trip", promoted: false },
    ],
  ];

  for (const [index, badge] of claims) {
    if (index !== -1 && !badges[index]) badges[index] = badge;
  }

  return {
    badges,
    promotedIndex: badges.findIndex((badge) => badge?.promoted),
  };
}

/* ------------------------------------------------------------------ */
/* Table rows                                                           */
/* ------------------------------------------------------------------ */

type Row = {
  label: string;
  /** Left out of the table when this says no for the plans on screen. */
  visible?: (columns: TravelPackage[]) => boolean;
  render: (pkg: TravelPackage, attrs: ComparedAttributes) => React.ReactNode;
  /** Which column wins this row, if any one of them does outright. */
  best?: (columns: TravelPackage[]) => number;
  bestLabel?: string;
};

/* The winning cell in a row worth winning. */
function BestTag({ label }: { label: string }) {
  return (
    <span className="shrink-0 rounded-cmt-full bg-cmt-primary-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-cmt-neutral-900">
      {label}
    </span>
  );
}

/* The comparison is exactly these rows, in this order — no expander and
   nothing held back behind one. */
const ROWS: Row[] = [
  {
    label: "Trip duration",
    render: (pkg) => (
      <span className="tabular-nums">
        {pkg.nights} nights / {pkg.days} days
      </span>
    ),
    best: (columns) =>
      strictBestIndex(
        columns.map((pkg) => pkg.days),
        "max",
      ),
    bestLabel: "Longest",
  },
  {
    label: "Price per person",
    /* No struck-through original here — the saving has its own row. */
    render: (pkg) => <Price price={pkg.price} qualifier="" size="sm" />,
    best: (columns) =>
      strictBestIndex(
        columns.map((pkg) => pkg.price),
        "min",
      ),
    bestLabel: "Lowest",
  },
  {
    label: "Savings",
    /* Only a real published original price counts; imported plans have
       none, and a saving is never worked out from nothing. */
    render: (pkg) =>
      typeof pkg.originalPrice === "number" && pkg.originalPrice > pkg.price ? (
        <span className="font-semibold tabular-nums text-cmt-success-700">
          Save ₹{(pkg.originalPrice - pkg.price).toLocaleString("en-IN")}
        </span>
      ) : (
        <span className="text-cmt-neutral-500">—</span>
      ),
  },
  {
    label: "Accommodation",
    render: (pkg, attrs) => <ComparisonText key={attrs.accommodation} text={attrs.accommodation} label={`Accommodation for ${pkg.title}`} />,
    best: (columns) =>
      strictBestIndex(
        columns.map((pkg) => pkg.hotelStars),
        "max",
      ),
    bestLabel: "Top stay",
  },
  { label: "Meals", render: (pkg, attrs) => <ComparisonText key={attrs.meals} text={attrs.meals} label={`Meals for ${pkg.title}`} /> },
  { label: "Flights", render: (pkg, attrs) => <ComparisonText key={attrs.flights} text={attrs.flights} label={`Flights for ${pkg.title}`} /> },
  { label: "Transfers", render: (pkg, attrs) => <ComparisonText key={attrs.transfers} text={attrs.transfers} label={`Transfers for ${pkg.title}`} /> },
  { label: "Key inclusions", render: (pkg, attrs) => <ComparisonText key={attrs.inclusions} text={attrs.inclusions} label={`Key inclusions for ${pkg.title}`} /> },
  {
    /* The route, place to place, rather than the day-by-day. */
    label: "Itinerary",
    render: (pkg, attrs) => {
      const route = attrs.destinations.split("\n").filter(Boolean).join(" · ");
      return <ComparisonText key={route} text={route} label={`Itinerary for ${pkg.title}`} />;
    },
  },
  { label: "Cancellation", render: (pkg, attrs) => <ComparisonText key={attrs.cancellation} text={attrs.cancellation} label={`Cancellation for ${pkg.title}`} /> },
  { label: "Ideal for", render: (pkg, attrs) => <ComparisonText key={attrs.bestFor} text={attrs.bestFor} label={`Ideal for ${pkg.title}`} /> },
  {
    label: "Traveller rating",
    /* No row at all until at least one plan has real reviews. */
    visible: (columns) => columns.some(hasTravellerRating),
    render: (pkg) => hasTravellerRating(pkg)
      ? <Rating value={pkg.rating} reviews={pkg.reviews} />
      : <span className="text-cmt-neutral-500">No reviews yet</span>,
    best: (columns) => columns.filter(hasTravellerRating).length < 2
      ? -1
      : strictBestIndex(
          columns.map((pkg) => hasTravellerRating(pkg) ? pkg.rating : -1),
          "max",
        ),
    bestLabel: "Top rated",
  },
];

export default function CompareBeforeYouBook() {
  const { compare } = useSiteContent();
  const { packages, loading, error } = usePackagesState();
  const { slots, setSlot, initialiseSuggestions } = useCompare();
  const suggestionsInitialised = useRef(false);
  useEffect(() => {
    if (suggestionsInitialised.current || loading || error || !packages.length) return;
    suggestionsInitialised.current = true;
    initialiseSuggestions(packages.map((pkg) => pkg.id));
  }, [packages, loading, error, initialiseSuggestions]);
  /* Which slot's picker is open, or null when the dialog is closed. */
  const [pickerColumn, setPickerColumn] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  /* One entry per slot, null where the slot is empty or its package has
     since left the catalogue. */
  const columns = useMemo(
    () =>
      slots.map((id) =>
        id ? (packages.find((pkg) => pkg.id === id) ?? null) : null,
      ),
    [packages, slots],
  );

  /* Superlatives and the table are computed over what is actually being
     compared, so an empty slot never wins or loses anything. */
  const filled = useMemo(
    () => columns.filter((pkg): pkg is TravelPackage => Boolean(pkg)),
    [columns],
  );

  const rows = ROWS.filter((row) => !row.visible || row.visible(filled));

  const { badgeById, promotedId } = useMemo(() => {
    const { badges, promotedIndex } = badgesFor(filled);

    return {
      badgeById: new Map(filled.map((pkg, index) => [pkg.id, badges[index]])),
      promotedId:
        promotedIndex === -1 ? null : (filled[promotedIndex]?.id ?? null),
    };
  }, [filled]);

  /* Native <dialog> so modal focus trapping, Escape and the backdrop are
     the browser's job rather than ours. */
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (pickerColumn !== null && !dialog.open) dialog.showModal();
    if (pickerColumn === null && dialog.open) dialog.close();
  }, [pickerColumn]);

  const choosePackage = (columnIndex: number, packageId: string) => {
    setSlot(columnIndex, packageId);
    setPickerColumn(null);
  };

  const openPackage = pickerColumn === null ? null : columns[pickerColumn];

  /* After the hooks, never before: this component runs a dialog effect and
     three memos, and bailing out early would change the hook order. */
  if (!compare.enabled) return null;

  return (
    <section
      id="compare"
      aria-labelledby="compare-title"
      className="w-full border-t border-cmt-neutral-100 bg-cmt-neutral-50 px-3 py-12 sm:px-4 sm:py-16 md:px-6 lg:py-20"
    >
      <div className="mx-auto w-full max-w-[1440px]">
        <SectionHeader
          eyebrow={compare.header.eyebrow}
          title={<span id="compare-title">{compare.header.title}</span>}
          description={compare.header.description}
          action={
            compare.header.actionLabel && compare.header.actionHref ? (
              <Link
                href={compare.header.actionHref}
                className="group inline-flex h-11 shrink-0 items-center gap-1.5 rounded-cmt-control border border-cmt-neutral-200 bg-white px-5 text-sm font-semibold text-cmt-neutral-900 transition-[border-color,background-color] duration-200 hover:border-cmt-neutral-300 hover:bg-cmt-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
              >
                {compare.header.actionLabel}
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
              </Link>
            ) : undefined
          }
        />

        {/* The decision layer: identity, duration, price, action. */}
        <ul className="cmt-mobile-rail mt-8 grid list-none grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-3 sm:gap-4">
          {columns.map((pkg, index) => {
            if (!pkg) {
              /* An emptied slot keeps its place rather than closing the
                 gap, so the reader can see there is room for one more. */
              return (
                <li key={`empty-${index}`} className="min-w-0">
                  <article className="flex h-full min-h-64 flex-col items-center justify-center gap-2 rounded-cmt-lg border border-dashed border-cmt-neutral-300 bg-white p-6 text-center">
                    <span className="grid size-11 place-items-center rounded-cmt-full bg-cmt-neutral-50 text-cmt-neutral-500">
                      <Plus
                        className="h-5 w-5"
                        strokeWidth={2.5}
                        aria-hidden="true"
                      />
                    </span>

                    <p className="font-display text-base font-semibold text-cmt-neutral-900">
                      Slot {index + 1} is empty
                    </p>
                    <p className="max-w-56 text-xs leading-relaxed text-cmt-neutral-500">
                      Choose one of our plans here, or select Add to compare in the
                      catalogue.
                    </p>

                    <button
                      type="button"
                      onClick={() => setPickerColumn(index)}
                      className="mt-2 inline-flex h-10 items-center justify-center rounded-cmt-control border border-cmt-neutral-200 bg-white px-5 text-sm font-semibold text-cmt-neutral-900 transition-colors hover:border-cmt-neutral-300 hover:bg-cmt-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
                    >
                      Add package
                    </button>
                  </article>
                </li>
              );
            }

            const badge = badgeById.get(pkg.id) ?? null;
            const isPromoted = pkg.id === promotedId;

            return (
              <li key={`${pkg.id}-${index}`} className="min-w-0">
                <article
                  className={`flex h-full flex-col overflow-hidden rounded-cmt-lg bg-white transition-colors duration-200 ${
                    isPromoted
                      ? "border border-cmt-primary-500 ring-1 ring-inset ring-cmt-primary-500"
                      : "border border-cmt-neutral-200 hover:border-cmt-neutral-300"
                  }`}
                >
                  {/* A strip rather than a hero: enough to place the
                      destination, not enough to outweigh the numbers. */}
                  <div className="relative h-40 w-full shrink-0 overflow-hidden bg-cmt-neutral-100 sm:h-44">
                    <Image
                      src={pkg.image}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 480px"
                      className="object-cover"
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-white/35 via-transparent to-transparent"
                      aria-hidden="true"
                    />

                    {badge && (
                      <span
                        className={`absolute left-4 top-4 rounded-cmt-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
                          badge.promoted
                            ? "bg-cmt-primary-500 text-cmt-neutral-900"
                            : "border border-cmt-neutral-200 bg-white/95 text-cmt-neutral-700 backdrop-blur-sm"
                        }`}
                      >
                        {badge.label}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <p className="truncate text-xs font-medium text-cmt-neutral-500">
                      {pkg.location}
                    </p>

                    <h3 className="mt-1 line-clamp-2 font-display text-[17px] font-semibold leading-snug text-cmt-neutral-900 sm:text-lg">
                      {pkg.title}
                    </h3>

                    <p className="mt-2.5 inline-flex w-fit items-center gap-1.5 rounded-cmt-full border border-cmt-neutral-200 bg-cmt-neutral-50 px-2.5 py-1 text-xs font-semibold tabular-nums text-cmt-neutral-700">
                      <Clock
                        className="h-3.5 w-3.5"
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                      {pkg.nights} nights · {pkg.days} days
                    </p>

                    {/* Pinned to the bottom so price and CTA line up across
                        cards whose titles wrap to different depths. */}
                    <div className="mt-auto pt-5">
                      <Price
                        price={pkg.price}
                        originalPrice={pkg.originalPrice}
                        qualifier="per person"
                        size="xl"
                        showSaving
                      />

                      <Link
                        href={pkg.href ?? `/packages/${pkg.id}`}
                        className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-cmt-control bg-cmt-primary-500 px-5 text-sm font-semibold text-cmt-neutral-900 transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:bg-cmt-primary-600 hover:shadow-cmt-primary active:translate-y-0 active:bg-cmt-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
                      >
                        Select package
                      </Link>

                      {/* Swapping a column is a second thought, not a
                          competing call to action. */}
                      <button
                        type="button"
                        onClick={() => setPickerColumn(index)}
                        className="mx-auto mt-2.5 flex h-8 items-center gap-1.5 rounded-cmt-control px-2 text-xs font-semibold text-cmt-neutral-600 transition-colors hover:bg-cmt-neutral-50 hover:text-cmt-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
                      >
                        <ArrowLeftRight
                          className="h-3.5 w-3.5"
                          strokeWidth={2.5}
                          aria-hidden="true"
                        />
                        Change package
                        <span className="sr-only">
                          {" "}
                          in column {index + 1}, currently {pkg.title}
                        </span>
                      </button>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>

        {/* The evidence layer: values only, borders and tints instead of
            shadows so nothing here floats above the data. One package on its
            own is not a comparison, so the table waits for a second. */}
        {filled.length < 2 ? (
          <p className="mt-4 rounded-cmt-lg border border-dashed border-cmt-neutral-300 bg-white p-6 text-center text-sm text-cmt-neutral-600 sm:mt-5">
            Choose at least two of our travel plans to compare them side by side.
          </p>
        ) : (
          <div className="max-md:hidden relative mt-4 rounded-cmt-lg border border-cmt-neutral-200 bg-white sm:mt-5">
            {/* Scrolls sideways on small screens with the attribute column
              pinned; from lg the table fits, so the container stops being a
              scroll box and the header row can stick under the site header. */}
            <div className="overflow-x-auto rounded-cmt-lg lg:overflow-visible [scrollbar-width:thin]">
              <table className="w-full min-w-[860px] table-fixed border-separate border-spacing-0 text-left lg:min-w-0">
                <caption className="sr-only">
                  Side-by-side comparison of our shortlisted travel plans across
                  duration, price, savings, accommodation, meals, flights,
                  transfers, inclusions, itinerary, cancellation, suitability
                  and traveller rating. Each plan can be swapped from its card
                  above.
                </caption>

                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="sticky left-0 z-30 w-[140px] bg-cmt-neutral-50 p-4 align-middle text-xs font-semibold uppercase tracking-wider text-cmt-neutral-500 border-b border-cmt-neutral-200 shadow-[1px_0_0_0_var(--cmt-color-neutral-200)] sm:w-[220px] lg:top-0 rounded-tl-cmt-lg"
                    >
                      What you get
                    </th>

                    {filled.map((pkg, index) => (
                      <th
                        key={pkg.id}
                        scope="col"
                        className={`z-20 border-b border-cmt-neutral-200 p-4 align-middle lg:sticky lg:top-0 ${
                          pkg.id === promotedId
                            ? "bg-cmt-primary-50"
                            : "bg-white"
                        } ${index === filled.length - 1 ? "rounded-tr-cmt-lg" : ""}`}
                      >
                        <p className="truncate text-sm font-semibold text-cmt-neutral-900">
                          {pkg.title}
                        </p>
                        <p className="mt-0.5 truncate text-xs tabular-nums text-cmt-neutral-500">
                          ₹{pkg.price.toLocaleString("en-IN")} · {pkg.nights}N /{" "}
                          {pkg.days}D
                        </p>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row, rowIndex) => {
                    const isLast = rowIndex === rows.length - 1;
                    const bestIndex = row.best ? row.best(filled) : -1;

                    return (
                      <tr key={row.label}>
                        <th
                          scope="row"
                          className={`sticky left-0 z-10 h-14 bg-cmt-neutral-50 px-4 py-3 align-top text-sm font-semibold text-cmt-neutral-700 shadow-[1px_0_0_0_var(--cmt-color-neutral-200)] ${
                            isLast ? "rounded-bl-cmt-lg" : "border-b border-cmt-neutral-100"
                          }`}
                        >
                          {row.label}
                        </th>

                        {filled.map((pkg, index) => {
                          const isBest = index === bestIndex;

                          return (
                            <td
                              key={pkg.id}
                              className={`h-14 px-4 py-3 align-top text-sm text-cmt-neutral-700 ${
                                isBest
                                  ? "bg-cmt-primary-50"
                                  : rowIndex % 2 === 1
                                    ? "bg-cmt-neutral-50"
                                    : "bg-white"
                              } ${isLast ? (index === filled.length - 1 ? "rounded-br-cmt-lg" : "") : "border-b border-cmt-neutral-100"}`}
                            >
                              <span
                                className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${
                                  isBest
                                    ? "font-semibold text-cmt-neutral-900"
                                    : ""
                                }`}
                              >
                                {row.render(pkg, attributesFor(pkg))}
                                {isBest && row.bestLabel && (
                                  <BestTag label={row.bestLabel} />
                                )}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Link href="/compare" className="mt-4 flex min-h-14 items-center justify-between gap-4 rounded-2xl bg-cmt-secondary-900 p-4 text-white md:hidden"><span><b className="block text-sm">Compare your shortlist</b><span className="text-xs text-white/70">Prices, stays &amp; inclusions, side by side</span></span><ArrowRight className="size-5 shrink-0 text-cmt-primary-500" /></Link>
        <p className="mt-3 text-xs leading-relaxed text-cmt-neutral-500 max-md:hidden">
          Highlights are computed from the packages shown, never sponsored: best
          value is the lowest cost per night.
          <span className="lg:hidden">
            {" "}
            Swipe the table sideways to see every package.
          </span>
        </p>
      </div>

      {/* Package picker. Rendered once and pointed at whichever column asked
          for it — a popover inside the table would be clipped by the
          horizontal scroll container. */}
      <dialog
        ref={dialogRef}
        onClose={() => setPickerColumn(null)}
        onClick={(event) => {
          if (event.target === dialogRef.current) setPickerColumn(null);
        }}
        aria-labelledby="package-picker-title"
        className="m-auto w-[min(560px,calc(100vw-2rem))] rounded-cmt-md border border-cmt-neutral-200 bg-white p-0 shadow-cmt-xl backdrop:bg-cmt-neutral-900/50"
      >
        <div className="flex items-start justify-between gap-4 border-b border-cmt-neutral-100 p-5">
          <div>
            <h3
              id="package-picker-title"
              className="font-display text-lg font-semibold text-cmt-neutral-900"
            >
              Choose a package
            </h3>
            <p className="mt-1 text-sm text-cmt-neutral-600">
              {pickerColumn === null
                ? null
                : `Replaces column ${pickerColumn + 1} of the comparison.`}
            </p>
          </div>

          <button
            type="button"
            aria-label="Close package picker"
            onClick={() => setPickerColumn(null)}
            className="grid size-9 shrink-0 place-items-center rounded-cmt-control border border-cmt-neutral-200 bg-white text-cmt-neutral-700 transition-colors hover:border-cmt-neutral-300 hover:bg-cmt-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
          >
            <X className="size-4" strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>

        <ul className="max-h-[60vh] overflow-y-auto p-3">
          {packages.map((pkg) => {
            const isCurrent = openPackage?.id === pkg.id;
            const inAnotherColumn =
              !isCurrent && columns.some((column) => column?.id === pkg.id);

            return (
              <li key={pkg.id}>
                <button
                  type="button"
                  disabled={inAnotherColumn}
                  aria-current={isCurrent || undefined}
                  onClick={() =>
                    pickerColumn !== null && choosePackage(pickerColumn, pkg.id)
                  }
                  className={`flex w-full items-center gap-3 rounded-cmt-sm p-2.5 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 ${
                    isCurrent
                      ? "bg-cmt-neutral-50"
                      : inAnotherColumn
                        ? "cursor-not-allowed opacity-50"
                        : "hover:bg-cmt-neutral-50"
                  }`}
                >
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-cmt-sm bg-cmt-neutral-100">
                    <Image
                      src={pkg.image}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-cmt-neutral-900">
                      {pkg.title}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-cmt-neutral-500">
                      {pkg.location}
                      <span aria-hidden="true"> · </span>
                      <span className="tabular-nums">
                        {pkg.nights}N / {pkg.days}D
                      </span>
                    </span>
                  </span>

                  <span className="shrink-0 text-right">
                    <span className="block font-display text-sm font-bold tabular-nums text-cmt-neutral-900">
                      ₹{pkg.price.toLocaleString("en-IN")}
                    </span>

                    {isCurrent && (
                      <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-cmt-neutral-600">
                        <Check
                          className="size-3"
                          strokeWidth={3}
                          aria-hidden="true"
                        />
                        In this column
                      </span>
                    )}

                    {inAnotherColumn && (
                      <span className="mt-0.5 block text-xs text-cmt-neutral-500">
                        Already compared
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </dialog>
    </section>
  );
}

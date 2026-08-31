"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeftRight,
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  Plus,
  X,
} from "lucide-react";

import { getPackageDetails, type TravelPackage } from "@/lib/packageData";
import { usePackages } from "@/lib/usePackages";
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
/* Identity, duration, price and rating are read off the real package    */
/* records, so this band can never drift from the catalogue. Curated     */
/* attributes exist for the three default packages; any package swapped  */
/* in falls back to its own generated detail record.                     */
/* ------------------------------------------------------------------ */

type ComparedAttributes = {
  accommodation: string;
  meals: string;
  transfers: string;
  bestFor: string;
  flightsIncluded: boolean;
  freeCancellation: boolean;
};

/* Hand-written detail for the three packages the table opens on. */
const CURATED: Record<string, ComparedAttributes> = {
  "dummy-kerala-backwaters": {
    accommodation: "3★ hotels + 1 night houseboat",
    meals: "Breakfast + dinner",
    transfers: "Private cab throughout",
    bestFor: "First-timers and families",
    flightsIncluded: false,
    freeCancellation: true,
  },
  "dummy-dharamshala-break": {
    accommodation: "3★ hotels + 1 night mountain stay",
    meals: "Breakfast only",
    transfers: "Shared coach + local cabs",
    bestFor: "Slow travel and monasteries",
    flightsIncluded: false,
    freeCancellation: true,
  },
  "dummy-goa-island-cruise": {
    accommodation: "4★ beach resort",
    meals: "Breakfast + one cruise dinner",
    transfers: "Airport pickup + scooter rental",
    bestFor: "Couples and small groups",
    flightsIncluded: true,
    freeCancellation: false,
  },
};

/* Anything swapped in from the catalogue reads its own detail record,
   so the table stays truthful for packages we have not written copy for. */
function attributesFor(pkg: TravelPackage): ComparedAttributes {
  const curated = CURATED[pkg.id];
  if (curated) return curated;

  const details = getPackageDetails(pkg);

  return {
    accommodation: `${pkg.hotelStars}★ hotels`,
    meals: details.meals,
    transfers: details.transfers,
    bestFor: pkg.tags.length > 0 ? pkg.tags.join(" · ") : "All travellers",
    flightsIncluded: !/not included/i.test(details.flights),
    freeCancellation: /free cancellation/i.test(details.cancellationPolicy),
  };
}

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
  /** Shown before the reader expands the rest (§17.4 scanability). */
  primary?: boolean;
  render: (pkg: TravelPackage, attrs: ComparedAttributes) => React.ReactNode;
  /** Which column wins this row, if any one of them does outright. */
  best?: (columns: TravelPackage[]) => number;
  bestLabel?: string;
};

/* Never colour alone (§18.1): the tick and the cross always carry a
   text label, the pill only adds emphasis on top of it. */
function YesNo({
  value,
  yes,
  no,
}: {
  value: boolean;
  yes: string;
  no: string;
}) {
  if (value) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-cmt-full bg-cmt-success-100 px-2.5 py-1 text-[13px] font-semibold text-cmt-success-700">
        <Check
          className="h-3.5 w-3.5 shrink-0"
          strokeWidth={3}
          aria-hidden="true"
        />
        {yes}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-0.5 text-[13px] text-cmt-neutral-500">
      <X
        className="h-3.5 w-3.5 shrink-0 text-cmt-neutral-300"
        strokeWidth={3}
        aria-hidden="true"
      />
      {no}
    </span>
  );
}

/* The winning cell in a row worth winning. */
function BestTag({ label }: { label: string }) {
  return (
    <span className="shrink-0 rounded-cmt-full bg-cmt-primary-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-cmt-neutral-900">
      {label}
    </span>
  );
}

const ROWS: Row[] = [
  {
    label: "Duration",
    primary: true,
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
    primary: true,
    render: (pkg) => (
      <Price
        price={pkg.price}
        originalPrice={pkg.originalPrice}
        qualifier=""
        size="sm"
        showSaving
      />
    ),
    best: (columns) =>
      strictBestIndex(
        columns.map((pkg) => pkg.price),
        "min",
      ),
    bestLabel: "Lowest",
  },
  {
    label: "Accommodation",
    primary: true,
    render: (_pkg, attrs) => attrs.accommodation,
    best: (columns) =>
      strictBestIndex(
        columns.map((pkg) => pkg.hotelStars),
        "max",
      ),
    bestLabel: "Top stay",
  },
  { label: "Meals", primary: true, render: (_pkg, attrs) => attrs.meals },
  {
    label: "Flights",
    primary: true,
    render: (_pkg, attrs) => (
      <YesNo
        value={attrs.flightsIncluded}
        yes="Included"
        no="Booked separately"
      />
    ),
  },
  {
    label: "Free cancellation",
    primary: true,
    render: (_pkg, attrs) => (
      <YesNo
        value={attrs.freeCancellation}
        yes="Up to 15 days before"
        no="Not available"
      />
    ),
  },
  { label: "Transfers", render: (_pkg, attrs) => attrs.transfers },
  {
    label: "Traveller rating",
    render: (pkg) => <Rating value={pkg.rating} reviews={pkg.reviews} />,
    best: (columns) =>
      strictBestIndex(
        columns.map((pkg) => pkg.rating),
        "max",
      ),
    bestLabel: "Top rated",
  },
  { label: "Best suited for", render: (_pkg, attrs) => attrs.bestFor },
];

const PRIMARY_ROWS = ROWS.filter((row) => row.primary);
const EXTRA_ROW_COUNT = ROWS.length - PRIMARY_ROWS.length;

export default function CompareBeforeYouBook() {
  const { compare } = useSiteContent();
  const packages = usePackages();
  const { slots, setSlot } = useCompare();
  /* Which slot's picker is open, or null when the dialog is closed. */
  const [pickerColumn, setPickerColumn] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
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

  const { badgeById, promotedId } = useMemo(() => {
    const { badges, promotedIndex } = badgesFor(filled);

    return {
      badgeById: new Map(filled.map((pkg, index) => [pkg.id, badges[index]])),
      promotedId:
        promotedIndex === -1 ? null : (filled[promotedIndex]?.id ?? null),
    };
  }, [filled]);

  const visibleRows = expanded ? ROWS : PRIMARY_ROWS;

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
        <ul className="mt-8 grid list-none grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-3 sm:gap-4">
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
                      Pick a package here, or hit Compare on any package in the
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
                        className={`absolute left-4 top-4 rounded-cmt-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
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

                    <p className="mt-2.5 inline-flex w-fit items-center gap-1.5 rounded-cmt-full border border-cmt-neutral-200 bg-cmt-neutral-50 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-cmt-neutral-700">
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
            Pick at least two packages to see them side by side.
          </p>
        ) : (
          <div className="relative mt-4 rounded-cmt-lg border border-cmt-neutral-200 bg-white sm:mt-5">
            {/* Scrolls sideways on small screens with the attribute column
              pinned; from lg the table fits, so the container stops being a
              scroll box and the header row can stick under the site header. */}
            <div className="overflow-x-auto rounded-t-cmt-lg lg:overflow-visible [scrollbar-width:thin]">
              <table className="w-full min-w-[860px] table-fixed border-separate border-spacing-0 text-left lg:min-w-0">
                <caption className="sr-only">
                  Side-by-side comparison of the shortlisted packages across
                  duration, price, accommodation, meals, flights, cancellation,
                  transfers, rating and who each one suits. Each package can be
                  swapped from its card above.
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
                  {visibleRows.map((row, rowIndex) => {
                    const isLast = rowIndex === visibleRows.length - 1;
                    const bestIndex = row.best ? row.best(filled) : -1;

                    return (
                      <tr key={row.label}>
                        <th
                          scope="row"
                          className={`sticky left-0 z-10 h-16 bg-cmt-neutral-50 p-4 align-middle text-sm font-semibold text-cmt-neutral-700 shadow-[1px_0_0_0_var(--cmt-color-neutral-200)] ${
                            isLast ? "" : "border-b border-cmt-neutral-100"
                          }`}
                        >
                          {row.label}
                        </th>

                        {filled.map((pkg, index) => {
                          const isBest = index === bestIndex;

                          return (
                            <td
                              key={pkg.id}
                              className={`h-16 p-4 align-middle text-sm text-cmt-neutral-700 ${
                                isBest
                                  ? "bg-cmt-primary-50"
                                  : rowIndex % 2 === 1
                                    ? "bg-cmt-neutral-50"
                                    : "bg-white"
                              } ${isLast ? "" : "border-b border-cmt-neutral-100"}`}
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

            <div className="rounded-b-cmt-lg border-t border-cmt-neutral-200">
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setExpanded((open) => !open)}
                className="flex h-14 w-full items-center justify-center gap-1.5 rounded-b-cmt-lg text-sm font-semibold text-cmt-neutral-900 transition-colors hover:bg-cmt-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
              >
                {expanded
                  ? "Show fewer details"
                  : `View all details (${EXTRA_ROW_COUNT} more rows)`}
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
        )}

        <p className="mt-3 text-xs leading-relaxed text-cmt-neutral-500">
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
                      <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-cmt-neutral-600">
                        <Check
                          className="size-3"
                          strokeWidth={3}
                          aria-hidden="true"
                        />
                        In this column
                      </span>
                    )}

                    {inAnotherColumn && (
                      <span className="mt-0.5 block text-[11px] text-cmt-neutral-500">
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

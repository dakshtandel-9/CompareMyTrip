"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeftRight, ChevronRight, X } from "lucide-react";

import { COMPARE_STORAGE_KEY, COMPARE_UPDATE_EVENT, useCompare } from "@/lib/useCompare";
import { usePackages } from "@/lib/usePackages";

/* ------------------------------------------------------------------ */
/* The standing way into /compare.                                      */
/*                                                                       */
/* A bar pinned along the bottom of the catalogue rather than a disc in  */
/* the corner: the shortlist is a list, and a list reads better laid out */
/* left to right than piled on top of itself. It spans the full width    */
/* with a small gutter either side so it reads as a card resting on the  */
/* page, not as a second footer welded to the edges.                     */
/*                                                                       */
/* Where it sits, and which page it appears on, belong to                */
/* @/components/FloatingActions.                                         */
/*                                                                       */
/* Its right-hand side is the shared tray (@/lib/useCompare) written     */
/* out: for each filled slot a boxed thumbnail and the package's price,  */
/* slashes fencing one off from the next, so what has been shortlisted   */
/* and what it costs both read at a glance without opening the           */
/* comparison. Each one carries its own dismiss, because the tray only   */
/* holds three and dropping one here — next to the grid the replacement  */
/* is picked from — beats opening the comparison to make room.           */
/*                                                                       */
/* Which is why the bar is a row of controls rather than one big link:   */
/* a button cannot live inside an anchor. The two links either end both  */
/* go to /compare, and the whole bar lights up when any part is hovered. */
/*                                                                       */
/* It does not sit open across the bottom of the catalogue all the time.  */
/* Its resting state is the square in the corner, and it opens for five   */
/* seconds whenever the tray changes — which is exactly when there is     */
/* something new to see in it. Picking a fourth package, or dropping one, */
/* starts the five seconds again, and a pointer resting on the bar or a   */
/* keyboard focus inside it holds it open for as long as it stays: the    */
/* bar must never fold away under the cursor mid-read.                    */
/* ------------------------------------------------------------------ */

/* Room for three, since the tray holds three. */
const THUMBNAILS = 3;

/* How long the bar stays open after a change, and after a pointer that
   was resting on it leaves. */
const REVEAL_MS = 5000;

const formatINR = (value: number) => `₹${value.toLocaleString("en-IN")}`;

/* The fence between one package and the next, and at either end of the
   run. Thin and grey so it separates without competing with the prices. */
function Slash() {
  return (
    <span
      className="select-none text-sm font-light text-cmt-neutral-300"
      aria-hidden="true"
    >
      /
    </span>
  );
}

export default function CompareBar() {
  const { slots, count, toggle } = useCompare();
  const packages = usePackages();

  /* Empty slots, and slots holding a package that has since left the
     catalogue, simply show nothing. */
  const shortlist = slots
    .map((id) => (id ? packages.find((pkg) => pkg.id === id) : undefined))
    .filter((pkg) => pkg !== undefined)
    .slice(0, THUMBNAILS);

  /* Closed is the resting state, and it is what the server renders, so the
     first paint and the hydrated one agree. */
  const [expanded, setExpanded] = useState(false);
  const collapseTimer = useRef<number | undefined>(undefined);

  /* Two separate holds because they end independently: a mouse can leave
     while the keyboard focus it left behind is still inside the bar. */
  const pointerResting = useRef(false);
  const focusInside = useRef(false);

  const cancelCollapse = useCallback(() => {
    if (collapseTimer.current === undefined) return;
    window.clearTimeout(collapseTimer.current);
    collapseTimer.current = undefined;
  }, []);

  const scheduleCollapse = useCallback(() => {
    cancelCollapse();
    /* Someone is on it. Closing is left to whichever hold ends last. */
    if (pointerResting.current || focusInside.current) return;
    collapseTimer.current = window.setTimeout(() => setExpanded(false), REVEAL_MS);
  }, [cancelCollapse]);

  /* Open it, and start the five seconds over. Every path in — a change to
     the tray, a tap, the corner button — comes through here. */
  const reveal = useCallback(() => {
    setExpanded(true);
    scheduleCollapse();
  }, [scheduleCollapse]);

  /* The tray writes to localStorage and announces it, so this fires for a
     pick made anywhere: a card in the grid, the dismiss inside this bar, or
     the comparison's own column picker. The storage event covers a second
     tab doing the same thing. */
  useEffect(() => {
    const onChange = () => reveal();
    const onStorage = (event: StorageEvent) => {
      if (event.key === COMPARE_STORAGE_KEY) reveal();
    };

    window.addEventListener(COMPARE_UPDATE_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(COMPARE_UPDATE_EVENT, onChange);
      window.removeEventListener("storage", onStorage);
      cancelCollapse();
    };
  }, [reveal, cancelCollapse]);

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={reveal}
        aria-expanded={false}
        aria-label={
          count > 0
            ? `Open the comparison shortlist, ${count} of ${THUMBNAILS} shortlisted`
            : "Open the comparison shortlist"
        }
        className="pointer-events-auto relative grid size-14 shrink-0 place-items-center rounded-cmt-md border border-cmt-neutral-200 bg-white/95 text-cmt-neutral-900 shadow-cmt-lg backdrop-blur transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-cmt-primary-500 hover:shadow-cmt-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
      >
        <ArrowLeftRight className="size-5" strokeWidth={2.5} aria-hidden="true" />
        {/* What is waiting inside, so the square is not a mystery. */}
        {count > 0 && (
          <span
            className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-cmt-full bg-cmt-primary-500 font-display text-[11px] font-bold text-cmt-neutral-900 shadow-cmt-xs"
            aria-hidden="true"
          >
            {count}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      /* A mouse resting on the bar holds it open and the countdown restarts
         when it leaves. Touch has no lingering hover to end, so a tap just
         starts the five seconds again. */
      onPointerEnter={(event) => {
        if (event.pointerType !== "mouse") return;
        pointerResting.current = true;
        cancelCollapse();
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== "mouse") return;
        pointerResting.current = false;
        scheduleCollapse();
      }}
      onPointerDown={(event) => {
        if (event.pointerType !== "mouse") reveal();
      }}
      onFocusCapture={() => {
        focusInside.current = true;
        cancelCollapse();
      }}
      onBlurCapture={(event) => {
        /* Moving between the bar's own controls is not leaving it. */
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        focusInside.current = false;
        scheduleCollapse();
      }}
      className="animate-cmt-rise pointer-events-auto group flex w-full items-center gap-3 rounded-cmt-md border border-cmt-neutral-200 bg-white/95 px-3 py-2.5 shadow-cmt-lg backdrop-blur transition-[border-color,box-shadow] duration-200 hover:border-cmt-primary-500 hover:shadow-cmt-xl sm:gap-4 sm:px-4 sm:py-3">
      <Link
        href="/compare"
        className="flex min-w-0 flex-1 items-center gap-3 rounded-cmt-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cmt-primary-500 sm:gap-4"
      >
        <span
          className="grid size-10 shrink-0 place-items-center rounded-cmt-full bg-cmt-primary-500 text-cmt-neutral-900 shadow-cmt-primary sm:size-11"
          aria-hidden="true"
        >
          <ArrowLeftRight className="size-5" strokeWidth={2.5} />
        </span>

        <span className="min-w-0">
          <span className="block truncate font-display text-sm font-semibold text-cmt-neutral-900 sm:text-base">
            Compare packages
          </span>
          <span className="mt-0.5 block truncate text-xs text-cmt-neutral-500">
            {shortlist.length > 0
              ? `${shortlist.length} of ${THUMBNAILS} shortlisted — see them side by side`
              : "Shortlist up to three and see them side by side"}
          </span>
        </span>
      </Link>

      {shortlist.length > 0 && (
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <Slash />
          {shortlist.map((pkg) => (
            <div key={pkg.id} className="flex items-center gap-2">
              <span className="relative block size-9 overflow-hidden rounded-cmt-sm bg-cmt-neutral-100">
                <Image
                  src={pkg.image}
                  alt=""
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </span>
              <span className="font-display text-sm font-semibold text-cmt-neutral-900">
                {formatINR(pkg.price)}
              </span>
              {/* Removing frees the slot rather than shuffling the rest
                  along, so the next pick from the grid lands where this
                  package was. */}
              <button
                type="button"
                onClick={() => toggle(pkg.id)}
                aria-label={`Remove ${pkg.title} from the comparison`}
                title={`Remove ${pkg.title}`}
                className="grid size-6 shrink-0 place-items-center rounded-cmt-full text-cmt-neutral-400 transition-colors duration-150 hover:bg-cmt-coral-100 hover:text-cmt-coral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
              >
                <X className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
              </button>
              <Slash />
            </div>
          ))}
        </div>
      )}

      <Link
        href="/compare"
        aria-label="Open the comparison"
        className="grid size-8 shrink-0 place-items-center rounded-cmt-full bg-cmt-neutral-100 text-cmt-neutral-700 transition-[background-color,transform] duration-200 group-hover:translate-x-0.5 group-hover:bg-cmt-primary-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
      >
        <ChevronRight className="size-4" strokeWidth={2.5} aria-hidden="true" />
      </Link>
    </div>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeftRight, ChevronRight, X } from "lucide-react";

import { useCompare } from "@/lib/useCompare";
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
/* ------------------------------------------------------------------ */

/* Room for three, since the tray holds three. */
const THUMBNAILS = 3;

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
  const { slots, toggle } = useCompare();
  const packages = usePackages();

  /* Empty slots, and slots holding a package that has since left the
     catalogue, simply show nothing. */
  const shortlist = slots
    .map((id) => (id ? packages.find((pkg) => pkg.id === id) : undefined))
    .filter((pkg) => pkg !== undefined)
    .slice(0, THUMBNAILS);

  return (
    <div className="group flex items-center gap-3 rounded-cmt-md border border-cmt-neutral-200 bg-white/95 px-3 py-2.5 shadow-cmt-lg backdrop-blur transition-[border-color,box-shadow] duration-200 hover:border-cmt-primary-500 hover:shadow-cmt-xl sm:gap-4 sm:px-4 sm:py-3">
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

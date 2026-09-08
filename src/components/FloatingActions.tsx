"use client";

import { usePathname } from "next/navigation";

import CompareBar from "@/components/CompareBar";

/* ------------------------------------------------------------------ */
/* The bottom bar.                                                      */
/*                                                                       */
/* Mounted once in the root layout, so it rides along rather than being   */
/* wired into a page, but it shows itself only where a shortlist is being */
/* built: the catalogue, where packages are picked out of the grid, and a */
/* package's own page, which carries a Compare button of its own and is   */
/* where a fourth pick is most likely to be made. Every other page — the  */
/* homepage, the destination lists — keeps its full height.               */
/*                                                                       */
/* Pinned across the bottom with a gutter either side so it reads as a    */
/* card resting on the page. z-40 keeps it under the header's             */
/* full-screen mobile menu (z-[100]) and under the admin shell's drawer   */
/* (z-50), so an open overlay covers it instead of being punched through. */
/* ------------------------------------------------------------------ */

/* The catalogue and every package page under it. Filters and searches ride
   in the query string, which leaves the path alone. */
const CATALOGUE_ROUTE = "/packages";

const buildsAShortlist = (pathname: string) =>
  pathname === CATALOGUE_ROUTE || pathname.startsWith(`${CATALOGUE_ROUTE}/`);

export default function FloatingActions() {
  const pathname = usePathname();

  if (!buildsAShortlist(pathname)) return null;

  return (
    /* The strip itself takes no clicks — only the bar inside it does, which
       is why the pointer-events are re-enabled on the bar rather than here —
       so the page underneath stays reachable either side of it, and beside
       the small square it folds down to.

       Justified to the end because that square rests in the right-hand
       corner; the open bar sets its own full width and so ignores it. */
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2 sm:px-4">
      <div className="flex justify-end">
        <CompareBar />
      </div>
    </div>
  );
}

"use client";

import { usePathname } from "next/navigation";

import CompareBar from "@/components/CompareBar";

/* ------------------------------------------------------------------ */
/* The bottom bar.                                                      */
/*                                                                       */
/* Mounted once in the root layout, so it rides along rather than being   */
/* wired into a page, but it shows itself on the catalogue alone: the     */
/* shortlist is built by picking cards out of /packages, and a way into   */
/* the comparison is only worth the bottom of the screen where there are  */
/* packages to pick. Every other page — the homepage, a package's own     */
/* page, the destination lists — keeps its full height.                   */
/*                                                                       */
/* Pinned across the bottom with a gutter either side so it reads as a    */
/* card resting on the page. z-40 keeps it under the header's             */
/* full-screen mobile menu (z-[100]) and under the admin shell's drawer   */
/* (z-50), so an open overlay covers it instead of being punched through. */
/* ------------------------------------------------------------------ */

/* The catalogue itself, not a package's own page underneath it. Filters
   and searches ride in the query string, which leaves the path alone. */
const CATALOGUE_ROUTE = "/packages";

export default function FloatingActions() {
  const pathname = usePathname();

  if (pathname !== CATALOGUE_ROUTE) return null;

  return (
    /* The strip itself takes no clicks — only the bar inside it does — so
       the page underneath stays reachable either side of it. */
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2 sm:px-4">
      <div className="pointer-events-auto">
        <CompareBar />
      </div>
    </div>
  );
}

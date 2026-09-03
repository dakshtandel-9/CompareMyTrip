"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeftRight } from "lucide-react";

import { useCompare } from "@/lib/useCompare";
import { usePackages } from "@/lib/usePackages";

/* ------------------------------------------------------------------ */
/* The standing way into /compare.                                      */
/*                                                                       */
/* The corner stack's one button (@/components/FloatingActions), which    */
/* owns where the stack sits and which routes it stays off.              */
/*                                                                       */
/* A round button with the shortlist stacked above it: one small disc    */
/* per filled slot of the shared tray (@/lib/useCompare), leaning on     */
/* each other like a short pile of paper so the count reads at a glance  */
/* without a number on it. Hover — or focus the button from the keyboard */
/* — and the pile opens like a flower, each disc swinging out along the  */
/* quarter turn between straight up and the button's left, one after the */
/* next. The discs sit inside the link, so they belong to its hover and  */
/* its hit area rather than fighting them.                              */
/*                                                                       */
/* Everything fans up and to the left: the button lives in the corner,   */
/* and a petal thrown right or down would leave the viewport. Up is also */
/* the only free side now that WhatsApp sits underneath.                 */
/* ------------------------------------------------------------------ */

/* Closed, the pile; open, the flower. Positions are measured from the
   resting anchor just above the button, and the delays let the discs
   leave one at a time rather than as a single block. */
const PETALS = [
  {
    closed: "[transform:translate(0px,0px)_rotate(0deg)]",
    open: "group-hover:[transform:translate(0px,-18px)_rotate(-3deg)] group-focus-visible:[transform:translate(0px,-18px)_rotate(-3deg)]",
    depth: "z-30 [transition-delay:0ms]",
  },
  {
    closed: "[transform:translate(0px,-5px)_rotate(-5deg)]",
    open: "group-hover:[transform:translate(-41px,-3px)_rotate(-14deg)] group-focus-visible:[transform:translate(-41px,-3px)_rotate(-14deg)]",
    depth: "z-20 [transition-delay:60ms]",
  },
  {
    closed: "[transform:translate(0px,-10px)_rotate(4deg)]",
    open: "group-hover:[transform:translate(-63px,35px)_rotate(-24deg)] group-focus-visible:[transform:translate(-63px,35px)_rotate(-24deg)]",
    depth: "z-10 [transition-delay:120ms]",
  },
];

export default function CompareFloatingButton() {
  const { slots } = useCompare();
  const packages = usePackages();

  /* Empty slots, and slots holding a package that has since left the
     catalogue, simply grow no petal. */
  const shortlist = slots
    .map((id) => (id ? packages.find((pkg) => pkg.id === id) : undefined))
    .filter((pkg) => pkg !== undefined)
    .slice(0, PETALS.length);

  return (
    <Link
      href="/compare"
      aria-label={
        shortlist.length > 0
          ? `Compare packages — ${shortlist.length} shortlisted`
          : "Compare packages"
      }
      className="group relative grid size-14 place-items-center rounded-cmt-full bg-cmt-primary-500 text-cmt-neutral-900 shadow-cmt-primary transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:bg-cmt-primary-600 hover:shadow-cmt-lg active:translate-y-0 active:bg-cmt-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
    >
      <ArrowLeftRight className="size-6" strokeWidth={2.5} aria-hidden="true" />

      {/* Anchored above the button, and never a click target of its own:
          the whole thing is one link. */}
      <span
        className="pointer-events-none absolute bottom-full left-1/2 mb-2.5 block size-10 -translate-x-1/2"
        aria-hidden="true"
      >
        {shortlist.map((pkg, index) => (
          <span
            key={pkg.id}
            className={`absolute inset-0 block overflow-hidden rounded-cmt-full border-2 border-white bg-cmt-neutral-100 shadow-cmt-md transition-transform duration-300 ease-out motion-reduce:transition-none ${PETALS[index].depth} ${PETALS[index].closed} ${PETALS[index].open}`}
          >
            <Image
              src={pkg.image}
              alt=""
              fill
              sizes="40px"
              className="object-cover"
            />
          </span>
        ))}
      </span>
    </Link>
  );
}

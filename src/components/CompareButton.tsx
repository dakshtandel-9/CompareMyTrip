"use client";

import { Check, GitCompareArrows } from "lucide-react";
import { useCompare } from "@/lib/useCompare";

/* ------------------------------------------------------------------ */
/* Puts a package into the comparison tray, or takes it back out.       */
/*                                                                      */
/* The tray itself lives in useCompare and is shared by every page, so   */
/* all this owns is the button: the two states it can be in, and the     */
/* wording for each. Written once because the same control now appears   */
/* on the catalogue cards, in the booking box, in the header of a        */
/* package page and on the hand-built Kerala page — and a compare        */
/* button that behaves differently in one of those places is a bug       */
/* nobody would think to look for.                                       */
/* ------------------------------------------------------------------ */

type Props = {
  packageId: string;
  /** Size and layout. The colours belong to the state, so they are not
      passed in — only where the button sits and how big it is. */
  className?: string;
  /** Wording for the two states. The short pair suits a tight row. */
  labels?: { added: string; idle: string };
};

export default function CompareButton({
  packageId,
  className = "h-11 px-4",
  labels = { added: "Added to compare", idle: "Add to compare" },
}: Props) {
  const { toggle, isCompared } = useCompare();
  const compared = isCompared(packageId);

  return (
    <button
      type="button"
      onClick={() => toggle(packageId)}
      aria-pressed={compared}
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-cmt-control border text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 ${
        compared
          ? "border-cmt-neutral-900 bg-cmt-neutral-900 text-white"
          : "border-cmt-neutral-300 bg-white text-cmt-neutral-900 hover:border-cmt-neutral-400"
      } ${className}`}
    >
      {compared ? (
        <Check className="size-4 shrink-0" aria-hidden="true" />
      ) : (
        <GitCompareArrows className="size-4 shrink-0" aria-hidden="true" />
      )}
      {compared ? labels.added : labels.idle}
    </button>
  );
}

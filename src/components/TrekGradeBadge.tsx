"use client";

import { useSiteContent } from "@/lib/useSiteContent";
import type { TravelPackage } from "@/lib/packageData";
import { TREK_GRADE_LABELS, trekGrade } from "@/lib/weekendTracks";

/* ------------------------------------------------------------------ */
/* Difficulty badge for a package card.                                 */
/*                                                                      */
/* Renders nothing unless the package is a weekend trek, so it can sit   */
/* unconditionally in the badge slot of any card. Own client component   */
/* rather than a prop on the card: the grade comes from the live site     */
/* content, and the cards themselves stay server-rendered.               */
/*                                                                      */
/* Three bars plus the word, matching the weekend-treks section — never   */
/* colour or shape alone (design.md §17.5).                              */
/* ------------------------------------------------------------------ */

export default function TrekGradeBadge({
  pkg,
  className = "",
}: {
  pkg: TravelPackage;
  className?: string;
}) {
  const { weekendTreks } = useSiteContent();
  const grade = trekGrade(pkg, weekendTreks.items);
  if (!grade) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-cmt-full bg-white/95 px-2.5 py-1 shadow-cmt-xs backdrop-blur-sm ${className}`}
    >
      <span className="flex items-end gap-0.5" aria-hidden="true">
        {[1, 2, 3].map((step) => (
          <span
            key={step}
            className={`w-1 rounded-cmt-full ${
              step === 1 ? "h-2" : step === 2 ? "h-3" : "h-4"
            } ${step <= grade ? "bg-cmt-neutral-900" : "bg-cmt-neutral-200"}`}
          />
        ))}
      </span>
      <span className="text-xs font-semibold text-cmt-neutral-700">
        {TREK_GRADE_LABELS[grade]}
      </span>
    </span>
  );
}

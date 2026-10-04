"use client";

import { useSiteContent } from "@/lib/useSiteContent";
import { TREK_GRADE_LABELS, trekGrade, type TrekGradeSource } from "@/lib/weekendTracks";

/* ------------------------------------------------------------------ */
/* Difficulty badge for a package card.                                 */
/*                                                                      */
/* Uses the package's saved difficulty. Older weekend-trek packages fall */
/* back to the site catalogue; an explicit 0 hides the badge.             */
/*                                                                      */
/* Three bars plus the word, matching the weekend-treks section — never   */
/* colour or shape alone (design.md §17.5).                              */
/*                                                                      */
/* Takes only the fields the grade reads: rendered from a server page,  */
/* everything passed here is sent to the browser for every card.        */
/* ------------------------------------------------------------------ */

export default function TrekGradeBadge({
  pkg,
  className = "",
}: {
  pkg: TrekGradeSource;
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

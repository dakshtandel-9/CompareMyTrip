import Link from "next/link";
import { ArrowRight } from "lucide-react";

/* ------------------------------------------------------------------ */
/* One section header for the whole /home stack, so every band opens    */
/* with the same eyebrow → H2 → sub-line rhythm the existing homepage   */
/* sections already use (design.md §7 type scale, §10 spacing).         */
/* ------------------------------------------------------------------ */

type SectionHeaderProps = {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  /** Right-aligned "View all →" text button (design.md §15.4 D-1). */
  actionLabel?: string;
  actionHref?: string;
  /** Takes the right-hand slot instead of the text button — rail arrows, etc. */
  action?: React.ReactNode;
  /** Inverts the palette for headers sitting on a dark surface. */
  tone?: "light" | "dark";
  className?: string;
};

export default function SectionHeader({
  eyebrow,
  title,
  description,
  actionLabel,
  actionHref,
  action,
  tone = "light",
  className = "",
}: SectionHeaderProps) {
  const isDark = tone === "dark";

  return (
    <div className={`cmt-section-heading flex flex-wrap items-end justify-between gap-x-6 gap-y-4 ${className}`}>
      <div className="min-w-0">
        <p
          className={`text-xs font-semibold uppercase tracking-wider sm:text-sm ${
            isDark ? "text-cmt-primary-400" : "text-cmt-primary-700"
          }`}
        >
          {eyebrow}
        </p>

        <h2
          className={`mt-2 text-balance font-display text-3xl font-semibold leading-[1.15] tracking-tight sm:text-5xl ${
            isDark ? "text-white" : "text-cmt-neutral-900"
          }`}
        >
          {title}
        </h2>

        {description && (
          <p
            className={`mt-3 max-w-2xl text-pretty text-sm leading-relaxed sm:text-base ${
              isDark ? "text-cmt-neutral-300" : "text-cmt-neutral-600"
            }`}
          >
            {description}
          </p>
        )}
      </div>

      {action}

      {!action && actionLabel && actionHref && (
        <Link
          href={actionHref}
          className={`group inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-cmt-control text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 sm:min-h-0 ${
            isDark
              ? "text-white hover:text-cmt-primary-400"
              : "text-cmt-neutral-900 hover:text-cmt-primary-900"
          }`}
        >
          {actionLabel}
          <ArrowRight
            className="h-4 w-4 transition-transform group-hover:translate-x-1"
            strokeWidth={2.5}
            aria-hidden="true"
          />
        </Link>
      )}
    </div>
  );
}

import type { LucideIcon } from "lucide-react";

/* ------------------------------------------------------------------ */
/* The circular arrow that drives a horizontal card rail from its        */
/* section header. Shared by every rail on /home so the two arrows read   */
/* the same wherever they appear, and so the disabled edge state (rail    */
/* already at its start or end) always looks the same too.                */
/* ------------------------------------------------------------------ */

export default function RailButton({
  label,
  icon: Icon,
  disabled,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-11 place-items-center rounded-cmt-full border bg-white transition-[background-color,border-color,color,opacity] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 enabled:border-cmt-primary-400 enabled:text-cmt-neutral-900 enabled:hover:border-cmt-primary-500 enabled:hover:bg-cmt-primary-50 disabled:cursor-not-allowed disabled:border-cmt-neutral-200 disabled:text-cmt-neutral-300"
    >
      <Icon className="size-[18px]" strokeWidth={2.5} aria-hidden="true" />
    </button>
  );
}

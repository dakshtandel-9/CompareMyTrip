import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline";
  /** Trailing icon — the default per the design system's "forward motion" rule (e.g. Log In →). */
  icon?: ReactNode;
  /** Leading icon — only for category/brand markers, e.g. the Google glyph on "Continue with Google". */
  leadingIcon?: ReactNode;
  /** Keeps the button's size, swaps the label for a spinner, and sets aria-busy (design.md §8.8). */
  isLoading?: boolean;
};

export default function Button({
  variant = "primary",
  icon,
  leadingIcon,
  isLoading,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-cmt-control px-8 text-[16px] font-semibold tracking-[0.005em] transition-all duration-200 outline-none disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-cmt-primary-500 text-cmt-neutral-900 shadow-cmt-xs hover:bg-cmt-primary-600 hover:shadow-cmt-primary hover:-translate-y-px active:bg-cmt-primary-700 active:translate-y-0 focus-visible:shadow-[var(--cmt-focus-ring)] disabled:bg-cmt-neutral-100 disabled:text-cmt-neutral-300 disabled:shadow-none",
    outline:
      "border border-cmt-neutral-200 bg-cmt-white text-cmt-neutral-900 hover:border-cmt-neutral-300 hover:shadow-cmt-sm active:bg-cmt-neutral-50 focus-visible:border-2 focus-visible:border-cmt-primary-500 focus-visible:shadow-[var(--cmt-focus-ring)] disabled:border-cmt-neutral-100 disabled:text-cmt-neutral-300",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className ?? ""}`}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? (
        <Loader2 size={20} strokeWidth={2} className="animate-spin" aria-hidden="true" />
      ) : (
        <>
          {leadingIcon}
          {children}
          {icon}
        </>
      )}
    </button>
  );
}

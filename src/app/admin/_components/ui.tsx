"use client";

/* Form furniture shared by every CRM screen, so a field looks the same
   whether it is editing hero copy or a category card. */

import type { ReactNode } from "react";

export const inputClass =
  "h-11 w-full rounded-cmt-control border border-cmt-neutral-200 bg-white px-3.5 text-sm text-cmt-neutral-900 outline-none transition-colors placeholder:text-cmt-neutral-400 focus:border-cmt-primary-500 focus:shadow-[var(--cmt-focus-ring)]";

export const textareaClass =
  "min-h-24 w-full resize-y rounded-cmt-control border border-cmt-neutral-200 bg-white px-3.5 py-2.5 text-sm leading-6 text-cmt-neutral-900 outline-none transition-colors placeholder:text-cmt-neutral-400 focus:border-cmt-primary-500 focus:shadow-[var(--cmt-focus-ring)]";

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-cmt-neutral-500">
      {children}
    </span>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <FieldLabel>{label}</FieldLabel>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
      {hint && <span className="mt-1 block text-[11px] text-cmt-neutral-500">{hint}</span>}
    </label>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  hint,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <FieldLabel>{label}</FieldLabel>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={textareaClass}
      />
      {hint && <span className="mt-1 block text-[11px] text-cmt-neutral-500">{hint}</span>}
    </label>
  );
}

export function Card({
  title,
  description,
  icon,
  action,
  children,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-cmt-md border border-cmt-neutral-200 bg-white shadow-cmt-sm">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-cmt-neutral-100 px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {icon && (
            <span className="grid size-10 shrink-0 place-items-center rounded-cmt-control bg-cmt-primary-50 text-cmt-primary-900">
              {icon}
            </span>
          )}
          <div className="min-w-0">
            <h2 className="font-display text-base font-semibold text-cmt-neutral-900">{title}</h2>
            {description && (
              <p className="mt-0.5 text-xs leading-5 text-cmt-neutral-500">{description}</p>
            )}
          </div>
        </div>
        {action}
      </header>
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}

/** Row-level switch. Reads as a control, not a checkbox, because these turn
    whole blocks of the live homepage on and off. */
export function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-cmt-control border border-cmt-neutral-200 bg-cmt-neutral-50 px-4 py-3">
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-cmt-neutral-900">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-cmt-neutral-500">{description}</span>
        )}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-cmt-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 ${
          checked ? "bg-cmt-primary-500" : "bg-cmt-neutral-300"
        }`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-cmt-full bg-white shadow-cmt-xs transition-[left] ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </label>
  );
}

export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "ghost" | "danger";
  disabled?: boolean;
  className?: string;
}) {
  const styles = {
    primary:
      "bg-cmt-primary-500 text-cmt-neutral-900 shadow-cmt-primary hover:bg-cmt-primary-600 disabled:bg-cmt-neutral-200 disabled:text-cmt-neutral-400 disabled:shadow-none",
    ghost:
      "border border-cmt-neutral-200 bg-white text-cmt-neutral-700 hover:border-cmt-neutral-300 hover:bg-cmt-neutral-50",
    danger:
      "border border-cmt-neutral-200 bg-white text-red-600 hover:border-red-200 hover:bg-red-50",
  }[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-cmt-control px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 disabled:cursor-not-allowed ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

/** Radio group rendered as segmented pills — used where the choice changes
    what the fields below mean (auto vs. hand-picked packages). */
export function SegmentedControl<Value extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: Value;
  options: { value: Value; label: string }[];
  onChange: (next: Value) => void;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div
        role="radiogroup"
        aria-label={label}
        className="inline-flex rounded-cmt-control border border-cmt-neutral-200 bg-cmt-neutral-100 p-1"
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            onClick={() => onChange(option.value)}
            className={`rounded-[calc(var(--cmt-radius-control)-2px)] px-4 py-1.5 text-sm font-semibold transition-colors ${
              value === option.value
                ? "bg-white text-cmt-neutral-900 shadow-cmt-xs"
                : "text-cmt-neutral-500 hover:text-cmt-neutral-700"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

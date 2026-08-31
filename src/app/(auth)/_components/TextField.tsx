"use client";

import { useId, useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: ReactNode;
  error?: string;
  isPassword?: boolean;
};

export default function TextField({
  label,
  icon,
  error,
  isPassword,
  type,
  className,
  ...props
}: TextFieldProps) {
  const id = useId();
  const [revealed, setRevealed] = useState(false);
  const resolvedType = isPassword ? (revealed ? "text" : "password") : type;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[14px] font-semibold text-cmt-neutral-700">
        {label}
      </label>

      <div className="relative">
        {icon ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cmt-neutral-500"
          >
            {icon}
          </span>
        ) : null}

        <input
          id={id}
          type={resolvedType}
          className={`h-12 w-full rounded-cmt-control border bg-cmt-white px-4 text-[16px] text-cmt-neutral-900 placeholder:text-cmt-neutral-400 transition-colors duration-200 outline-none ${
            icon ? "pl-11" : ""
          } ${isPassword ? "pr-11" : ""} ${
            error
              ? "border-2 border-cmt-error-500"
              : "border-cmt-neutral-200 hover:border-cmt-neutral-300 focus:border-2 focus:border-cmt-primary-500 focus:shadow-[var(--cmt-focus-ring)]"
          } ${className ?? ""}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />

        {isPassword ? (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? "Hide password" : "Show password"}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-cmt-neutral-500 hover:text-cmt-neutral-700"
          >
            {revealed ? <EyeOff size={20} strokeWidth={2} /> : <Eye size={20} strokeWidth={2} />}
          </button>
        ) : null}
      </div>

      {error ? (
        <p id={`${id}-error`} className="text-xs text-cmt-error-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

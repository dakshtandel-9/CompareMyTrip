"use client";

import { useId } from "react";
import type { ReactNode } from "react";
import { Check } from "lucide-react";

export default function Checkbox({
  checked,
  onChange,
  children,
  required,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  required?: boolean;
}) {
  const id = useId();

  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
      <span className="relative mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          required={required}
          onChange={(e) => onChange(e.target.checked)}
          className="peer absolute h-5 w-5 cursor-pointer appearance-none rounded-[4px] border-2 border-cmt-neutral-300 bg-cmt-white transition-colors checked:border-cmt-primary-500 checked:bg-cmt-primary-500 focus-visible:shadow-[var(--cmt-focus-ring)] outline-none"
        />
        <Check
          size={12}
          strokeWidth={3}
          aria-hidden="true"
          className="pointer-events-none relative hidden text-cmt-neutral-900 peer-checked:block"
        />
      </span>
      <span className="text-[14px] leading-[1.5] text-cmt-neutral-700">{children}</span>
    </label>
  );
}

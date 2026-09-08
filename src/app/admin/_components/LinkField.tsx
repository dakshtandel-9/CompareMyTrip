"use client";

import { useMemo } from "react";

import { destinationHref } from "@/lib/destinations";
import { usePackages } from "@/lib/usePackages";
import { FieldLabel, inputClass } from "./ui";

/* ------------------------------------------------------------------ */
/* Where a panel or card goes when it is clicked.                       */
/*                                                                      */
/* A plain URL box works but means someone has to know the package id    */
/* and type it without a typo, so the catalogue is offered as a menu     */
/* instead: pick the package and the href is written for you. Anything   */
/* the menu cannot express — a blog post, an outside link — still goes   */
/* in by hand under "Custom link".                                       */
/*                                                                      */
/* Draft packages are deliberately absent. Publishing the link before    */
/* the package would point the homepage at a 404.                        */
/* ------------------------------------------------------------------ */

const CUSTOM = "__custom__";
const NONE = "";

export default function LinkField({
  label,
  value,
  onChange,
  hint,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  hint?: string;
  className?: string;
}) {
  const packages = usePackages();

  const { packageOptions, destinationOptions } = useMemo(() => {
    const packageOptions = packages
      .map((pkg) => ({
        href: pkg.href || `/packages/${pkg.id}`,
        label: pkg.destination ? `${pkg.title} — ${pkg.destination}` : pkg.title,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    /* One entry per place that actually has a package filed under it —
       the same rule /destinations/[slug] uses to decide a page exists. */
    const names = [...new Set(packages.map((pkg) => pkg.destination).filter(Boolean))].sort();
    const destinationOptions = names.map((name) => ({
      href: destinationHref(name),
      label: name,
    }));

    return { packageOptions, destinationOptions };
  }, [packages]);

  const known = [...packageOptions, ...destinationOptions].some(
    (option) => option.href === value
  );
  const selected = value === "" ? NONE : known ? value : CUSTOM;

  return (
    <div className={className}>
      <FieldLabel>{label}</FieldLabel>

      <select
        value={selected}
        onChange={(event) => {
          const next = event.target.value;
          /* Switching to Custom keeps whatever is already typed, so picking
             it by accident does not wipe a hand-written link. */
          if (next === CUSTOM) return onChange(known ? "" : value);
          onChange(next);
        }}
        className={inputClass}
      >
        <option value={NONE}>Not clickable</option>

        {packageOptions.length > 0 && (
          <optgroup label="Packages">
            {packageOptions.map((option) => (
              <option key={option.href} value={option.href}>
                {option.label}
              </option>
            ))}
          </optgroup>
        )}

        {destinationOptions.length > 0 && (
          <optgroup label="Destination pages">
            {destinationOptions.map((option) => (
              <option key={option.href} value={option.href}>
                All packages in {option.label}
              </option>
            ))}
          </optgroup>
        )}

        <option value={CUSTOM}>Custom link…</option>
      </select>

      {selected === CUSTOM && (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="/blog/meghalaya-in-the-monsoon"
          className={`${inputClass} mt-2`}
        />
      )}

      {hint && <span className="mt-1 block text-[11px] text-cmt-neutral-500">{hint}</span>}
    </div>
  );
}

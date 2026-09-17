"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { PackageFact } from "@/lib/packageData";
import { PERMIT_BOOKING_URL, packageFactValue, type PackageFactValues } from "@/lib/packageFacts";
import PackageFactsBar from "@/app/packages/_components/PackageFactsBar";
import packageIconNames from "@/lib/packageIconNames.json";
import { PackageGlyph } from "@/lib/PackageGlyph";
import IconPicker from "../_components/IconPicker";
import { FieldLabel, inputClass } from "../_components/ui";

const buttonClass = "inline-flex h-9 items-center justify-center gap-1.5 rounded-cmt-control border border-cmt-neutral-200 px-3 text-xs font-semibold hover:bg-cmt-neutral-50 disabled:opacity-40";

export default function PackageFactsEditor({ facts, hidden, permitRequired, values, onChange, onHiddenChange, onPermitRequiredChange }: {
  facts: PackageFact[];
  hidden: boolean;
  permitRequired: boolean;
  values: PackageFactValues;
  onChange: (facts: PackageFact[]) => void;
  onHiddenChange: (hidden: boolean) => void;
  onPermitRequiredChange: (required: boolean) => void;
}) {
  const patch = (id: string, change: Partial<PackageFact>) => onChange(facts.map((fact) => fact.id === id ? { ...fact, ...change } : fact));
  const move = (index: number, direction: number) => {
    const reordered = [...facts];
    [reordered[index], reordered[index + direction]] = [reordered[index + direction], reordered[index]];
    onChange(reordered);
  };
  const visible = hidden ? [] : facts.filter((fact) => fact.visible !== false).map((fact) => ({ ...fact, value: packageFactValue(fact, values) }));

  return (
    <section className="rounded-cmt-md border border-cmt-neutral-200 bg-white p-5 shadow-cmt-sm sm:p-7">
      <h2 className="font-display text-xl font-semibold">Trip snapshot / quick details</h2>
      <p className="mt-1 text-xs leading-5 text-cmt-neutral-500">These quick facts introduce the trip, including duration, meals and transport. Values follow your trip details automatically. Customize a value if needed, then use Save package above.</p>
      <label className="mt-5 flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={!hidden} onChange={(event) => onHiddenChange(!event.target.checked)} className="size-4 accent-cmt-primary-500" />
        Show details bar
      </label>
      <div className="mt-5 rounded-cmt-control border border-cmt-neutral-200 bg-cmt-neutral-50 p-4">
        <label className="block max-w-sm">
          <FieldLabel>Permit requirement</FieldLabel>
          <select value={permitRequired ? "required" : "not-required"} onChange={(event) => onPermitRequiredChange(event.target.value === "required")} className={inputClass}>
            <option value="not-required">Not required</option>
            <option value="required">Required</option>
          </select>
        </label>
        <p className="mt-2 text-xs leading-5 text-cmt-neutral-500">
          A Permit box appears at the end of the details bar. Choose Required to show a Book permit button linking to{" "}
          <a href={PERMIT_BOOKING_URL} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2">Aranya Vihaara</a>.
        </p>
      </div>
      <div className="mt-5 space-y-4">
        {facts.map((fact, index) => (
          <details key={fact.id} open={index === 0} className="rounded-cmt-control border border-cmt-neutral-200 p-4">
            <summary className="cursor-pointer text-sm font-semibold"><span className="ml-2">{fact.label || `Box ${index + 1}`}</span><span className="ml-2 text-xs font-normal text-cmt-neutral-500">{fact.visible === false ? "Hidden" : packageFactValue(fact, values) || "Add a value"}</span></summary>
            <div className="mb-4 mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold">Box {index + 1}{fact.visible === false ? " · Hidden" : ""}</p>
              <div className="flex flex-wrap items-center gap-2">
                <label className="mr-2 flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={fact.visible !== false} onChange={(event) => patch(fact.id, { visible: event.target.checked })} className="size-4 accent-cmt-primary-500" />Show box</label>
                <button type="button" className={buttonClass} disabled={index === 0} aria-label={`Move box ${index + 1} up`} onClick={() => move(index, -1)}><ArrowUp className="size-4" /></button>
                <button type="button" className={buttonClass} disabled={index === facts.length - 1} aria-label={`Move box ${index + 1} down`} onClick={() => move(index, 1)}><ArrowDown className="size-4" /></button>
                <button type="button" className={`${buttonClass} text-cmt-error-700`} aria-label={`Remove box ${index + 1}`} onClick={() => onChange(facts.filter((item) => item.id !== fact.id))}><Trash2 className="size-4" />Remove</button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <IconPicker iconNames={packageIconNames} renderIcon={PackageGlyph} value={fact.icon} onChange={(icon) => patch(fact.id, { icon })} />
              <label><FieldLabel>Box name</FieldLabel><input value={fact.label} onChange={(event) => patch(fact.id, { label: event.target.value })} className={inputClass} /></label>
              <label className="sm:col-span-2"><FieldLabel>Box value</FieldLabel><input value={packageFactValue(fact, values)} onChange={(event) => patch(fact.id, { value: event.target.value })} className={inputClass} /></label>
            </div>
            {fact.source && <div className="mt-2 text-xs text-cmt-neutral-500">{fact.value === undefined ? "Updates automatically from the package details. Type a value to customize it." : <button type="button" className="font-semibold underline underline-offset-2" onClick={() => patch(fact.id, { value: undefined })}>Use automatic package value</button>}</div>}
          </details>
        ))}
      </div>
      <button type="button" className={`${buttonClass} mt-4`} onClick={() => onChange([...facts, { id: crypto.randomUUID(), icon: "Sparkles", label: "New box", value: "", visible: true }])}><Plus className="size-4" />Add box</button>
      <div className="mt-6 border-t border-cmt-neutral-200 pt-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-cmt-neutral-500">Bar preview</p>
        {visible.length ? <PackageFactsBar facts={visible} permitRequired={permitRequired} /> : <p className="rounded-cmt-control bg-cmt-neutral-50 p-4 text-sm text-cmt-neutral-500">The details bar is hidden on this package.</p>}
      </div>
    </section>
  );
}

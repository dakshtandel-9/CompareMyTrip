"use client";

import { Check } from "lucide-react";

export default function EditorSteps({ steps, current, onChange }: {
  steps: readonly string[];
  current: number;
  onChange: (step: number) => void;
}) {
  return (
    <nav aria-label="Editor sections" className="mb-6 rounded-2xl border border-cmt-neutral-200 bg-white p-2 shadow-cmt-xs">
      <ol className={`flex gap-1 ${steps.length > 10 ? "overflow-x-auto" : "flex-wrap"}`}>
        {steps.map((label, index) => (
          <li key={label} className="min-w-[140px] flex-1">
            <button type="button" aria-current={current === index ? "step" : undefined} onClick={() => onChange(index)}
              className={`flex min-h-14 w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold transition-colors ${current === index ? "bg-cmt-primary-50 text-cmt-primary-900 ring-1 ring-inset ring-cmt-primary-100" : "text-cmt-neutral-500 hover:bg-cmt-neutral-50 hover:text-cmt-neutral-900"}`}>
              <span className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] ${current === index ? "bg-cmt-primary-500 text-cmt-neutral-900" : "border border-cmt-neutral-200 bg-white"}`}>{index + 1}</span>
              {label}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function ReadinessList({ items, onSelect }: {
  items: { label: string; ready: boolean; step: number }[];
  onSelect: (step: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-cmt-neutral-200 bg-white p-5">
      <h3 className="text-sm font-semibold">Before you save</h3>
      <p className="mt-1 text-xs leading-5 text-cmt-neutral-500">Select an item to review its section.</p>
      <ul className="mt-4 space-y-1">
        {items.map((item) => <li key={item.label}><button type="button" onClick={() => onSelect(item.step)} className="flex w-full items-center gap-2.5 rounded-lg py-2 text-left text-xs hover:bg-cmt-neutral-50"><span className={`grid size-5 shrink-0 place-items-center rounded-full ${item.ready ? "bg-emerald-100 text-emerald-700" : "border border-amber-300 bg-amber-50 text-amber-800"}`}>{item.ready ? <Check className="size-3" /> : "!"}</span><span>{item.label}</span><span className={`ml-auto text-[10px] font-semibold ${item.ready ? "text-emerald-700" : "text-amber-700"}`}>{item.ready ? "Ready" : "Needed"}</span></button></li>)}
      </ul>
    </div>
  );
}

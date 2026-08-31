"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, Copy, Plus, Trash2 } from "lucide-react";

import { nextId, type SectionHeaderContent } from "@/lib/siteContent";
import { Button, FieldLabel, TextArea, TextField, inputClass } from "./ui";

/* ------------------------------------------------------------------ */
/* The two shapes almost every section is built from: the header block  */
/* it opens with, and a list of repeating cards under it.               */
/* ------------------------------------------------------------------ */

export function SectionHeaderFields({
  value,
  onChange,
  /* Sections whose header carries no "View all →" link hide those two
     fields rather than offering a link that goes nowhere. */
  withAction = true,
}: {
  value: SectionHeaderContent;
  onChange: (next: SectionHeaderContent) => void;
  withAction?: boolean;
}) {
  const patch = (item: Partial<SectionHeaderContent>) => onChange({ ...value, ...item });

  return (
    <div className="grid gap-4">
      <TextField
        label="Eyebrow"
        value={value.eyebrow}
        onChange={(next) => patch({ eyebrow: next })}
        placeholder="Browse By Travel Style"
        hint="The small line above the headline."
      />
      <TextField
        label="Headline"
        value={value.title}
        onChange={(next) => patch({ title: next })}
      />
      <TextArea
        label="Sub-line"
        value={value.description}
        onChange={(next) => patch({ description: next })}
      />

      {withAction && (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Link label"
            value={value.actionLabel}
            onChange={(next) => patch({ actionLabel: next })}
            placeholder="See all destinations"
            hint="Leave blank to hide the link."
          />
          <TextField
            label="Link destination"
            value={value.actionHref}
            onChange={(next) => patch({ actionHref: next })}
            placeholder="/packages"
          />
        </div>
      )}
    </div>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max = 999999,
  hint,
  className = "",
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <FieldLabel>{label}</FieldLabel>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) =>
          onChange(Math.max(min, Math.min(max, Number(event.target.value) || 0)))
        }
        className={inputClass}
      />
      {hint && <span className="mt-1 block text-[11px] text-cmt-neutral-500">{hint}</span>}
    </label>
  );
}

export function SelectField<Value extends string>({
  label,
  value,
  options,
  onChange,
  hint,
  className = "",
}: {
  label: string;
  value: Value;
  options: readonly Value[];
  onChange: (next: Value) => void;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <FieldLabel>{label}</FieldLabel>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as Value)}
        className={inputClass}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {hint && <span className="mt-1 block text-[11px] text-cmt-neutral-500">{hint}</span>}
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Repeating list of cards.                                            */
/*                                                                     */
/* Rows collapse, because a nine-card rail with every field open is a   */
/* page of scrolling before you reach the second card. Short lists open */
/* fully — with three rows there is nothing to hide from.               */
/* ------------------------------------------------------------------ */

export function ListEditor<Item extends { id: string }>({
  items,
  onChange,
  idPrefix,
  blank,
  summary,
  children,
  addLabel = "Add item",
  minItems = 1,
  allowDuplicate = true,
}: {
  items: Item[];
  onChange: (next: Item[]) => void;
  /** Prefix for generated ids — "cat", "faq", "trek". */
  idPrefix: string;
  /** A new row's starting values, minus its id. */
  blank: Omit<Item, "id">;
  /** The one-line title shown on a collapsed row. */
  summary: (item: Item, index: number) => string;
  children: (item: Item, patch: (value: Partial<Item>) => void, index: number) => ReactNode;
  addLabel?: string;
  minItems?: number;
  allowDuplicate?: boolean;
}) {
  const [open, setOpen] = useState<string[]>(() =>
    items.length <= 3 ? items.map((item) => item.id) : [],
  );

  const isOpen = (id: string) => open.includes(id);
  const toggle = (id: string) =>
    setOpen((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );

  const patchItem = (index: number, value: Partial<Item>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...value } : item)));

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const add = () => {
    const id = nextId(idPrefix, items);
    onChange([...items, { ...blank, id } as Item]);
    setOpen((current) => [...current, id]);
  };

  const duplicate = (index: number) => {
    const id = nextId(idPrefix, items);
    const next = [...items];
    next.splice(index + 1, 0, { ...items[index], id });
    onChange(next);
    setOpen((current) => [...current, id]);
  };

  const remove = (index: number) =>
    onChange(items.filter((_, itemIndex) => itemIndex !== index));

  const iconButton =
    "grid size-8 place-items-center rounded-cmt-sm border border-cmt-neutral-200 bg-white transition-colors disabled:opacity-35";

  return (
    <div>
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li
            key={item.id}
            className="overflow-hidden rounded-cmt-sm border border-cmt-neutral-200 bg-cmt-neutral-50"
          >
            <div className="flex items-center gap-3 p-3">
              <button
                type="button"
                onClick={() => toggle(item.id)}
                aria-expanded={isOpen(item.id)}
                className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-cmt-full bg-white text-[11px] font-bold tabular-nums text-cmt-neutral-500 ring-1 ring-cmt-neutral-200">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-cmt-neutral-900">
                  {summary(item, index) || "Untitled"}
                </span>
                <ChevronDown
                  className={`size-4 shrink-0 text-cmt-neutral-400 transition-transform ${
                    isOpen(item.id) ? "rotate-180" : ""
                  }`}
                />
              </button>

              <span className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move ${summary(item, index)} up`}
                  className={`${iconButton} text-cmt-neutral-600 enabled:hover:bg-cmt-neutral-100`}
                >
                  <ChevronUp className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === items.length - 1}
                  aria-label={`Move ${summary(item, index)} down`}
                  className={`${iconButton} text-cmt-neutral-600 enabled:hover:bg-cmt-neutral-100`}
                >
                  <ChevronDown className="size-3.5" />
                </button>
                {allowDuplicate && (
                  <button
                    type="button"
                    onClick={() => duplicate(index)}
                    aria-label={`Duplicate ${summary(item, index)}`}
                    className={`${iconButton} text-cmt-neutral-600 hover:bg-cmt-neutral-100`}
                  >
                    <Copy className="size-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(index)}
                  disabled={items.length <= minItems}
                  aria-label={`Delete ${summary(item, index)}`}
                  className={`${iconButton} text-red-600 enabled:hover:bg-red-50`}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </span>
            </div>

            {isOpen(item.id) && (
              <div className="border-t border-cmt-neutral-200 bg-white p-4">
                {children(item, (value) => patchItem(index, value), index)}
              </div>
            )}
          </li>
        ))}
      </ul>

      <Button variant="ghost" className="mt-4" onClick={add}>
        <Plus className="size-4" /> {addLabel}
      </Button>
    </div>
  );
}

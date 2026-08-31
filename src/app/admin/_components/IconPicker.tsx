"use client";

import { useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";

import { Glyph, ICON_GROUPS, ICON_LIBRARY, humanizeIconName } from "@/lib/adminIcons";
import { FieldLabel, inputClass } from "./ui";

/* ------------------------------------------------------------------ */
/* Icon picker — the trigger shows the icon the way the live card will  */
/* (a gold disc), and opens a searchable grid of the whole library      */
/* grouped by what an editor is usually looking for.                    */
/* ------------------------------------------------------------------ */

export default function IconPicker({
  label = "Icon",
  value,
  onChange,
}: {
  label?: string;
  value: string;
  onChange: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  /* An empty query keeps the groups, so the grid opens as a browsable set
     rather than 227 undifferentiated glyphs. */
  const groups = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return ICON_GROUPS;

    const matches = Object.keys(ICON_LIBRARY).filter((name) =>
      humanizeIconName(name).toLowerCase().includes(term),
    );
    return [{ title: `${matches.length} matching`, icons: matches }];
  }, [query]);

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 w-full items-center gap-3 rounded-cmt-control border border-cmt-neutral-200 bg-white px-2.5 text-left transition-colors hover:border-cmt-neutral-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-cmt-full bg-cmt-primary-500 text-cmt-neutral-900">
          <Glyph name={value} className="size-4" />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm text-cmt-neutral-900">
          {humanizeIconName(value)}
        </span>
        <span className="shrink-0 text-xs font-semibold text-cmt-primary-800">Change</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Choose an icon"
          className="fixed inset-0 z-50 grid place-items-center bg-cmt-neutral-900/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-cmt-md bg-white shadow-cmt-xl"
          >
            <header className="flex items-center gap-3 border-b border-cmt-neutral-100 px-5 py-4">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cmt-neutral-400" />
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search icons — beach, plane, hotel, star…"
                  className={`${inputClass} pl-9`}
                />
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close icon picker"
                className="grid size-10 shrink-0 place-items-center rounded-cmt-control border border-cmt-neutral-200 text-cmt-neutral-500 transition-colors hover:bg-cmt-neutral-50"
              >
                <X className="size-4" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {groups.map((group) => (
                <div key={group.title} className="mb-6 last:mb-0">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-cmt-neutral-500">
                    {group.title}
                  </p>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-2">
                    {group.icons.map((name) => {
                      const active = name === value;
                      return (
                        <button
                          key={name}
                          type="button"
                          title={humanizeIconName(name)}
                          onClick={() => {
                            onChange(name);
                            setOpen(false);
                          }}
                          className={`relative flex flex-col items-center gap-1.5 rounded-cmt-control border p-2.5 transition-colors ${
                            active
                              ? "border-cmt-primary-500 bg-cmt-primary-50"
                              : "border-cmt-neutral-200 hover:border-cmt-neutral-300 hover:bg-cmt-neutral-50"
                          }`}
                        >
                          {active && (
                            <Check className="absolute right-1 top-1 size-3 text-cmt-primary-800" />
                          )}
                          <Glyph name={name} className="size-5 text-cmt-neutral-800" />
                          <span className="line-clamp-2 text-center text-[10px] leading-tight text-cmt-neutral-500">
                            {humanizeIconName(name)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {groups.every((group) => group.icons.length === 0) && (
                <p className="py-10 text-center text-sm text-cmt-neutral-500">
                  No icon matches “{query}”.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

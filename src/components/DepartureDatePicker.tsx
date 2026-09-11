"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { WEEKDAYS } from "@/lib/packageData";

/* ------------------------------------------------------------------ */
/* Departure date picker.                                               */
/*                                                                      */
/* A native <input type="date"> cannot grey out a weekday, and a trek    */
/* that only runs on Sundays needs exactly that: the traveller should    */
/* not be able to pick the Monday at all, rather than pick it and be     */
/* told off afterwards. So the month grid is drawn here, and days the    */
/* package does not depart on are rendered disabled.                     */
/*                                                                      */
/* The panel expands inline rather than floating over the page. The      */
/* booking card it sits in is `overflow-hidden`, which would clip an     */
/* absolutely positioned popover — and an inline panel needs no          */
/* collision detection, no portal and no scroll listener to stay put.    */
/* ------------------------------------------------------------------ */

const pad = (value: number) => String(value).padStart(2, "0");

/** A calendar day as YYYY-MM-DD, built from local parts. Never via
    toISOString(), which converts to UTC and hands back the previous day for
    anyone east of Greenwich. */
const toKey = (year: number, month: number, day: number) => `${year}-${pad(month + 1)}-${pad(day)}`;

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const parseKey = (key: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getMonth() === month - 1 ? date : null;
};

const monthFormatter = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });
const longFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

type Props = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  /** JS day numbers the package departs on. Empty means any day. */
  allowedDays: number[];
  /** Earliest selectable day, YYYY-MM-DD. Defaults to today. */
  min?: string;
  placeholder?: string;
  /** Height and spacing of the trigger, so it can line up with whatever
      fields sit beside it. */
  triggerClassName?: string;
};

export default function DepartureDatePicker({
  id,
  value,
  onChange,
  allowedDays,
  min,
  placeholder = "Select a date",
  triggerClassName = "h-11",
}: Props) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const panelId = `${fieldId}-panel`;

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const floor = useMemo(() => parseKey(min ?? "") ?? startOfToday(), [min]);
  const selected = useMemo(() => parseKey(value), [value]);

  const allows = useMemo(() => {
    const set = new Set(allowedDays);
    return (date: Date) => (set.size === 0 || set.has(date.getDay())) && date >= floor;
  }, [allowedDays, floor]);

  /* The month the grid opens on: the one holding the current choice, else
     the one holding the first day that can actually be picked. Opening on a
     month with every day greyed out reads as broken. */
  const initialMonth = useMemo(() => {
    if (selected) return new Date(selected.getFullYear(), selected.getMonth(), 1);
    const cursor = new Date(floor);
    for (let step = 0; step < 366; step += 1) {
      if (allows(cursor)) break;
      cursor.setDate(cursor.getDate() + 1);
    }
    return new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  }, [selected, floor, allows]);

  const [month, setMonth] = useState(initialMonth);

  /* Reopening lands on the month worth showing — the current choice's, or
     the first one with a selectable day. Done as the grid is opened rather
     than in an effect watching `open`, which would re-render twice and land
     the viewer on the old month for a frame. */
  const toggle = () => {
    if (!open) setMonth(initialMonth);
    setOpen(!open);
  };

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  /* Six weeks of cells, so the grid does not change height between months
     and the buttons under it never jump. */
  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const cursor = new Date(first);
    cursor.setDate(1 - first.getDay());

    return Array.from({ length: 42 }, () => {
      const date = new Date(cursor);
      cursor.setDate(cursor.getDate() + 1);
      return date;
    });
  }, [month]);

  // Nothing to go back to once the grid is showing the earliest month.
  const atFloorMonth =
    month.getFullYear() === floor.getFullYear() && month.getMonth() === floor.getMonth();

  const shiftMonth = (delta: number) =>
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        id={fieldId}
        onClick={toggle}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className={`flex w-full items-center gap-2.5 rounded-cmt-sm border border-cmt-neutral-200 bg-white px-3 text-left text-sm font-semibold text-cmt-neutral-900 outline-none transition-colors hover:border-cmt-neutral-300 focus-visible:border-cmt-primary-500 focus-visible:ring-2 focus-visible:ring-cmt-primary-500/20 ${triggerClassName}`}
      >
        <CalendarDays className="size-4 shrink-0 text-cmt-neutral-400" aria-hidden="true" />
        <span className={selected ? "" : "font-normal text-cmt-neutral-400"}>
          {selected ? longFormatter.format(selected) : placeholder}
        </span>
        {selected ? (
          <span
            role="button"
            tabIndex={0}
            aria-label="Clear the travel date"
            onClick={(event) => {
              event.stopPropagation();
              onChange("");
              setOpen(false);
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              event.stopPropagation();
              onChange("");
              setOpen(false);
            }}
            className="ml-auto shrink-0 rounded-cmt-sm px-1.5 py-0.5 text-xs font-medium text-cmt-neutral-400 hover:bg-cmt-neutral-100 hover:text-cmt-neutral-700"
          >
            Clear
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          id={panelId}
          className="mt-2 rounded-cmt-sm border border-cmt-neutral-200 bg-white p-3 shadow-cmt-md"
        >
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              disabled={atFloorMonth}
              aria-label="Previous month"
              className="grid size-8 place-items-center rounded-cmt-sm border border-cmt-neutral-200 text-cmt-neutral-700 transition-colors hover:border-cmt-neutral-300 disabled:opacity-35"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span aria-live="polite" className="text-sm font-semibold">
              {monthFormatter.format(month)}
            </span>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
              className="grid size-8 place-items-center rounded-cmt-sm border border-cmt-neutral-200 text-cmt-neutral-700 transition-colors hover:border-cmt-neutral-300"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((day) => (
              <abbr
                key={day.value}
                title={day.short}
                className="pb-1 text-xs font-semibold uppercase text-cmt-neutral-400 no-underline"
              >
                {day.letter}
              </abbr>
            ))}

            {cells.map((date) => {
              const inMonth = date.getMonth() === month.getMonth();
              const key = toKey(date.getFullYear(), date.getMonth(), date.getDate());
              const selectable = inMonth && allows(date);
              const isSelected = key === value;

              return (
                <button
                  key={key}
                  type="button"
                  disabled={!selectable}
                  aria-pressed={isSelected}
                  aria-label={longFormatter.format(date)}
                  onClick={() => {
                    onChange(key);
                    setOpen(false);
                  }}
                  className={`grid h-9 place-items-center rounded-cmt-sm text-sm tabular-nums transition-colors ${
                    isSelected
                      ? "bg-cmt-neutral-900 font-semibold text-white"
                      : selectable
                        ? "font-medium text-cmt-neutral-900 hover:bg-cmt-primary-100"
                        : // Days the trip does not run, and days already
                          // past: shown so the shape of the month is still
                          // readable, but plainly not on offer.
                          "cursor-not-allowed text-cmt-neutral-300"
                  } ${inMonth ? "" : "invisible"}`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

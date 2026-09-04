"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw, TriangleAlert, X } from "lucide-react";

import { Button } from "../_components/ui";

/* ------------------------------------------------------------------ */
/* Type-to-confirm.                                                     */
/*                                                                      */
/* Reset throws away wording and photography someone chose, and the     */
/* button for it sits in the corner of every card — one stray click     */
/* away from a banner nobody meant to touch. Typing the phrase makes    */
/* the action deliberate; it cannot be done by muscle memory.            */
/* ------------------------------------------------------------------ */

const PHRASE = "Reset to original";

export default function ConfirmResetDialog({
  bannerName,
  onConfirm,
  onCancel,
}: {
  bannerName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [typed, setTyped] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  /* Case and stray spaces are not the point — intent is. */
  const matches = typed.trim().toLowerCase() === PHRASE.toLowerCase();

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-banner-title"
      className="fixed inset-0 z-[100] grid place-items-center p-4"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onCancel}
        className="absolute inset-0 cursor-default bg-cmt-neutral-900/50"
      />

      <div className="relative w-full max-w-[460px] rounded-cmt-md border border-cmt-neutral-200 bg-white p-6 shadow-cmt-lg">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-cmt-control text-cmt-neutral-400 transition-colors hover:bg-cmt-neutral-50 hover:text-cmt-neutral-700"
        >
          <X className="size-4" />
        </button>

        <span className="grid size-11 place-items-center rounded-cmt-full bg-cmt-primary-50 text-cmt-primary-900">
          <TriangleAlert className="size-5" aria-hidden="true" />
        </span>

        <h2
          id="reset-banner-title"
          className="mt-4 font-display text-lg font-semibold text-cmt-neutral-900"
        >
          Reset the {bannerName} banner?
        </h2>
        <p className="mt-2 text-sm leading-6 text-cmt-neutral-600">
          This puts the original photo and wording back into the editor,
          discarding what is there now. It only reaches the live site when you
          publish.
        </p>

        <label className="mt-5 block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-cmt-neutral-500">
            Type <span className="text-cmt-neutral-900">{PHRASE}</span> to confirm
          </span>
          <input
            ref={inputRef}
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && matches) onConfirm();
            }}
            placeholder={PHRASE}
            autoComplete="off"
            spellCheck={false}
            aria-label={`Type ${PHRASE} to confirm`}
            className="mt-1.5 h-11 w-full rounded-cmt-control border border-cmt-neutral-200 bg-white px-3 text-sm text-cmt-neutral-900 placeholder:text-cmt-neutral-300 focus:border-cmt-primary-500 focus:outline-2 focus:-outline-offset-2 focus:outline-cmt-primary-500"
          />
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={!matches}
            className="disabled:border-cmt-neutral-200 disabled:bg-cmt-neutral-100 disabled:text-cmt-neutral-400"
          >
            <RotateCcw className="size-4" /> Reset banner
          </Button>
        </div>
      </div>
    </div>
  );
}

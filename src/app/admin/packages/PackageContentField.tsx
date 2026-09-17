"use client";

import { createContext, useContext, useId, useState } from "react";
import { FieldLabel, textareaClass } from "../_components/ui";

export const PackageContentIOContext = createContext<((change: 1 | -1) => void) | null>(null);

/** Text imports update the same unsaved draft as typing; nothing is published here. */
export default function PackageContentField({ label, value, onChange, hint, disabled = false }: {
  label: string; value: string; onChange: (value: string) => void; hint?: string; disabled?: boolean;
}) {
  const id = useId();
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  const reportReading = useContext(PackageContentIOContext);
  return <fieldset disabled={disabled || reading} className="min-w-0">
    <label htmlFor={id}><FieldLabel>{label}</FieldLabel></label>
    <textarea id={id} value={value} onChange={event => onChange(event.target.value)} rows={5} className={textareaClass} aria-describedby={`${id}-hint`} />
    <p id={`${id}-hint`} className="mt-1 text-xs leading-5 text-cmt-neutral-500">{hint ?? "Paste or type your content. Use blank lines for paragraphs, [Heading] for a heading and - for a bullet point."}</p>
    <details className="mt-2 text-xs text-cmt-neutral-600">
      <summary className="w-fit cursor-pointer font-semibold">Import text from a file</summary>
      <label className="mt-3 block">{reading ? "Reading file…" : "Replace this field from a .txt or .md file (up to 100 KB)"}
        <input type="file" accept=".txt,.md,text/plain,text/markdown" aria-label={`Import ${label}`} className="mt-2 block max-w-full text-xs" onChange={async event => {
          const file = event.target.files?.[0]; event.target.value = "";
          if (!file) return;
          setError("");
          if (!/\.(txt|md)$/i.test(file.name) || file.size > 100_000) { setError("Choose a .txt or .md file up to 100 KB."); return; }
          setReading(true); reportReading?.(1);
          try { onChange((await file.text()).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n")); }
          catch { setError("The file could not be read. Try again or paste the text."); }
          finally { setReading(false); reportReading?.(-1); }
        }} />
      </label>
      <p className="mt-2">Imported text remains a draft until you save the package. Undo restores the previous text.</p>
    </details>
    {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
  </fieldset>;
}

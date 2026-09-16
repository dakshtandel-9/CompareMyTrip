"use client";

import { useId, useState } from "react";
import { usePackageEditing, type ContentPath } from "./PackageInlineEditing";

/** Stage pasted or uploaded copy locally; only Apply text changes the package draft. */
export default function PackageSectionTextEditor({ value, path, label }: { value: string; path: ContentPath; label: string }) {
  const editor = usePackageEditing();
  const id = useId();
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  if (!editor) return null;
  return <fieldset className="cmt-section-text-editor" disabled={editor.disabled || reading}>
    <label htmlFor={id}>{label}</label>
    <p id={`${id}-help`}>Paste your content below or upload a .txt or .md file. Use [Heading] on its own line for subheadings and - for bullet points.</p>
    <textarea id={id} aria-describedby={`${id}-help`} value={draft} onChange={event => setDraft(event.target.value)} rows={8} placeholder="[Good to know]\n- Add your first point\n- Add another point" />
    <div className="cmt-section-text-actions">
      <label className="cmt-section-upload">{reading ? "Reading file…" : "Upload text file"}<input type="file" accept=".txt,.md,text/plain,text/markdown" aria-label={`Upload ${label}`} onChange={async event => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        setError("");
        if (!/\.(txt|md)$/i.test(file.name) || file.size > 100_000) { setError("Choose a .txt or .md file up to 100 KB."); return; }
        setReading(true);
        try { setDraft((await file.text()).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n")); }
        catch { setError("The file could not be read. Try again or paste the text below."); }
        finally { setReading(false); }
      }} /></label>
      <button type="button" disabled={draft === value} onClick={() => { setDraft(value); setError(""); }}>Reset text</button>
      <button type="button" disabled={draft === value} onClick={() => editor.change(path, draft)}>Apply text</button>
    </div>
    <p role="status">{error || (draft !== value ? "Text staged. Apply it to the preview, then save the package." : "Changes go live after you save the package.")}</p>
  </fieldset>;
}

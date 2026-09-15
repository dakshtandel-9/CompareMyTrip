"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Upload } from "lucide-react";
import PackageGallery from "./PackageGallery";
import styles from "./PackageInlineEditing.module.css";

export type ContentPath = (string | number)[];
export type PackageEditing = {
  value: import("@/lib/packageData").TravelPackage;
  renderIconPicker?: (value: string, onChange: (name: string) => void) => ReactNode;
  change: (path: ContentPath, value: unknown) => void;
  upload: (files: File[]) => Promise<string[]>;
  disabled: boolean;
};
export const PackageEditingContext = createContext<PackageEditing | null>(null);
export const usePackageEditing = () => useContext(PackageEditingContext);

/** Public pages render ordinary text. Admin uses the very same markup and data. */
export function InlineText({ value, path, label, multiline = false, numeric = false, placeholder, children }: {
  value: string | number; path: ContentPath; label: string; multiline?: boolean; numeric?: boolean; placeholder?: string; children?: ReactNode;
}) {
  const editor = usePackageEditing();
  const [active, setActive] = useState(false);
  const [draft, setDraft] = useState("");
  const cancelled = useRef(false);
  if (!editor) return <>{children ?? value}</>;
  const begin = () => { if (!editor.disabled) { cancelled.current = false; setDraft(String(value)); setActive(true); } };
  const commit = () => {
    if (!cancelled.current && !editor.disabled) {
      const next = numeric ? Number(draft) : draft;
      if (!numeric || Number.isFinite(next)) editor.change(path, next);
    }
    setActive(false);
  };
  if (active) {
    const common = {
      autoFocus: true, value: draft, 'aria-label': label, disabled: editor.disabled,
      className: styles.input,
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(event.target.value),
      onBlur: commit,
      onClick: (event: React.MouseEvent) => event.stopPropagation(),
      onKeyDown: (event: React.KeyboardEvent) => {
        event.stopPropagation();
        if (event.key === "Escape") { event.preventDefault(); cancelled.current = true; setActive(false); }
        if (event.key === "Enter" && (!multiline || event.metaKey || event.ctrlKey)) { event.preventDefault(); if (event.currentTarget instanceof HTMLElement) event.currentTarget.blur(); }
      },
    };
    return multiline ? <textarea {...common} rows={Math.min(16, Math.max(3, draft.split("\n").length + Math.ceil(draft.length / 90)))} /> : <input {...common} type={numeric ? "number" : "text"} />;
  }
  return <span className={`${styles.editable} ${!String(value).trim() ? styles.placeholder : ""}`} role="button" tabIndex={editor.disabled ? -1 : 0} aria-disabled={editor.disabled} aria-label={`Edit ${label}`} title={`Click to edit ${label}`} onClick={event => { event.stopPropagation(); begin(); }} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); begin(); } }}>{String(value).trim() ? children ?? value : placeholder ?? `Add ${label.toLowerCase()}`}</span>;
}

export function EditorOnly({ children }: { children: ReactNode }) {
  return usePackageEditing() ? <>{children}</> : null;
}
export function EditAction({ label, onClick, kind = "add", disabled = false }: { label: string; onClick: () => void; kind?: "add" | "remove" | "up" | "down"; disabled?: boolean }) {
  const editor = usePackageEditing();
  if (!editor) return null;
  const Icon = { add: Plus, remove: Trash2, up: ArrowUp, down: ArrowDown }[kind];
  return <button type="button" className={styles.action} disabled={disabled || editor.disabled} onClick={event => { event.preventDefault(); event.stopPropagation(); onClick(); }}><Icon size={13} />{label}</button>;
}

export function EditableGallery({ images, path = ["details", "gallery"], maxImages = 10 }: { images: string[]; path?: ContentPath; maxImages?: number }) {
  const editor = usePackageEditing();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const move = (index: number, direction: number) => {
    const next = [...images]; [next[index], next[index + direction]] = [next[index + direction], next[index]];
    editor?.change(path, next);
  };
  return <div>
    {images.length > 0 ? <PackageGallery images={images} maxImages={maxImages} /> : <div className={styles.emptyPhoto}>Add your trip photos</div>}
    {editor && <div className={styles.photos}>
      <button type="button" className={styles.action} disabled={busy || editor.disabled || images.length >= maxImages} onClick={() => file.current?.click()}><Upload size={14} />{busy ? "Uploading…" : "Add photos"}</button>
      <input ref={file} hidden type="file" multiple accept="image/jpeg,image/png,image/webp" aria-label="Upload trip photos" onChange={async event => {
        const files = Array.from(event.target.files ?? []).slice(0, maxImages - images.length); event.target.value = "";
        if (!files.length) return; setBusy(true); setError("");
        try { const uploaded = await editor.upload(files); editor.change(path, [...images, ...uploaded].slice(0, maxImages)); } catch (cause) { setError(cause instanceof Error ? cause.message : "Upload failed"); } finally { setBusy(false); }
      }} />
      {images.map((image, index) => <span className={styles.photoActions} key={`${image}-${index}`}><span>Photo {index + 1}{index === 0 ? " · cover" : ""}</span><EditAction kind="up" label={`Move photo ${index + 1} earlier`} disabled={index === 0 || busy} onClick={() => move(index, -1)} /><EditAction kind="down" label={`Move photo ${index + 1} later`} disabled={index === images.length - 1 || busy} onClick={() => move(index, 1)} /><EditAction kind="remove" label={`Remove photo ${index + 1}`} disabled={busy} onClick={() => editor.change(path, images.filter((_, i) => i !== index))} /></span>)}
      {error && <p role="alert">{error}</p>}
    </div>}
  </div>;
}

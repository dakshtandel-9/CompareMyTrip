"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Save, Undo2, Eye, Pencil } from "lucide-react";
import { getPackageDetails, type TravelPackage } from "@/lib/packageData";
import { getPackagePageSections, packagePageSectionImages } from "@/lib/packageDetailSections";
import { savePackage, uploadPackageImage } from "@/lib/firebase/packages";
import { deleteImageFromCloudflare, PACKAGE_DRAFT_IMAGE_KEY_PREFIX } from "@/lib/cloudflareUpload";
import { applyPackageImport } from "@/lib/packageAiImport";
import PackageDetailClient from "@/app/packages/[packageId]/PackageDetailClient";
import { PackageEditingContext, type ContentPath } from "@/app/packages/_components/PackageInlineEditing";
import styles from "./AdminPackageBuilder.module.css";
import PackageAiImporter from "./PackageAiImporter";
import IconPicker from "../_components/IconPicker";
import iconNames from "@/lib/packageIconNames.json";
import { PackageGlyph } from "@/lib/PackageGlyph";
import PackagePreviewSettings from "./PackagePreviewSettings";
import { formFromPackage, packageFromForm, applyPackagePreviewChange } from "./packageFormModel";
import { packageValidationIssue, type PackageForm } from "./catalogueEditorState";
import { useUnsavedContentChanges } from "../content/useUnsavedContentChanges";

const button = "inline-flex items-center gap-2 rounded-lg border border-cmt-neutral-200 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-40";
export default function AdminPackageBuilder({ initialPackage, initialDestination = "", initialRegion = "India", filedUnderOptions, onCancel, onSaved }: { initialPackage?: TravelPackage; initialDestination?: string; initialRegion?: TravelPackage["region"]; filedUnderOptions: Record<TravelPackage["region"], string[]>; onCancel: () => void; onSaved: (message: string) => void }) {
  const draftStorageKey = `${PACKAGE_DRAFT_IMAGE_KEY_PREFIX}${initialPackage?.id ?? "new"}`;
  const draftImagesRef = useRef<string[]>([]);
  const toolbarRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const toolbar = toolbarRef.current;
    if (!toolbar) return;
    const measure = () => toolbar.parentElement?.style.setProperty("--package-toolbar-height", `${toolbar.getBoundingClientRect().height}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(toolbar);
    return () => observer.disconnect();
  }, []);
  const sectionUploadRef = useRef(false);
  const [form, setForm] = useState<PackageForm>(() => initialPackage ? formFromPackage(initialPackage) : { ...formFromPackage(), destination: initialDestination, region: initialRegion });
  const [originalForm] = useState(() => JSON.stringify(form));
  const [history, setHistory] = useState<PackageForm[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadWarning, setUploadWarning] = useState("");
  const [editing, setEditing] = useState(true);
  const formRef = useRef(form);
  const dirty = JSON.stringify(form) !== originalForm;
  const pkg = packageFromForm(form, initialPackage);
  useUnsavedContentChanges(dirty && !saving);
  const replaceForm = (next: PackageForm) => {
    const previous = formRef.current;
    setHistory(items => [...items.slice(-29), previous]);
    formRef.current = next; setForm(next); setError("");
  };
  const change = (path: ContentPath, value: unknown) => {
    if (saving || uploading) return;
    replaceForm(applyPackagePreviewChange(formRef.current, path, value, initialPackage));
  };
  useEffect(() => {
    const stored = sessionStorage.getItem(draftStorageKey);
    if (!stored) return;
    sessionStorage.removeItem(draftStorageKey);
    try {
      const abandonedImages = [...new Set(JSON.parse(stored) as string[])];
      void Promise.allSettled(abandonedImages.map(deleteImageFromCloudflare)).then((results) => {
        const failed = abandonedImages.filter((_, index) => results[index].status === "rejected");
        if (failed.length) sessionStorage.setItem(draftStorageKey, JSON.stringify(failed));
      });
    } catch {
      sessionStorage.removeItem(draftStorageKey);
    }
  }, [draftStorageKey]);

  const rememberDraftImages = (images: string[]) => {
    draftImagesRef.current = [...new Set([...draftImagesRef.current, ...images])];
    sessionStorage.setItem(draftStorageKey, JSON.stringify(draftImagesRef.current));
  };
  const abandonDraft = async () => {
    const images = [...draftImagesRef.current];
    const results = await Promise.allSettled(images.map(deleteImageFromCloudflare));
    const failed = images.filter((_, index) => results[index].status === "rejected");
    draftImagesRef.current = failed;
    if (failed.length) sessionStorage.setItem(draftStorageKey, JSON.stringify(failed));
    else sessionStorage.removeItem(draftStorageKey);
  };
  const handleSectionImageUpload = async (files: File[]): Promise<string[]> => {
    if (!files.length) return [];
    if (uploading || saving || sectionUploadRef.current) throw new Error("Wait for the current upload to finish.");
    if (files.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type))) throw new Error("Choose JPG, PNG or WebP images.");
    if (files.some((file) => file.size > 5_000_000)) throw new Error("Each image must be 5 MB or smaller.");
    sectionUploadRef.current = true;
    setUploading(true); setError(""); setUploadWarning("");
    try {
      const results = await Promise.allSettled(files.map(uploadPackageImage));
      const uploaded = results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
      if (uploaded.length) rememberDraftImages(uploaded);
      const failed = results.find((result) => result.status === "rejected");
      if (failed?.status === "rejected") {
        const message = failed.reason instanceof Error ? failed.reason.message : "Some images could not be uploaded.";
        if (!uploaded.length) throw new Error(message);
        setUploadWarning(`${uploaded.length} image${uploaded.length === 1 ? "" : "s"} uploaded. ${message}`);
      }
      return uploaded;
    } finally {
      sectionUploadRef.current = false;
      setUploading(false);
    }
  };
  const handleSubmit = async () => {
    setError("");
    if (saving || uploading) return;
    const validation = packageValidationIssue(form);
    if (validation) { setError(validation.message); window.requestAnimationFrame(() => document.getElementById("package-save-error")?.scrollIntoView({ behavior: "smooth", block: "center" })); return; }
    const newPackage = packageFromForm(form, initialPackage);
    if (!initialPackage) newPackage.id = `${form.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now().toString(36)}`;
    try {
      setSaving(true); await savePackage(newPackage);
      // Retain images in hidden sections. Clean removed uploads only after the
      // package has saved successfully, so cancelling never breaks a live page.
      const retained = new Set([newPackage.image, ...form.gallery, ...packagePageSectionImages(form.pageSections)]);
      const previousDetails = initialPackage ? getPackageDetails(initialPackage) : null;
      const previousImages = previousDetails ? [initialPackage!.image, ...previousDetails.gallery, ...packagePageSectionImages(getPackagePageSections(previousDetails))] : [];
      const removed = [...new Set([...draftImagesRef.current, ...previousImages])].filter((image) => image.startsWith("https://") && !retained.has(image));
      draftImagesRef.current = [];
      sessionStorage.removeItem(draftStorageKey);
      const cleanup = await Promise.allSettled(removed.map(deleteImageFromCloudflare));
      const failedCleanup = removed.filter((_, index) => cleanup[index].status === "rejected");
      if (failedCleanup.length) sessionStorage.setItem(draftStorageKey, JSON.stringify(failedCleanup));
      const savedMessage = newPackage.status === "draft"
        ? `“${newPackage.title}” was saved as a draft. It is hidden from the website.`
        : `“${newPackage.title}” was saved and is live on the website.`;
      onSaved(savedMessage + (failedCleanup.length ? " Unused image cleanup will retry next time." : ""));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "This package could not be saved."); }
    finally { setSaving(false); }
  };
  const handleCancel = async () => {
    if (dirty && !window.confirm("Leave the package editor? Unsaved changes will be lost.")) return;
    setSaving(true);
    await abandonDraft();
    onCancel();
  };

  return <div className={styles.editor}>
    <div ref={toolbarRef} className={styles.toolbar}>
      <div><button type="button" className="mb-1 inline-flex items-center gap-1 text-xs text-cmt-neutral-500" disabled={saving || uploading} onClick={() => void handleCancel()}><ArrowLeft size={13} />Back to packages</button><h1 className="text-lg font-semibold">{initialPackage ? "Edit package" : "Create package"}</h1><p className="text-xs text-cmt-neutral-500">{dirty ? "Unsaved changes" : "Click any text to edit it"} · Changes go live after you save as Published.</p></div>
      <div className={styles.actions}>
        <button className={button} type="button" disabled={!history.length || saving || uploading} onClick={() => { const previous = history[history.length - 1]; setHistory(items => items.slice(0, -1)); formRef.current = previous; setForm(previous); setError(""); }}><Undo2 size={14} />Undo</button>
        <button className={button} type="button" onClick={() => setEditing(value => !value)}>{editing ? <Eye size={14} /> : <Pencil size={14} />}{editing ? "View as traveller" : "Edit preview"}</button>
        <select aria-label="Publication status" value={form.status} disabled={saving || uploading} className={button} onChange={event => replaceForm({ ...formRef.current, status: event.target.value as PackageForm["status"] })}><option value="draft">Draft</option><option value="published">Published</option></select>
        <button className="inline-flex items-center gap-2 rounded-lg bg-cmt-primary-500 px-4 py-2 text-sm font-semibold disabled:opacity-40" type="button" disabled={saving || uploading} onClick={() => void handleSubmit()}><Save size={15} />{saving ? "Saving…" : "Save package"}</button>
      </div>
    </div>
    {error && <p id="package-save-error" role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    {uploadWarning && <p role="status" className="mb-4 text-sm text-amber-800">{uploadWarning}</p>}
    <details className="mb-5 rounded-lg border border-cmt-neutral-200 bg-white p-4"><summary className="cursor-pointer text-sm font-semibold">Import a package with AI</summary><div className="mt-4"><PackageAiImporter disabled={saving || uploading} onApply={product => replaceForm(applyPackageImport(formRef.current, product))} /></div></details>
    <PackageEditingContext.Provider value={editing ? { value: pkg, change, renderIconPicker: (value, onChange) => <IconPicker value={value} onChange={onChange} iconNames={iconNames} renderIcon={PackageGlyph} />, upload: handleSectionImageUpload, disabled: saving || uploading } : null}>
      <div className={styles.preview}>
        {editing && <p className={styles.hint}>Click text to edit · Click outside to apply · Escape to cancel · Photos and sections can be added in place</p>}
        <PackageDetailClient initialPackage={pkg} preview previewSidebar={<PackagePreviewSettings pkg={pkg} editing={editing} change={change} disabled={saving || uploading} filedUnderOptions={filedUnderOptions} />} />
      </div>
    </PackageEditingContext.Provider>
  </div>;
}

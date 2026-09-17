"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Save, Undo2, Eye, Pencil } from "lucide-react";
import { getPackageDetails, type TravelPackage } from "@/lib/packageData";
import { getPackagePageSections, packagePageSectionImages } from "@/lib/packageDetailSections";
import { savePackage, uploadPackageImage } from "@/lib/firebase/packages";
import { deleteImageFromCloudflare, PACKAGE_DRAFT_IMAGE_KEY_PREFIX } from "@/lib/cloudflareUpload";
import { applyPackageImport } from "@/lib/packageAiImport";
import PackageDetailClient from "@/app/packages/[packageId]/PackageDetailClient";
import { type ContentPath } from "@/app/packages/_components/PackageInlineEditing";
import styles from "./AdminPackageBuilder.module.css";
import PackageVisualEditor from "./PackageVisualEditor";
import PackageAiImporter from "./PackageAiImporter";
import PackageDetailEditor, { type PackageEditorArea } from "./PackageDetailEditor";
import { PackageContentIOContext } from "./PackageContentField";
import BookingCard from "@/app/packages/[packageId]/BookingCard";
import { formFromPackage, packageFromForm, applyPackagePreviewChange } from "./packageFormModel";
import { packageEditorSteps, packageValidationIssue, type PackageForm } from "./catalogueEditorState";
import { useUnsavedContentChanges } from "../content/useUnsavedContentChanges";

const button = "inline-flex items-center gap-2 rounded-lg border border-cmt-neutral-200 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-40";
export default function AdminPackageBuilder({ initialPackage, initialDestination = "", initialRegion = "India", filedUnderOptions, protectedImages = [], onCancel, onSaved }: { initialPackage?: TravelPackage; initialDestination?: string; initialRegion?: TravelPackage["region"]; filedUnderOptions: Record<TravelPackage["region"], string[]>; protectedImages?: string[]; onCancel: () => void; onSaved: (message: string) => void }) {
  const draftStorageKey = `${PACKAGE_DRAFT_IMAGE_KEY_PREFIX}${initialPackage?.id ?? "new"}`;
  const draftImagesRef = useRef<string[]>([]);
  const protectedImagesRef = useRef(protectedImages);
  useEffect(() => { protectedImagesRef.current = protectedImages; }, [protectedImages]);
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
  const readingRef = useRef(0);
  const [reading, setReading] = useState(0);
  const [section, setSection] = useState<PackageEditorArea>("basics");
  const [form, setForm] = useState<PackageForm>(() => initialPackage ? formFromPackage(initialPackage) : { ...formFromPackage(), destination: initialDestination, region: initialRegion });
  const [originalForm] = useState(() => JSON.stringify(form));
  const [history, setHistory] = useState<PackageForm[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadWarning, setUploadWarning] = useState("");
  const [editing, setEditing] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const formRef = useRef(form);
  const dirty = JSON.stringify(form) !== originalForm;
  const pkg = packageFromForm(form, initialPackage, { normalize: false });
  const busy = saving || uploading || reading > 0;
  useUnsavedContentChanges(dirty && !saving);
  const replaceForm = (next: PackageForm) => {
    const previous = formRef.current;
    setHistory(items => [...items.slice(-29), previous]);
    formRef.current = next; setForm(next); setError("");
  };
  const change = (path: ContentPath, value: unknown) => {
    if (busy) return;
    replaceForm(applyPackagePreviewChange(formRef.current, path, value, initialPackage));
  };
  useEffect(() => {
    // Recover unfinished uploads without deleting any asset used by the saved
    // package. Cleanup happens only when this draft is saved or discarded.
    const stored = sessionStorage.getItem(draftStorageKey);
    if (!stored) return;
    const savedDetails = initialPackage ? getPackageDetails(initialPackage) : null;
    const retained = new Set([...protectedImagesRef.current, ...(savedDetails ? [initialPackage!.image, ...savedDetails.gallery, ...packagePageSectionImages(getPackagePageSections(savedDetails))] : [])]);
    try {
      const values: unknown = JSON.parse(stored);
      draftImagesRef.current = Array.isArray(values) ? [...new Set(values.filter((value): value is string => typeof value === "string" && !retained.has(value)))] : [];
      if (draftImagesRef.current.length) sessionStorage.setItem(draftStorageKey, JSON.stringify(draftImagesRef.current));
      else sessionStorage.removeItem(draftStorageKey);
    } catch { sessionStorage.removeItem(draftStorageKey); }
  }, [draftStorageKey, initialPackage]);

  const rememberDraftImages = (images: string[]) => {
    draftImagesRef.current = [...new Set([...draftImagesRef.current, ...images])];
    sessionStorage.setItem(draftStorageKey, JSON.stringify(draftImagesRef.current));
  };
  const abandonDraft = async () => {
    const images = draftImagesRef.current.filter(image => !protectedImagesRef.current.includes(image));
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
    if (saving || sectionUploadRef.current || readingRef.current) return;
    const validation = packageValidationIssue(formRef.current);
    if (validation) {
      const step = packageEditorSteps(form.tags)[validation.step]?.id;
      const areas: Record<string, PackageEditorArea> = { intro: "basics", about: "overview", highlights: "highlights", itinerary: "itinerary", stays: "stays", carry: "practical", guidelines: "practical", transfers: "practical", locations: "locations", inclusions: "coverage", exclusions: "coverage", faq: "faq", reviews: "reviews", booking: "booking", extras: "extras" };
      setSection(/image|photo|cover/i.test(validation.message) ? "images" : /details box/i.test(validation.message) ? "facts" : areas[step] ?? "basics");
      setEditing(true); setInspectorOpen(true); setError(validation.message);
      window.requestAnimationFrame(() => document.getElementById("package-save-error")?.scrollIntoView({ behavior: "smooth", block: "center" })); return;
    }
    const newPackage = packageFromForm(form, initialPackage);
    if (!initialPackage) newPackage.id = `${form.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now().toString(36)}`;
    try {
      setSaving(true); const result = await savePackage(newPackage);
      // Retain images in hidden sections. Clean removed uploads only after the
      // package has saved successfully, so cancelling never breaks a live page.
      const retained = new Set([newPackage.image, ...form.gallery, ...packagePageSectionImages(form.pageSections), ...protectedImages]);
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
        : `“${newPackage.title}” was saved as Published.`;
      onSaved(savedMessage + (result?.refreshWarning ? ` ${result.refreshWarning}` : "") + (failedCleanup.length ? " Unused image cleanup will retry next time." : ""));
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
      <div><button type="button" className="mb-1 inline-flex items-center gap-1 text-xs text-cmt-neutral-500" disabled={busy} onClick={() => void handleCancel()}><ArrowLeft size={13} />Back to packages</button><h1 className="text-lg font-semibold">{initialPackage ? "Edit package" : "Create package"}</h1><p className="text-xs text-cmt-neutral-500">{dirty ? "Unsaved changes" : "All changes saved"} · Drafts stay private. Published packages update after saving.</p></div>
      <div className={styles.actions}>
        <button className={button} type="button" disabled={!history.length || busy} onClick={() => { const previous = history[history.length - 1]; setHistory(items => items.slice(0, -1)); formRef.current = previous; setForm(previous); setError(""); }}><Undo2 size={14} />Undo</button>
        <button className={button} type="button" disabled={busy} onClick={() => setEditing(value => !value)}>{editing ? <Eye size={14} /> : <Pencil size={14} />}{editing ? "Preview page" : "Back to editor"}</button>
        <select aria-label="Publication status" value={form.status} disabled={busy} className={button} onChange={event => replaceForm({ ...formRef.current, status: event.target.value as PackageForm["status"] })}><option value="draft">Draft</option><option value="published">Published</option></select>
        <button className="inline-flex items-center gap-2 rounded-lg bg-cmt-primary-500 px-4 py-2 text-sm font-semibold disabled:opacity-40" type="button" disabled={busy} onClick={() => void handleSubmit()}><Save size={15} />{saving ? "Saving…" : "Save package"}</button>
      </div>
    </div>
    {error && <p id="package-save-error" role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    {uploadWarning && <p role="status" className="mb-4 text-sm text-amber-800">{uploadWarning}</p>}
    <PackageContentIOContext.Provider value={delta => { readingRef.current += delta; setReading(readingRef.current); }}>
      <div className={styles.preview}>
        {!editing && <p className={styles.hint}>Preview of your unsaved changes. Use Back to editor to edit the page. Save package applies your changes. Booking actions are disabled.</p>}
        <PackageVisualEditor pkg={pkg} editing={editing} disabled={busy} section={section} open={inspectorOpen}
          onSelect={next => { setSection(next); setInspectorOpen(true); }} onClose={() => setInspectorOpen(false)} error={error}
          page={<PackageDetailClient initialPackage={pkg} preview publicPreview previewSidebar={pkg.image ? <div inert={!editing || busy}><BookingCard pkg={pkg} details={getPackageDetails(pkg)} travelDate="" onTravelDateChange={() => {}} travellers={2} onTravellersChange={() => {}} onRequestQuote={() => {}} /></div> : <div className="rounded-lg border border-dashed bg-white p-5 text-sm"><p className="font-semibold">Price & booking card</p><p className="mt-2 text-cmt-neutral-500">Add a cover photo to preview the card. Click here to set prices, badges and departure dates.</p></div>} />}
        >
          {section === "basics" && <details className="m-4 rounded-lg border border-cmt-neutral-200 bg-white p-4"><summary className="cursor-pointer text-sm font-semibold">Import package content (optional)</summary><div className="mt-4"><PackageAiImporter disabled={busy} onApply={product => replaceForm(applyPackageImport(formRef.current, product))} /></div></details>}
          <PackageDetailEditor key={section} compact form={form} pkg={pkg} section={section} onSectionChange={next => { setSection(next); setInspectorOpen(true); }} onChange={replaceForm} change={change} disabled={busy} onUploadImages={handleSectionImageUpload} filedUnderOptions={filedUnderOptions} />
        </PackageVisualEditor>
      </div>
    </PackageContentIOContext.Provider>
  </div>;
}

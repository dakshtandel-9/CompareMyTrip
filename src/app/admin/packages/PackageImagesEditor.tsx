"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ImagePlus, Maximize2, Replace, Trash2, Upload, X } from "lucide-react";
import Modal from "@/components/Modal";
import { getPackageDetails, type TravelPackage } from "@/lib/packageData";
import type { ContentPath } from "@/app/packages/_components/PackageInlineEditing";

export type PackageImagesChange = { image: string; gallery: string[] };
type Props = {
  pkg: TravelPackage;
  change: (path: ContentPath, value: unknown) => void;
  disabled: boolean;
  onUploadImages: (files: File[]) => Promise<string[]>;
  onChangeImages: (images: PackageImagesChange) => void;
};

const MAX_GALLERY_IMAGES = 10;
const accept = "image/jpeg,image/png,image/webp";
const button = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-cmt-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-cmt-neutral-700 transition-colors hover:border-cmt-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-700 disabled:cursor-not-allowed disabled:opacity-40";

/** Image edits only update the package draft. Upload storage and cleanup are
 * owned by the parent editor; this component never saves or deletes assets. */
export default function PackageImagesEditor({ pkg, disabled, onUploadImages, onChangeImages }: Props) {
  const gallery = getPackageDetails(pkg).gallery;
  const addInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const replacementInput = useRef<HTMLInputElement>(null);
  const replacementIndex = useRef<number | null>(null);
  const uploading = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState<{ image: string; label: string } | null>(null);
  const locked = disabled || busy;

  const update = (next: PackageImagesChange, message: string) => {
    if (disabled || uploading.current) return;
    onChangeImages(next);
    setError("");
    setNotice(message);
  };

  const upload = async (files: File[], target: "add" | "cover" | number) => {
    if (!files.length || disabled || uploading.current) return;
    setError("");
    setNotice("");
    if (files.some(file => !accept.split(",").includes(file.type))) {
      setError("Choose JPG, PNG or WebP images.");
      return;
    }
    if (files.some(file => file.size > 5_000_000)) {
      setError("Each image must be 5 MB or smaller.");
      return;
    }
    if (target === "add" && gallery.length + files.length > MAX_GALLERY_IMAGES) {
      const remaining = Math.max(0, MAX_GALLERY_IMAGES - gallery.length);
      setError(remaining ? `You can add ${remaining} more photo${remaining === 1 ? "" : "s"}. Select fewer files.` : "The top gallery already has 10 photos. Replace or remove a photo before adding another.");
      return;
    }
    uploading.current = true;
    setBusy(true);
    try {
      const uploaded = await onUploadImages(files);
      if (!uploaded.length) throw new Error("No images were uploaded. Please try again.");
      if (target === "cover") {
        onChangeImages({ image: uploaded[0], gallery });
        setNotice("Cover updated in your draft.");
      } else if (target === "add") {
        onChangeImages({ image: pkg.image, gallery: [...gallery, ...uploaded] });
        setNotice(`${uploaded.length} photo${uploaded.length === 1 ? "" : "s"} added to your draft.${uploaded.length < files.length ? " Some files did not upload. Please retry those files." : ""}`);
      } else {
        onChangeImages({ image: pkg.image, gallery: gallery.map((image, index) => index === target ? uploaded[0] : image) });
        setNotice(`Gallery photo ${target + 1} replaced in your draft. The cover is unchanged.`);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Images could not be uploaded. Please try again.");
    } finally {
      uploading.current = false;
      setBusy(false);
    }
  };

  const move = (index: number, direction: -1 | 1) => {
    if (index + direction < 0 || index + direction >= gallery.length) return;
    const next = [...gallery];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    update({ image: pkg.image, gallery: next }, `Photo moved to position ${index + direction + 1}.`);
  };

  return <section aria-label="Package images" className="space-y-6">
    <div>
      <h2 className="text-lg font-semibold text-cmt-neutral-900">Cover and top gallery</h2>
      <p className="mt-1 text-sm leading-6 text-cmt-neutral-500">Choose the cover for package listings and the booking card thumbnail. The first gallery photo is the large image at the top of the detail page.</p>
      <p className="mt-1 text-xs leading-5 text-cmt-neutral-500">Changes stay in this editor until you save the package. JPG, PNG or WebP · up to 5 MB per image.</p>
    </div>

    <div className="rounded-xl border border-cmt-neutral-200 bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg bg-cmt-neutral-50 sm:w-44">
          {pkg.image ? <button type="button" className="relative block size-full focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-cmt-primary-700" aria-label="Preview cover image" onClick={() => setPreview({ image: pkg.image, label: "Cover image" })}><Image src={pkg.image} alt="Current package cover" fill sizes="(max-width: 639px) 100vw, 176px" className="object-contain" /></button> : <div className="flex size-full flex-col items-center justify-center gap-2 text-sm text-cmt-neutral-400"><ImagePlus size={24} aria-hidden="true" /><span>No cover chosen</span></div>}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">Cover image</h3>
          <p className="mt-1 text-xs leading-5 text-cmt-neutral-500">Used on listing cards and the booking panel. Upload a separate image or select “Use as cover” on a gallery photo below.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={button} disabled={locked} onClick={() => coverInput.current?.click()}><Upload size={15} aria-hidden="true" />{pkg.image ? "Replace cover" : "Upload cover"}</button>
            {pkg.image && <button type="button" className={button} disabled={locked} onClick={() => update({ image: "", gallery }, "Cover removed from your draft. Gallery photos are unchanged.")}><Trash2 size={15} aria-hidden="true" />Remove cover</button>}
          </div>
        </div>
      </div>
    </div>

    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h3 className="text-sm font-semibold">Top gallery <span className="ml-1 font-normal text-cmt-neutral-500">{gallery.length} / {MAX_GALLERY_IMAGES}</span></h3><p className="mt-1 text-xs leading-5 text-cmt-neutral-500">Reorder to choose the main page image. Gallery changes do not change the cover.</p></div>
        <button type="button" className={button} disabled={locked || gallery.length >= MAX_GALLERY_IMAGES} onClick={() => addInput.current?.click()}><ImagePlus size={16} aria-hidden="true" />Add gallery photos</button>
      </div>
      {!gallery.length && <div className="mt-4 rounded-lg border border-dashed border-cmt-neutral-300 px-4 py-8 text-center"><p className="text-sm font-medium">No gallery photos yet</p><p className="mt-1 text-xs leading-5 text-cmt-neutral-500">Add at least one photo before saving. You can select several files at once.</p></div>}
      {gallery.length > MAX_GALLERY_IMAGES && <p className="mt-3 text-xs text-amber-800">All existing photos are retained. Reduce the gallery to 10 photos before saving.</p>}
      <ol className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {gallery.map((image, index) => <li key={`${image}-${index}`} className="min-w-0 overflow-hidden rounded-lg border border-cmt-neutral-200 bg-white">
          <button type="button" aria-label={`Preview gallery photo ${index + 1}`} className="group relative block aspect-[4/3] w-full bg-cmt-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-cmt-primary-700" onClick={() => setPreview({ image, label: `Gallery photo ${index + 1}` })}><Image src={image} alt={`Gallery photo ${index + 1}`} fill sizes="(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 33vw" className="object-contain" /><span className="absolute bottom-2 right-2 rounded-md bg-white/95 p-2 text-cmt-neutral-700"><Maximize2 size={15} aria-hidden="true" /></span></button>
          <div className="p-3">
            <div className="flex min-h-6 flex-wrap items-center justify-between gap-1"><p className="text-xs font-semibold">Photo {index + 1}{index === 0 ? " · Main page image" : ""}</p>{pkg.image === image && <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><Check size={13} aria-hidden="true" />Cover</span>}</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button type="button" className={button} disabled={locked || pkg.image === image} aria-label={`Use gallery photo ${index + 1} as cover`} onClick={() => update({ image, gallery }, `Photo ${index + 1} is now the cover. Gallery order is unchanged.`)}>Use as cover</button>
              <button type="button" className={button} disabled={locked} aria-label={`Replace gallery photo ${index + 1}`} onClick={() => { replacementIndex.current = index; replacementInput.current?.click(); }}><Replace size={14} aria-hidden="true" />Replace</button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button type="button" className={button} disabled={locked || index === 0} aria-label={`Move gallery photo ${index + 1} earlier`} onClick={() => move(index, -1)}><ArrowLeft size={14} aria-hidden="true" />Earlier</button>
              <button type="button" className={button} disabled={locked || index === gallery.length - 1} aria-label={`Move gallery photo ${index + 1} later`} onClick={() => move(index, 1)}><ArrowRight size={14} aria-hidden="true" />Later</button>
              <button type="button" className={button} disabled={locked} aria-label={`Remove gallery photo ${index + 1}`} onClick={() => update({ image: pkg.image, gallery: gallery.filter((_, itemIndex) => itemIndex !== index) }, `Photo ${index + 1} removed from your draft. The cover is unchanged.`)}><Trash2 size={14} aria-hidden="true" />Remove</button>
            </div>
          </div>
        </li>)}
      </ol>
    </div>

    <input ref={addInput} hidden type="file" multiple accept={accept} disabled={locked} aria-label="Upload top gallery photos" onChange={event => { const files = Array.from(event.target.files ?? []); event.target.value = ""; void upload(files, "add"); }} />
    <input ref={coverInput} hidden type="file" accept={accept} disabled={locked} aria-label="Upload cover image" onChange={event => { const files = Array.from(event.target.files ?? []).slice(0, 1); event.target.value = ""; void upload(files, "cover"); }} />
    <input ref={replacementInput} hidden type="file" accept={accept} disabled={locked} aria-label="Upload replacement gallery photo" onChange={event => { const files = Array.from(event.target.files ?? []).slice(0, 1); event.target.value = ""; const index = replacementIndex.current; replacementIndex.current = null; if (index !== null) void upload(files, index); }} />
    {busy && <p role="status" className="text-sm text-cmt-neutral-600">Uploading images… Keep this editor open.</p>}
    {error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
    {notice && <p role="status" className="text-sm text-cmt-neutral-600">{notice}</p>}

    {preview && <Modal label={preview.label} onClose={() => setPreview(null)} className="fixed inset-0 z-[100] flex flex-col bg-cmt-neutral-900/95 p-4 sm:p-8">
      <div className="mx-auto mb-4 flex w-full max-w-5xl items-center justify-between gap-4 text-white"><p className="text-sm font-semibold">{preview.label}</p><button type="button" data-modal-initial-focus aria-label="Close image preview" onClick={() => setPreview(null)} className="grid size-11 place-items-center rounded-full border border-white/30 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><X size={20} aria-hidden="true" /></button></div>
      <div className="relative mx-auto min-h-0 w-full max-w-5xl flex-1"><Image src={preview.image} alt={preview.label} fill sizes="100vw" className="object-contain" /></div>
    </Modal>}
  </section>;
}

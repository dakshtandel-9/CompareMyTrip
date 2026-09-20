"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

import { bypassesImageOptimizer, isDisplayableImage } from "@/lib/displayableImage";
import { FieldLabel, inputClass } from "../_components/ui";

/* ------------------------------------------------------------------ */
/* The hotel photo on a stay. Uploads go through the package's own      */
/* image path, so a stay picture lands beside the rest of that          */
/* package's photos rather than in the homepage library. A pasted URL   */
/* still works — the field keeps both ways of filling it in.            */
/* ------------------------------------------------------------------ */

const MAX_UPLOAD_BYTES = 5_000_000;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export default function StayPhotoField({ label, value, disabled, onChange, onUploadImages }: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (next: string) => void;
  onUploadImages: (files: File[]) => Promise<string[]>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadLock = useRef(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (files: File[]) => {
    const file = files[0];
    if (!file || disabled || uploadLock.current) return;
    setError("");
    if (!ACCEPTED.includes(file.type)) { setError("Please choose a JPG, PNG or WebP image."); return; }
    if (file.size > MAX_UPLOAD_BYTES) { setError("The image must be 5 MB or smaller."); return; }

    try {
      uploadLock.current = true;
      setUploading(true);
      const uploaded = await onUploadImages([file]);
      if (!uploaded.length) throw new Error("The photo was not uploaded. Please try again.");
      onChange(uploaded[0]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The photo could not be uploaded. Please try again.");
    } finally {
      uploadLock.current = false;
      setUploading(false);
    }
  };

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex gap-3">
        <div className="relative aspect-[3/2] w-32 shrink-0 overflow-hidden rounded-cmt-sm border border-cmt-neutral-200 bg-cmt-neutral-100">
          {isDisplayableImage(value)
            ? <Image src={value} alt="" fill sizes="128px" unoptimized={bypassesImageOptimizer(value)} className="object-cover" />
            : <span className="grid size-full place-items-center text-cmt-neutral-400"><ImagePlus className="size-5" /></span>}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <input
            className={`${inputClass} h-10`}
            value={value}
            disabled={disabled}
            placeholder="Upload a photo, or paste an image URL"
            onChange={event => onChange(event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={() => fileRef.current?.click()}
              className="inline-flex h-9 items-center gap-1.5 rounded-cmt-control border border-cmt-neutral-200 bg-white px-3 text-xs font-semibold text-cmt-neutral-700 transition-colors hover:bg-cmt-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ImagePlus className="size-3.5" />{uploading ? "Uploading…" : "Upload photo"}
            </button>
            {value && <button
              type="button"
              disabled={disabled}
              onClick={() => { onChange(""); setError(""); }}
              className="inline-flex h-9 items-center gap-1.5 rounded-cmt-control border border-cmt-neutral-200 bg-white px-3 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="size-3.5" />Remove
            </button>}
          </div>
          <input
            ref={fileRef}
            type="file"
            hidden
            accept={ACCEPTED.join(",")}
            disabled={disabled}
            onChange={event => { const files = Array.from(event.target.files ?? []); event.target.value = ""; void handleFile(files); }}
          />
          {error && <p className="text-xs font-medium text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}

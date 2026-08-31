"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

import { uploadHomepageImage } from "@/lib/firebase/homepageContent";
import { STOCK_IMAGES } from "@/lib/siteContent";
import { FieldLabel, inputClass } from "./ui";

/* Keep uploads compact for quick CRM previews and page delivery. The file is
   stored in Firebase Storage and only its download URL is saved in Firestore. */
const MAX_UPLOAD_BYTES = 5_000_000;

export default function ImageField({
  label,
  value,
  onChange,
  aspect = "aspect-[3/2]",
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  aspect?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [showLibrary, setShowLibrary] = useState(false);
  const [uploading, setUploading] = useState(false);
  const bypassOptimizer = value.startsWith("data:") || /^https?:\/\//i.test(value);

  const handleFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setError("");

    if (!file.type.startsWith("image/")) return setError("Choose an image file.");
    if (file.size > MAX_UPLOAD_BYTES)
      return setError("Images must be 5 MB or smaller. They are compressed automatically.");

    setUploading(true);
    try {
      onChange(await uploadHomepageImage(file));
    } catch (uploadError) {
      console.error("Unable to upload homepage image", uploadError);
      setError("That image could not be uploaded to Firebase Storage.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>

      <div className="flex gap-3">
        <div
          className={`relative ${aspect} w-32 shrink-0 overflow-hidden rounded-cmt-sm border border-cmt-neutral-200 bg-cmt-neutral-100`}
        >
          {value ? (
            /* Uploads and editor-provided remote URLs bypass the optimiser;
               arbitrary remote hosts are intentionally not allow-listed. */
            value.startsWith("data:") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt="" className="absolute inset-0 size-full object-cover" />
            ) : (
              <Image
                src={value}
                alt=""
                fill
                sizes="128px"
                unoptimized={bypassOptimizer}
                className="object-cover"
              />
            )
          ) : (
            <span className="grid size-full place-items-center text-cmt-neutral-400">
              <ImagePlus className="size-5" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <input
            value={value.startsWith("data:") ? "" : value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={value.startsWith("data:") ? "Uploaded image" : "/destinations/goa.jpg"}
            disabled={value.startsWith("data:")}
            className={`${inputClass} h-10 disabled:bg-cmt-neutral-50 disabled:text-cmt-neutral-400`}
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex h-9 items-center gap-1.5 rounded-cmt-control border border-cmt-neutral-200 bg-white px-3 text-xs font-semibold text-cmt-neutral-700 transition-colors hover:bg-cmt-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ImagePlus className="size-3.5" /> {uploading ? "Uploading…" : "Upload"}
            </button>
            <button
              type="button"
              onClick={() => setShowLibrary((current) => !current)}
              className="inline-flex h-9 items-center rounded-cmt-control border border-cmt-neutral-200 bg-white px-3 text-xs font-semibold text-cmt-neutral-700 transition-colors hover:bg-cmt-neutral-50"
            >
              {showLibrary ? "Hide library" : "Pick from library"}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="inline-flex h-9 items-center gap-1.5 rounded-cmt-control border border-cmt-neutral-200 bg-white px-3 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
              >
                <X className="size-3.5" /> Clear
              </button>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              void handleFile(event.target.files);
              event.target.value = "";
            }}
          />

          {error && <p className="text-xs font-medium text-red-600">{error}</p>}
        </div>
      </div>

      {showLibrary && (
        <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-2 rounded-cmt-sm border border-cmt-neutral-200 bg-cmt-neutral-50 p-2">
          {STOCK_IMAGES.map((src) => (
            <button
              key={src}
              type="button"
              title={src}
              onClick={() => {
                onChange(src);
                setShowLibrary(false);
              }}
              className={`relative aspect-[3/2] overflow-hidden rounded-cmt-sm border-2 transition-colors ${
                value === src ? "border-cmt-primary-500" : "border-transparent hover:border-cmt-neutral-300"
              }`}
            >
              <Image src={src} alt="" fill sizes="88px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

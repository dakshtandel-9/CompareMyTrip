"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";

import { deleteImageFromCloudflare, uploadImageToCloudflare } from "@/lib/cloudflareUpload";
import { FieldLabel } from "./ui";

/* Traveller photos follow the same rule as package gallery images: they go
   to Cloudflare through /api/uploads/image, capped at 5 MB. Empty means the
   card falls back to the initials disc. */
export default function AvatarField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  hint?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Please choose an image file.");
    if (file.size > 5_000_000) return setError("Each image must be 5 MB or smaller.");
    try {
      setBusy(true);
      setError("");
      const uploaded = await uploadImageToCloudflare(file, "homepage");
      if (value) await deleteImageFromCloudflare(value).catch(() => {});
      onChange(uploaded);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The image could not be uploaded.");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (!value) return;
    try {
      setBusy(true);
      setError("");
      await deleteImageFromCloudflare(value);
      onChange("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The image could not be deleted.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>

      <div className="flex items-center gap-3">
        <div className="relative size-14 shrink-0 overflow-hidden rounded-cmt-full border border-cmt-neutral-200 bg-cmt-neutral-100">
          {value ? (
            <Image src={value} alt="" fill sizes="56px" unoptimized className="object-cover" />
          ) : (
            <span className="grid size-full place-items-center text-cmt-neutral-400">
              <ImagePlus className="size-5" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="inline-flex h-9 items-center gap-1.5 rounded-cmt-control border border-cmt-neutral-200 bg-white px-3 text-xs font-semibold text-cmt-neutral-700 transition-colors hover:bg-cmt-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ImagePlus className="size-3.5" />
              {busy ? "Uploading…" : value ? "Replace" : "Upload photo"}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => void handleRemove()}
                disabled={busy}
                className="inline-flex h-9 items-center gap-1.5 rounded-cmt-control border border-cmt-neutral-200 bg-white px-3 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="size-3.5" /> Remove
              </button>
            )}
          </div>
          {hint && !error && <p className="text-[11px] text-cmt-neutral-500">{hint}</p>}
          {error && <p className="text-xs font-medium text-red-600">{error}</p>}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(event) => {
          void handleFile(event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}

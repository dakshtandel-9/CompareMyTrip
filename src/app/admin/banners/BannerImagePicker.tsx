"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlus, Images, Loader2, X } from "lucide-react";

import { uploadHomepageImage } from "@/lib/firebase/homepageContent";
import { STOCK_IMAGES } from "@/lib/siteContent";
import { inputClass } from "../_components/ui";

/* ------------------------------------------------------------------ */
/* The banner's photo, edited on the banner itself.                     */
/*                                                                      */
/* Deliberately not the shared ImageField: that one pairs a postage-     */
/* stamp thumbnail with a column of buttons, which is right for a card   */
/* photo in a list of twenty, and wrong here — a masthead is a wide      */
/* picture with words over it, so the preview has to be the real thing   */
/* at the real shape. Once it is, a second thumbnail of the same image   */
/* is just clutter, so the controls sit on the picture instead.          */
/* ------------------------------------------------------------------ */

const MAX_UPLOAD_BYTES = 5_000_000;

export default function BannerImagePicker({
  value,
  onChange,
  onUploaded,
  children,
}: {
  value: string;
  onChange: (next: string) => void;
  /** Fired only for a fresh upload, so the screen can track the object it
      just created in the bucket until it is published or thrown away. A
      library pick or a pasted path creates nothing and reports nothing. */
  onUploaded: (url: string) => void;
  /** The banner copy, drawn over the photo exactly as the site draws it. */
  children: React.ReactNode;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const isUpload = value.startsWith("data:");
  const bypassOptimizer = isUpload || /^https?:\/\//i.test(value);

  const handleFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setError("");

    if (!file.type.startsWith("image/")) return setError("Choose an image file.");
    if (file.size > MAX_UPLOAD_BYTES) {
      return setError("Images must be 5 MB or smaller.");
    }

    setUploading(true);
    try {
      const url = await uploadHomepageImage(file);
      onUploaded(url);
      onChange(url);
    } catch (cause) {
      console.error("Unable to upload banner image", cause);
      setError("That image could not be uploaded.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="relative isolate overflow-hidden rounded-cmt-md bg-cmt-secondary-900">
        {value ? (
          isUpload ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="absolute inset-0 -z-20 size-full object-cover" />
          ) : (
            <Image
              src={value}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 900px"
              unoptimized={bypassOptimizer}
              className="-z-20 object-cover object-center"
            />
          )
        ) : null}

        {/* The site's own gradients, so the copy is read against the
            contrast it will actually have. */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/90 via-black/65 to-black/10" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/45 via-transparent to-black/15" />

        <div className="absolute right-3 top-3 z-10 flex flex-wrap justify-end gap-2">
          <PhotoButton
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            icon={
              uploading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <ImagePlus className="size-3.5" />
              )
            }
          >
            {uploading ? "Uploading…" : "Upload"}
          </PhotoButton>

          <PhotoButton
            onClick={() => setShowLibrary((current) => !current)}
            icon={<Images className="size-3.5" />}
          >
            {showLibrary ? "Close library" : "Library"}
          </PhotoButton>

          {value && (
            <PhotoButton onClick={() => onChange("")} icon={<X className="size-3.5" />}>
              Remove
            </PhotoButton>
          )}
        </div>

        <div className="flex min-h-[210px] items-center px-6 py-8 sm:min-h-[240px] sm:px-8">
          {children}
        </div>
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

      <p className="mt-2 text-[11px] text-cmt-neutral-500">
        JPG, PNG or WebP · up to 5 MB · files under 800 KB are stored as they
        are, larger ones are resized and saved as WebP at 70% quality.
      </p>

      {error && <p className="mt-2 text-xs font-medium text-cmt-error-700">{error}</p>}

      {showLibrary && (
        <div className="mt-3 rounded-cmt-md border border-cmt-neutral-200 bg-cmt-neutral-50 p-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-cmt-neutral-500">
            Photo library
          </p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-2">
            {STOCK_IMAGES.map((src) => (
              <button
                key={src}
                type="button"
                title={src}
                onClick={() => {
                  onChange(src);
                  setShowLibrary(false);
                }}
                className={`relative aspect-[16/10] overflow-hidden rounded-cmt-sm border-2 transition-colors ${
                  value === src
                    ? "border-cmt-primary-500"
                    : "border-transparent hover:border-cmt-neutral-300"
                }`}
              >
                <Image src={src} alt="" fill sizes="120px" className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* The path stays editable for anyone pasting a URL, but it is the
          quiet option now rather than the first thing in the card. */}
      <label className="mt-3 block">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-cmt-neutral-500">
          Image path
        </span>
        <input
          value={isUpload ? "" : value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={isUpload ? "Uploaded image" : "/destinations/goa.jpg"}
          disabled={isUpload}
          className={`${inputClass} mt-1 h-10 font-mono text-[12px] disabled:bg-cmt-neutral-50 disabled:text-cmt-neutral-400`}
        />
      </label>
    </div>
  );
}

function PhotoButton({
  children,
  icon,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-cmt-full bg-white/90 px-3 text-[11px] font-semibold text-cmt-neutral-900 shadow-cmt-xs backdrop-blur-sm transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      {icon}
      {children}
    </button>
  );
}

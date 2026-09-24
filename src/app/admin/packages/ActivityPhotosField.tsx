"use client";

import { ImagePlus } from "lucide-react";

import StayPhotoField from "./StayPhotoField";

/* ------------------------------------------------------------------ */
/* Up to three photos for one itinerary activity. They print under the  */
/* activity in the downloadable itinerary PDF, like the pictures on a   */
/* booking voucher. Each slot reuses the stay photo field, so a photo   */
/* can be uploaded or pasted as a URL.                                  */
/* ------------------------------------------------------------------ */

export const MAX_ACTIVITY_PHOTOS = 3;

export default function ActivityPhotosField({ label, value, disabled, onChange, onUploadImages }: {
  label: string;
  value: string[];
  disabled: boolean;
  onChange: (next: string[]) => void;
  onUploadImages: (files: File[]) => Promise<string[]>;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-cmt-neutral-500">Optional. Up to {MAX_ACTIVITY_PHOTOS} photos, printed under this activity in the itinerary PDF.</p>
      {value.map((photo, index) => (
        <StayPhotoField
          key={index}
          label={`${label} ${index + 1}`}
          value={photo}
          disabled={disabled}
          onUploadImages={onUploadImages}
          onChange={next => onChange(value.map((item, i) => i === index ? next : item))}
        />
      ))}
      {value.length < MAX_ACTIVITY_PHOTOS && <button
        type="button"
        disabled={disabled}
        onClick={() => onChange([...value, ""])}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-dashed border-cmt-neutral-300 bg-white px-3 text-xs font-semibold disabled:opacity-40"
      >
        <ImagePlus size={14} />Add activity photo
      </button>}
    </div>
  );
}

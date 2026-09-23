"use client";

import { useState } from "react";
import { LoaderCircle, RotateCcw, Upload } from "lucide-react";

import { ACCREDITATIONS, PAYMENT_METHODS, TrustStripPreview } from "@/components/TrustStrip";
import { uploadHomepageImage } from "@/lib/firebase/homepageContent";
import type { FooterBadgesContent } from "@/lib/siteContent";
import { Button, Card } from "../_components/ui";

type ImageGroup = "paymentImages" | "accreditationImages";

export default function FooterBadgesEditor({ value, onChange }: {
  value: FooterBadgesContent;
  onChange: (update: (current: FooterBadgesContent) => FooterBadgesContent) => void;
}) {
  const [uploading, setUploading] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const replace = (group: ImageGroup, id: string, image: string) => {
    // Merge into the latest draft even if other uploads finish or the admin
    // switches sections while this request is running.
    onChange((current) => ({ ...current, [group]: { ...current[group], [id]: image } }));
  };

  const upload = async (group: ImageGroup, id: string, file: File) => {
    const key = `${group}-${id}`;
    setErrors((current) => ({ ...current, [key]: "" }));
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setErrors((current) => ({ ...current, [key]: "Choose a PNG, JPG or WebP image." }));
      return;
    }
    setUploading((current) => [...current, key]);
    try {
      replace(group, id, await uploadHomepageImage(file));
    } catch (error) {
      setErrors((current) => ({ ...current, [key]: error instanceof Error ? error.message : "Upload failed. Please try again." }));
    } finally {
      setUploading((current) => current.filter((item) => item !== key));
    }
  };

  const groups: { title: string; key: ImageGroup; items: { id: string; label: string }[] }[] = [
    { title: "Payment mode images", key: "paymentImages", items: PAYMENT_METHODS.map((item) => ({ id: item.id, label: item.name })) },
    { title: "Accreditation images", key: "accreditationImages", items: ACCREDITATIONS },
  ];

  return (
    <div className="space-y-5">
      <Card title="Footer preview" description="Upload your images below, wait for uploads to finish, then select Publish changes to update the website. PNG, JPG or WebP, up to 5 MB each. Transparent PNGs work well for logos.">
        <p role="status" className="text-xs text-cmt-neutral-500">
          {uploading.length ? `Uploading ${uploading.length} image${uploading.length === 1 ? "" : "s"}…` : "Images fit inside each badge without cropping. Restore original removes a custom replacement."}
        </p>
        <TrustStripPreview value={{ ...value, enabled: true }} />
      </Card>
      <Card title="Join WhatsApp community button" description="Adds a button under the footer logo inviting visitors into your WhatsApp community. Leave the link empty to hide the button.">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold text-cmt-neutral-600">
            Community invite link
            <input
              type="url"
              inputMode="url"
              value={value.communityUrl ?? ""}
              onChange={(event) => { const communityUrl = event.target.value; onChange((current) => ({ ...current, communityUrl })); }}
              placeholder="https://chat.whatsapp.com/…"
              className="mt-1.5 h-11 w-full rounded-xl border border-cmt-neutral-200 bg-white px-3 text-sm outline-none focus:border-cmt-primary-500 focus:shadow-[var(--cmt-focus-ring)]"
            />
          </label>
          <label className="text-xs font-semibold text-cmt-neutral-600">
            Button text <span className="font-medium text-cmt-neutral-400">— optional</span>
            <input
              value={value.communityLabel ?? ""}
              onChange={(event) => { const communityLabel = event.target.value.slice(0, 40); onChange((current) => ({ ...current, communityLabel })); }}
              placeholder="Join WhatsApp community"
              maxLength={40}
              className="mt-1.5 h-11 w-full rounded-xl border border-cmt-neutral-200 bg-white px-3 text-sm outline-none focus:border-cmt-primary-500 focus:shadow-[var(--cmt-focus-ring)]"
            />
          </label>
        </div>
        {/* Saved links are checked again when the site reads them, so an
            address that is not http(s) simply hides the button. Saying so
            here stops that looking like the save silently failed. */}
        {(value.communityUrl ?? "").trim() !== "" && !/^https?:\/\/[^\s]+$/i.test((value.communityUrl ?? "").trim()) && (
          <p role="alert" className="mt-3 text-xs text-cmt-error-700">
            Enter a full link starting with https:// — open your community in WhatsApp, choose Invite via link, and paste it here.
          </p>
        )}
      </Card>
      <Card title="Scrolling footer logos" description="Show the original tourism logos in a continuous scrolling strip above the footer. Publish changes to apply this setting.">
        <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={value.tourismLogosEnabled !== false} onChange={(event) => { const tourismLogosEnabled = event.target.checked; onChange((current) => ({ ...current, tourismLogosEnabled })); }} /> Show scrolling logos</label>
      </Card>
      {groups.map((group) => (
        <Card key={group.key} title={group.title}>
          <div className="grid gap-4 sm:grid-cols-2">
            {group.items.map((item) => {
              const key = `${group.key}-${item.id}`;
              const busy = uploading.includes(key);
              return (
                <div key={key} className="rounded-cmt-sm border border-cmt-neutral-200 p-4">
                  <h3 className="text-sm font-semibold">{item.label}</h3>
                  {group.key === "accreditationImages" && <label className="mt-3 flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={value.verifiedAccreditations?.includes(item.id) ?? false} onChange={(event) => { const verified = event.target.checked; onChange((current) => ({ ...current, verifiedAccreditations: verified ? [...new Set([...(current.verifiedAccreditations ?? []), item.id])] : (current.verifiedAccreditations ?? []).filter((id) => id !== item.id) })); }} /> Verified against current business records</label>}
                  <p className="mt-1 text-xs text-cmt-neutral-500">{value[group.key][item.id] ? "Custom image" : "Original artwork"}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <label className={`relative inline-flex min-h-11 items-center gap-2 rounded-cmt-control border border-cmt-neutral-200 bg-white px-3 text-xs font-semibold focus-within:outline-2 focus-within:outline-cmt-primary-500 ${busy ? "opacity-50" : "cursor-pointer hover:bg-cmt-neutral-50"}`}>
                      {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />}
                      {busy ? "Uploading…" : "Upload image"}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        aria-label={`Upload ${item.label} image`}
                        disabled={busy}
                        className="absolute inset-0 w-full cursor-pointer opacity-0"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          event.target.value = "";
                          if (file) void upload(group.key, item.id, file);
                        }}
                      />
                    </label>
                    <Button variant="ghost" disabled={busy || !value[group.key][item.id]} onClick={() => replace(group.key, item.id, "")}>
                      <RotateCcw className="size-3.5" /> Restore original
                    </Button>
                  </div>
                  {errors[key] && <p role="alert" className="mt-2 text-xs text-red-600">{errors[key]}</p>}
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}

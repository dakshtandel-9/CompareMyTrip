"use client";

import Image from "next/image";
import { useId, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Eye, ImagePlus, LayoutGrid, MapPin, MessageSquare, Plus, Square, Trash2 } from "lucide-react";
import {
  BUILTIN_PACKAGE_SECTIONS,
  type PackageCustomSection,
  type PackageLocation,
  type PackagePageSections,
  type PackageWrittenReview,
} from "@/lib/packageDetailSections";
import PackagePageSectionsPreview from "@/app/packages/_components/PackagePageSections";
import { FieldLabel, inputClass, textareaClass, Toggle } from "../_components/ui";

const buttonClass = "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-cmt-control border border-cmt-neutral-200 bg-white px-3 text-xs font-semibold transition-colors hover:bg-cmt-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 disabled:cursor-not-allowed disabled:opacity-40";
const addButtonClass = `${buttonClass} border-dashed`;
const panelClass = "rounded-cmt-control border border-cmt-neutral-200 bg-white p-4 sm:p-5";
const mutedClass = "text-xs leading-5 text-cmt-neutral-500";
const layouts = [
  { value: "box", label: "Box", description: "One box for your text", icon: Square },
  { value: "boxes", label: "Multiple boxes", description: "Cards displayed together", icon: LayoutGrid },
  { value: "dropdown", label: "Dropdown", description: "Click to expand each item", icon: ChevronDown },
] as const;

function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function BlockHeading({ icon, title, copy }: { icon: ReactNode; title: string; copy: string }) {
  return <div className="mb-4 flex items-start gap-3"><span className="mt-0.5 text-cmt-neutral-600">{icon}</span><div><h3 className="text-base font-semibold text-cmt-neutral-900">{title}</h3><p className={`mt-1 ${mutedClass}`}>{copy}</p></div></div>;
}

function OrderButtons({ label, index, length, onMove }: { label: string; index: number; length: number; onMove: (direction: -1 | 1) => void }) {
  return <><button type="button" className={buttonClass} aria-label={`Move ${label} up`} title="Move up" disabled={index === 0} onClick={() => onMove(-1)}><ArrowUp className="size-4" /></button><button type="button" className={buttonClass} aria-label={`Move ${label} down`} title="Move down" disabled={index === length - 1} onClick={() => onMove(1)}><ArrowDown className="size-4" /></button></>;
}

function Visibility({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="mr-auto flex min-h-10 items-center gap-2 text-xs font-semibold text-cmt-neutral-700"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-4 accent-cmt-primary-500" />{label}</label>;
}

function LayoutSelector({ value, onChange }: { value: PackageCustomSection["layout"]; onChange: (layout: PackageCustomSection["layout"]) => void }) {
  const name = useId();
  return <fieldset><legend className="mb-2 text-xs font-semibold text-cmt-neutral-700">Section layout</legend><div className="grid gap-2 sm:grid-cols-3">{layouts.map(({ value: option, label, description, icon: Icon }) => <label key={option} className="relative cursor-pointer"><input type="radio" className="peer sr-only" name={name} value={option} checked={value === option} onChange={() => onChange(option)} /><span className={`flex h-full gap-2.5 rounded-cmt-control border p-3 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cmt-primary-500 ${value === option ? "border-cmt-primary-500 bg-cmt-primary-50" : "border-cmt-neutral-200 bg-white hover:border-cmt-neutral-300"}`}><Icon className="mt-0.5 size-4 shrink-0" /><span><span className="block text-xs font-semibold">{label}</span><span className="mt-1 block text-[11px] leading-4 text-cmt-neutral-500">{description}</span></span></span></label>)}</div></fieldset>;
}

function UploadInput({ label, multiple = false, disabled = false, onSelect }: { label: string; multiple?: boolean; disabled?: boolean; onSelect: (files: File[]) => void }) {
  return <label className="block"><FieldLabel>{label}</FieldLabel><input type="file" accept="image/jpeg,image/png,image/webp" multiple={multiple} disabled={disabled} onChange={(event) => { const files = Array.from(event.target.files ?? []); event.target.value = ""; if (files.length) onSelect(files); }} className="block w-full rounded-cmt-control border border-dashed border-cmt-neutral-300 bg-cmt-neutral-50 p-3 text-xs text-cmt-neutral-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold file:text-cmt-neutral-900 disabled:opacity-40" /><span className={`mt-1 block ${mutedClass}`}>JPG, PNG or WebP, up to 5 MB each.</span></label>;
}

export default function PackagePageSectionsEditor({ value, onChange, onUploadImages, busy, allowReviews }: {
  value: PackagePageSections;
  onChange: (value: PackagePageSections) => void;
  onUploadImages: (files: File[]) => Promise<string[]>;
  busy: boolean;
  allowReviews: boolean;
}) {
  const [newLayout, setNewLayout] = useState<PackageCustomSection["layout"]>("box");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const disabled = busy || uploading;
  const patchSection = (id: string, patch: Partial<PackageCustomSection>) => onChange({ ...value, sections: value.sections.map((section) => section.id === id ? { ...section, ...patch } : section) });
  const patchLocation = (id: string, patch: Partial<PackageLocation>) => onChange({ ...value, locations: { ...value.locations, items: value.locations.items.map((location) => location.id === id ? { ...location, ...patch } : location) } });
  const patchReview = (id: string, patch: Partial<PackageWrittenReview>) => onChange({ ...value, reviews: { ...value.reviews, items: value.reviews.items.map((review) => review.id === id ? { ...review, ...patch } : review) } });

  const addSection = () => {
    const section: PackageCustomSection = { id: crypto.randomUUID(), title: "", layout: newLayout, visible: true, body: "", items: newLayout === "box" ? [] : [{ id: crypto.randomUUID(), title: "", body: "" }] };
    onChange({ ...value, sections: [...value.sections, section] });
  };
  const addLocation = (type: PackageLocation["type"]) => onChange({ ...value, locations: { ...value.locations, items: [...value.locations.items, { id: crypto.randomUUID(), type, name: "", address: "", notes: "", mapUrl: "", image: "", visible: true }] } });

  const uploadImages = async (files: File[], locationId?: string) => {
    if (disabled) return;
    setUploadError("");
    const remaining = locationId ? 1 : 20 - value.gallery.images.length;
    if (files.length > remaining) { setUploadError(locationId ? "Choose one image for this location." : `You can add ${remaining} more gallery ${remaining === 1 ? "photo" : "photos"}. Choose fewer images.`); return; }
    if (files.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type))) { setUploadError("Please choose JPG, PNG or WebP images."); return; }
    if (files.some((file) => file.size > 5_000_000)) { setUploadError("Each image must be 5 MB or smaller."); return; }
    try {
      setUploading(true);
      const images = await onUploadImages(files);
      if (!images.length) return;
      if (locationId) patchLocation(locationId, { image: images[0] });
      else onChange({ ...value, gallery: { ...value.gallery, images: [...value.gallery.images, ...images].slice(0, 20) } });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "The images could not be uploaded. Please try again.");
    } finally { setUploading(false); }
  };

  return (
    <section className="rounded-cmt-md border border-cmt-neutral-200 bg-white p-5 shadow-cmt-sm sm:p-7">
      <h2 className="font-display text-xl font-semibold">7. Customize the detail page</h2>
      <p className={`mt-1 ${mutedClass}`}>Choose the sections travellers see, then add your own boxes, photos and meeting points below the package details. Every choice applies only to this package.</p>
      <fieldset disabled={disabled} className="mt-6 min-w-0 space-y-6 disabled:opacity-70" aria-busy={disabled}>
        <legend className="sr-only">Package detail page sections</legend>
        <div>
          <BlockHeading icon={<Eye className="size-5" />} title="Show or hide existing sections" copy="Turn a section off to hide its box. Your saved text stays available when you turn it back on." />
          <div className="grid gap-2 sm:grid-cols-2">
            {BUILTIN_PACKAGE_SECTIONS.map((section) => <Toggle key={section.id} label={section.label} checked={!value.hiddenSections.includes(section.id)} onChange={(checked) => onChange({ ...value, hiddenSections: checked ? value.hiddenSections.filter((id) => id !== section.id) : [...value.hiddenSections, section.id] })} />)}
          </div>
        </div>

        <div className="border-t border-cmt-neutral-200 pt-6">
          <BlockHeading icon={<LayoutGrid className="size-5" />} title="Your own sections" copy="Add anything useful: things to carry, travel tips, optional activities or FAQs. Use the arrows to set their order at the bottom of the page." />
          <div className="space-y-4">
            {value.sections.map((section, index) => (
              <div key={section.id} className={panelClass}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h4 className="min-w-0 break-words text-sm font-semibold">{index + 1}. {section.title || "Untitled section"}{!section.visible && <span className="ml-2 rounded-full bg-cmt-neutral-100 px-2 py-1 text-[10px] font-medium text-cmt-neutral-500">Hidden</span>}</h4>
                  <div className="flex flex-wrap gap-1.5"><OrderButtons label={`section ${index + 1}`} index={index} length={value.sections.length} onMove={(direction) => onChange({ ...value, sections: moveItem(value.sections, index, direction) })} /><button type="button" className={`${buttonClass} text-cmt-error-700`} aria-label={`Remove section ${index + 1}`} onClick={() => onChange({ ...value, sections: value.sections.filter((item) => item.id !== section.id) })}><Trash2 className="size-3.5" />Remove</button></div>
                </div>
                <div className="space-y-4">
                  <Visibility label={`Show section ${index + 1} on the website`} checked={section.visible} onChange={(visible) => patchSection(section.id, { visible })} />
                  <label className="block"><FieldLabel>Section title</FieldLabel><input value={section.title} onChange={(event) => patchSection(section.id, { title: event.target.value })} placeholder="e.g. Things to carry" className={inputClass} /></label>
                  <LayoutSelector value={section.layout} onChange={(layout) => patchSection(section.id, { layout, items: layout !== "box" && !section.items.length ? [{ id: crypto.randomUUID(), title: "", body: "" }] : section.items })} />
                  <label className="block"><FieldLabel>{section.layout === "box" ? "Box content" : "Introduction (optional)"}</FieldLabel><textarea value={section.body} onChange={(event) => patchSection(section.id, { body: event.target.value })} placeholder="Write the details you want travellers to see." className={textareaClass} /></label>
                  {section.layout !== "box" && <div className="space-y-3">
                    {section.items.map((item, itemIndex) => <div key={item.id} className="rounded-cmt-control border border-cmt-neutral-200 bg-cmt-neutral-50 p-3 sm:p-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-semibold">{section.layout === "dropdown" ? "Dropdown item" : "Box"} {itemIndex + 1}</p><div className="flex gap-1.5"><OrderButtons label={`item ${itemIndex + 1} in section ${index + 1}`} index={itemIndex} length={section.items.length} onMove={(direction) => patchSection(section.id, { items: moveItem(section.items, itemIndex, direction) })} /><button type="button" className={`${buttonClass} text-cmt-error-700`} aria-label={`Remove item ${itemIndex + 1} from section ${index + 1}`} onClick={() => patchSection(section.id, { items: section.items.filter((entry) => entry.id !== item.id) })}><Trash2 className="size-3.5" /></button></div></div>
                      <Visibility label={`Show item ${itemIndex + 1} in section ${index + 1} on the website`} checked={item.visible !== false} onChange={(visible) => patchSection(section.id, { items: section.items.map((entry) => entry.id === item.id ? { ...entry, visible } : entry) })} />
                      <label className="mt-3 block"><FieldLabel>{section.layout === "dropdown" ? "Item title or question" : "Box title"}</FieldLabel><input value={item.title} onChange={(event) => patchSection(section.id, { items: section.items.map((entry) => entry.id === item.id ? { ...entry, title: event.target.value } : entry) })} placeholder={section.layout === "dropdown" ? "e.g. What should I bring?" : "e.g. Clothing"} className={inputClass} /></label>
                      <label className="mt-3 block"><FieldLabel>{section.layout === "dropdown" ? "Details or answer" : "Box text"}</FieldLabel><textarea value={item.body} onChange={(event) => patchSection(section.id, { items: section.items.map((entry) => entry.id === item.id ? { ...entry, body: event.target.value } : entry) })} className={textareaClass} /></label>
                    </div>)}
                    <button type="button" className={addButtonClass} onClick={() => patchSection(section.id, { items: [...section.items, { id: crypto.randomUUID(), title: "", body: "" }] })}><Plus className="size-4" />{section.layout === "dropdown" ? "Add dropdown item" : "Add box to this section"}</button>
                  </div>}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-cmt-control border border-dashed border-cmt-neutral-300 bg-cmt-neutral-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end"><label className="block flex-1"><FieldLabel>I need a...</FieldLabel><select className={inputClass} value={newLayout} onChange={(event) => setNewLayout(event.target.value as PackageCustomSection["layout"])}><option value="box">Box</option><option value="boxes">Multiple boxes</option><option value="dropdown">Dropdown</option></select></label><button type="button" onClick={addSection} className="inline-flex h-11 items-center justify-center gap-2 rounded-cmt-control bg-cmt-neutral-900 px-4 text-sm font-semibold text-white hover:bg-cmt-neutral-800"><Plus className="size-4" />Add section</button></div>
            <p className={`mt-2 ${mutedClass}`}>Switch layouts at any time. Text and extra boxes are kept if you switch back.</p>
          </div>
          {value.sections.length > 0 && <div className="mt-4"><button type="button" className={buttonClass} aria-expanded={showPreview} onClick={() => setShowPreview(!showPreview)}><Eye className="size-4" />{showPreview ? "Hide section preview" : "Preview your sections"}</button>{showPreview && <div className="mt-3 rounded-cmt-control border border-cmt-neutral-200 bg-cmt-neutral-50 p-3 sm:p-4"><p className={`mb-3 ${mutedClass}`}>Only visible sections with content appear in this preview.</p><PackagePageSectionsPreview value={{ ...value, gallery: { ...value.gallery, enabled: false }, locations: { ...value.locations, enabled: false }, reviews: { ...value.reviews, enabled: false } }} /></div>}</div>}
        </div>

        <div className="border-t border-cmt-neutral-200 pt-6">
          <BlockHeading icon={<ImagePlus className="size-5" />} title="Optional photo gallery" copy="Add a separate gallery near the bottom of the page. The main package photos are managed in the Photos step." />
          <Toggle label="Show extra photo gallery" description="Turn this off to hide the gallery and keep its photos for later." checked={value.gallery.enabled} onChange={(enabled) => onChange({ ...value, gallery: { ...value.gallery, enabled } })} />
          {value.gallery.enabled && <div className="mt-4 space-y-4">
            <UploadInput label={`Upload gallery photos (${value.gallery.images.length}/20)`} multiple disabled={value.gallery.images.length >= 20} onSelect={(files) => { void uploadImages(files); }} />
            <p className={mutedClass}>Up to 20 images. Photos are optional; an empty gallery stays off the website.</p>
            {value.gallery.images.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{value.gallery.images.map((src, index) => <div key={`${src}-${index}`} className="overflow-hidden rounded-cmt-control border border-cmt-neutral-200"><div className="relative aspect-[4/3] bg-cmt-neutral-100"><Image src={src} alt={`Extra gallery photo ${index + 1}`} fill sizes="(max-width: 640px) 40vw, 220px" className="object-cover" /></div><div className="flex flex-wrap items-center justify-center gap-1 p-2"><OrderButtons label={`gallery photo ${index + 1}`} index={index} length={value.gallery.images.length} onMove={(direction) => onChange({ ...value, gallery: { ...value.gallery, images: moveItem(value.gallery.images, index, direction) } })} /><button type="button" className={`${buttonClass} text-cmt-error-700`} aria-label={`Remove gallery photo ${index + 1}`} onClick={() => onChange({ ...value, gallery: { ...value.gallery, images: value.gallery.images.filter((_, imageIndex) => imageIndex !== index) } })}><Trash2 className="size-3.5" /></button></div></div>)}</div>}
          </div>}
        </div>

        <div className="border-t border-cmt-neutral-200 pt-6">
          <BlockHeading icon={<MapPin className="size-5" />} title="Pickup & drop locations" copy="Add several meeting points, with a name, directions, map link and an optional photo for each." />
          <Toggle label="Show pickup & drop locations" description="Turning this off keeps all locations saved for later." checked={value.locations.enabled} onChange={(enabled) => onChange({ ...value, locations: { ...value.locations, enabled } })} />
          {value.locations.enabled && <div className="mt-4 space-y-4">
            {value.locations.items.map((location, index) => <div key={location.id} className={panelClass}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h4 className="break-words text-sm font-semibold">{index + 1}. {location.name || (location.type === "pickup" ? "Pickup location" : "Drop location")}{!location.visible && <span className="ml-2 text-xs font-normal text-cmt-neutral-500">Hidden</span>}</h4><div className="flex gap-1.5"><OrderButtons label={`location ${index + 1}`} index={index} length={value.locations.items.length} onMove={(direction) => onChange({ ...value, locations: { ...value.locations, items: moveItem(value.locations.items, index, direction) } })} /><button type="button" className={`${buttonClass} text-cmt-error-700`} aria-label={`Remove location ${index + 1}`} onClick={() => onChange({ ...value, locations: { ...value.locations, items: value.locations.items.filter((item) => item.id !== location.id) } })}><Trash2 className="size-3.5" />Remove</button></div></div>
              <Visibility label={`Show location ${index + 1} on the website`} checked={location.visible} onChange={(visible) => patchLocation(location.id, { visible })} />
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <label><FieldLabel>Location type</FieldLabel><select value={location.type} onChange={(event) => patchLocation(location.id, { type: event.target.value as PackageLocation["type"] })} className={inputClass}><option value="pickup">Pickup</option><option value="drop">Drop</option></select></label>
                <label><FieldLabel>Location name</FieldLabel><input value={location.name} onChange={(event) => patchLocation(location.id, { name: event.target.value })} placeholder="e.g. Airport arrivals, Gate 3" className={inputClass} /></label>
                <label className="sm:col-span-2"><FieldLabel>Address or map search location</FieldLabel><input value={location.address} onChange={(event) => patchLocation(location.id, { address: event.target.value })} placeholder="Street address, landmark and city" className={inputClass} /><span className={`mt-1 block ${mutedClass}`}>Travellers can open this address in maps.</span></label>
                <label className="sm:col-span-2"><FieldLabel>Map link (optional)</FieldLabel><input inputMode="url" value={location.mapUrl} onChange={(event) => patchLocation(location.id, { mapUrl: event.target.value })} placeholder="https://maps.google.com/..." className={inputClass} /><span className={`mt-1 block ${mutedClass}`}>Paste a shared map link to point to the exact meeting spot.</span></label>
                <label className="sm:col-span-2"><FieldLabel>Meeting time & instructions (optional)</FieldLabel><textarea value={location.notes} onChange={(event) => patchLocation(location.id, { notes: event.target.value })} placeholder="e.g. Meet at 8:30 AM. Your driver will wait beside the information desk." className={textareaClass} /></label>
                <div className="sm:col-span-2">{location.image ? <div className="flex flex-wrap items-center gap-3"><div className="relative h-24 w-36 overflow-hidden rounded-cmt-control border border-cmt-neutral-200"><Image src={location.image} alt={location.name || `Location ${index + 1}`} fill sizes="144px" className="object-cover" /></div><button type="button" className={`${buttonClass} text-cmt-error-700`} aria-label={`Remove photo for location ${index + 1}`} onClick={() => patchLocation(location.id, { image: "" })}><Trash2 className="size-3.5" />Remove photo</button></div> : <UploadInput label="Location photo or map image (optional)" onSelect={(files) => { void uploadImages(files, location.id); }} />}</div>
              </div>
            </div>)}
            <div className="flex flex-wrap gap-2"><button type="button" className={addButtonClass} onClick={() => addLocation("pickup")}><Plus className="size-4" />Add pickup location</button><button type="button" className={addButtonClass} onClick={() => addLocation("drop")}><Plus className="size-4" />Add drop location</button></div>
          </div>}
        </div>

        {allowReviews && <div className="border-t border-cmt-neutral-200 pt-6">
          <BlockHeading icon={<MessageSquare className="size-5" />} title="Optional reviews" copy="Add reviews supplied by your travellers. These reviews are entered by the package editor; saved, visible reviews appear on the website." />
          <Toggle label="Write reviews" description="Turn on to add reviews for this package. Turn off to hide saved reviews and keep them for later." checked={value.reviews.enabled} onChange={(enabled) => onChange({ ...value, reviews: { ...value.reviews, enabled } })} />
          {value.reviews.enabled && <div className="mt-4 space-y-4">
            {value.reviews.items.map((review, index) => <div key={review.id} className={panelClass}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h4 className="text-sm font-semibold">Review {index + 1}</h4><div className="flex gap-1.5"><OrderButtons label={`review ${index + 1}`} index={index} length={value.reviews.items.length} onMove={(direction) => onChange({ ...value, reviews: { ...value.reviews, items: moveItem(value.reviews.items, index, direction) } })} /><button type="button" className={`${buttonClass} text-cmt-error-700`} aria-label={`Remove review ${index + 1}`} onClick={() => onChange({ ...value, reviews: { ...value.reviews, items: value.reviews.items.filter((item) => item.id !== review.id) } })}><Trash2 className="size-3.5" />Remove</button></div></div>
              <Visibility label={`Show review ${index + 1} on the website`} checked={review.visible} onChange={(visible) => patchReview(review.id, { visible })} />
              <div className="mt-3 grid gap-4 sm:grid-cols-2"><label><FieldLabel>Reviewer name</FieldLabel><input value={review.name} onChange={(event) => patchReview(review.id, { name: event.target.value })} placeholder="Traveller's name" className={inputClass} /></label><label><FieldLabel>Rating</FieldLabel><select value={review.rating} onChange={(event) => patchReview(review.id, { rating: Number(event.target.value) })} className={inputClass}>{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} {rating === 1 ? "star" : "stars"}</option>)}</select></label><label className="sm:col-span-2"><FieldLabel>Review text</FieldLabel><textarea value={review.text} onChange={(event) => patchReview(review.id, { text: event.target.value })} placeholder="Enter the traveller's review." className={textareaClass} /></label></div>
            </div>)}
            <button type="button" className={addButtonClass} onClick={() => onChange({ ...value, reviews: { ...value.reviews, items: [...value.reviews.items, { id: crypto.randomUUID(), name: "", rating: 5, text: "", visible: true }] } })}><Plus className="size-4" />Add review</button>
            {!value.reviews.items.length && <p className={mutedClass}>No reviews added yet. This section stays off the website until you add a review.</p>}
          </div>}
        </div>}
      </fieldset>
      {uploading && <p role="status" className="mt-4 text-sm font-medium text-cmt-neutral-600">Uploading photos…</p>}
      {uploadError && <p role="alert" className="mt-4 rounded-cmt-control border border-red-200 bg-red-50 p-3 text-sm text-red-700">{uploadError}</p>}
    </section>
  );
}

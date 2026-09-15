"use client";

import Image from "next/image";
import { ArrowUpRight, ChevronDown, MapPin, Star } from "lucide-react";
import type { ReactNode } from "react";
import {
  locationEmbedUrl,
  locationMapLink,
  isVisiblePackageSection,
  type PackageSectionPlacement,
  type PackageCustomSection,
  type PackagePageSections as PackagePageSectionsValue,
} from "@/lib/packageDetailSections";
import { InlineText, EditableGallery, EditAction, usePackageEditing } from "./PackageInlineEditing";
import { movePackageSection } from "@/lib/packageDetailSections";

const bodyClass = "whitespace-pre-wrap break-words text-sm leading-7 text-cmt-neutral-600";

export function getVisiblePackageReviews(value: PackagePageSectionsValue) {
  return value.reviews.enabled
    ? value.reviews.items.filter((review) => review.visible && review.name.trim() && review.text.trim() && Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5)
    : [];
}

function Section({ id, title, children }: { id?: string; title: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="min-w-0 scroll-mt-40 border-b border-cmt-neutral-200 py-7">
      <h2 className="mb-5 break-words font-display text-2xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function CustomSection({ section }: { section: PackageCustomSection }) {
  const editor = usePackageEditing();
  const sections = editor?.value.details?.pageSections?.sections ?? [];
  const index = sections.findIndex(item => item.id === section.id);
  const path = ["details", "pageSections", "sections", index];
  const items = editor ? section.items : section.items.filter((item) => item.visible !== false && (item.title.trim() || item.body.trim()));
  if (!editor && !isVisiblePackageSection(section)) return null;

  return (
    <Section id={`package-section-${section.id}`} title={<InlineText value={section.title} path={[...path, "title"]} label="Section title" />}>
      {editor && <div className="mb-3 flex flex-wrap items-center gap-2 text-xs"><button type="button" disabled={editor.disabled} onClick={() => editor.change([...path, "visible"], !section.visible)}>{section.visible ? "Hide section" : "Hidden · Show section"}</button><select aria-label="Section layout" value={section.layout} disabled={editor.disabled} onChange={event => editor.change([...path, "layout"], event.target.value)}><option value="box">Text</option><option value="boxes">List</option><option value="dropdown">Accordion</option></select><EditAction kind="up" label="Move section up" onClick={() => editor.change(["details", "pageSections", "sections"], movePackageSection(sections, section.id, -1))} /><EditAction kind="down" label="Move section down" onClick={() => editor.change(["details", "pageSections", "sections"], movePackageSection(sections, section.id, 1))} /><EditAction kind="remove" label="Remove section" onClick={() => editor.change(["details", "pageSections", "sections"], sections.filter(item => item.id !== section.id))} /></div>}
      {(editor || section.body.trim()) && <p className={bodyClass}><InlineText value={section.body} path={[...path, "body"]} label="Section text" multiline /></p>}
      {section.layout !== "box" && items.length > 0 && (
        <div className={`${section.body.trim() ? "mt-5 " : ""}${section.layout === "boxes" ? "grid gap-4 sm:grid-cols-2" : "space-y-3"}`}>
          {items.map((item) => section.layout === "dropdown" ? (
            <details key={item.id} className="group min-w-0 rounded-cmt-md border border-cmt-neutral-200">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-cmt-md p-4 font-semibold outline-offset-4 focus-visible:outline-2 focus-visible:outline-cmt-primary-700 [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 break-words"><InlineText value={item.title} path={[...path, "items", section.items.indexOf(item), "title"]} label="Item title" /></span>
                <ChevronDown className="size-4 shrink-0 text-cmt-neutral-500 transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              {(editor || item.body.trim()) && <div className="border-t border-cmt-neutral-100 px-4 py-4"><p className={bodyClass}><InlineText value={item.body} path={[...path, "items", section.items.indexOf(item), "body"]} label="Item text" multiline /></p></div>}
              {editor && <label className="text-xs"><input type="checkbox" checked={item.visible !== false} onChange={event => editor.change([...path, "items", section.items.indexOf(item), "visible"], event.target.checked)} /> Show item</label>}
              <EditAction kind="remove" label="Remove item" onClick={() => editor?.change([...path, "items"], section.items.filter(row => row !== item))} />
            </details>
          ) : (
            <article key={item.id} className="min-w-0 rounded-cmt-md border border-cmt-neutral-200 p-5">
              {(editor || item.title.trim()) && <h3 className="mb-2 break-words font-display text-lg font-semibold"><InlineText value={item.title} path={[...path, "items", section.items.indexOf(item), "title"]} label="Item title" /></h3>}
              {(editor || item.body.trim()) && <p className={bodyClass}><InlineText value={item.body} path={[...path, "items", section.items.indexOf(item), "body"]} label="Item text" multiline /></p>}
              {editor && <label className="text-xs"><input type="checkbox" checked={item.visible !== false} onChange={event => editor.change([...path, "items", section.items.indexOf(item), "visible"], event.target.checked)} /> Show item</label>}
              <EditAction kind="remove" label="Remove item" onClick={() => editor?.change([...path, "items"], section.items.filter(row => row !== item))} />
            </article>
          ))}
        </div>
      )}
      {section.layout !== "box" && <EditAction label="Add item" onClick={() => editor?.change([...path, "items"], [...section.items, { id: crypto.randomUUID(), title: "New item", body: "", visible: true }])} />}
    </Section>
  );
}

/** Optional, per-package content. Editing controls belong to the admin editor. */
export default function PackagePageSections({ value, area = "all" }: { value: PackagePageSectionsValue; area?: PackageSectionPlacement | "locations" | "reviews" | "all" }) {
  const editor = usePackageEditing();
  const galleryImages = value.gallery.enabled ? value.gallery.images.filter((image) => image.trim()) : [];
  const locations = (editor || value.locations.enabled)
    ? value.locations.items.filter((location) => editor || location.visible && location.name.trim())
    : [];
  const reviews = editor ? value.reviews.items : getVisiblePackageReviews(value);

  return (
    <>
      {value.sections.filter((section) => area === "all" || (section.placement ?? "extras") === area).map((section) => <CustomSection key={section.id} section={section} />)}

      {(area === "all" || area === "extras") && (editor || galleryImages.length > 0) && (
        <Section id="package-gallery" title="Trip gallery"><EditableGallery images={editor ? value.gallery.images : galleryImages} path={["details", "pageSections", "gallery", "images"]} maxImages={20} />{editor && <label className="text-xs"><input type="checkbox" checked={value.gallery.enabled} onChange={event => editor.change(["details", "pageSections", "gallery", "enabled"], event.target.checked)} /> Show trip gallery</label>}</Section>
      )}

      {(area === "all" || area === "locations") && (editor || locations.length > 0) && (
        <Section id="package-locations" title="Pickup & drop locations">
          <div className={`grid gap-4 ${locations.length > 1 ? "sm:grid-cols-2" : ""}`}>
            {locations.map((location) => {
              const path = ["details", "pageSections", "locations", "items", value.locations.items.indexOf(location)];
              const mapLink = locationMapLink(location);
              const embedUrl = locationEmbedUrl(location);
              return (
                <article key={location.id} className="min-w-0 overflow-hidden rounded-cmt-md border border-cmt-neutral-200">
                  {editor ? <EditableGallery images={location.image ? [location.image] : []} path={[...path, "image"]} maxImages={1} /> : location.image && <div className="relative aspect-[16/9] bg-cmt-neutral-100"><Image src={location.image} alt={location.name} fill unoptimized sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" /></div>}
                  <div className="p-5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${location.type === "pickup" ? "bg-cmt-primary-50 text-cmt-primary-800" : "bg-cmt-success-100 text-cmt-success-700"}`}><MapPin className="size-3.5" aria-hidden="true" />{location.type === "pickup" ? "Pickup location" : "Drop location"}</span>
                    <h3 className="mt-3 break-words font-display text-lg font-semibold"><InlineText value={location.name} path={[...path, "name"]} label="Location name" /></h3>
                    {(editor || location.address.trim()) && <p className={`mt-2 ${bodyClass}`}><InlineText value={location.address} path={[...path, "address"]} label="Location address" multiline /></p>}
                    {(editor || location.notes.trim()) && <p className={`mt-3 ${bodyClass}`}><InlineText value={location.notes} path={[...path, "notes"]} label="Location notes" multiline /></p>}
                    {editor && <div className="mt-3 space-y-2"><select aria-label="Location type" value={location.type} onChange={event => editor.change([...path, "type"], event.target.value)}><option value="pickup">Pickup</option><option value="drop">Drop</option></select><p><InlineText value={location.mapUrl} path={[...path, "mapUrl"]} label="Map URL" /></p><label className="text-xs"><input type="checkbox" checked={location.visible} onChange={event => editor.change([...path, "visible"], event.target.checked)} /> Show location</label><EditAction kind="remove" label="Remove location" onClick={() => editor.change(["details", "pageSections", "locations", "items"], value.locations.items.filter(item => item !== location))} /></div>}
                    {mapLink && <a href={mapLink} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-cmt-neutral-900 underline underline-offset-4">Open in Maps <ArrowUpRight className="size-4" aria-hidden="true" /><span className="sr-only"> for {location.name} (opens in a new tab)</span></a>}
                  </div>
                  {embedUrl && <iframe src={embedUrl} title={`Map of ${location.name}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-52 w-full border-0 border-t border-cmt-neutral-200" allowFullScreen />}
                </article>
              );
            })}
          </div>
          {editor && <label className="text-xs"><input type="checkbox" checked={value.locations.enabled} onChange={event => editor.change(["details", "pageSections", "locations", "enabled"], event.target.checked)} /> Show pickup & drop</label>}
          <EditAction label="Add location" onClick={() => editor?.change(["details", "pageSections", "locations"], { enabled: true, items: [...value.locations.items, { id: crypto.randomUUID(), name: "", type: "pickup", address: "", notes: "", mapUrl: "", image: "", visible: true }] })} />
        </Section>
      )}

      {(area === "all" || area === "reviews") && (editor || reviews.length > 0) && (
        <Section id="package-reviews" title="Traveller reviews">
          <div className="grid gap-4 sm:grid-cols-2">
            {reviews.map((review) => (
              <article key={review.id} className="min-w-0 rounded-cmt-md border border-cmt-neutral-200 p-5">
                <div className="flex gap-1 text-cmt-primary-600" role="img" aria-label={`${review.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }, (_, index) => <Star key={index} className={`size-4 ${index < review.rating ? "fill-current" : "text-cmt-neutral-200"}`} aria-hidden="true" />)}
                </div>
                <blockquote className={`mt-3 ${bodyClass}`}><InlineText value={review.text} path={["details", "pageSections", "reviews", "items", value.reviews.items.indexOf(review), "text"]} label="Review text" multiline /></blockquote>
                <p className="mt-4 break-words text-sm font-semibold"><InlineText value={review.name} path={["details", "pageSections", "reviews", "items", value.reviews.items.indexOf(review), "name"]} label="Reviewer name" /></p>{editor && <div className="mt-2 text-xs">Rating: <InlineText value={review.rating} numeric path={["details", "pageSections", "reviews", "items", value.reviews.items.indexOf(review), "rating"]} label="Review rating" /><label><input type="checkbox" checked={review.visible} onChange={event => editor.change(["details", "pageSections", "reviews", "items", value.reviews.items.indexOf(review), "visible"], event.target.checked)} /> Show</label><EditAction kind="remove" label="Remove review" onClick={() => editor.change(["details", "pageSections", "reviews", "items"], value.reviews.items.filter(item => item !== review))} /></div>}
              </article>
            ))}
          </div>
          {editor && <label className="text-xs"><input type="checkbox" checked={value.reviews.enabled} onChange={event => editor.change(["details", "pageSections", "reviews", "enabled"], event.target.checked)} /> Show reviews</label>}
          <EditAction label="Add real customer review" onClick={() => editor?.change(["details", "pageSections", "reviews"], { enabled: true, items: [...value.reviews.items, { id: crypto.randomUUID(), name: "", text: "", rating: 5, visible: true }] })} />
        </Section>
      )}
      {editor && area !== "all" && area !== "locations" && area !== "reviews" && <EditAction label={`Add ${area === "faq" ? "FAQs" : area === "carry" ? "things to carry" : area === "guidelines" ? "trail guidelines" : area + " section"}`} onClick={() => editor.change(["details", "pageSections", "sections"], [...value.sections, { id: crypto.randomUUID(), title: area === "faq" ? "Frequently asked questions" : area === "carry" ? "Things to carry" : area === "guidelines" ? "Trail guidelines" : "Additional details", layout: area === "faq" ? "dropdown" : "box", visible: true, placement: area, body: "", items: [] }])} />}
    </>
  );
}

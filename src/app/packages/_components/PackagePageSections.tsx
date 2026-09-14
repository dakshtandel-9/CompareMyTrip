import Image from "next/image";
import { ArrowUpRight, ChevronDown, MapPin, Star } from "lucide-react";
import type { ReactNode } from "react";
import {
  locationEmbedUrl,
  locationMapLink,
  type PackageCustomSection,
  type PackagePageSections as PackagePageSectionsValue,
} from "@/lib/packageDetailSections";
import PackageGallery from "./PackageGallery";

const bodyClass = "whitespace-pre-wrap break-words text-sm leading-7 text-cmt-neutral-600";

export function getVisiblePackageReviews(value: PackagePageSectionsValue) {
  return value.reviews.enabled
    ? value.reviews.items.filter((review) => review.visible && review.name.trim() && review.text.trim() && Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5)
    : [];
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-cmt-md border border-cmt-neutral-200 bg-white p-5 shadow-cmt-sm sm:p-7">
      <h2 className="mb-5 break-words font-display text-2xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function CustomSection({ section }: { section: PackageCustomSection }) {
  const items = section.items.filter((item) => item.visible !== false && (item.title.trim() || item.body.trim()));
  if (!section.visible || !section.title.trim() || (!section.body.trim() && (section.layout === "box" || !items.length))) return null;

  return (
    <Section title={section.title}>
      {section.body.trim() && <p className={bodyClass}>{section.body}</p>}
      {section.layout !== "box" && items.length > 0 && (
        <div className={`${section.body.trim() ? "mt-5 " : ""}${section.layout === "boxes" ? "grid gap-4 sm:grid-cols-2" : "space-y-3"}`}>
          {items.map((item) => section.layout === "dropdown" ? (
            <details key={item.id} className="group min-w-0 rounded-cmt-md border border-cmt-neutral-200">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-cmt-md p-4 font-semibold outline-offset-4 focus-visible:outline-2 focus-visible:outline-cmt-primary-700 [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 break-words">{item.title.trim() || "More details"}</span>
                <ChevronDown className="size-4 shrink-0 text-cmt-neutral-500 transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              {item.body.trim() && <div className="border-t border-cmt-neutral-100 px-4 py-4"><p className={bodyClass}>{item.body}</p></div>}
            </details>
          ) : (
            <article key={item.id} className="min-w-0 rounded-cmt-md border border-cmt-neutral-200 p-5">
              {item.title.trim() && <h3 className="mb-2 break-words font-display text-lg font-semibold">{item.title}</h3>}
              {item.body.trim() && <p className={bodyClass}>{item.body}</p>}
            </article>
          ))}
        </div>
      )}
    </Section>
  );
}

/** Optional, per-package content. Editing controls belong to the admin editor. */
export default function PackagePageSections({ value }: { value: PackagePageSectionsValue }) {
  const galleryImages = value.gallery.enabled ? value.gallery.images.filter((image) => image.trim()) : [];
  const locations = value.locations.enabled
    ? value.locations.items.filter((location) => location.visible && location.name.trim())
    : [];
  const reviews = getVisiblePackageReviews(value);

  return (
    <>
      {value.sections.map((section) => <CustomSection key={section.id} section={section} />)}

      {galleryImages.length > 0 && (
        <Section title="Trip gallery"><PackageGallery images={galleryImages} maxImages={20} /></Section>
      )}

      {locations.length > 0 && (
        <Section title="Pickup & drop locations">
          <div className={`grid gap-4 ${locations.length > 1 ? "sm:grid-cols-2" : ""}`}>
            {locations.map((location) => {
              const mapLink = locationMapLink(location);
              const embedUrl = locationEmbedUrl(location);
              return (
                <article key={location.id} className="min-w-0 overflow-hidden rounded-cmt-md border border-cmt-neutral-200">
                  {location.image && <div className="relative aspect-[16/9] bg-cmt-neutral-100"><Image src={location.image} alt={location.name} fill unoptimized sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" /></div>}
                  <div className="p-5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${location.type === "pickup" ? "bg-cmt-primary-50 text-cmt-primary-800" : "bg-cmt-success-100 text-cmt-success-700"}`}><MapPin className="size-3.5" aria-hidden="true" />{location.type === "pickup" ? "Pickup location" : "Drop location"}</span>
                    <h3 className="mt-3 break-words font-display text-lg font-semibold">{location.name}</h3>
                    {location.address.trim() && <p className={`mt-2 ${bodyClass}`}>{location.address}</p>}
                    {location.notes.trim() && <p className={`mt-3 ${bodyClass}`}>{location.notes}</p>}
                    {mapLink && <a href={mapLink} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-cmt-neutral-900 underline underline-offset-4">Open in Maps <ArrowUpRight className="size-4" aria-hidden="true" /><span className="sr-only"> for {location.name} (opens in a new tab)</span></a>}
                  </div>
                  {embedUrl && <iframe src={embedUrl} title={`Map of ${location.name}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-52 w-full border-0 border-t border-cmt-neutral-200" allowFullScreen />}
                </article>
              );
            })}
          </div>
        </Section>
      )}

      {reviews.length > 0 && (
        <Section title="Traveller reviews">
          <div className="grid gap-4 sm:grid-cols-2">
            {reviews.map((review) => (
              <article key={review.id} className="min-w-0 rounded-cmt-md border border-cmt-neutral-200 p-5">
                <div className="flex gap-1 text-cmt-primary-600" role="img" aria-label={`${review.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }, (_, index) => <Star key={index} className={`size-4 ${index < review.rating ? "fill-current" : "text-cmt-neutral-200"}`} aria-hidden="true" />)}
                </div>
                <blockquote className={`mt-3 ${bodyClass}`}>{review.text}</blockquote>
                <p className="mt-4 break-words text-sm font-semibold">{review.name}</p>
              </article>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}

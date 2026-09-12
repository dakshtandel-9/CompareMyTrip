"use client";

import ContentImage from "../_components/ContentImage";
import { useSiteContent } from "@/lib/useSiteContent";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, Expand, Images, MapPin, X } from "lucide-react";
import { lockPageScroll } from "@/lib/lockPageScroll";
import SectionHeader from "../_components/SectionHeader";

export default function TravelGallery() {
  const { gallery } = useSiteContent();
  const photos = gallery.items.filter((photo) => photo.src.trim());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedIndex = photos.findIndex((photo) => photo.id === selectedId);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const isOpen = gallery.enabled && selectedIndex >= 0;
  const selected = photos[selectedIndex];

  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    const unlock = lockPageScroll();
    return () => {
      dialog.close();
      unlock();
      openerRef.current?.focus({ preventScroll: true });
    };
  }, [isOpen]);

  function openPhoto(index: number, opener: HTMLButtonElement) {
    openerRef.current = opener;
    setSelectedId(photos[index].id);
  }

  function movePhoto(direction: number) {
    if (selectedIndex >= 0) setSelectedId(photos[(selectedIndex + direction + photos.length) % photos.length].id);
  }

  if (!gallery.enabled || photos.length === 0) return null;

  return (
    <section id="travel-gallery" aria-labelledby="travel-gallery-title" className="w-full border-t border-cmt-neutral-100 bg-cmt-neutral-50 px-3 py-12 sm:px-4 sm:py-16 md:px-6 lg:py-20">
      <div className="mx-auto w-full max-w-[1440px]">
        <SectionHeader
          eyebrow={gallery.header.eyebrow}
          title={<span id="travel-gallery-title">{gallery.header.title}</span>}
          description={gallery.header.description}
          action={gallery.header.actionLabel &&
            <button type="button" onClick={(event) => openPhoto(0, event.currentTarget)} className="inline-flex min-h-11 items-center gap-2 rounded-cmt-control border border-cmt-neutral-200 bg-white px-4 text-sm font-semibold shadow-cmt-xs transition-colors hover:bg-cmt-primary-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500">
              <Images className="size-4" aria-hidden="true" /> {gallery.header.actionLabel} <ArrowUpRight className="size-4" aria-hidden="true" />
            </button>
          }
        />

        <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-4 lg:grid-cols-4">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              aria-label={`View ${photo.destination} photo`}
              onClick={(event) => openPhoto(index, event.currentTarget)}
              className={`group relative h-48 overflow-hidden rounded-cmt-md bg-cmt-neutral-200 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cmt-primary-500 sm:h-64 xl:h-72 ${photo.wide ? "col-span-2" : ""}`}
            >
              <ContentImage src={photo.src} alt={photo.alt || photo.destination} fill sizes={photo.wide ? "(max-width: 1023px) 100vw, (max-width: 1440px) 50vw, 720px" : "(max-width: 1023px) 50vw, (max-width: 1440px) 25vw, 360px"} className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />
              <span className="absolute right-3 top-3 grid size-9 place-items-center rounded-full border border-white/30 bg-black/15 text-white backdrop-blur-sm transition-colors group-hover:bg-white group-hover:text-cmt-neutral-900" aria-hidden="true"><Expand className="size-4" /></span>
              <span className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <span className="flex items-center gap-1.5 font-display text-lg font-semibold text-white sm:text-2xl"><MapPin className="size-4 shrink-0 text-cmt-primary-400" aria-hidden="true" />{photo.destination}</span>
                <span className="mt-1 block text-xs leading-relaxed text-white/85 sm:text-sm">{photo.caption}</span>
              </span>
            </button>
          ))}
        </div>
        <p className="mt-4 text-xs text-cmt-neutral-500">Tap a photo to take a closer look.</p>
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby="gallery-viewer-title"
        onCancel={() => setSelectedId(null)}
        onClose={() => setSelectedId(null)}
        onClick={(event) => { if (event.target === event.currentTarget) setSelectedId(null); }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            movePhoto(event.key === "ArrowLeft" ? -1 : 1);
          }
        }}
        className="fixed inset-0 m-auto h-[100dvh] max-h-none w-screen max-w-none bg-cmt-neutral-900/95 p-4 text-white backdrop:bg-black/70 sm:p-6"
      >
        {isOpen && <div className="mx-auto flex h-full max-w-6xl flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div><h2 id="gallery-viewer-title" className="font-display text-xl font-semibold">Travel gallery</h2><p className="mt-1 text-xs text-white/65" role="status">{selectedIndex + 1} of {photos.length} · {selected.destination}</p></div>
            <button type="button" aria-label="Close photo viewer" onClick={() => setSelectedId(null)} className="grid size-11 shrink-0 place-items-center rounded-full bg-white/10 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-cmt-primary-500"><X className="size-5" aria-hidden="true" /></button>
          </div>
          <div className="relative min-h-0 flex-1">
            <ContentImage src={selected.src} alt={selected.alt || selected.destination} fill sizes="(max-width: 1152px) 100vw, 1152px" className="object-contain" />
            <button type="button" aria-label="Previous photo" onClick={() => movePhoto(-1)} className="absolute left-0 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white text-cmt-neutral-900 shadow-cmt-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 sm:left-3"><ChevronLeft className="size-5" aria-hidden="true" /></button>
            <button type="button" aria-label="Next photo" onClick={() => movePhoto(1)} className="absolute right-0 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white text-cmt-neutral-900 shadow-cmt-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 sm:right-3"><ChevronRight className="size-5" aria-hidden="true" /></button>
          </div>
          <div className="text-center"><p className="font-display text-lg font-semibold">{selected.destination}</p><p className="mt-1 text-sm text-white/75">{selected.caption}</p>{selected.credit && (selected.source ? <a href={selected.source} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-white/55 underline underline-offset-2 hover:text-white">Photo: {selected.credit}</a> : <p className="mt-2 text-xs text-white/55">Photo: {selected.credit}</p>)}</div>
          <div className="overflow-x-auto pb-[env(safe-area-inset-bottom)]"><div className="flex w-max min-w-full justify-center gap-2">
            {photos.map((photo, index) => <button key={photo.id} type="button" aria-label={`Show ${photo.destination} photo`} aria-pressed={index === selectedIndex} onClick={() => setSelectedId(photos[index].id)} className={`relative h-11 w-11 shrink-0 overflow-hidden rounded-cmt-sm border-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 sm:h-14 sm:w-20 ${index === selectedIndex ? "border-cmt-primary-500" : "border-transparent opacity-55 hover:opacity-100"}`}><ContentImage src={photo.src} alt="" fill sizes="80px" className="object-cover" /></button>)}
          </div></div>
        </div>}
      </dialog>
    </section>
  );
}

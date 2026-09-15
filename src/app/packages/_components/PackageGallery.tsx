"use client";

import Modal from "@/components/Modal";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const defaultGalleryImages = [
  { src: "/destinations/kerala.jpg", alt: "Houseboat cruising through the Kerala backwaters", position: "object-center" },
  { src: "/destinations/kerala.jpg", alt: "Kerala backwater village scenery", position: "object-[80%_center]" },
  { src: "/destinations/kerala.jpg", alt: "Traditional Kerala houseboat", position: "object-[15%_center]" },
  { src: "/package-gallery/kerala-houseboat.jpg", alt: "Houseboat on the Kerala backwaters", position: "object-center" },
  { src: "/package-gallery/munnar-tea-plantation.jpg", alt: "Tea plantation in Munnar", position: "object-center" },
  { src: "/package-gallery/munnar-tea-hills.jpg", alt: "Tea-covered hills near Munnar", position: "object-center" },
  { src: "/package-gallery/periyar-thekkady.jpg", alt: "Periyar landscape in Thekkady", position: "object-center" },
  { src: "/package-gallery/fort-kochi-fishing-nets.jpg", alt: "Chinese fishing nets at Fort Kochi", position: "object-center" },
  { src: "/package-gallery/alleppey-houseboat.jpg", alt: "Houseboat in Alleppey", position: "object-center" },
  { src: "/package-gallery/kerala-houseboats.jpg", alt: "Houseboats gathered on the Kerala backwaters", position: "object-center" },
];

export default function PackageGallery({ images, maxImages = 10 }: { images?: string[]; maxImages?: number }) {
  const galleryImages = (images?.length ? images.slice(0, maxImages) : defaultGalleryImages).map(
    (image, index) =>
      typeof image === "string"
        ? { src: image, alt: `Package gallery image ${index + 1}`, position: "object-center" }
        : image,
  );
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const isOpen = selectedIndex !== null;

  useEffect(() => {
    if (!isOpen) return;


    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        setSelectedIndex((current) =>
          current === null ? null : (current - 1 + galleryImages.length) % galleryImages.length,
        );
      }
      if (event.key === "ArrowRight") {
        setSelectedIndex((current) =>
          current === null ? null : (current + 1) % galleryImages.length,
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, galleryImages.length]);

  const showPrevious = () => {
    setSelectedIndex((current) =>
      current === null ? null : (current - 1 + galleryImages.length) % galleryImages.length,
    );
  };

  const showNext = () => {
    setSelectedIndex((current) =>
      current === null ? null : (current + 1) % galleryImages.length,
    );
  };

  /* Keep the frame bounded and preserve the full image, including portrait
     uploads. Thumbnails stay compact regardless of the image count. */
  if (galleryImages.length === 0) return null;

  const active = Math.min(activeIndex, galleryImages.length - 1);
  return (
    <>
      <div className="relative overflow-hidden rounded-xl border border-cmt-neutral-200 bg-cmt-neutral-50">
        <button type="button" onClick={() => setSelectedIndex(active)} aria-label={`Open package gallery at image ${active + 1}`} className="relative block h-[clamp(220px,42vw,420px)] w-full">
          <Image src={galleryImages[active].src} alt={galleryImages[active].alt} fill loading="eager" sizes="(max-width: 1023px) 100vw, 65vw" className="object-contain" />
        </button>
        {galleryImages.length > 1 && <>
          <button type="button" aria-label="Previous photo" onClick={() => setActiveIndex((active - 1 + galleryImages.length) % galleryImages.length)} className="absolute left-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/95"><ChevronLeft size={18} /></button>
          <button type="button" aria-label="Next photo" onClick={() => setActiveIndex((active + 1) % galleryImages.length)} className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/95"><ChevronRight size={18} /></button>
          <span className="absolute bottom-3 right-3 rounded-full bg-black/50 px-3 py-1 text-xs text-white">{active + 1} / {galleryImages.length}</span>
        </>}
      </div>
      {galleryImages.length > 1 && <div className="mt-3 flex max-w-full gap-2 overflow-x-auto pb-1">{galleryImages.map((image, index) => <button type="button" key={`${image.src}-${index}`} aria-label={`Show photo ${index + 1}`} aria-pressed={active === index} onClick={() => setActiveIndex(index)} className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 bg-cmt-neutral-50 ${active === index ? "border-cmt-primary-500" : "border-transparent"}`}><Image src={image.src} alt="" fill sizes="96px" className="object-contain p-1" /></button>)}</div>}

      {isOpen && selectedIndex !== null && (
        <Modal
          onClose={() => setSelectedIndex(null)}
          label="Package image gallery"
          className="fixed inset-0 z-[100] flex flex-col bg-cmt-neutral-900/95 p-3 backdrop-blur-md sm:p-6"
        >
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between pb-3 text-white sm:pb-5">
            <div>
              <p className="font-display text-lg font-semibold sm:text-xl">Package gallery</p>
              <p className="mt-0.5 text-xs text-white/60">{selectedIndex + 1} of {galleryImages.length}</p>
            </div>
            <button
              type="button"
              data-modal-initial-focus
              aria-label="Close gallery"
              onClick={() => setSelectedIndex(null)}
              className="grid size-11 place-items-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="relative mx-auto min-h-0 w-full max-w-7xl flex-1 overflow-hidden rounded-cmt-md bg-black/25">
            <Image
              src={galleryImages[selectedIndex].src}
              alt={galleryImages[selectedIndex].alt}
              fill
              fetchPriority="high"
              sizes="100vw"
              className={`object-contain ${galleryImages[selectedIndex].position}`}
            />
            <button
              type="button"
              aria-label="Previous image"
              onClick={showPrevious}
              className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-cmt-neutral-900 shadow-cmt-lg transition-transform hover:scale-105 sm:left-5"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={showNext}
              className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-cmt-neutral-900 shadow-cmt-lg transition-transform hover:scale-105 sm:right-5"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>

          <div className="mx-auto mt-3 flex w-full max-w-7xl gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mt-5">
            {galleryImages.map((image, index) => (
              <button
                key={`${image.src}-${index}`}
                type="button"
                onClick={() => setSelectedIndex(index)}
                aria-label={`View image ${index + 1}`}
                aria-current={selectedIndex === index}
                className={`relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-cmt-sm border-2 transition-opacity sm:w-24 ${
                  selectedIndex === index
                    ? "border-cmt-primary-500 opacity-100"
                    : "border-transparent opacity-55 hover:opacity-90"
                }`}
              >
                <Image src={image.src} alt="" fill sizes="96px" className={`object-cover ${image.position}`} />
              </button>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}

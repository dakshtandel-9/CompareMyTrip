"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";

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

export default function PackageGallery({ images }: { images?: string[] }) {
  const galleryImages = (images?.length ? images.slice(0, 10) : defaultGalleryImages).map(
    (image, index) =>
      typeof image === "string"
        ? { src: image, alt: `Package gallery image ${index + 1}`, position: "object-center" }
        : image,
  );
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const isOpen = selectedIndex !== null;

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedIndex(null);
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
      document.body.style.overflow = previousOverflow;
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

  /* Operators upload as few as one photo, so the mosaic adapts instead of
     indexing into slots that may not exist. */
  if (galleryImages.length === 0) return null;

  const [hero, ...rest] = galleryImages;
  const sideImages = rest.slice(0, 2);

  return (
    <>
      {galleryImages.length > 1 && <p className="mb-2 text-xs text-cmt-neutral-500 md:hidden">Swipe to explore · Tap a photo to view</p>}
      <div
        className={`cmt-package-gallery grid gap-3 overflow-hidden rounded-cmt-lg sm:gap-4 ${
          sideImages.length > 0 ? "sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]" : ""
        }`}
      >
        <button
          type="button"
          onClick={() => setSelectedIndex(0)}
          aria-label="Open package gallery at image 1"
          className="relative aspect-[16/10] overflow-hidden rounded-cmt-lg bg-cmt-neutral-100 sm:aspect-auto sm:min-h-[360px] lg:min-h-[520px]"
        >
          <Image
            src={hero.src}
            alt={hero.alt}
            fill
            loading="eager"
            sizes={sideImages.length > 0 ? "(max-width: 640px) 100vw, 67vw" : "100vw"}
            className="object-cover transition-transform duration-500 hover:scale-[1.02]"
          />
        </button>

        {sideImages.length > 0 && (
          <div
            className={`grid gap-3 sm:grid-cols-1 sm:gap-4 ${
              sideImages.length > 1 ? "grid-cols-2" : "grid-cols-1"
            }`}
          >
            {sideImages.map((image, index) => {
              // The last tile carries the "show more" affordance.
              const isLast = index === sideImages.length - 1;
              const position = index === 0 ? "object-[80%_center]" : "object-[15%_center]";
              return (
                <div
                  key={`${image.src}-${index}`}
                  className="relative min-h-[110px] sm:min-h-[150px] overflow-hidden rounded-cmt-lg bg-cmt-neutral-100"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedIndex(index + 1)}
                    aria-label={`Open package gallery at image ${index + 2}`}
                    className="absolute inset-0"
                  >
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      loading="eager"
                      sizes="(max-width: 640px) 50vw, 33vw"
                      className={`object-cover ${position} transition-transform duration-500 hover:scale-[1.03]`}
                    />
                    {isLast && (
                      <span className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    )}
                  </button>
                  {isLast && galleryImages.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setSelectedIndex(index + 1)}
                      className="absolute bottom-2 right-2 z-10 inline-flex min-h-11 max-w-[calc(100%-1rem)] items-center justify-center gap-1.5 sm:bottom-3 sm:right-3 sm:h-9 sm:min-h-0 sm:gap-2 rounded-cmt-control bg-white/95 px-3.5 text-xs font-semibold text-cmt-neutral-900 shadow-cmt-md transition-colors hover:bg-white"
                    >
                      <Images className="size-4 shrink-0" /><span className="sm:hidden">All photos</span><span className="hidden sm:inline">Show more images</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isOpen && selectedIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Package image gallery"
          className="fixed inset-0 z-[100] flex flex-col bg-cmt-neutral-900/95 p-3 backdrop-blur-md sm:p-6"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setSelectedIndex(null);
          }}
        >
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between pb-3 text-white sm:pb-5">
            <div>
              <p className="font-display text-lg font-semibold sm:text-xl">Package gallery</p>
              <p className="mt-0.5 text-xs text-white/60">{selectedIndex + 1} of {galleryImages.length}</p>
            </div>
            <button
              type="button"
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
        </div>
      )}
    </>
  );
}

import Link from "next/link";
import Image from "next/image";
import { BedDouble, Clock, MapPin, RotateCcw, Users } from "lucide-react";

import { getDiscountPercent, type TravelPackage } from "@/lib/packageData";
import TrekGradeBadge from "@/components/TrekGradeBadge";
import Price from "./Price";
import Rating from "./Rating";

/* ------------------------------------------------------------------ */
/* The package card used by every package rail and grid on /home.       */
/* Read order is fixed by design.md §17.1: badge → identity → key facts  */
/* → price → action, with exactly one badge and one yellow element       */
/* (the View button) per card.                                          */
/* ------------------------------------------------------------------ */

type PackageCardProps = {
  pkg: TravelPackage;
  /** Overrides the discount pill when a section has its own marker. */
  badge?: { label: string; tone: "coral" | "success" | "warning" };
  sizes?: string;
  className?: string;
};

const BADGE_TONES = {
  coral: "border-cmt-coral-500/30 bg-cmt-coral-100 text-cmt-coral-700",
  success: "border-cmt-success-500/30 bg-cmt-success-100 text-cmt-success-700",
  warning: "border-cmt-warning-500/30 bg-cmt-warning-100 text-cmt-warning-700",
} as const;

export default function PackageCard({
  pkg,
  badge,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw",
  className = "",
}: PackageCardProps) {
  /* Imported operator listings publish no pre-discount price, so the pill is
     dropped entirely rather than reading "0% off". */
  const discountPercent = getDiscountPercent(pkg);
  const marker =
    badge ??
    (discountPercent > 0 ? { label: `${discountPercent}% off`, tone: "coral" as const } : null);

  return (
    <article
      className={`group flex h-full min-w-0 flex-col overflow-hidden rounded-cmt-md border border-cmt-neutral-200 bg-white shadow-cmt-sm transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-cmt-neutral-300 hover:shadow-cmt-md ${className}`}
    >
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden">
        <Image
          src={pkg.image}
          alt={pkg.location}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />

        {marker && (
          <div
            className={`absolute left-3 top-3 rounded-cmt-full border px-2.5 py-1 text-[11px] font-semibold ${BADGE_TONES[marker.tone]}`}
          >
            {marker.label}
          </div>
        )}

        <TrekGradeBadge pkg={pkg} className="absolute right-3 top-3" />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-1 text-xs font-medium text-cmt-neutral-500">
          <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          <span className="truncate">{pkg.location}</span>
        </div>

        <h3 className="mt-1.5 line-clamp-2 font-display text-base font-bold leading-snug text-cmt-neutral-900">
          {pkg.title}
        </h3>

        {pkg.reviews > 0 && pkg.rating > 0 ? (
          <Rating value={pkg.rating} reviews={pkg.reviews} className="mt-2" />
        ) : (
          <p className="mt-2 text-xs font-medium text-cmt-neutral-400">Newly listed</p>
        )}

        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-cmt-neutral-600">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" strokeWidth={2} />
            {pkg.nights}N / {pkg.days}D
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" strokeWidth={2} />
            {pkg.pax}
          </span>
          <span className="inline-flex items-center gap-1">
            <BedDouble className="h-3.5 w-3.5" strokeWidth={2} />
            {pkg.hotelStars}★ hotels
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {pkg.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-cmt-full border border-cmt-neutral-200 bg-white px-2 py-0.5 text-[11px] font-medium text-cmt-neutral-700"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* The operating partner is deliberately not named on the card. */}
        <p className="mt-3 inline-flex items-center gap-1 text-[11px] text-cmt-neutral-500">
          <RotateCcw className="h-3 w-3" strokeWidth={2} />
          Free cancellation
        </p>

        {/* Price and action pinned to the bottom so cards in a row align. */}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-cmt-neutral-100 pt-4">
          <Price price={pkg.price} originalPrice={pkg.originalPrice} qualifier="/person" />

          <Link
            href={pkg.href ?? `/packages/${pkg.id}`}
            className="inline-flex h-11 shrink-0 sm:h-9 items-center justify-center rounded-cmt-control bg-cmt-primary-500 px-5 text-sm font-semibold text-cmt-neutral-900 shadow-cmt-xs transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:bg-cmt-primary-600 hover:shadow-cmt-primary active:translate-y-0 active:bg-cmt-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
          >
            View
          </Link>
        </div>
      </div>
    </article>
  );
}

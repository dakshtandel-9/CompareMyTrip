import Image from "next/image";

export default function BrandLogo({
  className = "",
  sizes = "235px",
  fetchPriority,
}: {
  className?: string;
  sizes?: string;
  fetchPriority?: "high" | "low" | "auto";
}) {
  // Hide the source image's empty vertical padding without modifying its pixels or transparency.
  return (
    <span className={`relative block aspect-[2172/300] shrink-0 overflow-hidden ${className}`}>
      <Image
        src="/comparemytrip-logo.png"
        alt="CompareMyTrip"
        width={2172}
        height={724}
        sizes={sizes}
        fetchPriority={fetchPriority}
        className="absolute top-1/2 left-0 h-auto w-full max-w-none -translate-y-1/2"
      />
    </span>
  );
}

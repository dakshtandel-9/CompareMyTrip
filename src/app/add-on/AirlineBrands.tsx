import Image from "@/components/SiteImage";

// Frame only the tail artwork in the original 1448 × 1086 images.
// Separate HTML captions stay sharp and readable at every screen size.
const AIRLINES = [
  { name: "Air India", src: "/Flight/Flight8.webp", frame: [509, 314, 420, 315] },
  { name: "IndiGo", src: "/Flight/Flight10.webp", frame: [482, 308, 484, 363] },
  { name: "Air India Express", src: "/Flight/Flight2.webp", frame: [525, 332, 396, 297] },
  { name: "Akasa Air", src: "/Flight/Flight9.webp", frame: [510, 310, 428, 321] },
  { name: "SpiceJet", src: "/Flight/Flight1.webp", frame: [500, 306, 448, 336] },
  { name: "Oman Air", src: "/Flight/Flight3.webp", frame: [493, 308, 468, 351] },
  { name: "Gulf Air", src: "/Flight/Flight4.webp", frame: [493, 302, 448, 336] },
  { name: "Saudia", src: "/Flight/Flight5.webp", frame: [525, 340, 396, 297] },
] as const;

export default function AirlineBrands() {
  return (
    <section aria-labelledby="flights-brands-heading" className="mt-6 rounded-cmt-lg border border-cmt-neutral-200 bg-cmt-neutral-50 p-6 sm:p-8">
      <h3 id="flights-brands-heading" className="font-display text-xl font-semibold leading-[1.25] text-cmt-neutral-900 sm:text-2xl">
        Airlines
      </h3>
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
        {AIRLINES.map(({ name, src, frame: [left, top, width, height] }) => (
          <li key={name} className="flex min-w-0 flex-col items-center justify-center gap-3 rounded-cmt-control border border-cmt-neutral-200 bg-white px-2 py-5">
            <div className="relative h-[78px] w-[104px] shrink-0 overflow-hidden sm:h-[84px] sm:w-[112px]" aria-hidden="true">
              <Image
                src={src}
                alt=""
                width={1448}
                height={1086}
                sizes="420px"
                className="absolute max-w-none"
                style={{
                  width: `${(1448 / width) * 100}%`,
                  height: "auto",
                  left: `${(-left / width) * 100}%`,
                  top: `${(-top / height) * 100}%`,
                }}
              />
            </div>
            <span className="text-center text-[13px] font-semibold leading-5 text-cmt-neutral-800 sm:text-sm">
              {name}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

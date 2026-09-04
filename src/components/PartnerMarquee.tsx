import Image from "next/image";

/* ------------------------------------------------------------------ */
/* The tourism boards, scrolling along the top of the footer.           */
/*                                                                       */
/* Logos only, no heading and no captions: the marks are the message,    */
/* and a row of them says "these are the boards we work with" without a  */
/* line of copy above it.                                                */
/*                                                                       */
/* The loop is one track holding the list twice and sliding left by half */
/* its own width (see .animate-cmt-marquee in globals.css). At the       */
/* moment the animation resets, the second copy is sitting exactly where */
/* the first started, so the join never shows. Both copies have to stay  */
/* identical for that to hold — anything added to LOGOS lands in both,   */
/* which is why the array is mapped twice rather than written out.       */
/*                                                                       */
/* The strip is on a white band rather than the footer's own fill: the   */
/* logos are cut from a printed sheet and carry their white background   */
/* with them, so a white band is what makes their edges disappear.       */
/* ------------------------------------------------------------------ */

/* Cut from the tourism-board sheet in public/partners. Alt text is empty
   on purpose — the strip is decorative, and fourteen board names read out
   in a row is noise to a screen reader, not information. */
const LOGOS = [
  { src: "/partners/visit-britain.png", width: 174, height: 151 },
  { src: "/partners/japan.png", width: 278, height: 118 },
  { src: "/partners/seychelles.png", width: 233, height: 134 },
  { src: "/partners/maldives.png", width: 159, height: 167 },
  { src: "/partners/sharjah.png", width: 167, height: 240 },
  { src: "/partners/tourism-ireland.png", width: 287, height: 74 },
  { src: "/partners/saudi-tourism-authority.png", width: 294, height: 92 },
  { src: "/partners/germany.png", width: 291, height: 90 },
  { src: "/partners/jordan.png", width: 217, height: 120 },
  { src: "/partners/visit-victoria.png", width: 230, height: 96 },
  { src: "/partners/mauritius.png", width: 248, height: 107 },
  { src: "/partners/dubai.png", width: 200, height: 85 },
  { src: "/partners/atout-france.png", width: 175, height: 99 },
  { src: "/partners/pesona-indonesia.png", width: 295, height: 127 },
];

export default function PartnerMarquee() {
  return (
    <div
      className="relative overflow-hidden border-b border-cmt-neutral-200 bg-white py-6"
      aria-hidden="true"
    >
      {/* The strip runs under the page edges rather than stopping dead at
          them: it fades out either side so logos arrive and leave instead
          of appearing and vanishing. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-white to-transparent sm:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white to-transparent sm:w-24" />

      <div className="flex w-max animate-cmt-marquee">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center">
            {LOGOS.map((logo) => (
              <span
                key={logo.src}
                className="grid h-14 w-32 shrink-0 place-items-center px-2 sm:h-16 sm:w-40 sm:px-4"
              >
                {/* Every mark gets the same box and is fitted inside it,
                    so a tall crest and a long wordmark carry the same
                    weight however different their shapes. */}
                <Image
                  src={logo.src}
                  alt=""
                  width={logo.width}
                  height={logo.height}
                  className="h-full w-full object-contain"
                />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

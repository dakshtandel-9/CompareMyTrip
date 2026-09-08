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
   on purpose — the strip is decorative, and eighteen board names read out
   in a row is noise to a screen reader, not information. */
const LOGOS = [
  /* The Indian bodies lead: this is an India-facing site, and they are the
     accreditations a traveller here recognises first. */
  "/partners/ministry-of-tourism-india.png",
  "/partners/incredible-india.png",
  "/partners/karnataka-tourism.png",
  "/partners/kstdc.png",
  "/partners/visit-britain.png",
  "/partners/japan.png",
  "/partners/seychelles.png",
  "/partners/maldives.png",
  "/partners/sharjah.png",
  "/partners/tourism-ireland.png",
  "/partners/saudi-tourism-authority.png",
  "/partners/germany.png",
  "/partners/jordan.png",
  "/partners/visit-victoria.png",
  "/partners/mauritius.png",
  "/partners/dubai.png",
  "/partners/atout-france.png",
  "/partners/pesona-indonesia.png",
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
                key={logo}
                className="grid h-14 w-32 shrink-0 place-items-center px-2 sm:h-16 sm:w-40 sm:px-4"
              >
                {/* Every mark gets the same box and is fitted inside it,
                    so a tall crest and a long wordmark carry the same
                    weight however different their shapes. */}
                <span className="relative block size-full">
                  <Image
                    src={logo}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 128px, 112px"
                    className="object-contain"
                  />
                </span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

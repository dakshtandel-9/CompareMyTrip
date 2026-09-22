import Image from "next/image";

/* ------------------------------------------------------------------ */
/* "Why book with us" — the reassurance band under the cruise grid.     */
/*                                                                      */
/* The four points are fixed copy rather than CRM content: they are     */
/* claims about how the cruise desk works, not a listing, so there is   */
/* nothing here for /admin to edit yet.                                 */
/*                                                                      */
/* Icons follow the two-tone treatment the trust band uses (design.md   */
/* §9.5) — a dark glyph carrying one gold accent stroke — drawn here at */
/* the same 2.5px non-scaling weight so a cruise icon and a homepage    */
/* trust icon read as one family.                                       */
/* ------------------------------------------------------------------ */

type IconProps = { className?: string };

const strokeProps = {
  fill: "none",
  strokeWidth: 2.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  vectorEffect: "non-scaling-stroke",
} as const;

/* Fast quotes — dark speech bubble, gold lightning bolt. */
function FastQuoteTwoTone({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        {...strokeProps}
        stroke="currentColor"
        d="M21 14.6a2.6 2.6 0 0 1-2.6 2.6H8.6L4 21.2V5.4A2.6 2.6 0 0 1 6.6 2.8h11.8A2.6 2.6 0 0 1 21 5.4Z"
      />
      <path {...strokeProps} className="stroke-cmt-primary-500" d="m13.2 6.4-3.4 4.6h3.4l-1.4 4.2 3.8-4.8h-3.2Z" />
    </svg>
  );
}

/* Industry-best commissions — dark chart frame, gold rising trend. */
function CommissionTwoTone({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path {...strokeProps} stroke="currentColor" d="M3.2 3v15.4a2.4 2.4 0 0 0 2.4 2.4H21" />
      <path {...strokeProps} className="stroke-cmt-primary-500" d="m6.8 15.4 3.9-4.2 3 2.6 4.6-5.6" />
      <path {...strokeProps} className="stroke-cmt-primary-500" d="M15.1 8.2h3.2v3.2" />
    </svg>
  );
}

/* Dedicated specialists — the headset from the trust band, verbatim, so
   the two say "a named person answers" in exactly the same mark. */
function HeadsetTwoTone({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path {...strokeProps} stroke="currentColor" d="M4.6 13.6v-2.2a7.4 7.4 0 0 1 14.8 0v2.2" />
      <rect {...strokeProps} stroke="currentColor" x="2.3" y="12.2" width="4.5" height="6.6" rx="2.25" />
      <rect {...strokeProps} stroke="currentColor" x="17.2" y="12.2" width="4.5" height="6.6" rx="2.25" />
      <path {...strokeProps} className="stroke-cmt-primary-500" d="M4.55 18.8v1a2.2 2.2 0 0 0 2.2 2.2h2.95" />
      <circle {...strokeProps} className="stroke-cmt-primary-500" cx="10.9" cy="22" r="1.2" />
    </svg>
  );
}

/* One stop solution — dark map pin, gold route joining ship to shore. */
function OneStopTwoTone({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        {...strokeProps}
        stroke="currentColor"
        d="M18.4 9.6c0 4.6-6.4 11.6-6.4 11.6S5.6 14.2 5.6 9.6a6.4 6.4 0 1 1 12.8 0Z"
      />
      <circle {...strokeProps} className="stroke-cmt-primary-500" cx="12" cy="9.4" r="2.4" />
      <path {...strokeProps} className="stroke-cmt-primary-500" d="M2.6 4.4h2.2M19.2 4.4h2.2M2.6 19.4h2.4" />
    </svg>
  );
}

const POINTS: { id: string; icon: (props: IconProps) => React.JSX.Element; title: string; body: string }[] = [
  {
    id: "quotes",
    icon: FastQuoteTwoTone,
    title: "Fast quotes",
    body: "Get quotes across all 6 lines in one request.",
  },
  {
    id: "commissions",
    icon: CommissionTwoTone,
    title: "Industry-best commissions",
    body: "Higher margins than booking direct with the cruise line.",
  },
  {
    id: "specialists",
    icon: HeadsetTwoTone,
    title: "Dedicated specialists",
    body: "Named experts on your account — not a generic support queue.",
  },
  {
    id: "onestop",
    icon: OneStopTwoTone,
    title: "One stop solution",
    body: "From cruise bookings to Singapore and Malaysia land arrangements — one partner for the full trip.",
  },
];

export default function CruiseWhyBook() {
  return (
    <section
      aria-labelledby="cruise-why-book"
      className="w-full bg-[#fffcf5] px-4 py-12 sm:px-5 sm:py-16 lg:px-6"
    >
      <div className="relative isolate mx-auto w-full max-w-[1440px] overflow-hidden rounded-[28px] bg-cmt-secondary-900 shadow-cmt-md sm:rounded-[32px]">
        <Image
          src="/catalogue/cruise-why-book.jpg"
          alt=""
          fill
          sizes="(max-width: 1488px) 100vw, 1440px"
          className="-z-20 object-cover object-[60%_center]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(9,23,43,0.94)_0%,rgba(9,23,43,0.72)_45%,rgba(9,23,43,0.22)_100%)]"
        />

        <div className="px-5 pb-5 pt-9 sm:px-8 sm:pb-8 sm:pt-12 lg:px-12 lg:pb-12 lg:pt-14">
          <div className="max-w-xl">
            <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-cmt-primary-500">
              <span aria-hidden="true" className="h-px w-8 bg-cmt-primary-500" />
              The CompareMyTrip advantage
            </p>
            <h2
              id="cruise-why-book"
              className="mt-4 font-display text-[34px] font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[56px]"
            >
              Why book <span className="text-cmt-primary-500">with us</span>
            </h2>
            <p className="mt-4 max-w-md text-base leading-7 text-white/85">
              From your first quote to your final port, our cruise specialists
              bring every part of your trip together.
            </p>
          </div>

          <div className="mt-8 overflow-hidden rounded-[20px] border border-white/30 bg-white/95 shadow-cmt-sm sm:mt-10 lg:mt-14">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {POINTS.map(({ id, icon: Icon, title, body }) => (
                <article
                  key={id}
                  className="relative p-6 before:absolute before:inset-x-6 before:top-0 before:h-px before:bg-cmt-neutral-200 first:before:hidden sm:p-7 sm:before:inset-x-auto sm:before:inset-y-7 sm:before:left-0 sm:before:h-auto sm:before:w-px sm:odd:before:hidden lg:odd:before:block lg:first:before:hidden"
                >
                  <span className="grid size-12 place-items-center rounded-2xl border border-cmt-primary-500/25 bg-[#fff7da] text-cmt-secondary-900">
                    <Icon className="size-6" />
                  </span>
                  <h3 className="mt-5 font-display text-lg font-semibold leading-[1.3] tracking-tight text-cmt-secondary-900">
                    {title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-cmt-neutral-600">
                    {body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

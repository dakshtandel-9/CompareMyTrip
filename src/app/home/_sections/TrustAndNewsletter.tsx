"use client";

import { useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Mail } from "lucide-react";

import { Glyph } from "@/lib/adminIcons";
import { useSiteContent } from "@/lib/useSiteContent";
import { saveNewsletterSubscription } from "@/lib/firebase/newsletter";

/* ------------------------------------------------------------------ */
/* Two-tone trust icons (design.md §9.5)                               */
/* "A black glyph with a single yellow accent stroke" — the signature   */
/* CompareMyTrip icon treatment, for feature icons at 24px+.            */
/* Stroke is 2.5px rendered (§9.2 Bold, for 32px icons), held there by  */
/* vector-effect so it does not scale with the 24px viewBox.            */
/* ------------------------------------------------------------------ */

type IconProps = { className?: string };

const strokeProps = {
  fill: "none",
  strokeWidth: 2.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  vectorEffect: "non-scaling-stroke",
} as const;

/* Guarantee seal — 12-point scalloped badge with a gold currency mark. */
function PriceSealTwoTone({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        {...strokeProps}
        stroke="currentColor"
        d="M12 1.9 14.15 3.98 17.05 3.25 17.87 6.13 20.75 6.95 20.02 9.85 22.1 12 20.02 14.15 20.75 17.05 17.87 17.87 17.05 20.75 14.15 20.02 12 22.1 9.85 20.02 6.95 20.75 6.13 17.87 3.25 17.05 3.98 14.15 1.9 12 3.98 9.85 3.25 6.95 6.13 6.13 6.95 3.25 9.85 3.98Z"
      />
      <path
        {...strokeProps}
        className="stroke-cmt-primary-500"
        d="M14.4 9.5a2.2 2.2 0 0 0-2.1-1.5h-1.4a1.95 1.95 0 0 0 0 3.9h2a1.95 1.95 0 0 1 0 3.9h-1.4a2.2 2.2 0 0 1-2.1-1.5"
      />
      <path {...strokeProps} className="stroke-cmt-primary-500" d="M12 6.6v10.8" />
    </svg>
  );
}

/* Support headset — dark band and cups, gold mic boom. */
function HeadsetTwoTone({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path {...strokeProps} stroke="currentColor" d="M4.6 13.6v-2.2a7.4 7.4 0 0 1 14.8 0v2.2" />
      <rect {...strokeProps} stroke="currentColor" x="2.3" y="12.2" width="4.5" height="6.6" rx="2.25" />
      <rect {...strokeProps} stroke="currentColor" x="17.2" y="12.2" width="4.5" height="6.6" rx="2.25" />
      <path
        {...strokeProps}
        className="stroke-cmt-primary-500"
        d="M4.55 18.8v1a2.2 2.2 0 0 0 2.2 2.2h2.95"
      />
      <circle {...strokeProps} className="stroke-cmt-primary-500" cx="10.9" cy="22" r="1.2" />
    </svg>
  );
}

/* Secure payments — dark shield, gold padlock. */
function ShieldLockTwoTone({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        {...strokeProps}
        stroke="currentColor"
        d="M12 21.4c4.5-1.9 7.3-5.5 7.3-9.7V5.9L12 3 4.7 5.9v5.8c0 4.2 2.8 7.8 7.3 9.7Z"
      />
      <rect {...strokeProps} className="stroke-cmt-primary-500" x="9" y="11.6" width="6" height="5" rx="1.2" />
      <path {...strokeProps} className="stroke-cmt-primary-500" d="M10.4 11.6v-1.5a1.6 1.6 0 0 1 3.2 0v1.5" />
    </svg>
  );
}

/* Easy booking — dark calendar frame, gold confirmation tick. */
function BookingCheckTwoTone({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect {...strokeProps} stroke="currentColor" x="2.8" y="4.6" width="18.4" height="16.6" rx="2.6" />
      <path {...strokeProps} stroke="currentColor" d="M7.8 2.4v4.4" />
      <path {...strokeProps} stroke="currentColor" d="M16.2 2.4v4.4" />
      <path {...strokeProps} stroke="currentColor" d="M2.8 9.9h18.4" />
      <path {...strokeProps} className="stroke-cmt-primary-500" d="m8.4 15.3 2.5 2.5 4.7-4.9" />
    </svg>
  );
}

/* Brand-decorative send mark (§9.5 "Brand Yellow (outline)") — the one
   piece of decoration this band spends its budget on (§12.3). */
function SendMailMark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 44 32" className={className} fill="none" aria-hidden="true">
      <g
        stroke="var(--cmt-color-primary-500)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      >
        <rect x="14.2" y="5.5" width="28.3" height="21" rx="2.6" />
        <path d="M15.4 7.6 28.35 17.1 41.3 7.6" />
        <path d="M2.6 10.5h6.6" />
        <path d="M1.5 16h7.7" />
        <path d="M4.4 21.5h4.8" />
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */

/* The four marks above are drawn for this band specifically — two-tone, gold
   on white, at a weight the plain library glyphs do not have. The CRM stores
   an icon name per point: one of these four keeps the drawing, anything else
   falls through to the shared library. */
const TWO_TONE_MARKS: Record<string, (props: IconProps) => React.JSX.Element> = {
  "price-seal": PriceSealTwoTone,
  headset: HeadsetTwoTone,
  "shield-lock": ShieldLockTwoTone,
  "booking-check": BookingCheckTwoTone,
};

function TrustMark({ name, className }: { name: string; className?: string }) {
  const Drawn = TWO_TONE_MARKS[name];
  if (Drawn) return <Drawn className={className} />;
  return <Glyph name={name} className={className} strokeWidth={1.6} />;
}

type SubmitState = { kind: "idle" } | { kind: "error"; message: string } | { kind: "success" };

/* Deliberately permissive — the real check is the confirmation email. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function TrustAndNewsletter() {
  const { newsletter } = useSiteContent();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<SubmitState>({ kind: "idle" });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = email.trim();

    if (!EMAIL_PATTERN.test(value)) {
      setState({ kind: "error", message: "Enter a valid email address so we know where to send it." });
      return;
    }

    try {
      setSubmitting(true);
      await saveNewsletterSubscription(value);
      setState({ kind: "success" });
      setEmail("");
    } catch (cause) {
      setState({ kind: "error", message: cause instanceof Error ? cause.message : "We could not save your subscription. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  /* After the state hooks, never before. */
  if (!newsletter.enabled) return null;

  return (
    <>
      {/* Trust row — four claims, one line of proof each, nothing else
          competing for the strip. Icons run at the same 32px glyph / tinted
          backplate treatment as the feature cards further up the page. */}
      <section
        id="why-book-with-us"
        className="w-full border-t border-cmt-neutral-100 bg-white px-4 py-12 sm:px-5 sm:py-16 lg:px-6 lg:py-20"
      >
        <ul className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {newsletter.points.map((point, index) => (
            <li
              key={point.id}
              className="animate-cmt-rise flex flex-col items-center text-center"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-cmt-full bg-cmt-primary-100">
                <TrustMark name={point.icon} className="h-8 w-8 text-cmt-neutral-900" />
              </span>

              {/* H3 (§4.3): 18 / 20px, Space Grotesk 600. */}
              <h3 className="mt-5 text-balance font-display text-lg font-semibold leading-[1.3] text-cmt-neutral-900 sm:text-xl">
                {point.title}
              </h3>

              <p className="mt-2 max-w-[32ch] text-pretty text-sm leading-[1.55] text-cmt-neutral-700 sm:text-base">
                {point.description}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Newsletter — the page has no footer, so this dark panel closes it out
          and echoes the hero card at the top. Gold on near-black (§3.7): the
          accent line and the button are the only saturated elements. */}
      <section
        id="newsletter"
        className="w-full bg-white px-4 pb-12 sm:px-5 sm:pb-16 lg:px-6 lg:pb-24"
      >
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="animate-cmt-rise relative isolate overflow-hidden rounded-cmt-lg bg-cmt-secondary-900 px-6 py-14 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
            {/* Single soft gold wash behind the headline — decoration budget
                (§12.3) spent here rather than on borders or extra rules. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 -top-40 -z-10 mx-auto h-80 w-[min(720px,90%)] rounded-full bg-cmt-primary-500/20 blur-3xl"
            />

            <div className="mx-auto flex max-w-[680px] flex-col items-center text-center">
              <SendMailMark className="h-9 w-12 sm:h-10 sm:w-14" />

              {/* Two-tone headline (§4.5) — on dark the gold segment is
                  primary-500; primary-800 is the light-background gold. */}
              <h2 className="mt-6 text-balance font-display text-[32px] font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[56px]">
                {newsletter.titleLine1}
                <span className="block text-cmt-primary-500">{newsletter.titleLine2}</span>
              </h2>

              <p className="mt-5 max-w-[44ch] text-pretty text-base leading-[1.6] text-white/70 sm:text-lg">
                {newsletter.description}
              </p>

              <form
                onSubmit={handleSubmit}
                noValidate
                className="mt-9 flex w-full max-w-[560px] flex-col gap-3 sm:flex-row"
              >
                <div className="relative flex-1">
                  <label htmlFor="newsletter-email" className="sr-only">
                    Email address
                  </label>
                  <Mail
                    className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/45"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  {/* Input field (§8.2) at 56px, matched to the button so the
                      pair reads as one control group at this scale. */}
                  <input
                    id="newsletter-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder={newsletter.placeholder}
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (state.kind !== "idle") setState({ kind: "idle" });
                    }}
                    aria-invalid={state.kind === "error"}
                    aria-describedby="newsletter-status"
                    className={`h-14 w-full rounded-cmt-control border bg-white/10 pl-12 text-base text-white placeholder:text-white/45 transition-colors duration-150 focus:outline-2 focus:-outline-offset-2 focus:outline-cmt-primary-500 ${
                      state.kind === "error"
                        ? "border-cmt-error-500 pr-11"
                        : "border-white/20 pr-4 hover:border-white/35 focus:border-cmt-primary-500"
                    }`}
                  />
                  {state.kind === "error" ? (
                    <AlertCircle
                      className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cmt-error-500"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  ) : null}
                </div>

                {/* Primary button (§8.1) — 56px to match the field. */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-cmt-control bg-cmt-primary-500 px-7 text-base font-semibold tracking-[0.005em] text-cmt-neutral-900 shadow-cmt-xs transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:bg-cmt-primary-600 hover:shadow-cmt-primary active:translate-y-0 active:bg-cmt-primary-700 active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 disabled:cursor-wait disabled:opacity-60"
                >
                  {submitting ? "Subscribing…" : newsletter.ctaLabel}
                  <ArrowRight className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
                </button>
              </form>

              {/* Consent line (§15.6 CTA-4), doubling as the live status slot
                  so the panel height never jumps on submit. */}
              <p
                id="newsletter-status"
                aria-live="polite"
                className={`mt-4 flex items-start gap-1.5 text-sm leading-[1.5] ${
                  state.kind === "error"
                    ? "text-cmt-error-100"
                    : state.kind === "success"
                      ? "text-cmt-success-100"
                      : "text-white/55"
                }`}
              >
                {state.kind === "error" ? (
                  <>
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                    {state.message}
                  </>
                ) : state.kind === "success" ? (
                  <>
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                    {newsletter.successMessage}
                  </>
                ) : (
                  newsletter.note
                )}
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

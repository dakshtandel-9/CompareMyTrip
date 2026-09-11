import Link from "next/link";
import { ArrowDown, BadgeIndianRupee, BedDouble, ChevronDown, Palmtree, ShieldCheck } from "lucide-react";
import { GUARANTEE_EXCLUSIONS, HOLIDAY_QUESTIONS, HOTEL_QUESTIONS, QUOTE_STEPS, type GuaranteeQuestion } from "./guaranteeContent";

function Questions({ items }: { items: GuaranteeQuestion[] }) {
  return (
    <div className="mt-5 divide-y divide-cmt-neutral-200">
      {items.map(({ question, answers }) => (
        <details key={question} className="group py-1">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 rounded-lg py-4 text-sm font-semibold leading-6 focus-visible:outline-2 focus-visible:outline-cmt-primary-500 [&::-webkit-details-marker]:hidden">
            {question}
            <ChevronDown aria-hidden="true" className="mt-1 size-4 shrink-0 text-cmt-neutral-500 transition-transform group-open:rotate-180" />
          </summary>
          <div className="space-y-3 pb-5 pr-5 text-sm leading-7 text-cmt-neutral-600">
            {answers.map((answer) => <p key={answer}>{answer}</p>)}
          </div>
        </details>
      ))}
    </div>
  );
}

export default function QuoteGuarantee({ onOpenQuote }: { onOpenQuote: () => void }) {
  return (
    <section id="quote-guarantee" aria-labelledby="quote-guarantee-title" className="scroll-mt-28 border-t border-cmt-neutral-200 bg-cmt-neutral-50 px-4 py-12 font-body text-cmt-neutral-900 sm:px-5 sm:py-16 lg:px-6">
      <div className="mx-auto max-w-[1440px]">
        <div className="overflow-hidden rounded-cmt-lg border border-cmt-primary-500/30 bg-white">
          <div className="grid gap-8 bg-cmt-primary-100/50 p-6 sm:p-9 lg:grid-cols-[1fr_320px] lg:items-center">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cmt-primary-900"><BadgeIndianRupee size={17} aria-hidden="true" /> A better price for the same trip</p>
              <h2 id="quote-guarantee-title" className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">Bring your quote. We’ll beat it.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-cmt-neutral-600 sm:text-base">Already have a travel quote? Compare the exact same destination and itinerary with us, and put the difference towards your holiday.</p>
              <a href="#quote-process" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold underline decoration-cmt-primary-500 underline-offset-4 focus-visible:outline-2 focus-visible:outline-cmt-primary-500">See how it works <ArrowDown size={16} aria-hidden="true" /></a>
            </div>
            <div className="rounded-cmt-md border border-cmt-primary-500/30 bg-white p-6">
              <ShieldCheck className="size-7 text-cmt-primary-700" aria-hidden="true" />
              <p className="mt-3 font-display text-lg font-semibold">If we can’t beat your quote</p>
              <p className="mt-2 text-sm leading-6 text-cmt-neutral-600">Your entire TOI refunded, plus <strong className="text-cmt-neutral-900">10× your TOI in redeemable rewards</strong> for future bookings.</p>
              <p className="mt-3 text-xs text-cmt-neutral-500">Terms and conditions apply.</p>
            </div>
          </div>
          <div id="quote-process" className="scroll-mt-28 p-6 sm:p-9">
            <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-display text-xl font-semibold">How it works</h3><button type="button" onClick={onOpenQuote} className="inline-flex min-h-11 items-center rounded-cmt-control bg-cmt-primary-500 px-5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500">Attach a PDF to your enquiry ↑</button></div>
            <ol className="mt-6 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
              {QUOTE_STEPS.map((step, index) => (
                <li key={step.title} className="flex items-start gap-3">
                  <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-cmt-primary-100 text-sm font-semibold text-cmt-primary-900">{index + 1}</span>
                  <div><h4 className="pt-1 font-display text-base font-semibold">{step.title}</h4><p className="mt-2 text-sm leading-6 text-cmt-neutral-600">{step.body}</p></div>
                </li>
              ))}
            </ol>
            <p className="mt-8 border-t border-cmt-neutral-200 pt-5 text-xs leading-6 text-cmt-neutral-500">The Token of Interest applies to the quote-beating service. Standard flight, hotel and visa enquiries remain free. <Link href="/terms" className="font-semibold text-cmt-neutral-700 underline underline-offset-4">Terms and conditions apply.</Link></p>
          </div>
        </div>

        <div className="mt-14" id="trust-guarantee">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cmt-primary-700"><ShieldCheck size={17} aria-hidden="true" /> CompareMyTrip Trust Guarantee</p>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-3xl">Support when your trip needs it.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-cmt-neutral-600">From check-in delays to missed transfers, here is how we help. These resolutions apply only to hotels and holidays booked under the Trust Guarantee category. Confirm eligibility with customer support before booking.</p>
          <div className="mt-7 grid items-start gap-6 lg:grid-cols-2">
            <article className="rounded-cmt-lg border border-cmt-neutral-200 bg-white p-6 sm:p-8">
              <h3 className="flex items-center gap-3 font-display text-xl font-semibold"><BedDouble className="size-5 text-cmt-primary-700" aria-hidden="true" /> Hotel queries</h3>
              <Questions items={HOTEL_QUESTIONS} />
            </article>
            <article className="rounded-cmt-lg border border-cmt-neutral-200 bg-white p-6 sm:p-8">
              <h3 className="flex items-center gap-3 font-display text-xl font-semibold"><Palmtree className="size-5 text-cmt-primary-700" aria-hidden="true" /> Holiday queries</h3>
              <Questions items={HOLIDAY_QUESTIONS} />
            </article>
          </div>
          <aside className="mt-6 rounded-cmt-md border border-cmt-neutral-200 p-6 sm:p-8" aria-labelledby="guarantee-exclusions-title">
            <h3 id="guarantee-exclusions-title" className="font-display text-base font-semibold">When the Trust Guarantee does not apply</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-cmt-neutral-600">{GUARANTEE_EXCLUSIONS.map((item) => <li key={item}>{item}</li>)}</ul>
            <p className="mt-4 text-sm leading-6 text-cmt-neutral-600">See our <Link href="/terms" className="font-semibold text-cmt-neutral-900 underline underline-offset-4">Terms and Conditions</Link> for detailed information.</p>
          </aside>
        </div>
      </div>
    </section>
  );
}

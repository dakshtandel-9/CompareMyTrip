"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, CalendarDays, ChevronDown, Users } from "lucide-react";
import { DUMMY_PACKAGES } from "@/lib/packageData";
import { useAuthUser } from "@/lib/firebase/useAuthUser";
import QuoteModal from "../[packageId]/QuoteModal";

const pkg = DUMMY_PACKAGES.find((item) => item.href === "/packages/kerala-backwaters-hills-escape");

export default function KeralaBookingActions({ mobile = false }: { mobile?: boolean }) {
  const authUser = useAuthUser();
  const [travellers, setTravellers] = useState(2);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const router = useRouter();

  if (!pkg) return null;

  /* A customized quote is filed against the customer's account, so it needs a
     real sign-in — the timed pop-up captures leads and cannot supply one. */
  const openQuote = () => {
    if (authUser === undefined) return;
    if (authUser === null) {
      router.push(`/login?next=${encodeURIComponent("/packages/kerala-backwaters-hills-escape")}`);
      return;
    }
    setQuoteOpen(true);
  };

  const checkoutHref = `/checkout?pkg=${encodeURIComponent(pkg.id)}&travellers=${travellers}`;

  return (
    <>
      {mobile ? (
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={checkoutHref}
            className="inline-flex h-11 items-center rounded-cmt-control border border-cmt-neutral-300 bg-white px-3 text-xs font-semibold text-cmt-neutral-900"
          >
            Pay &amp; book
          </Link>
          <button
            type="button"
            onClick={openQuote}
            className="inline-flex h-11 items-center gap-2 rounded-cmt-control bg-cmt-primary-500 px-3 text-xs font-semibold text-cmt-neutral-900 shadow-cmt-primary"
          >
            Get customized quote <ArrowRight className="size-4" />
          </button>
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-3">
            <label className="text-xs font-semibold text-cmt-neutral-700">
              Travel date
              <span className="relative mt-2 block">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cmt-neutral-400" />
                <input type="date" className="h-12 w-full rounded-cmt-control border border-cmt-neutral-200 bg-white pl-10 pr-3 text-sm font-medium outline-none focus:border-cmt-primary-500 focus:shadow-[var(--cmt-focus-ring)]" />
              </span>
            </label>
            <label className="text-xs font-semibold text-cmt-neutral-700">
              Travellers
              <span className="relative mt-2 block">
                <Users className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cmt-neutral-400" />
                <select
                  value={travellers}
                  onChange={(event) => setTravellers(Number(event.target.value))}
                  className="h-12 w-full appearance-none rounded-cmt-control border border-cmt-neutral-200 bg-white pl-10 pr-9 text-sm font-medium outline-none focus:border-cmt-primary-500 focus:shadow-[var(--cmt-focus-ring)]"
                >
                  <option value="1">1 traveller</option>
                  <option value="2">2 travellers</option>
                  <option value="3">3 travellers</option>
                  <option value="4">4 travellers</option>
                  <option value="5">5+ travellers</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-cmt-neutral-400" />
              </span>
            </label>
          </div>

          <button
            type="button"
            onClick={openQuote}
            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-cmt-control bg-cmt-primary-500 px-5 text-sm font-semibold text-cmt-neutral-900 shadow-cmt-primary transition-colors hover:bg-cmt-primary-600"
          >
            Get customized quote <ArrowRight className="size-4" />
          </button>
          <p className="mt-2 text-center text-xs leading-5 text-cmt-neutral-500">Sign in here to request a tailored product quote.</p>

          <Link
            href={checkoutHref}
            className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-cmt-control bg-cmt-secondary-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-cmt-neutral-700"
          >
            Pay &amp; book now
          </Link>
          <p className="mt-2 text-center text-xs leading-5 text-cmt-neutral-500">PayU setup is pending. This button keeps the existing checkout connection.</p>
        </>
      )}

      {quoteOpen ? <QuoteModal pkg={pkg} initialTravellers={travellers} onClose={() => setQuoteOpen(false)} /> : null}
    </>
  );
}

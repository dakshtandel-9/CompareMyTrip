"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Compass, Phone, Plane } from "lucide-react";
import ContentImage from "@/app/home/_components/ContentImage";
import { useSiteContentState } from "@/lib/useSiteContent";

export default function ComingSoonScreen() {
  const { content: { comingSoon, header }, loading } = useSiteContentState();
  const router = useRouter();
  const phone = header.topBar.phoneNumber.replace(/\D/g, "");

  // Re-run the server guard when an already open coming-soon page is
  // switched off, including a page restored from the client router cache.
  useEffect(() => {
    if (!loading && !comingSoon.enabled) router.refresh();
  }, [comingSoon.enabled, loading, router]);

  return (
    <main className="min-h-dvh bg-[#faf9f6] font-body text-cmt-neutral-900">
      <div className="mx-auto flex min-h-dvh max-w-[1440px] flex-col px-5 py-6 sm:px-8 lg:px-12 lg:py-9">
        <header className="flex items-center justify-between gap-5">
          <Image src="/comparemytrip-logo.png" alt="CompareMyTrip" width={240} height={42} className="h-auto w-44 sm:w-60" />
          <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-cmt-primary-500/40 bg-cmt-primary-50 px-3 py-2 text-xs font-semibold"><span className="size-2 rounded-full bg-cmt-primary-600" /> Coming soon</span>
        </header>
        <div className={`grid flex-1 items-center gap-10 py-12 lg:gap-16 lg:py-16 ${comingSoon.image ? "lg:grid-cols-2" : ""}`}>
          <div className="max-w-2xl">
            <span className="mb-6 inline-grid size-14 place-items-center rounded-2xl bg-cmt-primary-500 shadow-cmt-sm"><Plane className="size-7 -rotate-12" aria-hidden="true" /></span>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cmt-primary-800">Good things are on the horizon</p>
            <h1 className="mt-4 break-words font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">{comingSoon.title || "Coming soon"}</h1>
            <p className="mt-6 max-w-lg whitespace-pre-line text-base leading-8 text-cmt-neutral-600 sm:text-lg">{comingSoon.message}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {phone && <a href={`tel:+${phone}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-cmt-control bg-cmt-primary-500 px-6 text-sm font-semibold transition-colors hover:bg-cmt-primary-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cmt-primary-500"><Phone className="size-4" aria-hidden="true" /> Talk to our travel team <ArrowRight className="size-4" aria-hidden="true" /></a>}
            </div>
          </div>
          {comingSoon.image && <div className="relative isolate aspect-[4/3] overflow-hidden rounded-[2rem] bg-cmt-neutral-200 shadow-cmt-lg lg:aspect-[4/5]">
            <ContentImage src={comingSoon.image} alt={comingSoon.imageAlt} fill sizes="(max-width: 1023px) 100vw, 50vw" loading="eager" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-cmt-neutral-900/75 via-transparent to-transparent" />
            <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-white/25 bg-white/10 p-5 text-white backdrop-blur-md sm:inset-x-8 sm:bottom-8"><Compass className="mb-3 size-6 text-cmt-primary-400" aria-hidden="true" /><p className="font-display text-2xl font-semibold">A world worth exploring.</p><p className="mt-2 text-sm leading-6 text-white/80">New places. Unforgettable moments. Your kind of journey.</p></div>
          </div>}
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-cmt-neutral-200 pt-5 text-xs text-cmt-neutral-500">
          <p>CompareMyTrip · Your journey starts here.</p>
          <Link href="/login?next=%2Fadmin%2Fcontent" className="rounded underline-offset-4 hover:text-cmt-neutral-900 hover:underline focus-visible:outline-2 focus-visible:outline-cmt-primary-500">Admin sign in</Link>
        </footer>
      </div>
    </main>
  );
}

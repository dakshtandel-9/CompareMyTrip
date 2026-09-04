import Link from "next/link";
import { FileWarning } from "lucide-react";

import Footer from "@/components/Footer";
import Header from "@/components/Header";

export default function PendingPolicyPage({ title }: { title: string }) {
  return (
    <>
      <Header />
      <main className="grid min-h-[60vh] place-items-center bg-cmt-neutral-50 px-4 py-16 font-body text-cmt-neutral-900">
        <article className="w-full max-w-2xl rounded-cmt-lg border border-cmt-neutral-200 bg-white p-7 shadow-cmt-sm sm:p-10">
          <span className="grid size-12 place-items-center rounded-cmt-full bg-cmt-primary-100 text-cmt-primary-900">
            <FileWarning className="size-5" aria-hidden="true" />
          </span>
          <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 text-base leading-7 text-cmt-neutral-600">
            The approved business policy has not been supplied yet. This page is intentionally
            excluded from search results until the final policy is published and legally reviewed.
          </p>
          <p className="mt-3 text-sm leading-6 text-cmt-neutral-600">
            CompareMyTrip should not accept production bookings until this document is complete.
          </p>
          <Link
            href="/"
            className="mt-7 inline-flex h-11 items-center rounded-cmt-control bg-cmt-primary-500 px-5 text-sm font-semibold text-cmt-neutral-900"
          >
            Return to homepage
          </Link>
        </article>
      </main>
      <Footer />
    </>
  );
}


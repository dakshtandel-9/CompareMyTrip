"use client";

export default function PageError({ retry }: { retry: () => void }) {
  return (
    <main className="grid min-h-[70dvh] place-items-center bg-cmt-neutral-50 px-6 py-16 font-body text-cmt-neutral-900">
      <div className="max-w-lg text-center" role="alert">
        <h1 className="font-display text-3xl font-semibold">We couldn’t load this page</h1>
        <p className="mt-4 text-base leading-7 text-cmt-neutral-600">
          Please try again. If the problem continues, return to the homepage to explore your trip options.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={retry} className="min-h-11 rounded-cmt-control bg-cmt-primary-500 px-6 font-semibold hover:bg-cmt-primary-600 focus-visible:outline-2 focus-visible:outline-offset-4">
            Try again
          </button>
          {/* A document navigation also recovers from a stale client bundle. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className="inline-flex min-h-11 items-center rounded-cmt-control border border-cmt-neutral-300 px-6 font-semibold hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4">
            Return to homepage
          </a>
        </div>
      </div>
    </main>
  );
}

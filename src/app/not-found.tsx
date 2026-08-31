import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-cmt-neutral-50 px-6 font-body text-cmt-neutral-900">
      <div className="max-w-lg text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-cmt-full bg-cmt-primary-100 text-cmt-primary-900">
          <Compass className="size-7" aria-hidden="true" />
        </span>
        <p className="mt-7 font-display text-7xl font-semibold tracking-tight sm:text-8xl">404</p>
        <h1 className="mt-3 font-display text-2xl font-semibold sm:text-3xl">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-cmt-neutral-600">
          This page does not exist or is not available to your account.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex h-11 items-center gap-2 rounded-cmt-control bg-cmt-primary-500 px-5 text-sm font-semibold text-cmt-neutral-900 shadow-cmt-primary transition-colors hover:bg-cmt-primary-600"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Return to homepage
        </Link>
      </div>
    </main>
  );
}

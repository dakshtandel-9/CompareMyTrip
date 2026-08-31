import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, TriangleAlert } from "lucide-react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getPayuConfig, normaliseTravellers, priceOrder, resolvePackage } from "@/lib/payu";
import CheckoutForm from "./CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout | CompareMyTrip",
  description: "Confirm your travellers and pay securely to hold your package.",
  robots: { index: false, follow: false },
};

const formatINR = (value: number) => `₹${value.toLocaleString("en-IN")}`;

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="w-full bg-cmt-neutral-50 font-body text-cmt-neutral-900">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-5 sm:py-14 lg:px-6">
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto max-w-[560px] rounded-cmt-md border border-cmt-neutral-200 bg-white p-8 text-center shadow-cmt-sm">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-cmt-full bg-cmt-primary-100">
        <TriangleAlert className="h-6 w-6 text-cmt-neutral-900" strokeWidth={2} aria-hidden="true" />
      </span>
      <h1 className="mt-5 font-display text-2xl font-semibold text-cmt-neutral-900">{title}</h1>
      <p className="mt-2 text-pretty text-sm leading-[1.6] text-cmt-neutral-600">{body}</p>
      <Link
        href="/packages"
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-cmt-control border border-cmt-neutral-300 bg-white px-5 text-sm font-semibold text-cmt-neutral-900 transition-colors hover:border-cmt-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
        Back to packages
      </Link>
    </div>
  );
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ pkg?: string; travellers?: string }>;
}) {
  const params = await searchParams;
  const pkg = resolvePackage(params.pkg ?? "");

  if (!pkg) {
    return (
      <Shell>
        <Notice
          title="That package can't be paid for online yet"
          body="Packages added through the admin panel are stored in your browser, so the server has no price to charge against. Send an enquiry instead and the travel desk will raise a payment link."
        />
      </Shell>
    );
  }

  const order = priceOrder(pkg, normaliseTravellers(params.travellers));
  const configured = getPayuConfig() !== null;

  return (
    <Shell>
      <Link
        href={`/packages/${pkg.id}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-cmt-neutral-700 transition-colors hover:text-cmt-neutral-900"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
        Back to the package
      </Link>

      <h1 className="mt-4 font-display text-3xl font-semibold leading-[1.15] tracking-tight sm:text-4xl">
        Checkout
      </h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-12 lg:gap-8">
        {/* Buyer details */}
        <section className="lg:col-span-7">
          <div className="rounded-cmt-md border border-cmt-neutral-200 bg-white p-6 shadow-cmt-sm sm:p-8">
            <h2 className="font-display text-xl font-semibold sm:text-2xl">Who is travelling?</h2>
            <p className="mt-2 max-w-[52ch] text-sm leading-[1.6] text-cmt-neutral-600">
              The booking confirmation and operator contact go to these details.
            </p>

            {!configured ? (
              <p className="mt-6 flex items-start gap-2 rounded-cmt-control border border-cmt-error-500/40 bg-cmt-error-100/50 p-4 text-sm leading-[1.55] text-cmt-error-700">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
                Payments are not switched on yet — PAYU_MERCHANT_KEY and PAYU_SALT
                are missing from the environment.
              </p>
            ) : null}

            <div className="mt-6">
              <CheckoutForm
                packageId={pkg.id}
                travellers={order.travellers}
                disabled={!configured}
              />
            </div>
          </div>
        </section>

        {/* Order summary */}
        <aside className="lg:col-span-5">
          <div className="rounded-cmt-md border border-cmt-neutral-200 bg-white p-6 shadow-cmt-sm sm:p-8">
            <h2 className="font-display text-xl font-semibold">Order summary</h2>

            <div className="mt-5 flex gap-4">
              <span className="relative h-20 w-24 shrink-0 overflow-hidden rounded-cmt-sm bg-cmt-neutral-100">
                <Image src={pkg.image} alt="" fill sizes="96px" className="object-cover" />
              </span>
              <div className="min-w-0">
                <p className="font-display text-[15px] font-semibold leading-snug">{pkg.title}</p>
                <p className="mt-1 text-sm text-cmt-neutral-600">{pkg.location}</p>
                <p className="mt-1 text-xs text-cmt-neutral-500">
                  {pkg.nights} nights / {pkg.days} days · {pkg.location}
                </p>
              </div>
            </div>

            <dl className="mt-6 space-y-3 border-t border-cmt-neutral-200 pt-5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-cmt-neutral-600">Per person</dt>
                <dd className="tabular-nums font-medium">{formatINR(order.perPerson)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-cmt-neutral-600">Travellers</dt>
                <dd className="tabular-nums font-medium">{order.travellers}</dd>
              </div>
            </dl>

            <div className="mt-5 flex items-baseline justify-between border-t border-cmt-neutral-200 pt-5">
              <span className="font-display text-base font-semibold">Total payable</span>
              <span className="tabular-nums font-display text-2xl font-bold">
                {formatINR(order.total)}
              </span>
            </div>

            <p className="mt-4 flex items-center gap-1.5 text-xs text-cmt-neutral-600">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-cmt-success-700" strokeWidth={2.25} aria-hidden="true" />
              GST-verified · free cancellation
            </p>
          </div>
        </aside>
      </div>
    </Shell>
  );
}

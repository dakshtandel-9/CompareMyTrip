import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, TriangleAlert } from "lucide-react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { isDepartureAllowed } from "@/lib/packageData";
import { getPayuConfig, normaliseTravelDate, normaliseTravellers, priceOrder, resolvePackage } from "@/lib/payu";
import CheckoutPanels from "./CheckoutPanels";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Confirm your travellers and pay securely to hold your package.",
  robots: { index: false, follow: false },
};

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
  searchParams: Promise<{ pkg?: string; travellers?: string; date?: string }>;
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
  /* Chosen back on the package page. Re-checked here rather than trusted:
     it arrives in a URL anyone can edit, and the package may only run on
     certain weekdays. A date that fails either test is dropped, so the
     summary never shows a departure this trip cannot make. */
  const requestedDate = normaliseTravelDate(params.date);
  const travelDate = isDepartureAllowed(pkg, requestedDate) ? requestedDate : "";
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

      {/* Prices come from the server catalogue; the panels only ever show
          them, and ask /api/coupons/validate what a code takes off. */}
      <CheckoutPanels
        packageId={pkg.id}
        packageTitle={pkg.title}
        packageLocation={pkg.location}
        packageImage={pkg.image}
        nights={pkg.nights}
        days={pkg.days}
        perPerson={order.perPerson}
        travellers={order.travellers}
        travelDate={travelDate}
        subtotal={order.subtotal}
        configured={configured}
      />
    </Shell>
  );
}

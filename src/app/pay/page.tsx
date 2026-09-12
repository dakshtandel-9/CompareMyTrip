import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getPayuConfig } from "@/lib/payu";
import { CUSTOM_PAYMENT_ERRORS } from "@/lib/customPayment";
import CustomPaymentForm from "./CustomPaymentForm";
import PaymentHistory from "./PaymentHistory";

export const metadata: Metadata = { title: "Pay an amount", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PayPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const config = getPayuConfig();
  const message = !config ? CUSTOM_PAYMENT_ERRORS.unavailable : error ? CUSTOM_PAYMENT_ERRORS[error] : "";
  return <>
    <Header />
    <main className="bg-cmt-neutral-50 px-4 py-12 text-cmt-neutral-900 sm:py-20">
      <div className="mx-auto grid max-w-[1120px] items-start gap-6 lg:grid-cols-[minmax(0,600px)_minmax(0,1fr)]">
      <div className="w-full rounded-cmt-md border border-cmt-neutral-200 bg-white p-6 shadow-cmt-sm sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-wider text-cmt-neutral-500">Pay CompareMyTrip</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">One call. One easy payment.</h1>
        <p className="mt-3 text-sm leading-6 text-cmt-neutral-600">Enter the amount discussed with our travel team. Add your contact details so we can match the payment to your trip.</p>
        {config?.mode === "test" && <p className="mt-5 rounded-cmt-control bg-cmt-primary-100 p-3 text-sm">Test mode — this checkout does not collect real money.</p>}
        {message && <p role="alert" className="mt-5 rounded-cmt-control bg-cmt-error-100 p-3 text-sm text-cmt-error-700">{message}</p>}
        <CustomPaymentForm enabled={Boolean(config)} />
      </div>
      <PaymentHistory />
      </div>
    </main>
    <Footer />
  </>;
}

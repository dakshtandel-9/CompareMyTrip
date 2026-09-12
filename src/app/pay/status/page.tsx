import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, CircleHelp } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getAdminDb } from "@/lib/firebase/admin";

export const metadata: Metadata = { title: "Payment receipt", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function CustomPaymentStatus({ searchParams }: { searchParams: Promise<{ txnid?: string }> }) {
  const { txnid } = await searchParams;
  let payment: { status: string; amount: number; mismatch: boolean; test: boolean } | null = null;
  if (txnid && /^[A-Z0-9]{10,40}$/.test(txnid)) {
    try {
      const data = (await getAdminDb()?.collection("trips").doc(txnid).get())?.data();
      if (data?.paymentKind === "custom") payment = { status: data.paymentStatus, amount: Number(data.amount), mismatch: Boolean(data.amountMismatch), test: data.payuEnvironment === "test" };
    } catch { /* Keep a storage outage in the unconfirmed state. */ }
  }
  const success = payment?.status === "successful" && !payment.mismatch;
  const failed = payment?.status === "failed";
  const heading = success ? payment?.test ? "Test payment completed." : "Payment received." : failed ? "Payment did not go through." : "Payment is not yet confirmed.";
  const Icon = success ? CheckCircle2 : CircleHelp;
  return <>
    <Header />
    <main className="bg-cmt-neutral-50 px-4 py-16 text-cmt-neutral-900">
      <div className="mx-auto max-w-[600px] rounded-cmt-md border border-cmt-neutral-200 bg-white p-7 text-center shadow-cmt-sm sm:p-10">
        <Icon className={`mx-auto h-12 w-12 ${success ? "text-cmt-success-700" : "text-cmt-neutral-500"}`} aria-hidden="true" />
        <h1 className="mt-5 font-display text-3xl font-semibold">{heading}</h1>
        <p className="mt-4 text-sm leading-6 text-cmt-neutral-600">{success
          ? payment?.test ? "This was a test transaction. No real payment has been collected." : "Thank you. Share the transaction reference below with our travel team so they can confirm your arrangements."
          : "If money was deducted, please contact our team with your transaction reference before trying again."}</p>
        {txnid && /^[A-Z0-9]{10,40}$/.test(txnid) && <dl className="mt-6 space-y-3 rounded-cmt-control bg-cmt-neutral-50 p-4 text-sm">
          {payment && <div><dt className="text-cmt-neutral-500">Amount</dt><dd className="mt-1 text-2xl font-semibold">₹{payment.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</dd></div>}
          <div><dt className="text-cmt-neutral-500">Transaction reference</dt><dd className="mt-1 break-all font-mono">{txnid}</dd></div>
        </dl>}
        <Link href="/contact" className="mt-7 inline-flex min-h-12 items-center justify-center rounded-cmt-control bg-cmt-primary-500 px-6 font-semibold hover:bg-cmt-primary-600">Contact our team</Link>
        <Link href="/pay#payment-history" className="mt-4 block text-sm font-semibold underline">View payment history</Link>
        {!success && <Link href={txnid ? `/pay/status?txnid=${encodeURIComponent(txnid)}` : "/pay"} className="mt-4 block text-sm font-semibold underline">{txnid ? "Refresh payment status" : "Back to payment"}</Link>}
      </div>
    </main>
    <Footer />
  </>;
}

"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, MessageSquareText, RefreshCw } from "lucide-react";
import { paymentRequest, PAYMENT_REPORT_CHANGED_EVENT } from "@/lib/paymentClient";
import type { PaymentReport } from "@/lib/pendingPayments";

const BUTTON = "inline-flex min-h-11 items-center justify-center gap-2 rounded-cmt-control border border-cmt-neutral-200 bg-white px-4 text-xs font-semibold text-cmt-neutral-900 hover:border-cmt-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 disabled:opacity-50";
const date = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

export default function PaymentReports({ admin = false }: { admin?: boolean }) {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<PaymentReport[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [refresh, setRefresh] = useState(0);
  const [showResolved, setShowResolved] = useState(false);
  const endpoint = admin ? "/api/admin/payment-reports" : "/api/account/payment-reports";
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const result = await paymentRequest<{ reports: PaymentReport[] }>(endpoint, undefined, controller.signal);
        if (!controller.signal.aborted) { setReports(result.reports); setError(""); }
      } catch (cause) { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Payment requests could not be loaded."); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    const timer = setInterval(() => void load(), 60_000);
    const changed = () => void load();
    window.addEventListener(PAYMENT_REPORT_CHANGED_EVENT, changed);
    return () => { controller.abort(); clearInterval(timer); window.removeEventListener(PAYMENT_REPORT_CHANGED_EVENT, changed); };
  }, [endpoint, refresh]);

  async function act(report: PaymentReport, action: "check" | "resolve") {
    setBusy(report.id); setError(""); setNotice("");
    try {
      const result = await paymentRequest<{ message: string }>(endpoint, { tripId: report.tripId, action, note: notes[report.id] || "" });
      setNotice(result.message); setRefresh(value => value + 1);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The request could not be updated."); }
    finally { setBusy(""); }
  }
  if (!admin && reports.length === 0 && !error) return null;
  const visible = admin && !showResolved ? reports.filter(report => report.status === "open") : reports;
  return <section aria-label="Payment requests" className="mt-6 rounded-cmt-md border border-cmt-neutral-200 bg-white p-4 shadow-cmt-sm sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="flex items-center gap-2 font-display text-xl font-semibold text-cmt-neutral-900"><MessageSquareText className="size-5 text-cmt-primary-900" aria-hidden="true" />Payment requests</h2><p className="mt-2 text-xs leading-relaxed text-cmt-neutral-500">{admin ? "Travellers who report a payment that is not reflected in their booking. Verify in PayU before resolving." : "Updates on payments you asked our travel team to check."}</p></div>
      <button type="button" onClick={() => setRefresh(value => value + 1)} className={BUTTON}><RefreshCw className="size-4" aria-hidden="true" />Refresh</button>
    </div>
    {admin ? <label className="mt-4 flex min-h-11 items-center gap-2 text-xs text-cmt-neutral-600"><input type="checkbox" checked={showResolved} onChange={event => setShowResolved(event.target.checked)} className="size-4 accent-cmt-primary-500" />Include resolved requests</label> : null}
    {error ? <p role="alert" className="mt-3 text-xs text-cmt-error-700">{error}</p> : null}
    {notice ? <p role="status" className="mt-3 text-xs text-cmt-neutral-700">{notice}</p> : null}
    <div className="mt-4 space-y-4">{visible.map(report => <article key={report.id} className="rounded-cmt-control border border-cmt-neutral-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-display text-base font-semibold text-cmt-neutral-900">{report.packageTitle}</h3><span className={`rounded-cmt-full px-3 py-1 text-xs font-semibold ${report.status === "open" ? "bg-cmt-primary-100 text-cmt-primary-900" : "bg-cmt-success-100 text-cmt-success-700"}`}>{report.status === "open" ? "Under review" : "Resolved"}</span></div>
      <p className="mt-2 break-all text-xs text-cmt-neutral-500">Booking {report.tripId} · ₹{report.amount.toLocaleString("en-IN")} · {report.createdAt ? date.format(new Date(report.createdAt)) : "Just submitted"}</p>
      {admin ? <p className="mt-2 break-words text-sm text-cmt-neutral-700">{report.name} · {report.email} · {report.phone}</p> : null}
      <p className="mt-3 break-all text-sm text-cmt-neutral-700"><strong>Payment reference:</strong> {report.reference}</p>
      {report.message ? <p className="mt-2 whitespace-pre-wrap break-words text-sm text-cmt-neutral-600">{report.message}</p> : null}
      {report.adminNote ? <p className="mt-3 rounded-cmt-sm bg-cmt-neutral-50 p-3 text-sm text-cmt-neutral-700"><strong>Travel team:</strong> {report.adminNote}</p> : null}
      {admin && report.status === "open" ? <form onSubmit={event => { event.preventDefault(); void act(report, "resolve"); }} className="mt-4 space-y-3">
        <label className="block text-xs font-semibold text-cmt-neutral-700">Reply to traveller<textarea required minLength={4} maxLength={2000} rows={2} value={notes[report.id] || ""} onChange={event => setNotes(current => ({ ...current, [report.id]: event.target.value }))} className="mt-2 block w-full rounded-cmt-control border border-cmt-neutral-200 p-3 text-sm font-normal outline-none focus:border-cmt-primary-500" /></label>
        <div className="flex flex-wrap gap-2"><button type="button" disabled={Boolean(busy)} onClick={() => void act(report, "check")} className={BUTTON}><RefreshCw className="size-4" aria-hidden="true" />Check PayU</button><button type="submit" disabled={Boolean(busy)} className={BUTTON}><CheckCircle2 className="size-4" aria-hidden="true" />Resolve request</button></div>
      </form> : null}
    </article>)}</div>
    {admin && loading ? <p role="status" className="py-5 text-sm text-cmt-neutral-500">Loading payment requests…</p> : null}
    {admin && !loading && !error && visible.length === 0 ? <p className="py-5 text-center text-sm text-cmt-neutral-500">No {showResolved ? "" : "open "}payment requests.</p> : null}
  </section>;
}

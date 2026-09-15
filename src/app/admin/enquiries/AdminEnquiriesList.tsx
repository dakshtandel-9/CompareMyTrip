"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Download, Trash2 } from "lucide-react";
import { ContactLinks, InboxFilters, InboxSearch, InboxState, OperationsHeader, WorkflowGuide } from "./OperationsUI";
import {
  deleteContactEnquiry,
  subscribeToContactEnquiries,
  updateEnquiryStatus,
  type ContactEnquiry,
  type EnquiryStatus,
} from "@/lib/firebase/enquiries";
import { useAuthUser } from "@/lib/firebase/useAuthUser";
import { useAllPackages } from "@/lib/usePackages";

const dateFormatter = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" });
const formatINR = (value: number) => `₹${value.toLocaleString("en-IN")}`;

export default function AdminEnquiriesList({ kind }: { kind: "contact" | "package" }) {
  const authUser = useAuthUser();
  const packages = useAllPackages();
  const [enquiries, setEnquiries] = useState<ContactEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EnquiryStatus | "all">("all");
  const [notice, setNotice] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const [downloadingId, setDownloadingId] = useState("");
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    if (!authUser) return;
    return subscribeToContactEnquiries(
      (nextEnquiries) => { setEnquiries(nextEnquiries); setError(""); setLoading(false); },
      (message) => { setError(message); setLoading(false); },
    );
  }, [authUser]);

  const relevantEnquiries = useMemo(
    () => enquiries.filter((enquiry) => kind === "package" ? enquiry.source === "custom_quote" : enquiry.source !== "custom_quote"),
    [enquiries, kind],
  );

  const visibleEnquiries = useMemo(() => {
    const query = search.trim().toLowerCase();
    return relevantEnquiries.filter(enquiry =>
      (statusFilter === "all" || enquiry.status === statusFilter) &&
      (!query || [enquiry.name, enquiry.email, enquiry.phone, enquiry.destination, enquiry.packageTitle, enquiry.message]
        .some(value => value.toLowerCase().includes(query))),
    );
  }, [relevantEnquiries, search, statusFilter]);

  const changeStatus = async (enquiry: ContactEnquiry, status: EnquiryStatus) => {
    setUpdatingId(enquiry.id); setError(""); setNotice("");
    const previousStatus = enquiry.status;
    const setLocalStatus = (nextStatus: EnquiryStatus) => setEnquiries((current) => current.map((item) => item.id === enquiry.id ? { ...item, status: nextStatus } : item));
    setLocalStatus(status);
    try {
      await updateEnquiryStatus(enquiry.id, status);
      // Keep the controlled select on the confirmed value even if an older
      // cached snapshot arrived while the write was in flight.
      setLocalStatus(status);
      setNotice(`Status saved for ${enquiry.name || "this customer"}.`);
    }
    catch (cause) {
      setLocalStatus(previousStatus);
      setError(cause instanceof Error ? cause.message : "The contact status could not be updated.");
    }
    finally { setUpdatingId(""); }
  };

  const removeEnquiry = async (enquiry: ContactEnquiry) => {
    if (!window.confirm(`Delete the enquiry from ${enquiry.name}? This cannot be undone.`)) return;
    setDeletingId(enquiry.id); setError("");
    try { await deleteContactEnquiry(enquiry.id); setNotice("Enquiry deleted."); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "The enquiry could not be deleted."); }
    finally { setDeletingId(""); }
  };

  const downloadQuote = async (enquiry: ContactEnquiry) => {
    setDownloadingId(enquiry.id); setError("");
    try {
      const token = await authUser?.getIdToken();
      if (!token) throw new Error("Sign in to download quote PDFs.");
      const response = await fetch(`/api/quotes/${enquiry.id}`, { headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "The PDF could not be downloaded.");
      const link = document.createElement("a");
      link.href = result.url; link.rel = "noreferrer"; link.click();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The PDF could not be downloaded."); }
    finally { setDownloadingId(""); }
  };

  const isLoading = authUser === undefined || (authUser !== null && loading);
  const displayError = authUser === null ? "Sign in to your admin account to view enquiries." : error;
  const isPackageInbox = kind === "package";
  const pendingCount = relevantEnquiries.filter((enquiry) => enquiry.status === (isPackageInbox ? "under_review" : "not_contacted")).length;

  const statusOptions: { value: EnquiryStatus; label: string }[] = isPackageInbox
    ? [{ value: "under_review", label: "Needs review" }, { value: "accepted", label: "Accepted" }, { value: "completed", label: "Completed" }, { value: "rejected", label: "Rejected" }]
    : [{ value: "not_contacted", label: "Needs a reply" }, { value: "contacted", label: "Contacted" }];
  const doneCount = relevantEnquiries.filter(enquiry => isPackageInbox ? enquiry.status === "completed" : enquiry.status === "contacted").length;
  const noun = isPackageInbox ? "quote requests" : "enquiries";

  return <div className="text-slate-900">
    <OperationsHeader eyebrow="Customer requests" title={isPackageInbox ? "Package quote requests" : "Contact enquiries"}
      description={isPackageInbox ? "Review the trip a customer is interested in, discuss their requirements, and keep the request status up to date." : "Questions and trip requests from your Contact Us page. Find the customer’s details, reply, and mark them as contacted."}
      metrics={[
        { label: isPackageInbox ? "Needs review" : "Needs a reply", value: isLoading ? "—" : pendingCount, hint: "Start with these customers", attention: true },
        { label: isPackageInbox ? "Completed requests" : "Customers contacted", value: isLoading ? "—" : doneCount, hint: isPackageInbox ? "Requests marked as completed" : "Enquiries marked as contacted" },
        { label: isPackageInbox ? "All quote requests" : "All enquiries", value: isLoading ? "—" : relevantEnquiries.length, hint: "Newest requests appear first" },
      ]} />
    <WorkflowGuide steps={isPackageInbox ? ["Review the request details", "Contact the customer", "Update the request status"] : ["Read the customer’s request", "Call or email them", "Mark as contacted"]} />
    {displayError && <p role="alert" className="my-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{displayError}</p>}
    {notice && !displayError && <p role="status" className="my-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="space-y-4 border-b border-slate-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-base font-semibold">{isPackageInbox ? "Quote request inbox" : "Enquiry inbox"}</h2><p className="mt-1 text-xs text-slate-500">{isLoading ? "Connecting to your inbox…" : `${visibleEnquiries.length} of ${relevantEnquiries.length} ${noun} · newest first`}</p></div>
          <InboxSearch value={search} onChange={setSearch} label={`Search ${noun}`} />
        </div>
        <InboxFilters value={statusFilter} onChange={setStatusFilter} options={[{ value: "all", label: "All requests", count: relevantEnquiries.length }, ...statusOptions.map(option => ({ ...option, count: relevantEnquiries.filter(enquiry => enquiry.status === option.value).length }))]} />
      </div>
      <div className="divide-y divide-slate-100">
        {visibleEnquiries.map(enquiry => {
          const pricePerPerson = enquiry.pricePerPerson || packages.find(pkg => pkg.id === enquiry.packageId)?.price || 0;
          const expired = Boolean(enquiry.quoteExpiresAt && enquiry.quoteExpiresAt.getTime() <= now);
          return <article key={enquiry.id} className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><h3 className="text-base font-semibold">{enquiry.name || "Customer name not provided"}</h3><span className="text-xs text-slate-400">{enquiry.submittedAt ? dateFormatter.format(enquiry.submittedAt) : "Just submitted"}</span></div>
                <ContactLinks email={enquiry.email} phone={enquiry.phone} />
              </div>
              <label className="w-full sm:w-48"><span className="mb-1.5 block text-xs font-medium text-slate-500">{updatingId === enquiry.id ? "Saving status…" : "Request status · saves automatically"}</span>
                <select disabled={Boolean(updatingId) || deletingId === enquiry.id} value={enquiry.status} onChange={event => void changeStatus(enquiry, event.target.value as EnquiryStatus)} aria-label={`Request status for ${enquiry.name}`}
                  className={`h-10 w-full rounded-xl border px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-cmt-primary-100 disabled:opacity-60 ${enquiry.status === "rejected" ? "border-red-200 bg-red-50 text-red-700" : enquiry.status === "completed" || enquiry.status === "contacted" ? "border-cmt-success-500/30 bg-cmt-success-100 text-cmt-success-700" : "border-slate-200 bg-white text-slate-700"}`}>
                  {statusOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            </div>
            <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-sm font-medium text-slate-800">{isPackageInbox ? enquiry.packageTitle || "Package not specified" : enquiry.destination || "Destination not specified"}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{isPackageInbox ? `${enquiry.destination || "Destination not specified"} · ` : ""}{enquiry.travellers ? `${enquiry.travellers} travellers` : "Traveller count not specified"}{enquiry.departure ? ` · Departure: ${enquiry.departure}` : ""}</p>
            </div>
            <details className="group mt-4">
              <summary className="flex w-fit cursor-pointer list-none items-center gap-2 rounded-md py-1 text-sm font-semibold text-cmt-primary-900 [&::-webkit-details-marker]:hidden"><ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />View request details</summary>
              <div className="mt-4 space-y-4 rounded-xl border border-slate-200 p-4">
                <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div><dt className="text-xs text-slate-500">Destination</dt><dd className="mt-1 font-medium">{enquiry.destination || "Not specified"}</dd></div>
                  <div><dt className="text-xs text-slate-500">Departure</dt><dd className="mt-1 font-medium">{enquiry.departure || "Not specified"}</dd></div>
                  <div><dt className="text-xs text-slate-500">Travellers</dt><dd className="mt-1 font-medium">{enquiry.travellers || "Not specified"}</dd></div>
                  {isPackageInbox && <div><dt className="text-xs text-slate-500">Package price per person</dt><dd className="mt-1 font-medium">{pricePerPerson ? formatINR(pricePerPerson) : "Not available"}</dd></div>}
                </dl>
                <div><p className="text-xs font-medium text-slate-500">Customer’s message</p><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{enquiry.message || "No message provided."}</p></div>
                {enquiry.quoteExpiresAt && <div className="flex flex-wrap items-center gap-3"><button type="button" disabled={downloadingId === enquiry.id || expired} onClick={() => void downloadQuote(enquiry)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold disabled:opacity-50"><Download className="size-4" aria-hidden="true" />{downloadingId === enquiry.id ? "Preparing PDF…" : expired ? "Quote PDF expired" : "Download quote PDF"}</button><span className="text-xs text-slate-500">{expired ? "Expired" : "Available until"} {dateFormatter.format(enquiry.quoteExpiresAt)}</span></div>}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3"><p className="break-all text-xs text-slate-400">Request reference: {enquiry.id}</p><button type="button" onClick={() => void removeEnquiry(enquiry)} disabled={Boolean(deletingId) || updatingId === enquiry.id} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"><Trash2 className="size-3.5" aria-hidden="true" />{deletingId === enquiry.id ? "Deleting…" : "Delete request"}</button></div>
              </div>
            </details>
          </article>;
        })}
        <InboxState loading={isLoading} empty={!displayError && visibleEnquiries.length === 0}
          title={relevantEnquiries.length ? "No requests match your filters" : `No ${noun} yet`}
          description={relevantEnquiries.length ? "Try another search or clear the filters to see every request." : "New customer requests will appear here automatically."}
          onReset={search || statusFilter !== "all" ? () => { setSearch(""); setStatusFilter("all"); } : undefined} />
      </div>
    </section>
  </div>;
}

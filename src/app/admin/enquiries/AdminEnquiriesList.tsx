"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgeIndianRupee, CalendarClock, Mail, MapPin, MessageSquareText, Phone, Search, Trash2, Users } from "lucide-react";
import {
  deleteContactEnquiry,
  subscribeToContactEnquiries,
  updateEnquiryStatus,
  type ContactEnquiry,
  type EnquiryStatus,
} from "@/lib/firebase/enquiries";
import { useAuthUser } from "@/lib/firebase/useAuthUser";
import { usePackages } from "@/lib/usePackages";

const dateFormatter = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" });
const formatINR = (value: number) => `₹${value.toLocaleString("en-IN")}`;

export default function AdminEnquiriesList({ kind }: { kind: "contact" | "package" }) {
  const authUser = useAuthUser();
  const packages = usePackages();
  const [enquiries, setEnquiries] = useState<ContactEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState("");
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
    return query
      ? relevantEnquiries.filter((enquiry) => [enquiry.name, enquiry.email, enquiry.phone, enquiry.destination, enquiry.packageTitle, enquiry.message]
          .some((value) => value.toLowerCase().includes(query)))
      : relevantEnquiries;
  }, [relevantEnquiries, search]);

  const changeStatus = async (enquiry: ContactEnquiry, status: EnquiryStatus) => {
    setUpdatingId(enquiry.id); setError("");
    const previousStatus = enquiry.status;
    const setLocalStatus = (nextStatus: EnquiryStatus) => setEnquiries((current) => current.map((item) => item.id === enquiry.id ? { ...item, status: nextStatus } : item));
    setLocalStatus(status);
    try {
      await updateEnquiryStatus(enquiry.id, status);
      // Keep the controlled select on the confirmed value even if an older
      // cached snapshot arrived while the write was in flight.
      setLocalStatus(status);
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
    try { await deleteContactEnquiry(enquiry.id); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "The enquiry could not be deleted."); }
    finally { setDeletingId(""); }
  };

  const isLoading = authUser === undefined || (authUser !== null && loading);
  const displayError = authUser === null ? "Sign in to your CRM account to view enquiries." : error;
  const isPackageInbox = kind === "package";
  const pendingCount = relevantEnquiries.filter((enquiry) => enquiry.status === (isPackageInbox ? "under_review" : "not_contacted")).length;

  return <div className="font-body text-cmt-neutral-900">
    <header className="flex flex-wrap items-end justify-between gap-5">
      <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-cmt-primary-700">{isPackageInbox ? "Package sales inbox" : "Contact inbox"}</p><h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{isPackageInbox ? "Package quote requests" : "Contact Us enquiries"}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-cmt-neutral-600">{isPackageInbox ? "Review customized quote requests submitted from package pages and track customer contact." : "Review submissions from the Contact Us form and mark whether the customer has been contacted."}</p></div>
      <div className="flex min-w-[190px] items-center gap-3 rounded-cmt-md border border-cmt-neutral-200 bg-white px-4 py-3 shadow-cmt-xs"><span className="grid size-10 place-items-center rounded-cmt-full bg-cmt-primary-50 text-cmt-primary-900"><MessageSquareText className="size-5" aria-hidden="true" /></span><div><p className="font-display text-2xl font-semibold tabular-nums">{isLoading ? "—" : pendingCount}</p><p className="text-xs text-cmt-neutral-500">{isPackageInbox ? "Under review" : "Not contacted"}</p></div></div>
    </header>
    {displayError ? <p role="alert" className="mt-6 rounded-cmt-control border border-cmt-error-500/20 bg-cmt-error-100 px-4 py-3 text-sm text-cmt-error-700">{displayError}</p> : null}
    <section className="mt-7 overflow-hidden rounded-cmt-md border border-cmt-neutral-200 bg-white shadow-cmt-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cmt-neutral-200 px-5 py-4"><p className="text-sm font-semibold">{isLoading ? `Loading ${isPackageInbox ? "quote requests" : "enquiries"}…` : `${visibleEnquiries.length} ${visibleEnquiries.length === 1 ? isPackageInbox ? "quote request" : "enquiry" : isPackageInbox ? "quote requests" : "enquiries"}`}</p><label className="relative w-full sm:w-80"><span className="sr-only">Search {isPackageInbox ? "quote requests" : "enquiries"}</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cmt-neutral-400" aria-hidden="true" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, phone or trip" className="h-10 w-full rounded-cmt-control border border-cmt-neutral-200 bg-cmt-neutral-50 pl-9 pr-3 text-sm outline-none focus:border-cmt-primary-500 focus:ring-2 focus:ring-cmt-primary-500/20" /></label></div>
      <div className="divide-y divide-cmt-neutral-200">
        {visibleEnquiries.map((enquiry) => { const pricePerPerson = enquiry.pricePerPerson || packages.find((pkg) => pkg.id === enquiry.packageId)?.price || 0; return <article key={enquiry.id} className="p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-display text-lg font-semibold">{enquiry.name}</h2><div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-cmt-neutral-600"><a href={`mailto:${enquiry.email}`} className="inline-flex items-center gap-1.5 hover:text-cmt-neutral-900"><Mail className="size-4" />{enquiry.email}</a><a href={`tel:${enquiry.phone}`} className="inline-flex items-center gap-1.5 hover:text-cmt-neutral-900"><Phone className="size-4" />{enquiry.phone}</a><span className="inline-flex items-center gap-1.5"><CalendarClock className="size-4" />{enquiry.submittedAt ? dateFormatter.format(enquiry.submittedAt) : "Saving…"}</span></div></div><div className="flex items-center gap-2"><label className="min-w-[170px]"><span className="sr-only">Status for {enquiry.name}</span><select disabled={updatingId === enquiry.id} value={enquiry.status} onChange={(event) => void changeStatus(enquiry, event.target.value as EnquiryStatus)} className={`h-10 w-full rounded-cmt-control border px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-cmt-primary-500/20 ${enquiry.status === "rejected" ? "border-cmt-error-500/40 bg-cmt-error-100 text-cmt-error-700" : enquiry.status === "completed" || enquiry.status === "contacted" ? "border-cmt-success-500/40 bg-cmt-success-100 text-cmt-success-700" : "border-cmt-primary-500/40 bg-cmt-primary-50 text-cmt-primary-900"}`}>{isPackageInbox ? <><option value="under_review">Under review</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option><option value="completed">Completed</option></> : <><option value="not_contacted">Not contacted</option><option value="contacted">Contacted</option></>}</select></label><button type="button" onClick={() => void removeEnquiry(enquiry)} disabled={deletingId === enquiry.id} title="Delete enquiry" aria-label={`Delete enquiry from ${enquiry.name}`} className="grid size-10 shrink-0 place-items-center rounded-cmt-control border border-cmt-neutral-200 text-cmt-neutral-500 transition hover:border-cmt-error-500/40 hover:bg-cmt-error-100 hover:text-cmt-error-700 disabled:cursor-not-allowed disabled:opacity-50"><Trash2 className="size-4" aria-hidden="true" /></button></div></div>
          {isPackageInbox && enquiry.packageTitle ? <div className="mt-4 rounded-cmt-control border border-cmt-primary-200 bg-cmt-primary-50 px-4 py-3"><p className="text-xs font-semibold uppercase tracking-wide text-cmt-primary-800">Customized quote for</p><p className="mt-1 text-sm font-semibold">{enquiry.packageTitle}</p></div> : null}<div className={`mt-4 grid gap-3 rounded-cmt-control bg-cmt-neutral-50 p-4 text-sm ${isPackageInbox ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"}`}><div><p className="text-xs font-semibold uppercase tracking-wide text-cmt-neutral-400">Destination</p><p className="mt-1 inline-flex items-center gap-1.5"><MapPin className="size-4 text-cmt-neutral-400" />{enquiry.destination || "Not specified"}</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-cmt-neutral-400">Departure</p><p className="mt-1">{enquiry.departure || "Not specified"}</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-cmt-neutral-400">Travellers</p><p className="mt-1 inline-flex items-center gap-1.5"><Users className="size-4 text-cmt-neutral-400" />{enquiry.travellers || "Not specified"}</p></div>{isPackageInbox ? <div><p className="text-xs font-semibold uppercase tracking-wide text-cmt-neutral-400">Price per person</p><p className="mt-1 inline-flex items-center gap-1.5 font-semibold"><BadgeIndianRupee className="size-4 text-cmt-neutral-400" />{pricePerPerson ? formatINR(pricePerPerson) : "Not available"}<span className="font-normal text-cmt-neutral-500">/ person</span></p></div> : null}</div>
          <div className="mt-4"><p className="text-xs font-semibold uppercase tracking-wide text-cmt-neutral-400">{isPackageInbox ? "Optional message" : "Trip request"}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-cmt-neutral-700">{enquiry.message || "No message provided."}</p></div>
        </article>; })}
        {!isLoading && !displayError && visibleEnquiries.length === 0 ? <div className="px-5 py-12 text-center"><MessageSquareText className="mx-auto size-8 text-cmt-neutral-300" /><p className="mt-3 text-sm font-semibold">{relevantEnquiries.length ? `No ${isPackageInbox ? "quote requests" : "enquiries"} match your search` : isPackageInbox ? "No package quote requests yet" : "No Contact Us enquiries yet"}</p><p className="mt-1 text-xs text-cmt-neutral-500">{isPackageInbox ? "New customized quote requests will appear here automatically." : "New Contact Us submissions will appear here automatically."}</p></div> : null}
      </div>
    </section>
  </div>;
}

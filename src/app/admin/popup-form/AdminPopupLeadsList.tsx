"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Download, Trash2 } from "lucide-react";
import { csvCell } from "../enquiries/csv";
import { ContactLinks, InboxFilters, InboxSearch, InboxState, OperationsHeader, WorkflowGuide } from "../enquiries/OperationsUI";

import {
  deletePopupLead,
  subscribeToPopupLeads,
  updatePopupLeadStatus,
  DEPARTURE_TYPE_LABELS,
  FOOD_PREFERENCE_LABELS,
  POPUP_LEAD_STATUS_LABELS,
  type PopupLead,
  type PopupLeadStatus,
} from "@/lib/firebase/popupLeads";
import { useAuthUser } from "@/lib/firebase/useAuthUser";

const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" });
const dateFormatter = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });

const formatINR = (value: number) => `₹${value.toLocaleString("en-IN")}`;

/* A yyyy-mm-dd string is a plain calendar date; parsing it through Date and
   formatting in local time is what would shift it a day. Split it instead. */
const formatTravelDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return "Not specified";
  return dateFormatter.format(new Date(year, month - 1, day));
};

const STATUS_ORDER: PopupLeadStatus[] = ["new", "contacted", "quoted", "converted", "closed"];

const statusClass = (status: PopupLeadStatus) =>
  status === "closed"
    ? "border-cmt-neutral-300 bg-cmt-neutral-100 text-cmt-neutral-700"
    : status === "converted"
      ? "border-cmt-success-500/40 bg-cmt-success-100 text-cmt-success-700"
      : status === "contacted" || status === "quoted"
        ? "border-cmt-primary-500/40 bg-cmt-primary-50 text-cmt-primary-900"
        : "border-cmt-primary-500/40 bg-cmt-primary-50 text-cmt-primary-900";

export default function AdminPopupLeadsList() {
  const authUser = useAuthUser();
  const [leads, setLeads] = useState<PopupLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PopupLeadStatus | "all">("all");
  const [updatingId, setUpdatingId] = useState("");
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    if (!authUser) return;
    return subscribeToPopupLeads(
      (nextLeads) => {
        setLeads(nextLeads);
        setError("");
        setLoading(false);
      },
      (message) => {
        setError(message);
        setLoading(false);
      },
    );
  }, [authUser]);

  const visibleLeads = useMemo(() => {
    const query = search.trim().toLowerCase();
    return leads.filter((lead) => {
      if (statusFilter !== "all" && lead.status !== statusFilter) return false;
      if (!query) return true;
      return [lead.name, lead.email, lead.phone, ...lead.destinations].some((value) =>
        value.toLowerCase().includes(query),
      );
    });
  }, [leads, search, statusFilter]);

  const newCount = leads.filter((lead) => lead.status === "new").length;

  const changeStatus = async (lead: PopupLead, status: PopupLeadStatus) => {
    setUpdatingId(lead.id);
    setError("");
    setNotice("");
    const previousStatus = lead.status;
    const setLocalStatus = (nextStatus: PopupLeadStatus) =>
      setLeads((current) =>
        current.map((item) => (item.id === lead.id ? { ...item, status: nextStatus } : item)),
      );
    setLocalStatus(status);
    try {
      await updatePopupLeadStatus(lead.id, status);
      /* Keep the controlled select on the confirmed value even if an older
         cached snapshot arrived while the write was in flight. */
      setLocalStatus(status);
      setNotice(`Status saved for ${lead.name || "this customer"}.`);
    } catch (cause) {
      setLocalStatus(previousStatus);
      setError(cause instanceof Error ? cause.message : "The lead status could not be updated.");
    } finally {
      setUpdatingId("");
    }
  };

  const removeLead = async (lead: PopupLead) => {
    if (!window.confirm(`Delete the trip planning request from ${lead.name}? This cannot be undone.`)) return;
    setDeletingId(lead.id);
    setError("");
    try {
      await deletePopupLead(lead.id);
      setNotice("Trip planning request deleted.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The lead could not be deleted.");
    } finally {
      setDeletingId("");
    }
  };

  const exportCsv = () => {
    const header = [
      "Submitted", "Name", "Email", "Phone", "Destinations", "Departure type",
      "Food preference", "Travel date", "Travellers", "Budget per person", "Page", "Status",
    ];
    const rows = visibleLeads.map((lead) => [
      lead.submittedAt ? dateTimeFormatter.format(lead.submittedAt) : "",
      lead.name,
      lead.email,
      lead.phone,
      lead.destinations.join(" / "),
      DEPARTURE_TYPE_LABELS[lead.departureType],
      FOOD_PREFERENCE_LABELS[lead.foodPreference],
      lead.travelDate,
      String(lead.travellers),
      lead.budgetPerPerson ? String(lead.budgetPerPerson) : "",
      lead.pagePath,
      POPUP_LEAD_STATUS_LABELS[lead.status],
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `popup-form-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const isLoading = authUser === undefined || (authUser !== null && loading);
  const displayError = authUser === null ? "Sign in to your admin account to view trip planning requests." : error;

  const inProgress = leads.filter(lead => lead.status === "contacted" || lead.status === "quoted").length;
  const statusLabel = (status: PopupLeadStatus) => status === "new" ? "Needs a reply" : status === "converted" ? "Booked" : status === "quoted" ? "Quote sent" : POPUP_LEAD_STATUS_LABELS[status];

  return <div className="text-slate-900">
    <OperationsHeader eyebrow="Customer requests" title="Trip planning requests"
      description="Customers who asked for help through the website’s trip planning pop-up. Review their preferences, get in touch, and track the next step."
      action={<button type="button" onClick={exportCsv} disabled={!visibleLeads.length} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><Download className="size-4" aria-hidden="true" />Export visible requests</button>}
      metrics={[
        { label: "Needs a reply", value: isLoading ? "—" : newCount, hint: "New customers to contact", attention: true },
        { label: "In progress", value: isLoading ? "—" : inProgress, hint: "Contacted or waiting on a quote" },
        { label: "All trip requests", value: isLoading ? "—" : leads.length, hint: "From the trip planning pop-up" },
      ]} />
    <WorkflowGuide steps={["Check the travel preferences", "Contact the customer and share a quote", "Update their request status"]} />
    {displayError && <p role="alert" className="my-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{displayError}</p>}
    {notice && !displayError && <p role="status" className="my-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="space-y-4 border-b border-slate-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-semibold">Trip planning inbox</h2><p className="mt-1 text-xs text-slate-500">{isLoading ? "Connecting to your inbox…" : `${visibleLeads.length} of ${leads.length} requests · newest first`}</p></div><InboxSearch value={search} onChange={setSearch} label="Search trip planning requests" /></div>
        <InboxFilters value={statusFilter} onChange={setStatusFilter} options={[{ value: "all", label: "All requests", count: leads.length }, ...STATUS_ORDER.map(status => ({ value: status, label: statusLabel(status), count: leads.filter(lead => lead.status === status).length }))]} />
      </div>
      <div className="divide-y divide-slate-100">
        {visibleLeads.map(lead => <article key={lead.id} className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-base font-semibold">{lead.name || "Customer name not provided"}</h3><span className="text-xs text-slate-400">{lead.submittedAt ? dateTimeFormatter.format(lead.submittedAt) : "Just submitted"}</span></div><ContactLinks email={lead.email} phone={lead.phone} /></div>
            <label className="w-full sm:w-48"><span className="mb-1.5 block text-xs font-medium text-slate-500">{updatingId === lead.id ? "Saving status…" : "Request status · saves automatically"}</span><select disabled={Boolean(updatingId) || deletingId === lead.id} value={lead.status} onChange={event => void changeStatus(lead, event.target.value as PopupLeadStatus)} aria-label={`Request status for ${lead.name}`} className={`h-10 w-full rounded-xl border px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-100 disabled:opacity-60 ${statusClass(lead.status)}`}>{STATUS_ORDER.map(status => <option key={status} value={status}>{statusLabel(status)}</option>)}</select></label>
          </div>
          <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3"><p className="text-sm font-medium text-slate-800">{lead.destinations.length ? lead.destinations.join(" · ") : "Destination not specified"}</p><p className="mt-1 text-xs leading-5 text-slate-500">{lead.travellers} travellers · {lead.travelDate ? formatTravelDate(lead.travelDate) : "Travel date flexible"} · {lead.budgetPerPerson ? `${formatINR(lead.budgetPerPerson)} per person` : "Budget not specified"}</p></div>
          <details className="group mt-4"><summary className="flex w-fit cursor-pointer list-none items-center gap-2 rounded-md py-1 text-sm font-semibold text-emerald-700 [&::-webkit-details-marker]:hidden"><ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />View travel preferences</summary>
            <div className="mt-4 rounded-xl border border-slate-200 p-4">
              <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <div><dt className="text-xs text-slate-500">Destinations</dt><dd className="mt-1 font-medium">{lead.destinations.join(", ") || "Not specified"}</dd></div>
                <div><dt className="text-xs text-slate-500">Type of trip</dt><dd className="mt-1 font-medium">{DEPARTURE_TYPE_LABELS[lead.departureType]}</dd></div>
                <div><dt className="text-xs text-slate-500">Food preference</dt><dd className="mt-1 font-medium">{FOOD_PREFERENCE_LABELS[lead.foodPreference]}</dd></div>
                <div><dt className="text-xs text-slate-500">Travel date</dt><dd className="mt-1 font-medium">{lead.travelDate ? formatTravelDate(lead.travelDate) : "Not specified"}</dd></div>
                <div><dt className="text-xs text-slate-500">Number of travellers</dt><dd className="mt-1 font-medium">{lead.travellers}</dd></div>
                <div><dt className="text-xs text-slate-500">Budget per person</dt><dd className="mt-1 font-medium">{lead.budgetPerPerson ? formatINR(lead.budgetPerPerson) : "Not specified"}</dd></div>
              </dl>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3"><p className="break-all text-xs text-slate-400">{lead.pagePath ? `Submitted from ${lead.pagePath}` : "Submitted through the trip planning pop-up"}</p><button type="button" onClick={() => void removeLead(lead)} disabled={Boolean(deletingId) || updatingId === lead.id} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"><Trash2 className="size-3.5" aria-hidden="true" />{deletingId === lead.id ? "Deleting…" : "Delete request"}</button></div>
            </div>
          </details>
        </article>)}
        <InboxState loading={isLoading} empty={!displayError && visibleLeads.length === 0} title={leads.length ? "No requests match your filters" : "No trip planning requests yet"} description={leads.length ? "Try another search or clear the filters to see every request." : "New submissions from the website’s trip planning pop-up will appear here automatically."} onReset={search || statusFilter !== "all" ? () => { setSearch(""); setStatusFilter("all"); } : undefined} />
      </div>
    </section>
  </div>;
}

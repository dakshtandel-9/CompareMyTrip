"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BadgeIndianRupee,
  CalendarClock,
  CalendarDays,
  Download,
  Mail,
  MapPin,
  Phone,
  Search,
  Sparkles,
  Trash2,
  UsersRound,
  UtensilsCrossed,
} from "lucide-react";

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

/* Quotes a value for CSV: wrap in quotes and double any inner quote. The
   leading apostrophe guard stops a spreadsheet treating +91… or =… as a
   formula when the travel desk opens the export. */
const csvCell = (value: string) => {
  const guarded = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${guarded.replace(/"/g, '""')}"`;
};

export default function AdminPopupLeadsList() {
  const authUser = useAuthUser();
  const [leads, setLeads] = useState<PopupLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
    } catch (cause) {
      setLocalStatus(previousStatus);
      setError(cause instanceof Error ? cause.message : "The lead status could not be updated.");
    } finally {
      setUpdatingId("");
    }
  };

  const removeLead = async (lead: PopupLead) => {
    if (!window.confirm(`Delete the pop-up form lead from ${lead.name}? This cannot be undone.`)) return;
    setDeletingId(lead.id);
    setError("");
    try {
      await deletePopupLead(lead.id);
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
  const displayError = authUser === null ? "Sign in to your CRM account to view pop-up form leads." : error;

  return (
    <div className="font-body text-cmt-neutral-900">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cmt-primary-700">Lead inbox</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Pop-up Form</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-cmt-neutral-600">
            Trip requests submitted through the website&rsquo;s timed pop-up. Every visitor who fills
            it in lands here — call them back with quotes and track the outcome.
          </p>
        </div>
        <div className="flex min-w-[190px] items-center gap-3 rounded-cmt-md border border-cmt-neutral-200 bg-white px-4 py-3 shadow-cmt-xs">
          <span className="grid size-10 place-items-center rounded-cmt-full bg-cmt-primary-50 text-cmt-primary-900">
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-display text-2xl font-semibold tabular-nums">{isLoading ? "—" : newCount}</p>
            <p className="text-xs text-cmt-neutral-500">New leads</p>
          </div>
        </div>
      </header>

      {displayError ? (
        <p
          role="alert"
          className="mt-6 rounded-cmt-control border border-cmt-error-500/20 bg-cmt-error-100 px-4 py-3 text-sm text-cmt-error-700"
        >
          {displayError}
        </p>
      ) : null}

      <section className="mt-7 overflow-hidden rounded-cmt-md border border-cmt-neutral-200 bg-white shadow-cmt-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cmt-neutral-200 px-5 py-4">
          <p className="text-sm font-semibold">
            {isLoading
              ? "Loading leads…"
              : `${visibleLeads.length} ${visibleLeads.length === 1 ? "lead" : "leads"}`}
          </p>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <label className="relative min-w-0 flex-1 sm:w-72 sm:flex-none">
              <span className="sr-only">Search leads</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cmt-neutral-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, email, phone or place"
                className="h-10 w-full rounded-cmt-control border border-cmt-neutral-200 bg-cmt-neutral-50 pl-9 pr-3 text-sm outline-none focus:border-cmt-primary-500 focus:ring-2 focus:ring-cmt-primary-500/20"
              />
            </label>

            <label>
              <span className="sr-only">Filter by status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as PopupLeadStatus | "all")}
                className="h-10 rounded-cmt-control border border-cmt-neutral-200 bg-cmt-neutral-50 px-3 text-sm font-semibold outline-none focus:border-cmt-primary-500 focus:ring-2 focus:ring-cmt-primary-500/20"
              >
                <option value="all">All statuses</option>
                {STATUS_ORDER.map((status) => (
                  <option key={status} value={status}>
                    {POPUP_LEAD_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={exportCsv}
              disabled={!visibleLeads.length}
              className="inline-flex h-10 items-center gap-2 rounded-cmt-control border border-cmt-neutral-200 px-3 text-sm font-semibold transition hover:bg-cmt-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="size-4" aria-hidden="true" /> Export
            </button>
          </div>
        </div>

        <div className="divide-y divide-cmt-neutral-200">
          {visibleLeads.map((lead) => (
            <article key={lead.id} className="p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-lg font-semibold">{lead.name}</h2>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-cmt-neutral-600">
                    <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1.5 hover:text-cmt-neutral-900">
                      <Mail className="size-4" aria-hidden="true" />
                      {lead.email}
                    </a>
                    <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1.5 hover:text-cmt-neutral-900">
                      <Phone className="size-4" aria-hidden="true" />
                      {lead.phone}
                    </a>
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarClock className="size-4" aria-hidden="true" />
                      {lead.submittedAt ? dateTimeFormatter.format(lead.submittedAt) : "Saving…"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="min-w-[150px]">
                    <span className="sr-only">Status for {lead.name}</span>
                    <select
                      disabled={updatingId === lead.id}
                      value={lead.status}
                      onChange={(event) => void changeStatus(lead, event.target.value as PopupLeadStatus)}
                      className={`h-10 w-full rounded-cmt-control border px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-cmt-primary-500/20 ${statusClass(lead.status)}`}
                    >
                      {STATUS_ORDER.map((status) => (
                        <option key={status} value={status}>
                          {POPUP_LEAD_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <button
                    type="button"
                    onClick={() => void removeLead(lead)}
                    disabled={deletingId === lead.id}
                    title="Delete lead"
                    aria-label={`Delete lead from ${lead.name}`}
                    className="grid size-10 shrink-0 place-items-center rounded-cmt-control border border-cmt-neutral-200 text-cmt-neutral-500 transition hover:border-cmt-error-500/40 hover:bg-cmt-error-100 hover:text-cmt-error-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-cmt-control border border-cmt-primary-200 bg-cmt-primary-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-cmt-primary-800">Wants to visit</p>
                <p className="mt-1.5 flex flex-wrap gap-1.5">
                  {lead.destinations.length ? (
                    lead.destinations.map((destination) => (
                      <span
                        key={destination}
                        className="inline-flex items-center gap-1 rounded-cmt-full bg-white px-3 py-1 text-[13px] font-semibold text-cmt-primary-900"
                      >
                        <MapPin className="size-3.5" aria-hidden="true" />
                        {destination}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm">Not specified</span>
                  )}
                </p>
              </div>

              <div className="mt-4 grid gap-3 rounded-cmt-control bg-cmt-neutral-50 p-4 text-sm sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-cmt-neutral-400">Departure type</p>
                  <p className="mt-1 font-semibold">{DEPARTURE_TYPE_LABELS[lead.departureType]}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-cmt-neutral-400">Food</p>
                  <p className="mt-1 inline-flex items-center gap-1.5">
                    <UtensilsCrossed className="size-4 text-cmt-neutral-400" aria-hidden="true" />
                    {FOOD_PREFERENCE_LABELS[lead.foodPreference]}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-cmt-neutral-400">Travel date</p>
                  <p className="mt-1 inline-flex items-center gap-1.5">
                    <CalendarDays className="size-4 text-cmt-neutral-400" aria-hidden="true" />
                    {lead.travelDate ? formatTravelDate(lead.travelDate) : "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-cmt-neutral-400">Travellers</p>
                  <p className="mt-1 inline-flex items-center gap-1.5">
                    <UsersRound className="size-4 text-cmt-neutral-400" aria-hidden="true" />
                    {lead.travellers}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-cmt-neutral-400">Budget / person</p>
                  <p className="mt-1 inline-flex items-center gap-1.5 font-semibold">
                    <BadgeIndianRupee className="size-4 text-cmt-neutral-400" aria-hidden="true" />
                    {lead.budgetPerPerson ? formatINR(lead.budgetPerPerson) : "Not stated"}
                  </p>
                </div>
              </div>

              {lead.pagePath ? (
                <p className="mt-3 text-xs text-cmt-neutral-500">
                  Submitted from <span className="font-semibold text-cmt-neutral-700">{lead.pagePath}</span>
                </p>
              ) : null}
            </article>
          ))}

          {!isLoading && !displayError && visibleLeads.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Sparkles className="mx-auto size-8 text-cmt-neutral-300" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold">
                {leads.length ? "No leads match your filters" : "No pop-up form leads yet"}
              </p>
              <p className="mt-1 text-xs text-cmt-neutral-500">
                New submissions will appear here automatically.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Download, Trash2 } from "lucide-react";
import { csvCell } from "../enquiries/csv";
import { ContactLinks, InboxFilters, InboxSearch, InboxState, OperationsHeader, WorkflowGuide } from "../enquiries/OperationsUI";

import {
  deleteCruiseEnquiry,
  subscribeToCruiseEnquiries,
  updateCruiseEnquiryStatus,
  BOOKING_TIMELINE_LABELS,
  CABIN_TYPE_LABELS,
  CRUISE_ENQUIRY_STATUS_LABELS,
  type CruiseEnquiry,
  type CruiseEnquiryStatus,
} from "@/lib/firebase/cruiseEnquiries";
import { useAuthUser } from "@/lib/firebase/useAuthUser";

const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" });
const dateFormatter = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });

const formatINR = (value: number) => `₹${value.toLocaleString("en-IN")}`;

/* A yyyy-mm-dd string is a plain calendar date; parsing it through Date and
   formatting in local time is what would shift it a day. Split it instead. */
const formatSailDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return "Not specified";
  return dateFormatter.format(new Date(year, month - 1, day));
};

/** "2 adults · 1 child" — infants are named separately because they do not
    take a berth, which is what the travel desk needs to price. */
const guestSummary = (enquiry: CruiseEnquiry) => {
  const parts = [`${enquiry.adults} adult${enquiry.adults === 1 ? "" : "s"}`];
  if (enquiry.children) parts.push(`${enquiry.children} child${enquiry.children === 1 ? "" : "ren"}`);
  if (enquiry.infants) parts.push(`${enquiry.infants} infant${enquiry.infants === 1 ? "" : "s"}`);
  return parts.join(" · ");
};

const STATUS_ORDER: CruiseEnquiryStatus[] = ["new", "contacted", "quoted", "converted", "closed"];

const statusClass = (status: CruiseEnquiryStatus) =>
  status === "closed"
    ? "border-cmt-neutral-300 bg-cmt-neutral-100 text-cmt-neutral-700"
    : status === "converted"
      ? "border-cmt-success-500/40 bg-cmt-success-100 text-cmt-success-700"
      : "border-cmt-primary-500/40 bg-cmt-primary-50 text-cmt-primary-900";

export default function AdminCruiseEnquiriesList() {
  const authUser = useAuthUser();
  const [enquiries, setEnquiries] = useState<CruiseEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CruiseEnquiryStatus | "all">("all");
  const [updatingId, setUpdatingId] = useState("");
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    if (!authUser) return;
    return subscribeToCruiseEnquiries(
      (next) => { setEnquiries(next); setError(""); setLoading(false); },
      (message) => { setError(message); setLoading(false); },
    );
  }, [authUser]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return enquiries.filter((enquiry) => {
      if (statusFilter !== "all" && enquiry.status !== statusFilter) return false;
      if (!query) return true;
      return [enquiry.name, enquiry.email, enquiry.phone, enquiry.cruiseName].some((value) =>
        value.toLowerCase().includes(query),
      );
    });
  }, [enquiries, search, statusFilter]);

  const newCount = enquiries.filter((item) => item.status === "new").length;
  const inProgress = enquiries.filter((item) => item.status === "contacted" || item.status === "quoted").length;

  const statusLabel = (status: CruiseEnquiryStatus) =>
    status === "new" ? "Needs a reply"
      : status === "converted" ? "Booked"
        : status === "quoted" ? "Quote sent"
          : CRUISE_ENQUIRY_STATUS_LABELS[status];

  const changeStatus = async (enquiry: CruiseEnquiry, status: CruiseEnquiryStatus) => {
    setUpdatingId(enquiry.id); setError(""); setNotice("");
    const previous = enquiry.status;
    const setLocalStatus = (next: CruiseEnquiryStatus) =>
      setEnquiries((current) => current.map((item) => (item.id === enquiry.id ? { ...item, status: next } : item)));
    setLocalStatus(status);
    try {
      await updateCruiseEnquiryStatus(enquiry.id, status);
      /* Keep the controlled select on the confirmed value even if an older
         cached snapshot arrived while the write was in flight. */
      setLocalStatus(status);
      setNotice(`Status saved for ${enquiry.name || "this customer"}.`);
    } catch (cause) {
      setLocalStatus(previous);
      setError(cause instanceof Error ? cause.message : "The enquiry status could not be updated.");
    } finally {
      setUpdatingId("");
    }
  };

  const remove = async (enquiry: CruiseEnquiry) => {
    if (!window.confirm(`Delete the cruise enquiry from ${enquiry.name}? This cannot be undone.`)) return;
    setDeletingId(enquiry.id); setError("");
    try {
      await deleteCruiseEnquiry(enquiry.id);
      setNotice("Cruise enquiry deleted.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The enquiry could not be deleted.");
    } finally {
      setDeletingId("");
    }
  };

  const exportCsv = () => {
    const header = [
      "Submitted", "Name", "Email", "Phone", "Cruise", "Rooms", "Adults", "Children",
      "Infants", "Booking timeline", "Sail date", "Nights", "Cabin type",
      "Budget per person", "Special occasion", "Flight booked", "Notes", "Status",
    ];
    const rows = visible.map((enquiry) => [
      enquiry.submittedAt ? dateTimeFormatter.format(enquiry.submittedAt) : "",
      enquiry.name, enquiry.email, enquiry.phone, enquiry.cruiseName,
      String(enquiry.rooms), String(enquiry.adults), String(enquiry.children), String(enquiry.infants),
      BOOKING_TIMELINE_LABELS[enquiry.bookingTimeline],
      enquiry.sailDate,
      enquiry.nights ? String(enquiry.nights) : "",
      CABIN_TYPE_LABELS[enquiry.cabinType],
      enquiry.budgetPerPerson ? String(enquiry.budgetPerPerson) : "",
      enquiry.specialOccasion ? "Yes" : "No",
      enquiry.flightBooked ? "Yes" : "No",
      enquiry.notes,
      CRUISE_ENQUIRY_STATUS_LABELS[enquiry.status],
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `cruise-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const isLoading = authUser === undefined || (authUser !== null && loading);
  const displayError = authUser === null ? "Sign in to your admin account to view cruise enquiries." : error;

  return <div className="text-slate-900">
    <OperationsHeader eyebrow="Customer requests" title="Cruise enquiries"
      description="Customers who asked for a cruise quote from your cruise page. Review their cabin and guest details, get in touch, and track the next step."
      action={<button type="button" onClick={exportCsv} disabled={!visible.length} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><Download className="size-4" aria-hidden="true" />Export visible enquiries</button>}
      metrics={[
        { label: "Needs a reply", value: isLoading ? "—" : newCount, hint: "New customers to contact", attention: true },
        { label: "In progress", value: isLoading ? "—" : inProgress, hint: "Contacted or waiting on a quote" },
        { label: "All cruise enquiries", value: isLoading ? "—" : enquiries.length, hint: "From the cruise page" },
      ]} />
    <WorkflowGuide steps={["Check the cruise, dates and guest details", "Contact the customer and share cabin prices", "Update their enquiry status"]} />
    {displayError && <p role="alert" className="my-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{displayError}</p>}
    {notice && !displayError && <p role="status" className="my-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="space-y-4 border-b border-slate-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Cruise enquiry inbox</h2>
            <p className="mt-1 text-xs text-slate-500">{isLoading ? "Connecting to your inbox…" : `${visible.length} of ${enquiries.length} enquiries · newest first`}</p>
          </div>
          <InboxSearch value={search} onChange={setSearch} label="Search cruise enquiries" placeholder="Search name, email, phone or cruise" />
        </div>
        <InboxFilters value={statusFilter} onChange={setStatusFilter} options={[
          { value: "all", label: "All enquiries", count: enquiries.length },
          ...STATUS_ORDER.map((status) => ({ value: status, label: statusLabel(status), count: enquiries.filter((item) => item.status === status).length })),
        ]} />
      </div>

      <div className="divide-y divide-slate-100">
        {visible.map((enquiry) => <article key={enquiry.id} className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold">{enquiry.name || "Customer name not provided"}</h3>
                <span className="text-xs text-slate-400">{enquiry.submittedAt ? dateTimeFormatter.format(enquiry.submittedAt) : "Just submitted"}</span>
              </div>
              <ContactLinks email={enquiry.email} phone={enquiry.phone} />
            </div>
            <label className="w-full sm:w-48">
              <span className="mb-1.5 block text-xs font-medium text-slate-500">{updatingId === enquiry.id ? "Saving status…" : "Enquiry status · saves automatically"}</span>
              <select disabled={Boolean(updatingId) || deletingId === enquiry.id} value={enquiry.status} onChange={(event) => void changeStatus(enquiry, event.target.value as CruiseEnquiryStatus)} aria-label={`Enquiry status for ${enquiry.name}`} className={`h-10 w-full rounded-xl border px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-cmt-primary-100 disabled:opacity-60 ${statusClass(enquiry.status)}`}>
                {STATUS_ORDER.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
              </select>
            </label>
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-sm font-medium text-slate-800">{enquiry.cruiseName || "Cruise not specified"}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {enquiry.rooms} room{enquiry.rooms === 1 ? "" : "s"} · {guestSummary(enquiry)} · {enquiry.sailDate ? formatSailDate(enquiry.sailDate) : "Sail date flexible"} · {enquiry.budgetPerPerson ? `${formatINR(enquiry.budgetPerPerson)} per person` : "Budget not specified"}
            </p>
          </div>

          <details className="group mt-4">
            <summary className="flex w-fit cursor-pointer list-none items-center gap-2 rounded-md py-1 text-sm font-semibold text-cmt-primary-900 [&::-webkit-details-marker]:hidden">
              <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />View enquiry details
            </summary>
            <div className="mt-4 rounded-xl border border-slate-200 p-4">
              <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <div><dt className="text-xs text-slate-500">Cruise</dt><dd className="mt-1 font-medium">{enquiry.cruiseName || "Not specified"}</dd></div>
                <div><dt className="text-xs text-slate-500">Rooms</dt><dd className="mt-1 font-medium">{enquiry.rooms}</dd></div>
                <div><dt className="text-xs text-slate-500">Guests</dt><dd className="mt-1 font-medium">{guestSummary(enquiry)}</dd></div>
                <div><dt className="text-xs text-slate-500">Booking timeline</dt><dd className="mt-1 font-medium">{BOOKING_TIMELINE_LABELS[enquiry.bookingTimeline]}</dd></div>
                <div><dt className="text-xs text-slate-500">Preferred sail date</dt><dd className="mt-1 font-medium">{enquiry.sailDate ? formatSailDate(enquiry.sailDate) : "Not specified"}</dd></div>
                <div><dt className="text-xs text-slate-500">Duration</dt><dd className="mt-1 font-medium">{enquiry.nights ? `${enquiry.nights} night${enquiry.nights === 1 ? "" : "s"}` : "Not specified"}</dd></div>
                <div><dt className="text-xs text-slate-500">Cabin type</dt><dd className="mt-1 font-medium">{CABIN_TYPE_LABELS[enquiry.cabinType]}</dd></div>
                <div><dt className="text-xs text-slate-500">Budget per person</dt><dd className="mt-1 font-medium">{enquiry.budgetPerPerson ? formatINR(enquiry.budgetPerPerson) : "Not specified"}</dd></div>
                <div><dt className="text-xs text-slate-500">Honeymoon / anniversary</dt><dd className="mt-1 font-medium">{enquiry.specialOccasion ? "Yes" : "No"}</dd></div>
                <div><dt className="text-xs text-slate-500">Flight already booked</dt><dd className="mt-1 font-medium">{enquiry.flightBooked ? "Yes" : "No"}</dd></div>
              </dl>
              {enquiry.notes && <div className="mt-4 border-t border-slate-100 pt-3"><dt className="text-xs text-slate-500">Notes from the customer</dt><dd className="mt-1 whitespace-pre-wrap text-sm">{enquiry.notes}</dd></div>}
              <div className="mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-3">
                <button type="button" onClick={() => void remove(enquiry)} disabled={Boolean(deletingId) || updatingId === enquiry.id} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
                  <Trash2 className="size-3.5" aria-hidden="true" />{deletingId === enquiry.id ? "Deleting…" : "Delete enquiry"}
                </button>
              </div>
            </div>
          </details>
        </article>)}
        <InboxState loading={isLoading} empty={!displayError && visible.length === 0}
          title={enquiries.length ? "No enquiries match your filters" : "No cruise enquiries yet"}
          description={enquiries.length ? "Try another search or clear the filters to see every enquiry." : "New Get quote submissions from your cruise page will appear here automatically."}
          onReset={search || statusFilter !== "all" ? () => { setSearch(""); setStatusFilter("all"); } : undefined} />
      </div>
    </section>
  </div>;
}

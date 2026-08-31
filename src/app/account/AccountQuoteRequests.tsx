"use client";

import { useEffect, useState } from "react";
import {
  BadgeIndianRupee,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  MessageSquareText,
  Users,
  XCircle,
} from "lucide-react";
import { subscribeToUserQuoteEnquiries, type ContactEnquiry, type EnquiryStatus } from "@/lib/firebase/enquiries";
import { usePackages } from "@/lib/usePackages";

/* Quote requests, styled as a sibling of My Trips: heading outside, one
   white card per request. Status is a badge (§8.5), not a disabled button —
   nothing here is clickable, so it should not look like a control. */

const dateFormatter = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });
const formatINR = (value: number) => `₹${value.toLocaleString("en-IN")}`;

const statusContent: Record<EnquiryStatus, { label: string; className: string; icon: typeof Clock3 }> = {
  under_review: { label: "Under review", className: "border-cmt-primary-500 bg-cmt-primary-100 text-cmt-primary-900", icon: Clock3 },
  accepted: { label: "Accepted", className: "border-cmt-success-500/40 bg-cmt-success-100 text-cmt-success-700", icon: CheckCircle2 },
  rejected: { label: "Rejected", className: "border-cmt-error-500/40 bg-cmt-error-100 text-cmt-error-700", icon: XCircle },
  completed: { label: "Completed", className: "border-cmt-neutral-300 bg-cmt-neutral-100 text-cmt-neutral-700", icon: CheckCircle2 },
  not_contacted: { label: "Under review", className: "border-cmt-primary-500 bg-cmt-primary-100 text-cmt-primary-900", icon: Clock3 },
  contacted: { label: "Accepted", className: "border-cmt-success-500/40 bg-cmt-success-100 text-cmt-success-700", icon: CheckCircle2 },
};

function Meta({ icon: Icon, label, value, suffix }: { icon: typeof Users; label: string; value: string; suffix?: string }) {
  return (
    <div className="min-w-0">
      <p className="font-body text-[11px] font-semibold uppercase tracking-[0.12em] text-cmt-neutral-400">{label}</p>
      <p className="mt-1 flex items-center gap-1.5 font-body text-sm text-cmt-neutral-700">
        <Icon className="size-4 shrink-0 text-cmt-neutral-400" aria-hidden="true" />
        <span className="truncate">{value}</span>
        {suffix ? <span className="shrink-0 text-cmt-neutral-500">{suffix}</span> : null}
      </p>
    </div>
  );
}

export default function AccountQuoteRequests({ userId }: { userId: string }) {
  const packages = usePackages();
  const [enquiries, setEnquiries] = useState<ContactEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(
    () =>
      subscribeToUserQuoteEnquiries(
        userId,
        (next) => {
          setEnquiries(next);
          setError("");
          setLoading(false);
        },
        (message) => {
          setError(message);
          setLoading(false);
        },
      ),
    [userId],
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-[560px]">
          <p className="font-body text-[11px] font-semibold uppercase tracking-[0.12em] text-cmt-primary-900">
            Enquiries
          </p>
          <h2 className="mt-2 font-display text-[22px] font-semibold tracking-[-0.003em] text-cmt-neutral-900 sm:text-[26px]">
            Customized quote requests
          </h2>
          <p className="mt-1.5 font-body text-sm leading-[1.55] text-cmt-neutral-600">
            Package enquiries you sent from “Get customized quote”.
          </p>
        </div>
        <span className="rounded-cmt-full border border-cmt-neutral-200 bg-white px-3.5 py-1.5 font-body text-xs font-semibold text-cmt-neutral-700">
          {loading ? "Loading…" : `${enquiries.length} request${enquiries.length === 1 ? "" : "s"}`}
        </span>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-5 rounded-cmt-control border border-cmt-error-500/40 bg-cmt-error-100 px-4 py-3 font-body text-sm text-cmt-neutral-900"
        >
          {error}
        </p>
      ) : null}

      {enquiries.length > 0 ? (
        <div className="mt-6 grid gap-5">
          {enquiries.map((enquiry) => {
            const status = statusContent[enquiry.status];
            const StatusIcon = status.icon;
            const pricePerPerson =
              enquiry.pricePerPerson || packages.find((pkg) => pkg.id === enquiry.packageId)?.price || 0;

            return (
              <article
                key={enquiry.id}
                className="rounded-cmt-md border border-cmt-neutral-200 bg-white p-5 shadow-cmt-sm transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-cmt-neutral-300 hover:shadow-cmt-md sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display text-[20px] font-medium leading-[1.35] text-cmt-neutral-900">
                      {enquiry.packageTitle || "Customized trip request"}
                    </h3>
                    <p className="mt-1 inline-flex items-center gap-1.5 font-body text-xs text-cmt-neutral-500">
                      <CalendarClock className="size-3.5" aria-hidden="true" />
                      {enquiry.submittedAt
                        ? `Requested ${dateFormatter.format(enquiry.submittedAt)}`
                        : "Saving request…"}
                    </p>
                  </div>
                  <span
                    className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-cmt-full border px-3 font-body text-xs font-semibold ${status.className}`}
                  >
                    <StatusIcon className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
                    {status.label}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 rounded-cmt-control bg-cmt-neutral-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Meta icon={MapPin} label="Destination" value={enquiry.destination || "Not specified"} />
                  <Meta icon={CalendarDays} label="Travel date" value={enquiry.departure || "Not specified"} />
                  <Meta icon={Users} label="Travellers" value={enquiry.travellers || "Not specified"} />
                  <Meta
                    icon={BadgeIndianRupee}
                    label="Price per person"
                    value={pricePerPerson ? formatINR(pricePerPerson) : "Not available"}
                    suffix={pricePerPerson ? "/ person" : undefined}
                  />
                </div>

                {enquiry.message ? (
                  <div className="mt-4">
                    <p className="font-body text-[11px] font-semibold uppercase tracking-[0.12em] text-cmt-neutral-400">
                      Your message
                    </p>
                    <p className="mt-1.5 whitespace-pre-wrap font-body text-sm leading-[1.6] text-cmt-neutral-700">
                      {enquiry.message}
                    </p>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : null}

      {!loading && !error && enquiries.length === 0 ? (
        <div className="mt-6 rounded-cmt-md border border-dashed border-cmt-neutral-300 bg-white px-6 py-14 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-cmt-full bg-cmt-primary-100 text-cmt-primary-900">
            <MessageSquareText className="size-6" strokeWidth={2} aria-hidden="true" />
          </span>
          <h3 className="mt-5 font-display text-[20px] font-medium text-cmt-neutral-900">
            No quote requests yet
          </h3>
          <p className="mx-auto mt-2 max-w-[420px] text-pretty font-body text-sm leading-[1.6] text-cmt-neutral-600">
            Requests sent from package pages appear here. Contact Us submissions are kept separate.
          </p>
        </div>
      ) : null}
    </div>
  );
}

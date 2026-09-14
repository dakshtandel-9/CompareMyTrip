"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Download, Mail, Trash2 } from "lucide-react";
import { csvCell } from "../enquiries/csv";
import { InboxSearch, InboxState, OperationsHeader } from "../enquiries/OperationsUI";
import {
  deleteNewsletterSubscriber,
  subscribeToNewsletterSubscribers,
  type NewsletterSubscriber,
} from "@/lib/firebase/newsletter";
import { useAuthUser } from "@/lib/firebase/useAuthUser";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default function AdminSubscribersList() {
  const authUser = useAuthUser();
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    if (!authUser) return;
    return subscribeToNewsletterSubscribers(
      (nextSubscribers) => {
        setSubscribers(nextSubscribers);
        setError("");
        setLoading(false);
      },
      (message) => {
        setError(message);
        setLoading(false);
      },
    );
  }, [authUser]);

  const visibleSubscribers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? subscribers.filter((subscriber) => subscriber.email.toLowerCase().includes(query))
      : subscribers;
  }, [search, subscribers]);
  const removeSubscriber = async (subscriber: NewsletterSubscriber) => {
    if (!window.confirm(`Remove ${subscriber.email} from the newsletter list?`)) return;
    setDeletingId(subscriber.id);
    setError("");
    try {
      await deleteNewsletterSubscriber(subscriber.id);
      setNotice(`${subscriber.email} was removed from the newsletter list.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The subscriber could not be removed.");
    } finally {
      setDeletingId("");
    }
  };

  const isLoading = authUser === undefined || (authUser !== null && loading);
  const displayError = authUser === null ? "Sign in to your admin account to view subscribers." : error;

  const exportCsv = () => {
    const rows = [["Email address", "Subscribed on"], ...visibleSubscribers.map(subscriber => [subscriber.email, subscriber.subscribedAt?.toISOString() || ""])];
    const url = URL.createObjectURL(new Blob(["\ufeff" + rows.map(row => row.map(csvCell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const latest = subscribers.find(subscriber => subscriber.subscribedAt)?.subscribedAt;

  return <div className="text-slate-900">
    <OperationsHeader eyebrow="Customers" title="Newsletter subscribers" description="Your newsletter audience, collected through the website. Search an email address, download the list, or remove a subscriber."
      action={<button type="button" onClick={exportCsv} disabled={!visibleSubscribers.length} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><Download className="size-4" aria-hidden="true" />Export visible subscribers</button>}
      metrics={[
        { label: "All subscribers", value: isLoading ? "—" : subscribers.length, hint: "Emails on your newsletter list", attention: true },
        { label: "Matching your search", value: isLoading ? "—" : visibleSubscribers.length, hint: "These subscribers are included in export" },
        { label: "Latest signup", value: isLoading ? "—" : latest ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(latest) : "—", hint: latest ? String(latest.getFullYear()) : "Waiting for your first subscriber" },
      ]} />
    {displayError && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{displayError}</p>}
    {notice && !displayError && <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5"><div><h2 className="text-base font-semibold">Subscriber list</h2><p className="mt-1 text-xs text-slate-500">{isLoading ? "Loading subscribers…" : `${visibleSubscribers.length} of ${subscribers.length} subscribers · newest first`}</p></div><InboxSearch value={search} onChange={setSearch} placeholder="Search email address" label="Search newsletter subscribers" /></div>
      <div className="hidden grid-cols-[minmax(0,1fr)_220px_110px] gap-4 border-b border-slate-100 bg-slate-50 px-6 py-3 text-xs font-medium text-slate-500 lg:grid"><span>Email address</span><span>Subscribed on</span><span>Action</span></div>
      <div className="divide-y divide-slate-100">
        {visibleSubscribers.map(subscriber => <article key={subscriber.id} className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_220px_110px] lg:items-center lg:px-6">
          <div className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800"><Mail className="size-4" aria-hidden="true" /></span><a href={`mailto:${subscriber.email}`} className="break-all text-sm font-medium hover:text-emerald-700">{subscriber.email}</a></div>
          <div className="flex items-center gap-2 text-sm text-slate-600"><CalendarClock className="size-4 shrink-0 text-slate-400" aria-hidden="true" /><time dateTime={subscriber.subscribedAt?.toISOString()}>{subscriber.subscribedAt ? dateFormatter.format(subscriber.subscribedAt) : "Just subscribed"}</time></div>
          <button type="button" onClick={() => void removeSubscriber(subscriber)} disabled={Boolean(deletingId)} className="inline-flex h-10 w-fit items-center gap-2 rounded-lg px-3 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"><Trash2 className="size-3.5" aria-hidden="true" />{deletingId === subscriber.id ? "Removing…" : "Remove"}</button>
        </article>)}
        <InboxState loading={isLoading} empty={!displayError && visibleSubscribers.length === 0} title={subscribers.length ? "No subscribers match your search" : "No newsletter subscribers yet"} description={subscribers.length ? "Try another email address or clear your search." : "New website subscriptions will appear here automatically."} onReset={search ? () => setSearch("") : undefined} />
      </div>
    </section>
  </div>;
}

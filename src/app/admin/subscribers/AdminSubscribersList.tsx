"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Mail, Search, Trash2 } from "lucide-react";
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
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The subscriber could not be removed.");
    } finally {
      setDeletingId("");
    }
  };

  const isLoading = authUser === undefined || (authUser !== null && loading);
  const displayError = authUser === null ? "Sign in to your CRM account to view subscribers." : error;

  return (
    <div className="font-body text-cmt-neutral-900">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cmt-primary-700">Newsletter audience</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Subscribers</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-cmt-neutral-600">Everyone who submitted the newsletter form on the homepage.</p>
        </div>
        <div className="flex min-w-[190px] items-center gap-3 rounded-cmt-md border border-cmt-neutral-200 bg-white px-4 py-3 shadow-cmt-xs">
          <span className="grid size-10 place-items-center rounded-cmt-full bg-cmt-primary-50 text-cmt-primary-900"><Mail className="size-5" aria-hidden="true" /></span>
          <div><p className="font-display text-2xl font-semibold tabular-nums">{isLoading ? "—" : subscribers.length}</p><p className="text-xs text-cmt-neutral-500">Total subscribers</p></div>
        </div>
      </header>

      {displayError ? <p role="alert" className="mt-6 rounded-cmt-control border border-cmt-error-500/20 bg-cmt-error-100 px-4 py-3 text-sm text-cmt-error-700">{displayError}</p> : null}

      <section className="mt-7 overflow-hidden rounded-cmt-md border border-cmt-neutral-200 bg-white shadow-cmt-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cmt-neutral-200 px-5 py-4">
          <p className="text-sm font-semibold">{isLoading ? "Loading subscribers…" : `${visibleSubscribers.length} ${visibleSubscribers.length === 1 ? "subscriber" : "subscribers"}`}</p>
          <label className="relative w-full sm:w-72"><span className="sr-only">Search subscribers</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cmt-neutral-400" aria-hidden="true" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search email address" className="h-10 w-full rounded-cmt-control border border-cmt-neutral-200 bg-cmt-neutral-50 pl-9 pr-3 text-sm outline-none focus:border-cmt-primary-500 focus:ring-2 focus:ring-cmt-primary-500/20" /></label>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(160px,220px)_auto] gap-4 border-b border-cmt-neutral-200 bg-cmt-neutral-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-cmt-neutral-500"><span>Email address</span><span>Subscribed</span><span className="sr-only">Actions</span></div>
        <div className="divide-y divide-cmt-neutral-200">
          {visibleSubscribers.map((subscriber) => <article key={subscriber.id} className="grid grid-cols-[minmax(0,1fr)_minmax(160px,220px)_auto] items-center gap-4 px-5 py-4"><div className="flex min-w-0 items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-cmt-full bg-cmt-secondary-900 text-cmt-primary-500"><Mail className="size-4" aria-hidden="true" /></span><span className="truncate text-sm font-medium">{subscriber.email}</span></div><div className="flex items-center gap-2 text-sm text-cmt-neutral-600"><CalendarClock className="size-4 shrink-0 text-cmt-neutral-400" aria-hidden="true" /><time dateTime={subscriber.subscribedAt?.toISOString()}>{subscriber.subscribedAt ? dateFormatter.format(subscriber.subscribedAt) : "Saving…"}</time></div><button type="button" onClick={() => void removeSubscriber(subscriber)} disabled={deletingId === subscriber.id} className="inline-flex h-9 items-center gap-1.5 rounded-cmt-control border border-cmt-neutral-200 px-3 text-xs font-semibold text-cmt-neutral-600 transition hover:border-cmt-error-500/40 hover:bg-cmt-error-100 hover:text-cmt-error-700 disabled:cursor-not-allowed disabled:opacity-50"><Trash2 className="size-4" aria-hidden="true" />{deletingId === subscriber.id ? "Removing…" : "Delete"}</button></article>)}
          {!isLoading && !displayError && visibleSubscribers.length === 0 ? <div className="px-5 py-12 text-center"><Mail className="mx-auto size-8 text-cmt-neutral-300" aria-hidden="true" /><p className="mt-3 text-sm font-semibold">{subscribers.length ? "No subscribers match your search" : "No newsletter subscribers yet"}</p><p className="mt-1 text-xs text-cmt-neutral-500">New homepage subscriptions will appear here automatically.</p></div> : null}
        </div>
      </section>
    </div>
  );
}

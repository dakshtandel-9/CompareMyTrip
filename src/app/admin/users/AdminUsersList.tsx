"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock } from "lucide-react";
import { ContactLinks, InboxFilters, InboxSearch, InboxState, OperationsHeader } from "../enquiries/OperationsUI";
import {
  subscribeToRegisteredUsers,
  type RegisteredUser,
} from "@/lib/firebase/users";
import { useAuthUser } from "@/lib/firebase/useAuthUser";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

function displayName(user: RegisteredUser) {
  return user.name || "Name not provided";
}

function initials(user: RegisteredUser) {
  const source = user.name || user.email || "U";
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function registrationTime(value: Date | null) {
  return value ? dateFormatter.format(value) : "Not recorded";
}

function providerLabel(provider: string) {
  if (provider === "google") return "Google";
  if (provider === "password") return "Email";
  return provider || "Unknown";
}

export default function AdminUsersList() {
  const authUser = useAuthUser();
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState("all");

  useEffect(() => {
    if (!authUser) return;

    const unsubscribe = subscribeToRegisteredUsers(
      (nextUsers) => {
        setUsers(nextUsers);
        setError("");
        setLoading(false);
      },
      (message) => {
        setError(
          message === "Sign in with an authorized CRM account to view registered users."
            ? "Your account does not have access to customer records. Ask the account owner to check your admin access."
            : message,
        );
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [authUser]);

  const availableUsers = useMemo(() => (authUser ? users : []), [authUser, users]);
  const displayError =
    authUser === null ? "Sign in to your admin account to view customer accounts." : error;
  const isLoading = authUser === undefined || (authUser !== null && loading);

  const visibleUsers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return availableUsers.filter(user =>
      (providerFilter === "all" || user.provider === providerFilter) &&
      (!query || [user.name, user.email, user.phone, user.provider].some(value => value.toLocaleLowerCase().includes(query))),
    );
  }, [availableUsers, search, providerFilter]);

  return <div className="text-slate-900">
    <OperationsHeader eyebrow="Customers" title="Customer accounts" description="Find customers who have created an account, see when they joined, and use their contact details to follow up on a trip."
      metrics={[
        { label: "All customers", value: isLoading ? "—" : availableUsers.length, hint: "Registered website accounts", attention: true },
        { label: "With a phone number", value: isLoading ? "—" : availableUsers.filter(user => user.phone).length, hint: "Customers you can call directly" },
        { label: "Google sign-ins", value: isLoading ? "—" : availableUsers.filter(user => user.provider === "google").length, hint: "Accounts created with Google" },
      ]} />
    {displayError && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{displayError}</p>}
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="space-y-4 border-b border-slate-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-semibold">Customer directory</h2><p className="mt-1 text-xs text-slate-500">{isLoading ? "Loading customer accounts…" : `${visibleUsers.length} of ${availableUsers.length} customers · newest first`}</p></div><InboxSearch value={search} onChange={setSearch} placeholder="Search name, email or phone" label="Search customer accounts" /></div>
        <InboxFilters value={providerFilter} onChange={setProviderFilter} options={[{ value: "all", label: "All customers", count: availableUsers.length }, { value: "google", label: "Google sign-in", count: availableUsers.filter(user => user.provider === "google").length }, { value: "password", label: "Email sign-in", count: availableUsers.filter(user => user.provider === "password").length }]} />
      </div>
      <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_120px] gap-5 border-b border-slate-100 bg-slate-50 px-6 py-3 text-xs font-medium text-slate-500 lg:grid"><span>Customer & contact details</span><span>Joined</span><span>Sign-in method</span></div>
      <div className="divide-y divide-slate-100">
        {visibleUsers.map(user => <article key={user.id} className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_120px] lg:items-center lg:px-6">
          <div className="flex min-w-0 items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-cmt-primary-50 text-xs font-semibold text-cmt-primary-900">{initials(user)}</span><div className="min-w-0"><h3 className="break-words text-sm font-semibold">{displayName(user)}</h3><ContactLinks email={user.email} phone={user.phone} /><details className="mt-2"><summary className="w-fit cursor-pointer text-xs text-slate-400 hover:text-slate-600">Customer reference</summary><p className="mt-1 break-all font-mono text-xs text-slate-500">{user.id}</p></details></div></div>
          <div className="flex items-center gap-2 text-sm text-slate-600"><CalendarClock className="size-4 shrink-0 text-slate-400" aria-hidden="true" /><span><span className="mr-1 lg:hidden">Joined</span><time dateTime={user.createdAt?.toISOString()}>{registrationTime(user.createdAt)}</time></span></div>
          <span className="w-fit rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{providerLabel(user.provider)} sign-in</span>
        </article>)}
        <InboxState loading={isLoading} empty={!displayError && visibleUsers.length === 0} title={availableUsers.length ? "No customers match your filters" : "No customer accounts yet"} description={availableUsers.length ? "Try another name, email address, or phone number." : "New website accounts will appear here automatically."} onReset={search || providerFilter !== "all" ? () => { setSearch(""); setProviderFilter("all"); } : undefined} />
      </div>
    </section>
  </div>;
}

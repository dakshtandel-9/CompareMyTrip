"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Mail, Phone, Search, UserRound, Users } from "lucide-react";
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
  return user.name || "Unnamed user";
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
            ? `The signed-in account is not authorized. Admin UID: ${authUser.uid}`
            : message,
        );
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [authUser]);

  const availableUsers = useMemo(() => (authUser ? users : []), [authUser, users]);
  const displayError =
    authUser === null ? "Sign in to your CRM account to view registered users." : error;
  const isLoading = authUser === undefined || (authUser !== null && loading);

  const visibleUsers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return availableUsers;

    return availableUsers.filter((user) =>
      [user.name, user.email, user.phone, user.provider].some((value) =>
        value.toLocaleLowerCase().includes(query),
      ),
    );
  }, [availableUsers, search]);

  return (
    <div className="font-body text-cmt-neutral-900">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cmt-primary-700">
            Customer accounts
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Registered users
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-cmt-neutral-600">
            View the contact details and registration time for everyone who has created an account.
          </p>
        </div>

        <div className="flex min-w-[190px] items-center gap-3 rounded-cmt-md border border-cmt-neutral-200 bg-white px-4 py-3 shadow-cmt-xs">
          <span className="grid size-10 place-items-center rounded-cmt-full bg-cmt-primary-50 text-cmt-primary-900">
            <Users className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-display text-2xl font-semibold tabular-nums">{isLoading ? "—" : availableUsers.length}</p>
            <p className="text-xs text-cmt-neutral-500">Total registered</p>
          </div>
        </div>
      </header>

      {displayError ? (
        <p role="alert" className="mt-6 rounded-cmt-control border border-cmt-error-500/20 bg-cmt-error-100 px-4 py-3 text-sm text-cmt-error-700">
          {displayError}
        </p>
      ) : null}

      <section className="mt-7 overflow-hidden rounded-cmt-md border border-cmt-neutral-200 bg-white shadow-cmt-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cmt-neutral-200 px-4 py-4 sm:px-5">
          <p className="text-sm font-semibold">
            {isLoading
              ? "Loading registered users…"
              : search
                ? `${visibleUsers.length} of ${availableUsers.length} users`
                : `${availableUsers.length} ${availableUsers.length === 1 ? "user" : "users"}`}
          </p>
          <label className="relative w-full sm:w-72">
            <span className="sr-only">Search registered users</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cmt-neutral-400" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email or phone"
              className="h-10 w-full rounded-cmt-control border border-cmt-neutral-200 bg-cmt-neutral-50 pl-9 pr-3 text-sm outline-none transition focus:border-cmt-primary-500 focus:ring-2 focus:ring-cmt-primary-500/20"
            />
          </label>
        </div>

        <div className="hidden grid-cols-[minmax(210px,1.2fr)_minmax(220px,1.2fr)_minmax(140px,.8fr)_minmax(180px,1fr)_100px] gap-4 border-b border-cmt-neutral-200 bg-cmt-neutral-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-cmt-neutral-500 md:grid">
          <span>User</span>
          <span>Email address</span>
          <span>Phone number</span>
          <span>Registered</span>
          <span>Method</span>
        </div>

        <div className="divide-y divide-cmt-neutral-200">
          {visibleUsers.map((user) => (
            <article key={user.id} className="grid gap-4 px-4 py-5 md:grid-cols-[minmax(210px,1.2fr)_minmax(220px,1.2fr)_minmax(140px,.8fr)_minmax(180px,1fr)_100px] md:items-center md:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-cmt-full bg-cmt-secondary-900 text-xs font-semibold text-cmt-primary-500">
                  {initials(user)}
                </span>
                <div className="min-w-0">
                  <h2 className="truncate font-display text-sm font-semibold">{displayName(user)}</h2>
                  <p className="mt-0.5 truncate text-[11px] text-cmt-neutral-400">ID: {user.id}</p>
                </div>
              </div>

              <div className="flex min-w-0 items-center gap-2 text-sm text-cmt-neutral-600">
                <Mail className="size-4 shrink-0 text-cmt-neutral-400 md:hidden" aria-hidden="true" />
                <span className="truncate">{user.email || "Not provided"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-cmt-neutral-600">
                <Phone className="size-4 shrink-0 text-cmt-neutral-400 md:hidden" aria-hidden="true" />
                <span>{user.phone || "Not provided"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-cmt-neutral-600">
                <CalendarClock className="size-4 shrink-0 text-cmt-neutral-400 md:hidden" aria-hidden="true" />
                <time dateTime={user.createdAt?.toISOString()}>{registrationTime(user.createdAt)}</time>
              </div>
              <div className="flex items-center gap-2 md:block">
                <UserRound className="size-4 shrink-0 text-cmt-neutral-400 md:hidden" aria-hidden="true" />
                <span className="inline-flex rounded-cmt-full bg-cmt-neutral-100 px-2.5 py-1 text-xs font-semibold text-cmt-neutral-600">
                  {providerLabel(user.provider)}
                </span>
              </div>
            </article>
          ))}

          {!isLoading && !displayError && visibleUsers.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <UserRound className="mx-auto size-8 text-cmt-neutral-300" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold">
                {availableUsers.length === 0 ? "No registered users yet" : "No users match your search"}
              </p>
              <p className="mt-1 text-xs text-cmt-neutral-500">
                {availableUsers.length === 0
                  ? "New accounts will appear here automatically."
                  : "Try a different name, email address, or phone number."}
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

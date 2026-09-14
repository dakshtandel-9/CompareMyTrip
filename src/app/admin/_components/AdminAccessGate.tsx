"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, type User } from "firebase/auth";
import { doc, getDocFromServer } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/client";
import { getAuthDestination, getAuthPageHref } from "@/lib/firebase/authDestination";
import { useAuthUser } from "@/lib/firebase/useAuthUser";

type AccessCheck = { user: User; attempt: number; status: "authorized" | "denied" | "error" };

function loginHref() {
  const { pathname, search, hash, origin } = window.location;
  const destination = getAuthDestination(`?${new URLSearchParams({ next: pathname + search + hash })}`, origin);
  return getAuthPageHref("/login", destination);
}

export default function AdminAccessGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthUser();
  const [check, setCheck] = useState<AccessCheck | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [switchingAccount, setSwitchingAccount] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const status = user && check?.user === user && check.attempt === attempt ? check.status : "checking";

  useEffect(() => {
    if (user === null) router.replace(loginHref());
  }, [router, user, pathname]);

  useEffect(() => {
    if (!user) return;

    let active = true;
    let settled = false;
    const finish = (next: AccessCheck["status"]) => {
      if (!active || settled) return;
      settled = true;
      window.clearTimeout(timeout);
      setCheck({ user, attempt, status: next });
    };
    // Membership must be confirmed by the server, never an old offline cache.
    // An unavailable connection should offer recovery rather than spin forever.
    const timeout = window.setTimeout(() => finish("error"), 10000);
    Promise.resolve().then(() => getDocFromServer(doc(getFirebaseDb(), "admins", user.uid)))
      .then((adminDocument) => {
        finish(adminDocument.exists() ? "authorized" : "denied");
      }).catch(() => finish("error"));

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [user, attempt]);

  async function switchAccount() {
    const destination = loginHref();
    setSwitchingAccount(true);
    setSignOutError("");
    try {
      await signOut(getFirebaseAuth());
      router.replace(destination);
    } catch {
      setSignOutError("We couldn't sign you out. Please try again.");
    } finally {
      setSwitchingAccount(false);
    }
  }

  if (user && (status === "denied" || status === "error")) {
    return (
      <main className="grid min-h-dvh place-items-center bg-cmt-neutral-50 px-5 py-12 font-body">
        <section className="w-full max-w-md rounded-cmt-lg border border-cmt-neutral-200 bg-white p-6 shadow-cmt-sm sm:p-8" aria-labelledby="admin-access-title">
          <h1 id="admin-access-title" className="font-display text-2xl font-semibold text-cmt-neutral-900">
            {status === "denied" ? "Administrator access required" : "Couldn't verify admin access"}
          </h1>
          <p className="mt-3 break-words text-sm leading-6 text-cmt-neutral-600">
            {status === "denied"
              ? "This account does not have administrator access. Sign in with your admin account, or ask the site owner to grant access."
              : "Check your connection and try again. You can also sign in with another account."}
          </p>
          {user.email && <p className="mt-3 break-words text-sm text-cmt-neutral-600">Signed in as {user.email}</p>}
          {signOutError && <p role="alert" className="mt-3 text-sm text-red-700">{signOutError}</p>}
          <div className="mt-6 flex flex-col gap-3">
            <button type="button" disabled={switchingAccount} onClick={() => setAttempt((value) => value + 1)} className="min-h-11 rounded-cmt-control bg-cmt-primary-500 px-4 text-sm font-semibold hover:bg-cmt-primary-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cmt-primary-500 disabled:opacity-60">Try again</button>
            <button type="button" disabled={switchingAccount} onClick={switchAccount} className="min-h-11 rounded-cmt-control border border-cmt-neutral-300 px-4 text-sm font-semibold hover:bg-cmt-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cmt-primary-500 disabled:opacity-60">{switchingAccount ? "Signing out…" : "Sign in with another account"}</button>
            <Link href="/" className="inline-flex min-h-11 items-center justify-center text-sm text-cmt-neutral-600 underline underline-offset-4">Back to website</Link>
          </div>
        </section>
      </main>
    );
  }

  if (!user || status !== "authorized") {
    return (
      <main className="grid min-h-screen place-items-center bg-cmt-neutral-50" aria-busy="true">
        <div className="text-center">
          <span className="mx-auto block size-8 animate-spin rounded-cmt-full border-2 border-cmt-neutral-200 border-t-cmt-primary-500" />
          <p className="mt-3 text-sm text-cmt-neutral-500">{user === null ? "Opening admin sign in…" : "Checking admin access…"}</p>
        </div>
      </main>
    );
  }

  return children;
}

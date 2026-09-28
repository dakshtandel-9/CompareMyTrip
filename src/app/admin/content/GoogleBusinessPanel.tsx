"use client";

/* ------------------------------------------------------------------ */
/* Connect a Google Business Profile to the reviews rail.               */
/*                                                                      */
/* Two halves, because connecting is genuinely two jobs and pretending  */
/* otherwise is what makes this integration frustrating:                */
/*                                                                      */
/*   1. A Google Cloud project with the Business Profile APIs enabled   */
/*      and approved. This is a form Google answers by hand, and until  */
/*      they do, quota is zero and every call fails. Nothing in this    */
/*      CRM can shorten that, so the panel walks through it instead.    */
/*   2. Signing in, which is the one-click part once (1) is done.       */
/*                                                                      */
/* The client secret is posted to the server and never comes back: the  */
/* status endpoint returns the client id (so an admin can confirm which */
/* project is wired up) and nothing else.                               */
/* ------------------------------------------------------------------ */

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Link2,
  MapPin,
  RefreshCw,
  Star,
  Unlink,
} from "lucide-react";

import { getFirebaseAuth } from "@/lib/firebase/client";
import { EMPTY_GOOGLE_STATUS, type GoogleBusinessStatus } from "@/lib/googleBusiness";
import { Button, Card, FieldLabel, TextField, inputClass } from "../_components/ui";

async function authHeaders(): Promise<HeadersInit> {
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Sign in to the CRM again.");
  return { Authorization: `Bearer ${token}`, "content-type": "application/json" };
}

const API = "/api/integrations/google-business";

async function fetchStatus(): Promise<GoogleBusinessStatus> {
  const response = await fetch(API, { headers: await authHeaders(), cache: "no-store" });
  if (!response.ok) throw new Error("Could not read the connection status.");
  return (await response.json()) as GoogleBusinessStatus;
}

/** One numbered step of the setup walkthrough. */
function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="grid size-6 shrink-0 place-items-center rounded-cmt-full bg-cmt-primary-100 text-[11px] font-bold text-cmt-neutral-900">
        {number}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-cmt-neutral-900">{title}</p>
        <div className="mt-1 text-xs leading-5 text-cmt-neutral-600">{children}</div>
      </div>
    </li>
  );
}

function Link({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 font-semibold text-cmt-primary-900 underline underline-offset-2 hover:text-cmt-primary-900"
    >
      {children}
      <ExternalLink className="size-3" aria-hidden="true" />
    </a>
  );
}

export default function GoogleBusinessPanel() {
  const [status, setStatus] = useState<GoogleBusinessStatus>(EMPTY_GOOGLE_STATUS);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [busy, setBusy] = useState("");
  const [copied, setCopied] = useState(false);

  /* The consent round trip can only report back through the URL it
     redirected to (?google=connected|error), so the outcome is read during
     the first render rather than in an effect. AdminAccessGate holds this
     subtree behind a client-side auth check, so it never renders on the
     server and there is no hydration mismatch to worry about. */
  const [banner] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const outcome = params.get("google");
    if (outcome === "connected") {
      return { note: "Google account connected. Load businesses, select CompareMyTrip, then sync.", problem: "" };
    }
    if (outcome) {
      return {
        note: "",
        problem: params.get("message") || "Google did not complete the connection.",
      };
    }
    return { note: "", problem: "" };
  });

  const [note, setNote] = useState(banner.note);
  const [problem, setProblem] = useState(banner.problem);

  /* Used after an action has changed something server-side. The mount-time
     load is separate, below, so it can be cancelled on unmount. */
  const refresh = useCallback(async () => {
    try {
      const next = await fetchStatus();
      setStatus(next);
      setSelectedLocation(next.selectedLocation);
      setClientId((current) => current || next.clientId);
    } catch (error) {
      setProblem((error as Error).message);
    }
  }, []);

  useEffect(() => {
    let active = true;

    fetchStatus()
      .then((next) => {
        if (!active) return;
        setStatus(next);
        setSelectedLocation(next.selectedLocation);
        setClientId((current) => current || next.clientId);
      })
      .catch((error: Error) => {
        if (active) setProblem(error.message);
      });

    return () => {
      active = false;
    };
  }, []);

  /* Strip the callback's parameters once they have been read, so reloading
     the page does not replay a stale "connected" banner. */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("google")) return;

    params.delete("google");
    params.delete("message");
    const query = params.toString();
    window.history.replaceState({}, "", window.location.pathname + (query ? `?${query}` : ""));
  }, []);

  const run = async (label: string, task: () => Promise<void>) => {
    setBusy(label);
    setProblem("");
    setNote("");
    try {
      await task();
    } catch (error) {
      await refresh();
      setProblem((error as Error).message);
    } finally {
      setBusy("");
    }
  };

  const saveCredentials = () =>
    run("save", async () => {
      const response = await fetch(API, {
        method: "PUT",
        headers: await authHeaders(),
        body: JSON.stringify({ clientId, clientSecret }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not save the credentials.");

      /* Cleared from component state the moment it is stored: there is no
         reason for the secret to sit in a form field afterwards, and the
         server will never send it back to repopulate it. */
      setClientSecret("");
      setNote("Credentials saved. Now connect the Google account.");
      await refresh();
    });

  const connect = () =>
    run("connect", async () => {
      const response = await fetch(`${API}/oauth`, { method: "POST", headers: await authHeaders() });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "Could not start the sign-in.");
      window.location.href = result.url;
    });

  const loadBusinesses = () =>
    run("locations", async () => {
      const response = await fetch(`${API}/locations`, { method: "POST", headers: await authHeaders() });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load businesses.");
      await refresh();
      setNote(result.locations.length ? "Choose CompareMyTrip by its name and address, then sync." : "No businesses found. Check which Google account you connected.");
    });

  const sync = () =>
    run("sync", async () => {
      const response = await fetch(`${API}/sync`, { method: "POST", headers: await authHeaders(), body: JSON.stringify({ location: selectedLocation }) });
      const result = (await response.json()) as { count?: number; error?: string };
      if (!response.ok) throw new Error(result.error || "The sync failed.");
      setNote(`Pulled ${result.count ?? 0} reviews from Google.`);
      await refresh();
    });

  const disconnect = () =>
    run("disconnect", async () => {
      const response = await fetch(API, { method: "DELETE", headers: await authHeaders() });
      if (!response.ok) throw new Error("Could not disconnect.");
      setNote("Disconnected. Imported Google reviews have been removed from the website.");
      setClientId("");
      await refresh();
    });

  const copyRedirect = async () => {
    await navigator.clipboard.writeText(status.redirectUri);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      <Card
        icon={<Link2 className="size-5" />}
        title="Google Business Profile"
        description="Connect Google, choose CompareMyTrip, and import its reviews into your existing website cards."
        action={
          status.connected ? (
            <span className="inline-flex items-center gap-1.5 rounded-cmt-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
              <Check className="size-3.5" aria-hidden="true" />
              Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-cmt-full bg-cmt-neutral-100 px-3 py-1 text-xs font-semibold text-cmt-neutral-600">
              Not connected
            </span>
          )
        }
      >
        <div className="space-y-5">
          {note && (
            <p className="rounded-cmt-control bg-green-50 px-4 py-3 text-sm text-green-800">{note}</p>
          )}
          {problem && (
            <p className="rounded-cmt-control bg-red-50 px-4 py-3 text-sm text-red-700">{problem}</p>
          )}

          {status.awaitingApproval && (
            <div className="flex gap-3 rounded-cmt-control border border-amber-200 bg-amber-50 px-4 py-3">
              <Clock className="mt-0.5 size-4 shrink-0 text-amber-700" aria-hidden="true" />
              <div className="text-xs leading-5 text-amber-900">
                <p className="text-sm font-semibold">Waiting on Google&apos;s approval</p>
                <p className="mt-1">
                  Google reported zero API quota. Check Basic API Access approval and quota
                  in the same Cloud project as your OAuth client, then retry loading businesses.
                </p>
              </div>
            </div>
          )}

          {!status.connected && (
            <div className="rounded-cmt-control border border-cmt-neutral-200 bg-cmt-neutral-50 p-4">
              <p className="mb-3 text-sm font-semibold text-cmt-neutral-900">
                Getting Google API access
              </p>
              <ol className="space-y-3.5">
                <Step number={1} title="Check the profile qualifies">
                  Google requires the Business Profile to be verified and active for at least 60
                  days, with a website listed on it.
                </Step>
                <Step number={2} title="Choose a Cloud project and request API access">
                  Open <Link href="https://console.cloud.google.com/">Google Cloud Console</Link>,
                  select your business project and note its project number. Use the{" "}
                  <Link href="https://developers.google.com/my-business/content/prereqs">Basic API Access application</Link>{" "}
                  with the Google account that manages CompareMyTrip. Being a profile admin does
                  not automatically grant the project API access.
                </Step>
                <Step number={3} title="After approval, enable the APIs">
                  In the same project, enable <em>Google My Business API</em>,{" "}
                  <em>My Business Account Management API</em> and{" "}
                  <em>My Business Business Information API</em>. Check their quotas: zero quota
                  means API access is still pending. The My Business API may only appear after approval.
                </Step>
                <Step number={4} title="Create an OAuth client">
                  Under <em>APIs &amp; Services → Credentials</em>, create an OAuth client ID of
                  type <em>Web application</em>, and add this exact redirect URI:
                  <span className="mt-2 flex items-center gap-2">
                    <code className="min-w-0 flex-1 truncate rounded bg-white px-2 py-1.5 font-mono text-[11px] text-cmt-neutral-800 ring-1 ring-cmt-neutral-200">
                      {status.redirectUri || "Set NEXT_PUBLIC_SITE_URL on the server first"}
                    </code>
                    {status.redirectUri && (
                      <button
                        type="button"
                        onClick={copyRedirect}
                        className="inline-flex shrink-0 items-center gap-1 rounded border border-cmt-neutral-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-cmt-neutral-700 hover:bg-cmt-neutral-50"
                      >
                        <Copy className="size-3" aria-hidden="true" />
                        {copied ? "Copied" : "Copy"}
                      </button>
                    )}
                  </span>
                  <span className="mt-1.5 block">
                    It must match character for character, or the sign-in fails with
                    <em> redirect_uri_mismatch</em>.
                  </span>
                </Step>
                <Step number={5} title="Paste the credentials below">
                  Copy the client ID and secret from that OAuth client into the two fields below,
                  save, then press Connect. Configure the OAuth consent screen with the business.manage scope.
                  If the app is in Testing, add your managing Google account as a test user;
                  testing refresh tokens usually expire after seven days. Complete Google’s
                  publishing requirements for a lasting connection.
                </Step>
              </ol>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="OAuth client ID"
              value={clientId}
              onChange={setClientId}
              placeholder="1234567890-abc.apps.googleusercontent.com"
            />
            <div>
              <FieldLabel>OAuth client secret</FieldLabel>
              {/* type=password, and never repopulated from the server: once
                  saved it is write-only from the CRM's point of view. */}
              <input
                type="password"
                value={clientSecret}
                onChange={(event) => setClientSecret(event.target.value)}
                placeholder={
                  status.credentialsSaved ? "Saved — type to replace" : "GOCSPX-…"
                }
                autoComplete="off"
                className={inputClass}
              />
            </div>
          </div>

          {status.connected && (
            <div>
              <label htmlFor="google-business-location" className="mb-2 block text-sm font-semibold">Business to display</label>
              <select id="google-business-location" className={inputClass} value={selectedLocation}
                onChange={event => setSelectedLocation(event.target.value)} disabled={busy !== ""}>
                <option value="">Select CompareMyTrip after loading businesses</option>
                {status.locations.map(location => (
                  <option key={location.name} value={location.name}>{location.title} — {location.address || location.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={saveCredentials}
              disabled={!clientId || !clientSecret || busy !== ""}
              variant="ghost"
            >
              {busy === "save" ? "Saving…" : "Save credentials"}
            </Button>

            <Button onClick={connect} disabled={!status.credentialsSaved || busy !== ""}>
              <Link2 className="size-4" aria-hidden="true" />
              {busy === "connect"
                ? "Opening Google…"
                : status.connected
                  ? "Reconnect Google account"
                  : "Connect Google account"}
            </Button>

            {status.connected && (
              <>
                <Button onClick={loadBusinesses} disabled={busy !== ""} variant="ghost">
                  {busy === "locations" ? "Loading businesses…" : "Load businesses"}
                </Button>
                <Button onClick={sync} disabled={!selectedLocation || busy !== ""} variant="ghost">
                  <RefreshCw className="size-4" aria-hidden="true" />
                  {busy === "sync" ? "Syncing…" : "Sync now"}
                </Button>
                <Button onClick={disconnect} disabled={busy !== ""} variant="danger">
                  <Unlink className="size-4" aria-hidden="true" />
                  Disconnect
                </Button>
              </>
            )}
          </div>

          {status.connected && (
            <p className="text-xs text-cmt-neutral-500">
              {status.lastSyncedAt
                ? `Last synced ${new Date(status.lastSyncedAt).toLocaleString("en-GB")} — ${status.lastSyncCount} reviews.`
                : "Not synced yet."}{" "}
              Up to 100 recent reviews with written comments appear after your verified testimonials.
              Star-only ratings still count in Google’s total. Daily refresh requires the
              deployed scheduler and CRON_SECRET; expired imports are hidden.
            </p>
          )}
        </div>
      </Card>

      {status.locations.length > 0 && (
        <Card
          icon={<MapPin className="size-5" />}
          title={`Locations (${status.locations.length})`}
          description="Choose the correct business above. Ratings are filled after that business is synced."
        >
          <ul className="divide-y divide-cmt-neutral-100">
            {status.locations.map((location) => (
              <li
                key={location.name}
                className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-cmt-neutral-900">
                    {location.title}
                  </p>
                  {location.address && (
                    <p className="truncate text-xs text-cmt-neutral-500">{location.address}</p>
                  )}
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-cmt-neutral-700">
                  <Star className="size-3.5 fill-cmt-primary-400 text-cmt-primary-400" aria-hidden="true" />
                  {location.averageRating ? location.averageRating.toFixed(1) : "—"}
                  <span className="font-normal text-cmt-neutral-400">
                    ({location.totalReviewCount})
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {status.error && !status.awaitingApproval && (
        <div className="flex gap-3 rounded-cmt-md border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-600" aria-hidden="true" />
          <p className="text-xs leading-5 text-red-800">
            <span className="font-semibold">Last sync failed.</span> {status.error}
          </p>
        </div>
      )}
    </div>
  );
}

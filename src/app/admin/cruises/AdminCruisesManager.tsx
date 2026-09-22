"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { Edit3, ExternalLink, FileText, Ship, Trash2, Upload } from "lucide-react";
import { deleteCruises, saveCruise } from "@/lib/firebase/cruises";
import { uploadBrochureToCloudflare, uploadImageToCloudflare } from "@/lib/cloudflareUpload";
import { isPublishedCruise, type CruiseListing } from "@/lib/cruiseListings";
import { useCruisesState } from "@/lib/useCruises";
import { useAuthUser } from "@/lib/firebase/useAuthUser";

/* The cruise editor is deliberately this small. A cruise has no itinerary,
   no stays and no detail page, so it needs none of the package builder's
   steps — everything a card shows fits on one form. */

const FIELD =
  "mt-1.5 h-11 w-full rounded-xl border border-cmt-neutral-200 bg-white px-3 text-sm outline-none focus:border-cmt-primary-500 focus:shadow-[var(--cmt-focus-ring)]";

const blank = (): CruiseListing => ({
  id: "", name: "", route: "", image: "", fromPrice: 0,
  pitch: "", badge: "", brochureUrl: "", status: "published",
});

export default function AdminCruisesManager() {
  const authUser = useAuthUser();
  const { cruises, loading, error } = useCruisesState();
  const [editing, setEditing] = useState<CruiseListing | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CruiseListing | null>(null);
  const [actionError, setActionError] = useState("");
  const [success, setSuccess] = useState("");
  const [working, setWorking] = useState(false);
  const [uploading, setUploading] = useState<"image" | "brochure" | null>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const brochureInput = useRef<HTMLInputElement>(null);

  const isLoading = authUser === undefined || (authUser !== null && loading);
  const displayError = authUser === null
    ? "Sign in to your admin account to manage cruises."
    : actionError || error;

  const draftCount = cruises.filter((cruise) => !isPublishedCruise(cruise)).length;

  const upload = async (file: File | undefined, kind: "image" | "brochure") => {
    if (!file || !editing) return;
    setUploading(kind); setActionError("");
    try {
      const url = kind === "image"
        ? await uploadImageToCloudflare(file, "packages")
        : await uploadBrochureToCloudflare(file);
      setEditing({ ...editing, [kind === "image" ? "image" : "brochureUrl"]: url });
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "The file could not be uploaded.");
    } finally {
      setUploading(null);
    }
  };

  const save = async () => {
    if (!editing || working) return;
    if (!editing.name.trim()) return setActionError("A cruise name is required.");
    setWorking(true); setActionError(""); setSuccess("");
    try {
      const record: CruiseListing = {
        ...editing,
        // A new cruise gets its id here; an edit keeps the one it has.
        id: editing.id || crypto.randomUUID(),
        position: editing.position ?? Date.now(),
      };
      const { refreshWarning } = await saveCruise(record);
      setSuccess(`“${record.name}” was saved.`);
      setActionError(refreshWarning);
      setEditing(null);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "The cruise could not be saved.");
    } finally {
      setWorking(false);
    }
  };

  const remove = async (cruise: CruiseListing) => {
    setWorking(true); setActionError(""); setSuccess("");
    try {
      const { refreshWarning } = await deleteCruises([cruise.id]);
      setSuccess(`“${cruise.name}” was deleted.`);
      setActionError(refreshWarning);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "The cruise could not be deleted.");
    } finally {
      setWorking(false); setPendingDelete(null);
    }
  };

  /* ---- the editor ---- */
  if (editing) {
    return <div className="font-body text-cmt-neutral-900">
      <h1 className="font-display text-3xl font-semibold tracking-tight">{editing.id ? "Edit cruise" : "Create cruise"}</h1>
      <p className="mt-2 text-sm text-cmt-neutral-600">These few details are the whole listing — a cruise card has no page behind it.</p>

      {actionError && <p role="alert" className="mt-5 rounded-cmt-control border border-cmt-error-500/20 bg-cmt-error-100 px-4 py-3 text-sm text-cmt-error-700">{actionError}</p>}

      <div className="mt-6 grid max-w-2xl gap-5 rounded-cmt-md border border-cmt-neutral-200 bg-white p-6 shadow-cmt-sm">
        <label className="text-xs font-semibold text-cmt-neutral-600">Cruise line
          <input value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} placeholder="Star Dream Cruises" className={FIELD} />
        </label>
        <label className="text-xs font-semibold text-cmt-neutral-600">Route
          <input value={editing.route} onChange={(event) => setEditing({ ...editing, route: event.target.value })} placeholder="Singapore · Genting Dreams" className={FIELD} />
        </label>
        <label className="text-xs font-semibold text-cmt-neutral-600">From price, per person (₹)
          <input type="number" min={0} value={editing.fromPrice || ""} onChange={(event) => setEditing({ ...editing, fromPrice: Math.max(0, Number(event.target.value) || 0) })} className={FIELD} />
        </label>
        <label className="text-xs font-semibold text-cmt-neutral-600">One line under the price
          <input value={editing.pitch} onChange={(event) => setEditing({ ...editing, pitch: event.target.value })} placeholder="Fastest quotes, year-round availability" className={FIELD} />
        </label>
        <label className="text-xs font-semibold text-cmt-neutral-600">Badge <span className="font-medium text-cmt-neutral-400">— optional, shows on the photo</span>
          <input value={editing.badge} onChange={(event) => setEditing({ ...editing, badge: event.target.value })} placeholder="Top pick" className={FIELD} />
        </label>

        <div className="text-xs font-semibold text-cmt-neutral-600">Photo
          <div className="mt-1.5 flex items-center gap-3">
            <div className="relative aspect-[16/10] w-32 shrink-0 overflow-hidden rounded-cmt-sm bg-cmt-neutral-100">
              {editing.image ? <Image src={editing.image} alt="" fill sizes="128px" className="object-cover" /> : <span className="grid h-full place-items-center text-[11px] text-cmt-neutral-500">No photo</span>}
            </div>
            <input ref={imageInput} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; void upload(file, "image"); }} />
            <button type="button" disabled={uploading !== null} onClick={() => imageInput.current?.click()} className="inline-flex h-10 items-center gap-2 rounded-cmt-control border border-cmt-neutral-200 px-3 text-xs font-semibold disabled:opacity-40">
              <Upload className="size-3.5" />{uploading === "image" ? "Uploading…" : editing.image ? "Replace photo" : "Upload photo"}
            </button>
          </div>
        </div>

        <div className="text-xs font-semibold text-cmt-neutral-600">Brochure PDF <span className="font-medium text-cmt-neutral-400">— optional, hides the button when empty</span>
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            {editing.brochureUrl && <a href={editing.brochureUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-cmt-primary-900 underline underline-offset-4"><FileText className="size-3.5" />View current</a>}
            <input ref={brochureInput} hidden type="file" accept="application/pdf" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; void upload(file, "brochure"); }} />
            <button type="button" disabled={uploading !== null} onClick={() => brochureInput.current?.click()} className="inline-flex h-10 items-center gap-2 rounded-cmt-control border border-cmt-neutral-200 px-3 text-xs font-semibold disabled:opacity-40">
              <Upload className="size-3.5" />{uploading === "brochure" ? "Uploading…" : editing.brochureUrl ? "Replace PDF" : "Upload PDF"}
            </button>
            {editing.brochureUrl && <button type="button" onClick={() => setEditing({ ...editing, brochureUrl: "" })} className="text-xs font-semibold text-cmt-neutral-600">Remove</button>}
          </div>
        </div>

        <label className="text-xs font-semibold text-cmt-neutral-600">Visibility
          <select value={editing.status ?? "published"} onChange={(event) => setEditing({ ...editing, status: event.target.value === "draft" ? "draft" : "published" })} className={FIELD}>
            <option value="published">Live on website</option>
            <option value="draft">Draft · private</option>
          </select>
        </label>

        <div className="flex gap-3 pt-2">
          <button type="button" disabled={working || uploading !== null} onClick={() => void save()} className="h-11 rounded-cmt-control bg-cmt-primary-500 px-5 text-sm font-semibold disabled:opacity-50">{working ? "Saving…" : "Save cruise"}</button>
          <button type="button" disabled={working} onClick={() => { setEditing(null); setActionError(""); }} className="h-11 rounded-cmt-control border border-cmt-neutral-200 px-5 text-sm font-semibold">Cancel</button>
        </div>
      </div>
    </div>;
  }

  /* ---- the list ---- */
  return <div className="font-body text-cmt-neutral-900">
    {pendingDelete && <div className="fixed inset-0 z-[80] grid place-items-center p-4" role="dialog" aria-modal="true">
      <button type="button" aria-label="Cancel" onClick={() => setPendingDelete(null)} className="absolute inset-0 bg-cmt-neutral-900/50" />
      <div className="relative w-full max-w-md rounded-cmt-md bg-white p-6 shadow-cmt-xl">
        <h2 className="font-display text-lg font-semibold">Delete this cruise?</h2>
        <p className="mt-2 text-sm text-cmt-neutral-600">“{pendingDelete.name}” will be removed from your website. This cannot be undone.</p>
        <div className="mt-5 flex gap-3">
          <button type="button" disabled={working} onClick={() => void remove(pendingDelete)} className="h-10 rounded-cmt-control bg-red-600 px-4 text-sm font-semibold text-white disabled:opacity-50">{working ? "Deleting…" : "Delete cruise"}</button>
          <button type="button" onClick={() => setPendingDelete(null)} className="h-10 rounded-cmt-control border border-cmt-neutral-200 px-4 text-sm font-semibold">Cancel</button>
        </div>
      </div>
    </div>}

    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cmt-primary-900">Travel catalogue</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Cruises</h1>
        <p className="mt-2 text-sm text-cmt-neutral-600">Each cruise is one card on your cruise page. There is no detail page — travellers ask for a quote or take the brochure.</p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-cmt-primary-900">
          <Link href="/cruise" target="_blank">View cruise page <span aria-hidden="true">↗</span></Link>
        </div>
      </div>
      <button type="button" disabled={isLoading || !authUser} onClick={() => { setEditing(blank()); setActionError(""); }} className="inline-flex h-11 items-center gap-2 rounded-cmt-control bg-cmt-primary-500 px-5 text-sm font-semibold shadow-cmt-primary hover:bg-cmt-primary-600 disabled:cursor-not-allowed disabled:opacity-50"><Ship className="size-4" /> Create cruise</button>
    </div>

    <div className="mt-6 grid gap-3 sm:grid-cols-3">
      {[{ label: "All cruises", count: cruises.length, hint: "Everything on your cruise page" },
        { label: "Live on website", count: cruises.length - draftCount, hint: "Travellers can see these" },
        { label: "Drafts", count: draftCount, hint: "Private until you publish" }].map((item) =>
        <div key={item.label} className="rounded-2xl border border-cmt-neutral-200 bg-white p-5">
          <span className="text-sm font-semibold text-cmt-neutral-600">{item.label}</span>
          <span className="mt-2 block text-3xl font-semibold tracking-tight">{isLoading ? "—" : item.count}</span>
          <span className="mt-1 block text-xs text-cmt-neutral-500">{item.hint}</span>
        </div>)}
    </div>

    {success && <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</p>}
    {displayError && <p role="alert" className="mt-5 rounded-cmt-control border border-cmt-error-500/20 bg-cmt-error-100 px-4 py-3 text-sm text-cmt-error-700">{displayError}</p>}

    <div className="mt-7 overflow-hidden rounded-cmt-md border border-cmt-neutral-200 bg-white shadow-cmt-sm">
      <div className="border-b border-cmt-neutral-200 px-5 py-4">
        <p className="text-sm font-semibold">{isLoading ? "Loading cruises…" : `${cruises.length} cruise${cruises.length === 1 ? "" : "s"} · ${draftCount} draft${draftCount === 1 ? "" : "s"}`}</p>
      </div>
      <div className="divide-y divide-cmt-neutral-200">
        {cruises.map((cruise) => <article key={cruise.id} className="grid gap-4 p-4 lg:grid-cols-[88px_minmax(0,1fr)_auto] lg:items-center sm:px-5">
          <div className="relative aspect-[16/10] w-28 lg:w-full overflow-hidden rounded-cmt-sm bg-cmt-neutral-100">
            {cruise.image ? <Image src={cruise.image} alt="" fill sizes="112px" className="object-cover" /> : <span className="grid h-full place-items-center text-xs text-cmt-neutral-500">No photo</span>}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="break-words font-display text-base font-semibold">{cruise.name}</h2>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${isPublishedCruise(cruise) ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{isPublishedCruise(cruise) ? "Live on website" : "Draft · private"}</span>
              {cruise.badge && <span className="shrink-0 rounded-full bg-cmt-primary-50 px-2.5 py-1 text-[11px] font-semibold text-cmt-primary-900">{cruise.badge}</span>}
            </div>
            <p className="mt-1 text-xs text-cmt-neutral-500">{cruise.route || "No route set"} · From ₹{cruise.fromPrice.toLocaleString("en-IN")} per person{cruise.brochureUrl ? " · Brochure attached" : ""}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {cruise.brochureUrl && <a href={cruise.brochureUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-cmt-control border border-cmt-neutral-200 px-3 text-xs font-semibold"><ExternalLink className="size-3.5" /> Brochure</a>}
            <button type="button" disabled={!authUser} onClick={() => { setEditing(cruise); setActionError(""); }} className="inline-flex h-9 items-center gap-1.5 rounded-cmt-control border border-cmt-neutral-200 px-3 text-xs font-semibold disabled:opacity-40"><Edit3 className="size-3.5" /> Edit</button>
            <button type="button" disabled={working || !authUser} onClick={() => setPendingDelete(cruise)} className="inline-flex h-9 items-center gap-1.5 rounded-cmt-control border border-cmt-error-500/30 px-3 text-xs font-semibold text-cmt-error-700 disabled:opacity-40"><Trash2 className="size-3.5" /> Delete</button>
          </div>
        </article>)}
        {!isLoading && cruises.length === 0 && <p className="p-8 text-center text-sm text-cmt-neutral-500">No cruises yet. Select Create cruise to add your first listing — until then your cruise page shows three sample cards.</p>}
      </div>
    </div>
  </div>;
}

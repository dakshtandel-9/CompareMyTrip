"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Database, Edit3, ExternalLink, PackagePlus, Search, Trash2 } from "lucide-react";
import { assignWeekendTrack, deletePackages, seedPackages } from "@/lib/firebase/packages";
import { DUMMY_PACKAGES, isPublishedPackage, type TravelPackage } from "@/lib/packageData";
import { packageImages } from "@/lib/packageImages";
import { cleanupAbandonedPackageImages, deleteImageFromCloudflare } from "@/lib/cloudflareUpload";
import { INDIA_STATES, toIndiaState } from "@/lib/indiaStates";
import { useDestinationCoversState } from "@/lib/useDestinationCovers";
import { useAllPackagesState } from "@/lib/usePackages";
import { trackForTrek, WEEKEND_TRACKS } from "@/lib/weekendTracks";
import AdminPackageBuilder from "./AdminPackageBuilder";
import DeletePackageDialog from "./DeletePackageDialog";

import { catalogueEditorMode, catalogueListHref } from "./catalogueEditorState";

/* Distinguishes "clear the track" from the select's own empty placeholder. */
const CLEAR_TRACK = "__clear__";

export default function AdminPackagesManager() {
  const basePath = "/admin/packages";
  const title = "Packages";
  const itemLabel = "package";
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageSize = 10;
  const { destinations } = useDestinationCoversState();
  const destinationFilter = searchParams.get("destination") ?? "";
  const { packages, loading, error, databaseInitialized } = useAllPackagesState();
  const managedPackages = packages;
  const [editing, setEditing] = useState<TravelPackage | null>(null);
  const [actionError, setActionError] = useState("");
  const [working, setWorking] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [region, setRegion] = useState("all");
  const [success, setSuccess] = useState("");
  const [pendingDelete, setPendingDelete] = useState<TravelPackage[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const deleting = useRef(false);

  const imageCleanupStarted = useRef(false);
  useEffect(() => {
    if (loading || error || !databaseInitialized || editing || searchParams.has("create") || imageCleanupStarted.current) return;
    imageCleanupStarted.current = true;
    const retained = packages.flatMap(packageImages);
    void cleanupAbandonedPackageImages(retained).then(({ failedCount }) => {
      if (failedCount) setActionError(`${failedCount} abandoned package image${failedCount === 1 ? "" : "s"} could not be deleted. Cleanup will retry next time.`);
    });
  }, [loading, error, databaseInitialized, editing, searchParams, packages]);
  const filteredPackages = useMemo(() => {
    const query = search.trim().toLowerCase();
    return managedPackages.filter((pkg) =>
      (status === "all" || (status === "published" ? isPublishedPackage(pkg) : !isPublishedPackage(pkg))) &&
      (region === "all" || pkg.region === region) &&
      (!destinationFilter || (pkg.region === "India" ? toIndiaState(pkg.destination) : pkg.destination) === destinationFilter) &&
      (!query || [pkg.title, pkg.location, pkg.destination, pkg.region, ...pkg.tags].some((value) => value.toLowerCase().includes(query))));
  }, [managedPackages, search, status, region, destinationFilter]);
  const draftCount = managedPackages.filter((pkg) => !isPublishedPackage(pkg)).length;
  const totalPages = Math.max(1, Math.ceil(filteredPackages.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visiblePackages = filteredPackages.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  // Only matching rows are actionable, so hidden selections cannot be deleted.
  const selectedPackages = filteredPackages.filter((pkg) => selectedIds.has(pkg.id));
  const allPageSelected = visiblePackages.length > 0 && visiblePackages.every((pkg) => selectedIds.has(pkg.id));
  const toggleSelection = (ids: string[], checked: boolean) => {
    setSelectedIds(() => {
      const next = new Set(selectedPackages.map((pkg) => pkg.id));
      ids.forEach((id) => { if (checked) next.add(id); else next.delete(id); });
      return next;
    });
  };
  /* What the builder's "Filed under" field offers, split by region. India lists
     every state, so a state enters the public destination filter the moment a
     package is filed under it — nothing is hardcoded on the site itself.
     International lists the countries already in the catalogue, unchanged. */
  const filedUnderOptions = useMemo(() => {
    const used = (region: TravelPackage["region"]) =>
      packages
        .filter((pkg) => pkg.region === region)
        .map((pkg) => pkg.destination.trim())
        .filter(Boolean);
    const unique = (list: string[]) => [...new Set(list)].sort((a, b) => a.localeCompare(b));
    return {
      India: unique([...INDIA_STATES, ...used("India"), ...used("India").map(toIndiaState), ...destinations.filter(item => item.region === "India").map(item => item.name)]),
      International: unique([...used("International"), ...destinations.filter(item => item.region === "International").map(item => item.name)]),
    };
  }, [packages, destinations]);

  const currentEditing = catalogueEditorMode(editing, searchParams.get("create"), databaseInitialized);
  const closeEditor = () => {
    setEditing(null);
    if (searchParams.has("create")) router.replace(catalogueListHref(basePath, searchParams.toString()), { scroll: false });
  };

  if (currentEditing) {
    const protectedImages = packages.filter(pkg => currentEditing === "new" || pkg.id !== currentEditing.id).flatMap(packageImages);
    return <AdminPackageBuilder initialDestination={searchParams.get("destination") ?? ""} initialRegion={searchParams.get("region") === "International" ? "International" : "India"} initialPackage={currentEditing === "new" ? undefined : currentEditing} filedUnderOptions={filedUnderOptions} protectedImages={protectedImages} onCancel={closeEditor} onSaved={(message) => { setSuccess(message); closeEditor(); }} />;
  }

  const importExisting = async () => {
    setWorking(true); setActionError("");
    try { await seedPackages(DUMMY_PACKAGES); setSuccess("Your existing packages are ready to manage. You can now edit them or create a new package."); }
    catch (cause) { setActionError(cause instanceof Error ? cause.message : "The packages could not be imported."); }
    finally { setWorking(false); }
  };

  const moveToTrack = async (targets: TravelPackage[], track: string | null) => {
    if (!targets.length) return;
    setWorking(true); setActionError(""); setSuccess("");
    try {
      const { refreshWarning } = await assignWeekendTrack(targets, track);
      const label = WEEKEND_TRACKS.find((item) => item.id === track)?.label;
      const count = `${targets.length} ${targets.length === 1 ? "package" : "packages"}`;
      setSuccess(label ? `${count} moved to ${label}.` : `${count} removed from their weekend track.`);
      setActionError(refreshWarning);
    }
    catch (cause) { setActionError(cause instanceof Error ? cause.message : "The packages could not be moved. Please try again."); }
    finally { setWorking(false); }
  };

  const remove = async (targets: TravelPackage[]) => {
    if (deleting.current || !targets.length) return;
    deleting.current = true;
    setWorking(true); setActionError(""); setSuccess("");
    try {
      const { refreshWarning } = await deletePackages(targets.map((pkg) => pkg.id));
      const deletedIds = new Set(targets.map((pkg) => pkg.id));
      setSelectedIds((previous) => new Set([...previous].filter((id) => !deletedIds.has(id))));
      const retainedImages = new Set(packages.filter((pkg) => !deletedIds.has(pkg.id)).flatMap(packageImages));
      const images = [...new Set(targets.flatMap(packageImages))].filter((image) => !retainedImages.has(image));
      const cleanup = await Promise.allSettled(images.map(deleteImageFromCloudflare));
      setSuccess(targets.length === 1 ? `“${targets[0].title}” was deleted.` : `${targets.length} packages were deleted.`);
      const cleanupWarning = cleanup.some((result) => result.status === "rejected")
        ? "The packages were deleted, but some uploaded images could not be removed from storage." : "";
      setActionError([refreshWarning, cleanupWarning].filter(Boolean).join(" "));
    }
    catch (cause) { setActionError(cause instanceof Error ? cause.message : "The packages could not be deleted. Please try again."); }
    finally { deleting.current = false; setWorking(false); setPendingDelete(null); }
  };

  return <div className="font-body text-cmt-neutral-900">
    {pendingDelete && <DeletePackageDialog packages={pendingDelete} busy={working} onCancel={() => setPendingDelete(null)} onConfirm={() => void remove(pendingDelete)} />}
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-cmt-primary-900">Travel catalogue</p><h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1><p className="mt-2 text-sm text-cmt-neutral-600">Manage every trip in one place. Drafts stay private; published packages appear on your website.</p></div>
      <button disabled={!databaseInitialized} title={!databaseInitialized ? "Import the existing catalogue first" : undefined} onClick={() => router.push(`${basePath}?create=1`, { scroll: false })} className="inline-flex h-11 items-center gap-2 rounded-cmt-control bg-cmt-primary-500 px-5 text-sm font-semibold shadow-cmt-primary hover:bg-cmt-primary-600 disabled:cursor-not-allowed disabled:opacity-50"><PackagePlus className="size-4" /> Create {itemLabel}</button>
    </div>

    {!databaseInitialized && !loading && <section className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-cmt-md border border-cmt-primary-200 bg-cmt-primary-50 p-5">
      <div className="flex gap-3"><Database className="mt-0.5 size-5 text-cmt-primary-800" /><div><p className="font-semibold">Set up your existing packages</p><p className="mt-1 text-sm text-cmt-neutral-600">Your website already has {DUMMY_PACKAGES.length} packages. Import them once to start editing them here. This keeps your current catalogue available.</p></div></div>
      <button disabled={working} onClick={importExisting} className="h-10 rounded-cmt-control bg-cmt-neutral-900 px-4 text-sm font-semibold text-white disabled:opacity-50">{working ? "Importing…" : `Import ${DUMMY_PACKAGES.length} packages`}</button>
    </section>}

    <div className="mt-6 grid gap-3 sm:grid-cols-3">
      {[{ label: `All ${title.toLowerCase()}`, value: "all", count: managedPackages.length, hint: "Your complete travel catalogue" }, { label: "Live on website", value: "published", count: managedPackages.length - draftCount, hint: "Travellers can view and book" }, { label: "Drafts", value: "draft", count: draftCount, hint: "Private until you publish" }].map((item) => <button key={item.value} type="button" aria-pressed={status === item.value} onClick={() => { setStatus(item.value); setPage(1); }} className={`rounded-2xl border p-5 text-left transition-colors ${status === item.value ? "border-cmt-primary-400 bg-cmt-primary-50/70" : "border-cmt-neutral-200 bg-white hover:border-cmt-primary-100"}`}><span className="text-sm font-semibold text-cmt-neutral-600">{item.label}</span><span className="mt-2 block text-3xl font-semibold tracking-tight">{loading ? "—" : item.count}</span><span className="mt-1 block text-xs text-cmt-neutral-500">{item.hint}</span></button>)}
    </div>
    {success && <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</p>}
    {(error || actionError) && <p role="alert" className="mt-5 rounded-cmt-control border border-cmt-error-500/20 bg-cmt-error-100 px-4 py-3 text-sm text-cmt-error-700">{actionError || error}</p>}

    <div className="mt-7 overflow-hidden rounded-cmt-md border border-cmt-neutral-200 bg-white shadow-cmt-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cmt-neutral-200 px-5 py-4">
        <p className="text-sm font-semibold">{loading ? "Loading packages…" : search ? `${filteredPackages.length} matching packages` : `${managedPackages.length} ${title.toLowerCase()} · ${draftCount} draft${draftCount === 1 ? "" : "s"}`}</p>
        <label className="relative block w-full sm:w-80"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cmt-neutral-400" /><span className="sr-only">Search packages</span><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search packages…" className="h-10 w-full rounded-cmt-control border border-cmt-neutral-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-cmt-primary-500 focus:shadow-[var(--cmt-focus-ring)]" /></label>
      </div>
      <div className="flex flex-wrap items-end gap-3 border-b border-cmt-neutral-100 bg-cmt-neutral-50/50 px-5 py-4">
        <label className="text-xs font-semibold text-cmt-neutral-600">Visibility<select aria-label="Filter packages by visibility" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="mt-1.5 block h-10 min-w-40 rounded-xl border border-cmt-neutral-200 bg-white px-3 text-sm"><option value="all">All packages</option><option value="published">Live on website</option><option value="draft">Drafts</option></select></label>
        <label className="text-xs font-semibold text-cmt-neutral-600">Destination region<select aria-label="Filter packages by region" value={region} onChange={(event) => { setRegion(event.target.value); setPage(1); }} className="mt-1.5 block h-10 min-w-40 rounded-xl border border-cmt-neutral-200 bg-white px-3 text-sm"><option value="all">All destinations</option><option value="India">India</option><option value="International">International</option></select></label>
        {destinationFilter && <p className="text-sm font-semibold">Destination: {destinationFilter}</p>}
        {(status !== "all" || region !== "all" || search || destinationFilter) && <button type="button" onClick={() => { setStatus("all"); setRegion("all"); setSearch(""); setPage(1); if (destinationFilter) router.replace(basePath, { scroll: false }); }} className="h-10 px-2 text-xs font-semibold text-cmt-primary-900">Clear filters</button>}
        <p className="ml-auto pb-3 text-xs text-cmt-neutral-500">{loading ? "Loading…" : `${filteredPackages.length} package${filteredPackages.length === 1 ? "" : "s"} shown`}</p>
      </div>
      {!loading && filteredPackages.length > 0 && <div className="flex flex-wrap items-center gap-3 border-b border-cmt-neutral-200 bg-cmt-primary-50/40 px-5 py-3">
        <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={allPageSelected} ref={(input) => { if (input) input.indeterminate = !allPageSelected && visiblePackages.some((pkg) => selectedIds.has(pkg.id)); }} disabled={working || !databaseInitialized} onChange={(event) => toggleSelection(visiblePackages.map((pkg) => pkg.id), event.target.checked)} className="size-4 accent-cmt-primary-700" />
          Select this page
        </label>
        {selectedPackages.length > 0 && <>
          <span role="status" className="text-xs font-semibold text-cmt-primary-800">{selectedPackages.length} selected across pages</span>
          {selectedPackages.length < filteredPackages.length && filteredPackages.length <= 500 && <button type="button" disabled={working} onClick={() => setSelectedIds(new Set(filteredPackages.map((pkg) => pkg.id)))} className="min-h-9 text-xs font-semibold text-cmt-primary-800 underline underline-offset-4">Select all {filteredPackages.length} matching packages</button>}
          <button type="button" disabled={working} onClick={() => setSelectedIds(new Set())} className="min-h-9 text-xs font-semibold text-cmt-neutral-600">Clear selection</button>
          <label className="inline-flex min-h-9 items-center gap-2 text-xs font-semibold text-cmt-neutral-600">
            Weekend track
            <select aria-label="Move selected packages to a weekend track" value="" disabled={working || selectedPackages.length > 500} onChange={(event) => { const value = event.target.value; event.target.value = ""; if (value) void moveToTrack(selectedPackages, value === CLEAR_TRACK ? null : value); }} className="h-9 rounded-xl border border-cmt-neutral-200 bg-white px-2 text-xs font-semibold disabled:opacity-40">
              <option value="">Move to…</option>
              {WEEKEND_TRACKS.map((track) => <option key={track.id} value={track.id}>{track.label}</option>)}
              <option value={CLEAR_TRACK}>Remove from track</option>
            </select>
          </label>
          <button type="button" disabled={working || selectedPackages.length > 500} onClick={() => setPendingDelete(selectedPackages)} className="ml-auto inline-flex min-h-9 items-center gap-2 rounded-xl bg-red-600 px-4 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-40"><Trash2 className="size-4" />Delete selected ({selectedPackages.length})</button>
          {selectedPackages.length > 500 && <p className="w-full text-xs text-red-700">Select up to 500 packages at a time.</p>}
        </>}
      </div>}
      <div className="divide-y divide-cmt-neutral-200">
        {visiblePackages.map((pkg) => <article key={pkg.id} className="grid gap-4 p-4 lg:grid-cols-[24px_88px_minmax(0,1fr)_auto] lg:items-center sm:px-5">
          <input type="checkbox" aria-label={`Select ${pkg.title}`} checked={selectedIds.has(pkg.id)} disabled={working || !databaseInitialized} onChange={(event) => toggleSelection([pkg.id], event.target.checked)} className="size-4 cursor-pointer accent-cmt-primary-700" />
          <div className="relative aspect-[4/3] w-28 lg:w-full overflow-hidden rounded-cmt-sm bg-cmt-neutral-100">{pkg.image ? <Image src={pkg.image} alt="" fill sizes="112px" className="object-cover" /> : <span className="grid h-full place-items-center text-xs text-cmt-neutral-500">No cover photo</span>}</div>
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="break-words font-display text-base font-semibold">{pkg.title}</h2><span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${isPublishedPackage(pkg) ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{isPublishedPackage(pkg) ? "Live on website" : "Draft · private"}</span><select aria-label={`Weekend track for ${pkg.title}`} value={trackForTrek(pkg)?.id ?? CLEAR_TRACK} disabled={working || !databaseInitialized} onChange={(event) => void moveToTrack([pkg], event.target.value === CLEAR_TRACK ? null : event.target.value)} className="max-w-full rounded-full border border-cmt-primary-100 bg-cmt-primary-50 px-2.5 py-1 text-[11px] font-semibold text-cmt-primary-900 disabled:opacity-40">
            <option value={CLEAR_TRACK}>{trackForTrek(pkg) ? "Remove from track" : "No weekend track"}</option>
            {WEEKEND_TRACKS.map((track) => <option key={track.id} value={track.id}>{track.label}</option>)}
          </select></div><p className="mt-1 text-xs font-medium text-cmt-neutral-600">Destination: {pkg.region === "India" ? toIndiaState(pkg.destination) : pkg.destination} · {pkg.region}</p><p className="mt-1 truncate text-xs text-cmt-neutral-500">{pkg.location} · {pkg.nights} nights / {pkg.days} days · ₹{pkg.price.toLocaleString("en-IN")} per person</p></div>
          <div className="flex flex-wrap gap-2">{isPublishedPackage(pkg) && <Link href={`/packages/${pkg.id}`} target="_blank" className="inline-flex h-9 items-center gap-1.5 rounded-cmt-control border border-cmt-neutral-200 px-3 text-xs font-semibold"><ExternalLink className="size-3.5" /> View</Link>}<button disabled={!databaseInitialized} title={!databaseInitialized ? "Import the existing catalogue first" : undefined} onClick={() => setEditing(pkg)} className="inline-flex h-9 items-center gap-1.5 rounded-cmt-control border border-cmt-neutral-200 px-3 text-xs font-semibold disabled:opacity-40"><Edit3 className="size-3.5" /> Edit</button><button disabled={working || !databaseInitialized} onClick={() => setPendingDelete([pkg])} className="inline-flex h-9 items-center gap-1.5 rounded-cmt-control border border-cmt-error-500/30 px-3 text-xs font-semibold text-cmt-error-700 disabled:opacity-40"><Trash2 className="size-3.5" /> Delete</button></div>
        </article>)}
        {!loading && filteredPackages.length === 0 && <p className="p-8 text-center text-sm text-cmt-neutral-500">{search || status !== "all" || region !== "all" || destinationFilter ? "No packages match these filters. Try another search or clear the filters." : `No ${title.toLowerCase()} yet. Select Create ${itemLabel} to add your first listing.`}</p>}
      </div>
      {!loading && filteredPackages.length > 0 && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-cmt-neutral-200 px-5 py-4"><p className="text-xs text-cmt-neutral-500">Page {currentPage} of {totalPages} · Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredPackages.length)} of {filteredPackages.length}</p><div className="flex gap-2"><button disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="inline-flex h-9 items-center gap-1.5 rounded-cmt-control border border-cmt-neutral-200 px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="size-3.5" /> Previous</button><button disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="inline-flex h-9 items-center gap-1.5 rounded-cmt-control bg-cmt-neutral-900 px-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Next <ChevronRight className="size-3.5" /></button></div></div>}
    </div>
  </div>;
}

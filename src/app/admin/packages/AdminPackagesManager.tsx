"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Database, Edit3, PackagePlus, Search, Trash2 } from "lucide-react";
import { deletePackage, seedPackages } from "@/lib/firebase/packages";
import { DUMMY_PACKAGES, getPackageDetails, isPublishedPackage, type TravelPackage } from "@/lib/packageData";
import { cleanupAbandonedPackageImages, deleteImageFromCloudflare } from "@/lib/cloudflareUpload";
import { INDIA_STATES, toIndiaState } from "@/lib/indiaStates";
import { useAllPackagesState } from "@/lib/usePackages";
import AdminPackageBuilder from "./AdminPackageBuilder";

export default function AdminPackagesManager() {
  const pageSize = 10;
  const { packages, loading, error, databaseInitialized } = useAllPackagesState();
  const [editing, setEditing] = useState<TravelPackage | "new" | null>(null);
  const [actionError, setActionError] = useState("");
  const [working, setWorking] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    void cleanupAbandonedPackageImages().then(({ failedCount }) => {
      if (failedCount) setActionError(`${failedCount} abandoned package image${failedCount === 1 ? "" : "s"} could not be deleted. Cleanup will retry next time.`);
    });
  }, []);
  const filteredPackages = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return packages;
    return packages.filter((pkg) => [pkg.title, pkg.location, pkg.destination, pkg.region, ...pkg.tags]
      .some((value) => value.toLowerCase().includes(query)));
  }, [packages, search]);
  const draftCount = packages.filter((pkg) => !isPublishedPackage(pkg)).length;
  const totalPages = Math.max(1, Math.ceil(filteredPackages.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visiblePackages = filteredPackages.slice((currentPage - 1) * pageSize, currentPage * pageSize);
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
      India: unique([...INDIA_STATES, ...used("India").map(toIndiaState)]),
      International: unique(used("International")),
    };
  }, [packages]);

  if (editing) {
    return <AdminPackageBuilder initialPackage={editing === "new" ? undefined : editing} filedUnderOptions={filedUnderOptions} onCancel={() => setEditing(null)} onSaved={() => setEditing(null)} />;
  }

  const importExisting = async () => {
    setWorking(true); setActionError("");
    try { await seedPackages(DUMMY_PACKAGES); }
    catch (cause) { setActionError(cause instanceof Error ? cause.message : "The packages could not be imported."); }
    finally { setWorking(false); }
  };

  const remove = async (pkg: TravelPackage) => {
    if (!window.confirm(`Delete “${pkg.title}”? This removes it from the website too.`)) return;
    setWorking(true); setActionError("");
    try {
      await deletePackage(pkg.id);
      const images = [...new Set([pkg.image, ...getPackageDetails(pkg).gallery])];
      await Promise.all(images.map(deleteImageFromCloudflare));
    }
    catch (cause) { setActionError(cause instanceof Error ? cause.message : "The package could not be deleted."); }
    finally { setWorking(false); }
  };

  return <div className="font-body text-cmt-neutral-900">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-cmt-primary-700">Package inventory</p><h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Packages</h1><p className="mt-2 text-sm text-cmt-neutral-600">Create, edit and remove the products shown on the website.</p></div>
      <button disabled={!databaseInitialized} title={!databaseInitialized ? "Import the existing catalogue first" : undefined} onClick={() => setEditing("new")} className="inline-flex h-11 items-center gap-2 rounded-cmt-control bg-cmt-primary-500 px-5 text-sm font-semibold shadow-cmt-primary hover:bg-cmt-primary-600 disabled:cursor-not-allowed disabled:opacity-50"><PackagePlus className="size-4" /> Create package</button>
    </div>

    {!databaseInitialized && !loading && <section className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-cmt-md border border-cmt-primary-200 bg-cmt-primary-50 p-5">
      <div className="flex gap-3"><Database className="mt-0.5 size-5 text-cmt-primary-800" /><div><p className="font-semibold">Move the existing catalogue to Firebase</p><p className="mt-1 text-sm text-cmt-neutral-600">The current {DUMMY_PACKAGES.length} website packages are visible as a safe fallback. Import them once to make Firebase the source of truth.</p></div></div>
      <button disabled={working} onClick={importExisting} className="h-10 rounded-cmt-control bg-cmt-neutral-900 px-4 text-sm font-semibold text-white disabled:opacity-50">{working ? "Importing…" : `Import ${DUMMY_PACKAGES.length} packages`}</button>
    </section>}

    {(error || actionError) && <p role="alert" className="mt-5 rounded-cmt-control border border-cmt-error-500/20 bg-cmt-error-100 px-4 py-3 text-sm text-cmt-error-700">{actionError || error}</p>}

    <div className="mt-7 overflow-hidden rounded-cmt-md border border-cmt-neutral-200 bg-white shadow-cmt-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cmt-neutral-200 px-5 py-4">
        <p className="text-sm font-semibold">{loading ? "Loading packages…" : search ? `${filteredPackages.length} matching packages` : `${packages.length} packages · ${draftCount} draft${draftCount === 1 ? "" : "s"}`}</p>
        <label className="relative block w-full sm:w-80"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cmt-neutral-400" /><span className="sr-only">Search packages</span><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search packages…" className="h-10 w-full rounded-cmt-control border border-cmt-neutral-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-cmt-primary-500 focus:shadow-[var(--cmt-focus-ring)]" /></label>
      </div>
      <div className="divide-y divide-cmt-neutral-200">
        {visiblePackages.map((pkg) => <article key={pkg.id} className="grid gap-4 p-4 sm:grid-cols-[88px_minmax(0,1fr)_auto] sm:items-center sm:px-5">
          <div className="relative aspect-[4/3] overflow-hidden rounded-cmt-sm bg-cmt-neutral-100"><Image src={pkg.image} alt="" fill className="object-cover" /></div>
          <div className="min-w-0"><div className="flex items-center gap-2"><h2 className="truncate font-display text-base font-semibold">{pkg.title}</h2>{!isPublishedPackage(pkg) && <span className="shrink-0 rounded-full bg-cmt-neutral-200 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-cmt-neutral-700">Draft</span>}</div><p className="mt-1 truncate text-xs text-cmt-neutral-500">{pkg.location} · {pkg.nights}N/{pkg.days}D · ₹{pkg.price.toLocaleString("en-IN")}</p></div>
          <div className="flex gap-2"><button disabled={!databaseInitialized} title={!databaseInitialized ? "Import the existing catalogue first" : undefined} onClick={() => setEditing(pkg)} className="inline-flex h-9 items-center gap-1.5 rounded-cmt-control border border-cmt-neutral-200 px-3 text-xs font-semibold disabled:opacity-40"><Edit3 className="size-3.5" /> Edit</button><button disabled={working || !databaseInitialized} onClick={() => remove(pkg)} className="inline-flex h-9 items-center gap-1.5 rounded-cmt-control border border-cmt-error-500/30 px-3 text-xs font-semibold text-cmt-error-700 disabled:opacity-40"><Trash2 className="size-3.5" /> Delete</button></div>
        </article>)}
        {!loading && filteredPackages.length === 0 && <p className="p-8 text-center text-sm text-cmt-neutral-500">{search ? "No packages match your search." : "No packages yet. Create your first package."}</p>}
      </div>
      {!loading && filteredPackages.length > 0 && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-cmt-neutral-200 px-5 py-4"><p className="text-xs text-cmt-neutral-500">Page {currentPage} of {totalPages} · Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredPackages.length)} of {filteredPackages.length}</p><div className="flex gap-2"><button disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="inline-flex h-9 items-center gap-1.5 rounded-cmt-control border border-cmt-neutral-200 px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="size-3.5" /> Previous</button><button disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="inline-flex h-9 items-center gap-1.5 rounded-cmt-control bg-cmt-neutral-900 px-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Next <ChevronRight className="size-3.5" /></button></div></div>}
    </div>
  </div>;
}

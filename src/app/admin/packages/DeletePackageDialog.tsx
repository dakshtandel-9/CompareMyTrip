"use client";

import Image from "next/image";
import { LoaderCircle, Trash2, X } from "lucide-react";
import Modal from "@/components/Modal";
import { isPublishedPackage, type TravelPackage } from "@/lib/packageData";

export default function DeletePackageDialog({ packages, busy, onCancel, onConfirm }: {
  packages: TravelPackage[];
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return <Modal onClose={() => { if (!busy) onCancel(); }} labelledBy="delete-package-title"
    className="grid place-items-center overflow-y-auto bg-cmt-neutral-900/40 p-4 font-body backdrop:bg-transparent backdrop-blur-sm">
    <section aria-busy={busy} className="relative my-auto w-full max-w-[480px] overflow-hidden rounded-3xl border border-cmt-neutral-200 bg-white text-cmt-neutral-900 shadow-2xl">
      <div className="p-6 sm:p-8">
        <button type="button" onClick={onCancel} disabled={busy} aria-label="Close delete confirmation" className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-cmt-neutral-500 transition-colors hover:bg-cmt-neutral-100 focus-visible:outline-2 focus-visible:outline-cmt-primary-600 disabled:opacity-40"><X className="size-5" /></button>
        <div className="grid size-14 place-items-center rounded-2xl border border-red-100 bg-red-50 text-red-600"><Trash2 className="size-6" aria-hidden="true" /></div>
        <h2 id="delete-package-title" className="mt-5 font-display text-2xl font-semibold tracking-tight">{packages.length === 1 ? "Delete this package?" : `Delete ${packages.length} packages?`}</h2>
        <p className="mt-2 text-sm leading-6 text-cmt-neutral-600">{packages.some(isPublishedPackage) ? "Selected packages will be removed from your catalogue and will no longer appear on your website." : "Selected drafts will be permanently removed from your catalogue."}</p>
        <div className="mt-5 max-h-60 space-y-2 overflow-y-auto">{packages.map((pkg) => <div key={pkg.id} className="flex items-center gap-3 rounded-2xl border border-cmt-neutral-200 bg-cmt-neutral-50 p-3">
          {pkg.image && <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-cmt-neutral-200"><Image src={pkg.image} alt="" fill sizes="64px" className="object-cover" /></div>}
          <div className="min-w-0"><p className="break-words text-sm font-semibold leading-5">{pkg.title}</p><p className="mt-1 text-xs leading-5 text-cmt-neutral-500">{pkg.nights} nights · {pkg.days} days</p></div>
        </div>)}</div>
        <p className="mt-4 text-xs font-medium text-cmt-neutral-500">This action cannot be undone.</p>
      </div>
      <div className="flex flex-col-reverse gap-3 border-t border-cmt-neutral-100 bg-cmt-neutral-50/70 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
        <button type="button" data-modal-initial-focus onClick={onCancel} disabled={busy} className="inline-flex h-11 items-center justify-center rounded-xl border border-cmt-neutral-200 bg-white px-5 text-sm font-semibold transition-colors hover:bg-cmt-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-600 disabled:opacity-50">Cancel</button>
        <button type="button" onClick={onConfirm} disabled={busy} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-wait disabled:opacity-60">
          {busy ? <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}<span role="status">{busy ? "Deleting…" : packages.length === 1 ? "Delete package" : `Delete ${packages.length} packages`}</span>
        </button>
      </div>
    </section>
  </Modal>;
}

"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { Compass, ImageIcon, ImagePlus, MapPin, Search, Trash2 } from "lucide-react";

import { buildDestinations, durationLabel } from "@/lib/destinations";
import {
  clearDestinationCover,
  saveDestinationCover,
  uploadDestinationImage,
} from "@/lib/firebase/destinations";
import { deleteImageFromCloudflare } from "@/lib/cloudflareUpload";
import { useAuthUser } from "@/lib/firebase/useAuthUser";
import { useDestinationCoversState } from "@/lib/useDestinationCovers";
import { usePackagesState } from "@/lib/usePackages";

/* ------------------------------------------------------------------ */
/* Destination cover artwork. The rows are exactly the destinations that */
/* have packages — they cannot be created or deleted here, only dressed. */
/* Uploads go through the same route, limits and compression as package  */
/* photography, and each row saves the moment a file lands, so there is   */
/* no draft window and no orphaned-image bookkeeping to do.              */
/* ------------------------------------------------------------------ */

const formatINR = (value: number) => `₹${value.toLocaleString("en-IN")}`;

export default function AdminDestinationsManager() {
  const authUser = useAuthUser();
  const { packages, loading: packagesLoading } = usePackagesState();
  const { covers, loading: coversLoading, error: coversError } = useDestinationCoversState();

  const [search, setSearch] = useState("");
  const [busyName, setBusyName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const destinations = useMemo(() => buildDestinations(packages, covers), [covers, packages]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return destinations;
    return destinations.filter((destination) => destination.name.toLowerCase().includes(needle));
  }, [destinations, search]);

  const withCover = destinations.filter((destination) => destination.cover).length;

  const isLoading = authUser === undefined || (authUser !== null && (packagesLoading || coversLoading));
  const displayError =
    authUser === null ? "Sign in to your CRM account to manage destinations." : error || coversError;

  /* Same guards as the package builder before anything leaves the browser. */
  const handleUpload = async (name: string, previousCover: string, files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setError("");
    setMessage("");
    if (!file.type.startsWith("image/")) return setError("Please choose an image file.");
    if (file.size > 5_000_000) return setError("Each image must be 5 MB or smaller.");

    setBusyName(name);
    try {
      const url = await uploadDestinationImage(file);
      await saveDestinationCover(name, url);
      setMessage(`${name} cover updated.`);
      /* Best effort: the cover is already saved, so a bucket object that
         outlives its reference is untidy but never breaks the page. */
      if (previousCover.startsWith("http")) {
        void deleteImageFromCloudflare(previousCover).catch(() => {});
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That image could not be uploaded.");
    } finally {
      setBusyName("");
    }
  };

  const handleClear = async (name: string, cover: string) => {
    if (!window.confirm(`Remove the custom cover for ${name}? The card falls back to a package photo.`)) {
      return;
    }
    setError("");
    setMessage("");
    setBusyName(name);
    try {
      await clearDestinationCover(name);
      setMessage(`${name} is using a package photo again.`);
      if (cover.startsWith("http")) {
        void deleteImageFromCloudflare(cover).catch(() => {});
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The cover could not be removed.");
    } finally {
      setBusyName("");
    }
  };

  return (
    <div className="font-body text-cmt-neutral-900">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cmt-primary-700">
            Cover artwork
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Destinations
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-cmt-neutral-600">
            Every destination that has at least one package. Set the cover photo
            shown on the public destinations page — the list itself comes from
            your packages, so add a package to add a destination.
          </p>
        </div>
        <div className="flex min-w-[190px] items-center gap-3 rounded-cmt-md border border-cmt-neutral-200 bg-white px-4 py-3 shadow-cmt-xs">
          <span className="grid size-10 place-items-center rounded-cmt-full bg-cmt-primary-50 text-cmt-primary-900">
            <Compass className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-display text-2xl font-semibold tabular-nums">
              {isLoading ? "—" : `${withCover}/${destinations.length}`}
            </p>
            <p className="text-xs text-cmt-neutral-500">Custom covers set</p>
          </div>
        </div>
      </header>

      {displayError ? (
        <p
          role="alert"
          className="mt-6 rounded-cmt-control border border-cmt-error-500/20 bg-cmt-error-100 px-4 py-3 text-sm text-cmt-error-700"
        >
          {displayError}
        </p>
      ) : null}

      {message && !displayError ? (
        <p className="mt-6 rounded-cmt-control border border-cmt-success-500/20 bg-cmt-success-100 px-4 py-3 text-sm text-cmt-success-700">
          {message}
        </p>
      ) : null}

      <section className="mt-7 overflow-hidden rounded-cmt-md border border-cmt-neutral-200 bg-white shadow-cmt-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cmt-neutral-200 px-5 py-4">
          <p className="text-sm font-semibold">
            {isLoading
              ? "Loading destinations…"
              : `${visible.length} ${visible.length === 1 ? "destination" : "destinations"}`}
          </p>
          <label className="relative w-full sm:w-72">
            <span className="sr-only">Search destinations</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cmt-neutral-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search destinations"
              className="h-10 w-full rounded-cmt-control border border-cmt-neutral-200 bg-cmt-neutral-50 pl-9 pr-3 text-sm outline-none focus:border-cmt-primary-500 focus:ring-2 focus:ring-cmt-primary-500/20"
            />
          </label>
        </div>

        <div className="divide-y divide-cmt-neutral-200">
          {visible.map((destination) => (
            <DestinationRow
              key={destination.name}
              name={destination.name}
              region={destination.region}
              count={destination.count}
              duration={durationLabel(destination)}
              fromPrice={destination.fromPrice}
              cover={destination.cover}
              image={destination.image}
              busy={busyName === destination.name}
              disabled={authUser === null}
              onUpload={(files) => void handleUpload(destination.name, destination.cover, files)}
              onClear={() => void handleClear(destination.name, destination.cover)}
            />
          ))}

          {!isLoading && !displayError && visible.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Compass className="mx-auto size-8 text-cmt-neutral-300" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold">
                {destinations.length ? "No destination matches your search" : "No destinations yet"}
              </p>
              <p className="mt-1 text-xs text-cmt-neutral-500">
                {destinations.length
                  ? "Try another spelling."
                  : "Destinations appear here as soon as a package is filed under one."}
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function DestinationRow({
  name,
  region,
  count,
  duration,
  fromPrice,
  cover,
  image,
  busy,
  disabled,
  onUpload,
  onClear,
}: {
  name: string;
  region: string;
  count: number;
  duration: string;
  fromPrice: number;
  cover: string;
  image: string;
  busy: boolean;
  disabled: boolean;
  onUpload: (files: FileList | null) => void;
  onClear: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  /* Uploads land on R2 and imported photography on Supabase; both are remote,
     so the optimiser is bypassed exactly as the CRM's other pickers do. */
  const remote = /^https?:\/\//i.test(image);

  return (
    <article className="flex flex-wrap items-center gap-4 px-5 py-4">
      <div className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-cmt-sm border border-cmt-neutral-200 bg-cmt-neutral-100">
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            sizes="112px"
            unoptimized={remote}
            className="object-cover"
          />
        ) : (
          <span className="grid size-full place-items-center text-cmt-neutral-400">
            <ImageIcon className="size-5" aria-hidden="true" />
          </span>
        )}
      </div>

      <div className="min-w-[180px] flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-base font-semibold">{name}</h2>
          <span className="inline-flex items-center gap-1 rounded-cmt-full border border-cmt-neutral-200 bg-cmt-neutral-50 px-2 py-0.5 text-[11px] font-medium text-cmt-neutral-600">
            <MapPin className="size-3" aria-hidden="true" />
            {region}
          </span>
          <span
            className={`rounded-cmt-full border px-2 py-0.5 text-[11px] font-semibold ${
              cover
                ? "border-cmt-success-500/30 bg-cmt-success-100 text-cmt-success-700"
                : "border-cmt-neutral-200 bg-cmt-neutral-50 text-cmt-neutral-500"
            }`}
          >
            {cover ? "Custom cover" : "Package photo"}
          </span>
        </div>
        <p className="mt-1 text-xs text-cmt-neutral-500">
          <span className="tabular-nums">{count}</span> {count === 1 ? "package" : "packages"}
          {duration ? ` · ${duration}` : ""} · from{" "}
          <span className="tabular-nums">{formatINR(fromPrice)}</span>
        </p>
        <p className="mt-1 text-[11px] text-cmt-neutral-400">
          Up to 5 MB · files under 800 KB stay unchanged · larger files use 70% quality
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy || disabled}
          className="inline-flex h-9 items-center gap-1.5 rounded-cmt-control border border-cmt-neutral-200 bg-white px-3 text-xs font-semibold text-cmt-neutral-700 transition-colors hover:bg-cmt-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ImagePlus className="size-3.5" aria-hidden="true" />
          {busy ? "Uploading…" : cover ? "Replace cover" : "Upload cover"}
        </button>

        {cover ? (
          <button
            type="button"
            onClick={onClear}
            disabled={busy || disabled}
            className="inline-flex h-9 items-center gap-1.5 rounded-cmt-control border border-cmt-neutral-200 bg-white px-3 text-xs font-semibold text-cmt-neutral-600 transition-colors hover:border-cmt-error-500/40 hover:bg-cmt-error-100 hover:text-cmt-error-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            Remove
          </button>
        ) : null}

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(event) => {
            onUpload(event.target.files);
            event.target.value = "";
          }}
        />
      </div>
    </article>
  );
}

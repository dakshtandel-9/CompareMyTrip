"use client";

import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import type { TravelPackage } from "@/lib/packageData";

export default function ItineraryDownloadButton({ pkg }: { pkg: TravelPackage }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  async function downloadItinerary() {
    setDownloading(true);
    setError("");
    try {
      // Load the PDF library only when a traveller asks for a download.
      const { createPackageItineraryPdf, itineraryFilename } = await import("@/lib/packageItineraryPdf");
      const url = new URL(window.location.pathname, window.location.origin).href;
      const pdf = createPackageItineraryPdf(pkg, url);
      await pdf.save(itineraryFilename(pkg.title), { returnPromise: true });
    } catch {
      setError("Could not download the itinerary. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex max-w-full flex-col items-start gap-2">
      <button
        type="button"
        onClick={downloadItinerary}
        disabled={downloading}
        aria-busy={downloading}
        className="inline-flex h-11 shrink-0 items-center gap-2 rounded-cmt-control border border-cmt-neutral-200 bg-white px-4 text-sm font-semibold shadow-cmt-xs transition-colors hover:bg-cmt-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 disabled:opacity-60"
      >
        {downloading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Download className="size-4" aria-hidden="true" />}
        {downloading ? "Preparing PDF..." : "Itinerary Download"}
      </button>
      {error && <p role="alert" className="max-w-56 text-xs text-cmt-coral-700">{error}</p>}
    </div>
  );
}

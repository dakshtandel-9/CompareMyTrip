"use client";

import { useEffect, useState } from "react";
import { Check, Share2 } from "lucide-react";

export default function PackageShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function sharePackage() {
    setSharing(true);
    setCopied(false);
    const url = new URL(window.location.pathname, window.location.origin).href;

    try {
      if (navigator.share) {
        try {
          await navigator.share({ title, url });
          return;
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") return;
        }
      }

      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      } catch {
        window.prompt("Copy this link to share the package:", url);
      }
    } finally {
      setSharing(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={sharePackage}
        disabled={sharing}
        className="inline-flex h-11 shrink-0 items-center gap-2 rounded-cmt-control border border-cmt-neutral-200 bg-white px-4 text-sm font-semibold shadow-cmt-xs transition-colors hover:bg-cmt-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500 disabled:opacity-60"
      >
        {copied ? <Check className="size-4" aria-hidden="true" /> : <Share2 className="size-4" aria-hidden="true" />}
        {copied ? "Link copied" : "Share"}
      </button>
      <span role="status" className="sr-only">{copied ? "Package link copied to clipboard." : ""}</span>
    </>
  );
}

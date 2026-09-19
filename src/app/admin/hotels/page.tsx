import type { Metadata } from "next";
import { Suspense } from "react";
import AdminPackagesManager from "../packages/AdminPackagesManager";

export const metadata: Metadata = {
  title: "Hotels",
  description: "Create, edit and publish hotels with the package editor.",
};

export default function AdminHotelsPage() {
  return <Suspense fallback={<p role="status" className="p-6 text-sm text-cmt-neutral-500">Loading hotels…</p>}><AdminPackagesManager collection="hotels" /></Suspense>;
}

import type { Metadata } from "next";
import { Suspense } from "react";
import AdminPackagesManager from "../packages/AdminPackagesManager";

export const metadata: Metadata = {
  title: "Cruises",
  description: "Create, edit and publish cruises with the package editor.",
};

export default function AdminCruisesPage() {
  return <Suspense fallback={<p role="status" className="p-6 text-sm text-cmt-neutral-500">Loading cruises…</p>}><AdminPackagesManager collection="cruise" /></Suspense>;
}

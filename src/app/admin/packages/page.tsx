import type { Metadata } from "next";
import { Suspense } from "react";
import AdminPackagesManager from "./AdminPackagesManager";

export const metadata: Metadata = {
  title: "Packages",
  description: "Create, edit and publish travel packages.",
};

export default function AdminPackagesPage() {
  return <Suspense fallback={<p role="status" className="p-6 text-sm text-cmt-neutral-500">Loading packages…</p>}><AdminPackagesManager /></Suspense>;
}

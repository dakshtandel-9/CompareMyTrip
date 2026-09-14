import type { Metadata } from "next";
import { Suspense } from "react";
import AdminBlogManager from "./AdminBlogManager";

export const metadata: Metadata = {
  title: "Blog",
  description: "Write, edit and publish travel guide articles.",
};

export default function AdminBlogPage() {
  return <Suspense fallback={<p role="status" className="p-6 text-sm text-cmt-neutral-500">Loading blog…</p>}><AdminBlogManager /></Suspense>;
}

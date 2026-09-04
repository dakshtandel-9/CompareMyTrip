import type { Metadata } from "next";
import AdminBlogManager from "./AdminBlogManager";

export const metadata: Metadata = {
  title: "Blog",
  description: "Write, edit and publish travel guide articles.",
};

export default function AdminBlogPage() {
  return <AdminBlogManager />;
}

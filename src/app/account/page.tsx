import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AccountClient from "./AccountClient";

export const metadata: Metadata = {
  title: "My Account | CompareMyTrip",
  description: "Manage your CompareMyTrip profile and password.",
};

export default function AccountPage() {
  return <><Header /><main className="min-h-[calc(100vh-4rem)] bg-cmt-neutral-50"><AccountClient /></main><Footer /></>;
}

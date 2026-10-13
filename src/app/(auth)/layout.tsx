import type { Metadata } from "next";
import PageSiteContent from "@/components/PageSiteContent";
import RequireGuest from "./_components/RequireGuest";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-body">
      {/* The sign-in pages are client components; their copy is published here. */}
      <PageSiteContent sections={["auth"]}>
        <RequireGuest>{children}</RequireGuest>
      </PageSiteContent>
    </div>
  );
}

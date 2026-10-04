import type { Metadata } from "next";
import AdminShell from "./_components/AdminShell";
import AdminAccessGate from "./_components/AdminAccessGate";
import { LiveSiteContent } from "@/components/SiteContentProvider";

export const metadata: Metadata = {
  title: {
    default: "CompareMyTrip Admin",
    template: "%s | CompareMyTrip Admin",
  },
  robots: { index: false, follow: false, noarchive: true },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  /* The editors read and write the live document, never the server copy. */
  return (
    <LiveSiteContent>
      <AdminAccessGate>
        <AdminShell>{children}</AdminShell>
      </AdminAccessGate>
    </LiveSiteContent>
  );
}

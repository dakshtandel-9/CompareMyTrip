import type { Metadata } from "next";
import AdminShell from "./_components/AdminShell";
import AdminAccessGate from "./_components/AdminAccessGate";

export const metadata: Metadata = {
  title: {
    default: "CompareMyTrip CRM",
    template: "%s | CompareMyTrip CRM",
  },
  robots: { index: false, follow: false, noarchive: true },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <AdminAccessGate>
      <AdminShell>{children}</AdminShell>
    </AdminAccessGate>
  );
}

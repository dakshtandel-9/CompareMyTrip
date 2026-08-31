import AdminShell from "./_components/AdminShell";
import AdminAccessGate from "./_components/AdminAccessGate";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <AdminAccessGate>
      <AdminShell>{children}</AdminShell>
    </AdminAccessGate>
  );
}

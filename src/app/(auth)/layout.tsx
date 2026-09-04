import type { Metadata } from "next";
import RequireGuest from "./_components/RequireGuest";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-body">
      <RequireGuest>{children}</RequireGuest>
    </div>
  );
}

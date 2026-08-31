import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import RequireGuest from "./_components/RequireGuest";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CompareMyTrip",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${spaceGrotesk.variable} ${inter.variable} font-body`}>
      <RequireGuest>{children}</RequireGuest>
    </div>
  );
}

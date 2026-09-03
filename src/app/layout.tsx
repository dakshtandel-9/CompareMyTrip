import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import WebsiteLoader from "@/components/WebsiteLoader";
import ProfileCompletionGate from "@/components/ProfileCompletionGate";
import AuthPromptDialog from "@/components/AuthPromptDialog";
import FloatingActions from "@/components/FloatingActions";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CompareMyTrip",
  description: "Find and compare the best trips, all in one place.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white">
        <WebsiteLoader autoDismiss />
        <ProfileCompletionGate>{children}</ProfileCompletionGate>
        {/* Mounted beside the gate, not inside it: the two never coincide —
            that one prompts signed-in users, this one signed-out visitors —
            and living in the root layout is what keeps this timer tied to a
            document load rather than to route changes. */}
        <AuthPromptDialog />
        {/* Rides along on every page and hides itself on the handful that
            own the whole screen — see the component. */}
        <FloatingActions />
      </body>
    </html>
  );
}

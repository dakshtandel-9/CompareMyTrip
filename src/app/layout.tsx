import type { Metadata } from "next";
import MobileNavigation from "@/components/MobileNavigation";
import { Inter, Space_Grotesk } from "next/font/google";
import WebsiteLoader from "@/components/WebsiteLoader";
import ProfileCompletionGate from "@/components/ProfileCompletionGate";
import TripPlanPromptDialog from "@/components/TripPlanPromptDialog";
import FloatingActions from "@/components/FloatingActions";
import JsonLd from "@/components/JsonLd";
import Analytics from "@/components/Analytics";
import {
  absoluteUrl,
  DEFAULT_DESCRIPTION,
  getSiteUrl,
  SITE_NAME,
} from "@/lib/seo";
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
  metadataBase: getSiteUrl(),
  title: {
    default: "Compare Travel Packages | CompareMyTrip",
    template: "%s | CompareMyTrip",
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  category: "travel",
  referrer: "origin-when-cross-origin",
  formatDetection: { email: false, address: false, telephone: false },
  icons: { icon: "/comparemytrip-logo.png" },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: SITE_NAME,
    title: "Compare Travel Packages | CompareMyTrip",
    description: DEFAULT_DESCRIPTION,
    url: absoluteUrl("/"),
    images: [
      {
        url: "/images/destinations-header-banner.jpg",
        width: 1983,
        height: 793,
        alt: "Mountain landscape featured by CompareMyTrip",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Compare Travel Packages | CompareMyTrip",
    description: DEFAULT_DESCRIPTION,
    images: ["/images/destinations-header-banner.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": absoluteUrl("/#organization"),
                name: SITE_NAME,
                url: absoluteUrl("/"),
                logo: absoluteUrl("/comparemytrip-logo.png"),
              },
              {
                "@type": "WebSite",
                "@id": absoluteUrl("/#website"),
                name: SITE_NAME,
                url: absoluteUrl("/"),
                description: DEFAULT_DESCRIPTION,
                publisher: { "@id": absoluteUrl("/#organization") },
                inLanguage: "en-IN",
              },
            ],
          }}
        />
        <Analytics />
        <WebsiteLoader autoDismiss />
        <ProfileCompletionGate>{children}</ProfileCompletionGate>
        {/* Mounted beside the gate, not inside it: living in the root layout
            is what keeps this timer tied to a document load rather than to
            route changes. It captures trip leads rather than sign-ins — the
            account flows stay on /login and /signup. */}
        <TripPlanPromptDialog />
        {/* Rides along on every page and hides itself on the handful that
            own the whole screen — see the component. */}
        <FloatingActions />
        <MobileNavigation />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import SiteExperience from "@/components/SiteExperience";
import SiteContentProvider from "@/components/SiteContentProvider";
import SiteReadySignal from "@/components/SiteReadySignal";
import ImageLookahead from "@/components/ImageLookahead";
import { ImageRevealScript } from "@/components/SiteImage";
import JsonLd from "@/components/JsonLd";
import Analytics from "@/components/Analytics";
import {
  absoluteUrl,
  DEFAULT_DESCRIPTION,
  getSiteUrl,
  SITE_NAME,
} from "@/lib/seo";
import { getPublishedSiteContent } from "@/lib/serverSiteContent";
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

// Keep the phone layout at device width during scrolling. No maximum scale
// is set, so users can still pinch to zoom in.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: "Treks, Getaways & Holiday Packages | CompareMyTrip",
    template: "%s | CompareMyTrip",
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  category: "travel",
  referrer: "origin-when-cross-origin",
  formatDetection: { email: false, address: false, telephone: false },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: SITE_NAME,
    title: "Treks, Getaways & Holiday Packages | CompareMyTrip",
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
    title: "Treks, Getaways & Holiday Packages | CompareMyTrip",
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

export default async function RootLayout({ children }: LayoutProps<"/">) {
  /* Published once per revalidation and shared by every page, so the header,
     banners and forms paint with real content. Should the read fail, the
     pages fall back to the live Firestore listener as before. */
  const site = await getPublishedSiteContent().catch(() => null);
  const experience = <SiteExperience>{children}</SiteExperience>;
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
      /* ImageRevealScript flags <html> before React hydrates. */
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-white">
        <ImageRevealScript />
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
                description: DEFAULT_DESCRIPTION,
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
        <SiteReadySignal />
        <ImageLookahead />
        {site ? <SiteContentProvider site={site}>{experience}</SiteContentProvider> : experience}
      </body>
    </html>
  );
}

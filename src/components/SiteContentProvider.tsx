"use client";

import { useMemo } from "react";
import { SiteContentContext } from "@/lib/useSiteContent";
import type { SiteContent } from "@/lib/siteContent";

/** The published site content, read on the server, for every page under it. */
export default function SiteContentProvider({ site, children }: {
  site: { content: SiteContent; exists: boolean };
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ ...site, loading: false, error: "" }), [site]);
  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

/** For editors of the document itself: drops the server copy, which can lag
    a publish, in favour of the live Firestore listener. */
export function LiveSiteContent({ children }: { children: React.ReactNode }) {
  return <SiteContentContext.Provider value={null}>{children}</SiteContentContext.Provider>;
}

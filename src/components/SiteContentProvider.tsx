"use client";

import { useContext, useMemo } from "react";
import { SiteContentContext } from "@/lib/useSiteContent";
import { DEFAULT_SITE_CONTENT, type SiteContent } from "@/lib/siteContent";

/** Published site content, read on the server. The root layout provides the
    site-wide sections and a page nests its own beneath them, so each page
    carries only the sections it renders. */
export default function SiteContentProvider({ site, children }: {
  site: { content: Partial<SiteContent>; exists: boolean };
  children: React.ReactNode;
}) {
  const parent = useContext(SiteContentContext);
  const value = useMemo(() => ({
    content: { ...(parent?.content ?? DEFAULT_SITE_CONTENT), ...site.content },
    exists: site.exists,
    loading: false,
    error: "",
    sections: [...(parent?.sections ?? []), ...(Object.keys(site.content) as (keyof SiteContent)[])],
  }), [parent, site]);
  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

/** For editors of the document itself: drops the server copy, which can lag
    a publish, in favour of the live Firestore listener. */
export function LiveSiteContent({ children }: { children: React.ReactNode }) {
  return <SiteContentContext.Provider value={null}>{children}</SiteContentContext.Provider>;
}

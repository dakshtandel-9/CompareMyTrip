"use client";

import { useEffect, useMemo } from "react";
import type { TravelPackage } from "@/lib/packageData";
import type { BlogPost } from "@/lib/blogData";
import type { SiteContent } from "@/lib/siteContent";
import { PublicContentContext, seedPublicContent } from "@/lib/usePublicContent";
import { SiteContentContext } from "@/lib/useSiteContent";

export default function HomeContentProvider({ packages, posts, site, children }: {
  packages: TravelPackage[];
  posts: BlogPost[];
  site: { content: SiteContent; exists: boolean };
  children: React.ReactNode;
}) {
  const catalogue = useMemo(() => ({ packages, posts, loading: false, error: "" }), [packages, posts]);
  useEffect(() => seedPublicContent(catalogue), [catalogue]);
  const content = useMemo(() => ({ ...site, loading: false, error: "" }), [site]);
  return <PublicContentContext.Provider value={catalogue}>
    <SiteContentContext.Provider value={content}>{children}</SiteContentContext.Provider>
  </PublicContentContext.Provider>;
}

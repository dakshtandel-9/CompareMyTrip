"use client";

import { useEffect, useMemo } from "react";
import type { TravelPackage } from "@/lib/packageData";
import type { BlogPost } from "@/lib/blogData";
import { PublicContentContext, seedPublicContent } from "@/lib/usePublicContent";

export default function HomeContentProvider({ packages, posts, children }: {
  packages: TravelPackage[];
  posts: BlogPost[];
  children: React.ReactNode;
}) {
  const catalogue = useMemo(() => ({ packages, posts, loading: false, error: "" }), [packages, posts]);
  useEffect(() => seedPublicContent(catalogue), [catalogue]);
  return <PublicContentContext.Provider value={catalogue}>{children}</PublicContentContext.Provider>;
}

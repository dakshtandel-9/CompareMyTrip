import type { SiteContent } from "@/lib/siteContent";

/* What a CRM publish can change. Each server read of public content is
   tagged with the scope it belongs to, so a publish refreshes only the pages
   that show what changed: a blog post no longer regenerates every package
   page, and a homepage section only the pages that render that section.
   The hosting plan charges for every regenerated page that is written, and
   the whole site is 170-odd pages. */
export const CONTENT_SCOPES = ["site", "packages", "blog", "cruises", "destinations"] as const;
export type ContentScope = (typeof CONTENT_SCOPES)[number];

/** On every public read as well, so an unscoped refresh still reaches everything. */
export const PUBLIC_CONTENT_TAG = "public-content";

export const siteSectionTag = (section: keyof SiteContent) => `site:${section}`;

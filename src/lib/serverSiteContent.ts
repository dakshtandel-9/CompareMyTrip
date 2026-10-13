import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getAdminDb } from "@/lib/firebase/admin";
import { PUBLIC_CONTENT_TAG, siteSectionTag } from "@/lib/contentScopes";
import { DEFAULT_SITE_CONTENT, normalizeSiteContent, type SiteContent } from "@/lib/siteContent";

export type SiteSection = keyof SiteContent;
export type PublishedSiteSections = { content: Partial<SiteContent>; exists: boolean };

/** What every page renders: the header, the footer and the coming-soon switch.
    The root layout publishes these; a page adds its own with PageSiteContent. */
export const SITE_WIDE_SECTIONS = ["header", "contact", "footerBadges", "comingSoon"] as const satisfies readonly SiteSection[];

async function readSiteContent() {
  const db = getAdminDb();
  if (!db) return { content: DEFAULT_SITE_CONTENT, exists: false };
  const snapshot = await db.collection("siteContent").doc("homepage").get();
  return { content: normalizeSiteContent(snapshot.data()?.content), exists: snapshot.exists };
}

/* A page's output contains every section it is handed, so handing every page
   the whole document made one FAQ edit rewrite all of them. Each distinct set
   of sections is cached on its own and tagged per section, so publishing a
   section regenerates only the pages that show it. The week is a backstop;
   publishing from the CRM expires the tags at once. */
const readSections = cache((key: string) => {
  const sections = key.split(",") as SiteSection[];
  return unstable_cache(async (): Promise<PublishedSiteSections> => {
    const site = await readSiteContent();
    const content: Partial<Record<SiteSection, unknown>> = {};
    for (const section of sections) content[section] = site.content[section];
    return { content: content as Partial<SiteContent>, exists: site.exists };
  }, ["published-site-sections-v1", key], { revalidate: 604800, tags: [PUBLIC_CONTENT_TAG, ...sections.map(siteSectionTag)] })();
});

export function getPublishedSiteSections(sections: readonly SiteSection[]) {
  return readSections([...new Set(sections)].sort().join(","));
}

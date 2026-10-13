import SiteContentProvider, { LiveSiteContent } from "@/components/SiteContentProvider";
import { getPublishedSiteSections, type SiteSection } from "@/lib/serverSiteContent";

/** Publishes the site-content sections only this page renders, on top of the
    site-wide ones from the root layout. List every section the page's
    components read: the rest keep their defaults (development logs which). */
export default async function PageSiteContent({ sections, children }: {
  sections: readonly SiteSection[];
  children: React.ReactNode;
}) {
  const site = await getPublishedSiteSections(sections).catch(() => null);
  /* Should the read fail, the page falls back to the live Firestore listener
     instead of painting default copy, as the whole site did before. */
  return site
    ? <SiteContentProvider site={site}>{children}</SiteContentProvider>
    : <LiveSiteContent>{children}</LiveSiteContent>;
}

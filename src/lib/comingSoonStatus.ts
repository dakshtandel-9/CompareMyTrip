"use client";

import { useContext } from "react";
import { SiteContentContext } from "@/lib/useSiteContent";

/* Whether coming-soon mode is on, as published into this page. The switch is
   one of the site-wide sections the root layout renders into every page, so
   publishing it regenerates every page and no request is made to find out.
   It used to be read on every request, which cost a server call per page view
   and closed the website when that call failed on a freshly started server.

   A page rendered without the server copy (a failed read) stays open rather
   than closing the website over an outage. */
export function useComingSoonStatus(): boolean | undefined {
  return useContext(SiteContentContext)?.content.comingSoon.enabled;
}

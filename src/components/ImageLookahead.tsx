"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { onSiteReady } from "@/lib/siteReady";

/* Homepage bands and listing cards skip rendering until they come near the
   viewport (content-visibility in globals.css), and the lazy photos inside
   wait with them: left alone, they only start downloading as they scroll into
   view, and arrive one by one. Once the page has finished loading, so nothing
   competes with the first screen or the hero video, this starts each band's
   photos about a screen and a half before the band arrives. Cards are watched
   one at a time, so a long catalogue is never fetched all at once. Visitors
   who ask to save data keep plain lazy loading. */
const LOOK_AHEAD = ".cmt-home > section, .cmt-footer, .cmt-offscreen-card, .cmt-catalog-card";

export default function ImageLookahead() {
  const pathname = usePathname();

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (connection?.saveData || window.matchMedia("(prefers-reduced-data: reduce)").matches) return;

    let observer: IntersectionObserver | undefined;
    const stopWaiting = onSiteReady(() => {
      observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer?.unobserve(entry.target);
          entry.target.querySelectorAll<HTMLImageElement>('img[loading="lazy"]').forEach((image) => {
            image.loading = "eager";
          });
        }
      }, { rootMargin: "150% 0px" });
      document.querySelectorAll(LOOK_AHEAD).forEach((band) => observer?.observe(band));
    });
    return () => {
      stopWaiting();
      observer?.disconnect();
    };
  }, [pathname]);

  return null;
}

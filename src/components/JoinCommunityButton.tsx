"use client";

import { ArrowUpRight } from "lucide-react";
import WhatsAppMark from "@/components/WhatsAppMark";
import { useSiteContent } from "@/lib/useSiteContent";

/* The footer's "Join community" invite. A client component for the same
   reason TrustStrip is one: the link is edited in /admin/content → Footer
   badges, and the footer itself is a server component.

   Renders nothing until an invite URL is saved, so the button never ships
   pointing nowhere. siteContent only keeps http(s) URLs, so what arrives
   here is already safe to put in an href. */

export default function JoinCommunityButton() {
  const { footerBadges } = useSiteContent();
  const url = footerBadges.communityUrl?.trim();
  if (!url) return null;

  const label = footerBadges.communityLabel?.trim() || "Join WhatsApp community";

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      /* h-11 to match the platform tiles it sits beside; the row that holds
         them owns the spacing, so there is no margin here. */
      className="inline-flex h-11 items-center gap-2 rounded-cmt-sm border border-cmt-neutral-200 bg-white px-4 text-sm font-semibold text-cmt-neutral-900 transition-colors duration-150 hover:border-cmt-primary-500 hover:bg-cmt-primary-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
    >
      <WhatsAppMark className="h-4 w-4 text-[#25D366]" />
      {label}
      <ArrowUpRight className="h-4 w-4 text-cmt-neutral-500" aria-hidden="true" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, Compass, House, Luggage, UserRound } from "lucide-react";
import { useCompare } from "@/lib/useCompare";

const items = [
  { href: "/", label: "Home", icon: House },
  { href: "/destinations", label: "Explore", icon: Compass },
  { href: "/packages", label: "Packages", icon: Luggage },
  { href: "/compare", label: "Compare", icon: ArrowLeftRight },
  { href: "/account", label: "My trips", icon: UserRound },
];

export default function MobileNavigation() {
  const pathname = usePathname();
  const { count } = useCompare();
  // Detail pages have their own booking dock; focused forms own their screen.
  if (/^\/(admin|checkout|login|signup|forgot-password)(\/|$)/.test(pathname) || pathname.startsWith("/packages/")) return null;

  return (
    <nav aria-label="Phone navigation" className="cmt-mobile-nav md:hidden">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === href : pathname.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className="cmt-mobile-nav-link">
            <span className="relative inline-flex"><Icon size={20} strokeWidth={active ? 2.4 : 1.8} aria-hidden="true" />
              {href === "/compare" && count > 0 && <span className="cmt-mobile-nav-count" aria-label={`${count} shortlisted`}>{count}</span>}
            </span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

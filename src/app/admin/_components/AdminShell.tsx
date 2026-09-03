"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Compass,
  ExternalLink,
  LayoutDashboard,
  type LucideIcon,
  Menu,
  Mail,
  MessageSquareText,
  MessagesSquare,
  Newspaper,
  PackageSearch,
  PanelsTopLeft,
  Plane,
  TicketPercent,
  Users,
  X,
} from "lucide-react";

type NavItem = { href: string; label: string; hint: string; icon: LucideIcon };

/* Only routes that exist. A CRM sidebar full of dead links is worse than a
   short one — new sections get added here as they are built. */
const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", hint: "Overview", icon: LayoutDashboard },
  { href: "/admin/content", label: "Website content", hint: "Every page's copy and images", icon: PanelsTopLeft },
  { href: "/admin/packages", label: "Packages", hint: "Create inventory", icon: PackageSearch },
  { href: "/admin/trips", label: "Trips", hint: "Paid bookings", icon: Plane },
  { href: "/admin/coupons", label: "Coupons", hint: "Discount codes", icon: TicketPercent },
  { href: "/admin/destinations", label: "Destinations", hint: "Cover artwork", icon: Compass },
  { href: "/admin/blog", label: "Blog", hint: "Travel guides", icon: Newspaper },
  { href: "/admin/users", label: "Users", hint: "Registered customers", icon: Users },
  { href: "/admin/subscribers", label: "Subscribers", hint: "Newsletter sign-ups", icon: Mail },
  { href: "/admin/enquiries", label: "Contact enquiries", hint: "Contact Us form", icon: MessageSquareText },
  { href: "/admin/package-enquiries", label: "Package quotes", hint: "Customized requests", icon: MessagesSquare },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const nav = (
    <nav className="space-y-1">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMenuOpen(false)}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-cmt-control px-3 py-2.5 transition-colors ${
              active
                ? "bg-cmt-primary-500 text-cmt-neutral-900"
                : "text-cmt-neutral-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon className="size-[18px] shrink-0" strokeWidth={2} aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-sm font-semibold leading-tight">{item.label}</span>
              <span
                className={`block text-[11px] leading-tight ${
                  active ? "text-cmt-neutral-900/60" : "text-cmt-neutral-500"
                }`}
              >
                {item.hint}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );

  const sidebarBody = (
    <>
      <p className="shrink-0 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-cmt-neutral-500">
        Manage
      </p>
      <div className="mt-2 min-h-0 flex-1 overflow-y-auto">{nav}</div>

      <Link
        href="/"
        className="mt-4 flex shrink-0 items-center justify-center gap-2 rounded-cmt-control border border-white/15 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
      >
        <ExternalLink className="size-4" /> View live site
      </Link>
    </>
  );

  return (
    <div className="min-h-screen bg-cmt-neutral-50 font-body text-cmt-neutral-900">
      {/* Desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col bg-cmt-secondary-900 px-4 py-6 lg:flex">
        {sidebarBody}
      </aside>

      {/* Mobile drawer over the same markup, so the two never drift apart */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-cmt-neutral-900/50"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[268px] flex-col bg-cmt-secondary-900 px-4 py-6">
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-4 grid size-9 place-items-center rounded-cmt-control text-white/70 hover:bg-white/10"
            >
              <X className="size-4" />
            </button>
            {sidebarBody}
          </aside>
        </div>
      )}

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-cmt-neutral-200 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="grid size-10 shrink-0 place-items-center rounded-cmt-control border border-cmt-neutral-200 lg:hidden"
          >
            <Menu className="size-4" />
          </button>

          <p className="min-w-0 flex-1 truncate font-display text-sm font-semibold text-cmt-neutral-900">
            {NAV.find((item) => isActive(item.href))?.label ?? "Admin"}
          </p>

          <span className="hidden items-center gap-2 rounded-cmt-full bg-cmt-primary-50 px-3 py-1.5 text-[11px] font-semibold text-cmt-primary-900 sm:inline-flex">
            <span className="size-1.5 rounded-cmt-full bg-cmt-primary-600" />
            Content synced with Firebase
          </span>
        </header>

        <main className="mx-auto w-full max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}

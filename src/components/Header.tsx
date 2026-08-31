"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "firebase/auth";
import {
  Menu,
  X,
  User as UserIcon,
  ChevronDown,
  LogOut,
  ArrowRight,
} from "lucide-react";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { useAuthUser } from "@/lib/firebase/useAuthUser";

type NavChild = { label: string; href: string };

type NavItem = {
  label: string;
  href?: string;
  children?: NavChild[];
};

const navItems: NavItem[] = [
  { label: "Destinations", href: "/destinations" },
  { label: "Weekend Treks", href: "/packages?category=Weekend%20Treks" },
  { label: "Domestic Tours", href: "/packages?region=india" },
  { label: "International Holidays", href: "/packages?region=international" },
  { label: "Deals", href: "/packages?deals=1" },
  { label: "Travel Guides", href: "/blog" },
];

export default function Header() {
  const user = useAuthUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [expandedMobileItem, setExpandedMobileItem] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  const headerRef = useRef<HTMLElement>(null);

  // ---- Scroll: sticky shadow + hide-on-scroll-down ----------------------
  useEffect(() => {
    let lastY = window.scrollY;
    let rafId = 0;

    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        const y = window.scrollY;
        const delta = y - lastY;

        setIsScrolled(y > 4);

        if (y < 80) {
          setIsHidden(false);
        } else if (delta > 6) {
          setIsHidden(true);
          setOpenDropdown(null);
        } else if (delta < -6) {
          setIsHidden(false);
        }

        lastY = y;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // ---- Close dropdown on outside click / Escape --------------------------
  const closeDropdown = useCallback(() => setOpenDropdown(null), []);

  useEffect(() => {
    if (!openDropdown) return;

    const onPointerDown = (e: MouseEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) closeDropdown();
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDropdown();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [openDropdown, closeDropdown]);

  // ---- Lock body scroll when mobile menu is open --------------------------
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const toggle = useCallback(
    (key: string) => setOpenDropdown((v) => (v === key ? null : key)),
    []
  );

  async function handleLogout() {
    closeDropdown();
    setIsMobileMenuOpen(false);
    await signOut(getFirebaseAuth());
  }

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Account";

  return (
    <>
      {/* Main sticky header */}
      <header
        ref={headerRef}
        className={`sticky top-0 z-50 bg-white font-body transition-[transform,box-shadow] duration-300 ease-out ${
          isScrolled ? "shadow-[0_2px_12px_rgba(15,23,42,0.08)]" : "border-b border-cmt-neutral-200"
        }`}
        style={{ transform: isHidden ? "translateY(-100%)" : "translateY(0)" }}
      >
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-6">
          {/* Logo. flex-1 here and on the right actions gives both flanks equal
              width, which centres the nav between them without taking it out of
              flow — an absolutely centred nav overlaps the actions once the menu
              grows past the space either side of centre. */}
          <div className="flex flex-1 items-center justify-start">
            <Link href="/" className="flex shrink-0 items-center">
              <Image
                src="/logo.png"
                alt="CompareMyTrip"
                width={1400}
                height={167}
                priority
                className="h-7 w-auto"
              />
            </Link>
          </div>

          {/* Desktop nav */}
          <nav
            aria-label="Main navigation"
            className="hidden shrink-0 items-center gap-6 min-[1400px]:flex min-[1400px]:gap-7"
          >
            {navItems.map((item) => {
              const hasChildren = Boolean(item.children?.length);
              const isOpen = openDropdown === item.label;

              return (
                <div key={item.label} className="relative">
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={() => toggle(item.label)}
                      aria-expanded={isOpen}
                      aria-haspopup="menu"
                      className="flex items-center gap-1 whitespace-nowrap py-2 text-[14px] font-medium text-cmt-neutral-700 transition-colors hover:text-cmt-neutral-900"
                    >
                      {item.label}
                      <ChevronDown
                        size={14}
                        strokeWidth={2}
                        className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                    </button>
                  ) : (
                    <Link
                      href={item.href!}
                      className="whitespace-nowrap py-2 text-[14px] font-medium text-cmt-neutral-700 transition-colors hover:text-cmt-neutral-900"
                    >
                      {item.label}
                    </Link>
                  )}

                  {hasChildren && isOpen && (
                    <div
                      role="menu"
                      className="absolute left-0 top-full z-50 mt-2 min-w-[200px] rounded-cmt-md border border-cmt-neutral-200 bg-white p-1.5 shadow-cmt-md"
                    >
                      {item.children!.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          role="menuitem"
                          onClick={closeDropdown}
                          className="block rounded-cmt-control px-3 py-2 text-[14px] text-cmt-neutral-700 hover:bg-cmt-neutral-50 hover:text-cmt-neutral-900"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex flex-1 shrink-0 items-center justify-end gap-2">
            {user === undefined ? (
              <div className="hidden sm:block h-10 w-20 animate-pulse rounded-cmt-control bg-cmt-neutral-100" aria-hidden="true" />
            ) : user ? (
              <div className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => toggle("account")}
                  aria-expanded={openDropdown === "account"}
                  aria-haspopup="menu"
                  className="flex h-10 items-center gap-2 rounded-cmt-control border border-cmt-neutral-200 bg-white pl-3 pr-2.5 text-[14px] font-medium text-cmt-neutral-900 transition-colors hover:border-cmt-neutral-300 hover:bg-cmt-neutral-50"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-cmt-full bg-cmt-primary-100">
                    <UserIcon size={14} strokeWidth={2} className="text-cmt-primary-800" aria-hidden="true" />
                  </span>
                  <span className="max-w-[110px] truncate">{displayName}</span>
                  <ChevronDown
                    size={15}
                    strokeWidth={2}
                    className={`text-cmt-neutral-500 transition-transform ${
                      openDropdown === "account" ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>

                {openDropdown === "account" && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-2 min-w-[200px] rounded-cmt-md border border-cmt-neutral-200 bg-white p-1.5 shadow-cmt-md"
                  >
                    <Link
                      href="/account"
                      role="menuitem"
                      onClick={closeDropdown}
                      className="flex items-center gap-2.5 rounded-cmt-control px-3 py-2.5 text-[14px] text-cmt-neutral-700 hover:bg-cmt-neutral-50"
                    >
                      <UserIcon size={15} strokeWidth={2} aria-hidden="true" />
                      My Account
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-cmt-control px-3 py-2.5 text-left text-[14px] text-cmt-error-700 hover:bg-cmt-error-100"
                    >
                      <LogOut size={15} strokeWidth={2} aria-hidden="true" />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden sm:flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-cmt-control border border-cmt-neutral-200 bg-white px-4 text-[14px] font-medium text-cmt-neutral-900 transition-colors hover:border-cmt-neutral-300 hover:bg-cmt-neutral-50"
              >
                <UserIcon size={16} strokeWidth={2} aria-hidden="true" />
                Log in
              </Link>
            )}

            <Link
              href="/contact"
              className="hidden h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-cmt-control bg-cmt-primary-500 px-5 text-[14px] font-semibold text-cmt-neutral-900 transition-colors hover:bg-cmt-primary-600 sm:flex"
            >
              Contact Us
              <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
            </Link>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={isMobileMenuOpen}
              className="flex h-10 w-10 items-center justify-center rounded-cmt-control border border-cmt-neutral-200 text-cmt-neutral-900 transition-colors hover:bg-cmt-neutral-50 min-[1400px]:hidden"
            >
              <Menu size={20} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile / tablet drawer */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-white min-[1400px]:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div className="flex items-center justify-between border-b border-cmt-neutral-200 px-6 py-4">
            <Image src="/logo.png" alt="CompareMyTrip" width={1400} height={167} className="h-6 w-auto" />
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close navigation menu"
              className="flex h-10 w-10 items-center justify-center rounded-cmt-control border border-cmt-neutral-200 text-cmt-neutral-900"
            >
              <X size={20} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          <nav aria-label="Mobile navigation" className="flex flex-col px-6 pt-2">
            {navItems.map((item, i) => {
              const hasChildren = Boolean(item.children?.length);
              const isExpanded = expandedMobileItem === item.label;

              return (
                <div key={item.label} className={i > 0 ? "border-t border-cmt-neutral-100" : ""}>
                  {hasChildren ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedMobileItem((v) => (v === item.label ? null : item.label))
                        }
                        className="flex w-full items-center justify-between py-4 font-display text-[17px] font-semibold text-cmt-neutral-900"
                      >
                        {item.label}
                        <ChevronDown
                          size={18}
                          strokeWidth={2}
                          className={`text-cmt-neutral-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          aria-hidden="true"
                        />
                      </button>
                      {isExpanded && (
                        <div className="flex flex-col gap-1 pb-4 pl-3">
                          {item.children!.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="rounded-cmt-control px-3 py-2.5 text-[15px] text-cmt-neutral-600 hover:bg-cmt-neutral-50 hover:text-cmt-neutral-900"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href!}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block py-4 font-display text-[17px] font-semibold text-cmt-neutral-900"
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="mt-auto flex flex-col gap-3 border-t border-cmt-neutral-200 px-6 pb-8 pt-4">
            {user ? (
              <>
                <Link
                  href="/account"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex h-11 items-center justify-center gap-2 rounded-cmt-control border border-cmt-neutral-200 text-[15px] font-medium text-cmt-neutral-900"
                >
                  <UserIcon size={18} strokeWidth={2} aria-hidden="true" />
                  {displayName}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex h-11 items-center justify-center gap-2 rounded-cmt-control text-[15px] font-medium text-cmt-error-700"
                >
                  <LogOut size={18} strokeWidth={2} aria-hidden="true" />
                  Log out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex h-11 items-center justify-center gap-2 rounded-cmt-control border border-cmt-neutral-200 text-[15px] font-medium text-cmt-neutral-900"
              >
                <UserIcon size={18} strokeWidth={2} aria-hidden="true" />
                Log in
              </Link>
            )}

            <Link
              href="/contact"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex h-11 items-center justify-center gap-2 rounded-cmt-control bg-cmt-primary-500 text-[15px] font-semibold text-cmt-neutral-900"
            >
              Contact Us
              <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

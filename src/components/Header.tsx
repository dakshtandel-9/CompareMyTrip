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
  Check,
  Copy,
  Luggage,
  Phone,
  TicketPercent,
} from "lucide-react";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { useAuthUser } from "@/lib/firebase/useAuthUser";
import { useSiteContent } from "@/lib/useSiteContent";
import { whatsAppHref } from "@/lib/whatsapp";

export default function Header() {
  const user = useAuthUser();
  const { header, contact } = useSiteContent();

  /* The nav is edited in /admin/content → Header. An item with children is
     a dropdown and ignores its own href; one without is a plain link, and is
     dropped entirely if it has nowhere to point. */
  const navItems = header.enabled
    ? header.items.filter((item) => item.children.length > 0 || item.href)
    : [];
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [expandedMobileItem, setExpandedMobileItem] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

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

  /* Hover open/close. The close is deferred by a beat so that moving between
     two dropdowns, or slipping a pixel outside the menu on the way to an
     entry, does not flicker it shut; moving onto anything else cancels the
     pending close rather than reopening. */
  const hoverCloseTimer = useRef<number | undefined>(undefined);

  const cancelHoverClose = useCallback(() => {
    if (hoverCloseTimer.current !== undefined) {
      window.clearTimeout(hoverCloseTimer.current);
      hoverCloseTimer.current = undefined;
    }
  }, []);

  // ---- Close dropdown on outside click / Escape --------------------------
  const closeDropdown = useCallback(() => {
    cancelHoverClose();
    setOpenDropdown(null);
  }, [cancelHoverClose]);

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
    if (!isMobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const menu = mobileMenuRef.current;
    menu?.querySelector<HTMLButtonElement>("button")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
      if (event.key !== "Tab" || !menu) return;
      const focusable = Array.from(menu.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'))
        .filter((element) => element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    const desktop = window.matchMedia("(min-width: 1400px)");
    const onLayoutChange = () => {
      if (desktop.matches) setIsMobileMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onLayoutChange);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onLayoutChange);
      previousFocus?.focus();
    };
  }, [isMobileMenuOpen]);

  const toggle = useCallback(
    (key: string) => setOpenDropdown((v) => (v === key ? null : key)),
    []
  );

  /* Clicking the trigger. On a hovering pointer the menu is already open by
     the time the click lands, so toggling would shut it again — there, a
     click only ever opens, and leaving or pressing Escape is what closes it.
     Touch and keyboard get the real toggle, since they never hovered. */
  const activate = useCallback(
    (key: string) => {
      const canHover =
        typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;
      if (canHover) {
        cancelHoverClose();
        setOpenDropdown(key);
      } else {
        toggle(key);
      }
    },
    [cancelHoverClose, toggle],
  );

  const openOnHover = useCallback(
    (key: string) => {
      cancelHoverClose();
      setOpenDropdown(key);
    },
    [cancelHoverClose],
  );

  const closeOnHover = useCallback(() => {
    cancelHoverClose();
    hoverCloseTimer.current = window.setTimeout(() => setOpenDropdown(null), 140);
  }, [cancelHoverClose]);

  // A pending close must not fire into an unmounted header.
  useEffect(() => cancelHoverClose, [cancelHoverClose]);

  async function handleLogout() {
    closeDropdown();
    setIsMobileMenuOpen(false);
    await signOut(getFirebaseAuth());
  }

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Account";

  /* The utility strip. Each half is optional: clearing the offer, the number
     or the trips label in /admin drops just that piece, so the strip can run
     one-sided without leaving a hole where the other half was. */
  const topBar = header.topBar;
  const offerText = topBar.offerText.trim();
  const couponCode = topBar.couponCode.trim();
  const phoneNumber = topBar.phoneNumber.trim();
  const tripsLabel = topBar.tripsLabel.trim();
  const tripsHref = topBar.tripsHref.trim();
  /* Only for someone who has trips to look at: signed out, the link would
     lead straight to the login wall, so it stays off the strip entirely.
     `user` is undefined until Firebase reports back, which reads as signed
     out here — the link appears once, rather than flickering away. */
  const showTrips = Boolean(user) && tripsLabel !== "" && tripsHref !== "";
  /* tel: wants the number without the spacing a human reads it by. */
  const telHref = `tel:${phoneNumber.replace(/[^\d+]/g, "")}`;
  /* The same line the /contact page publishes, opened as a chat. */
  const chatHref = whatsAppHref(contact.channels);
  const showTopBar =
    topBar.enabled && (offerText !== "" || phoneNumber !== "" || chatHref !== "" || showTrips);

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
        {showTopBar && (
          <div className="border-b border-cmt-neutral-200 bg-cmt-neutral-50">
            <div className="mx-auto flex h-9 max-w-[1440px] items-center justify-between gap-4 px-6">
              {/* Left — the offer running right now, and the code for it */}
              <div className="flex min-w-0 items-center gap-2">
                {offerText &&
                  (topBar.offerHref ? (
                    <Link
                      href={topBar.offerHref}
                      className="flex min-w-0 items-center gap-1.5 text-[12.5px] text-cmt-neutral-700 transition-colors hover:text-cmt-neutral-900"
                    >
                      <TicketPercent
                        size={15}
                        strokeWidth={2}
                        className="shrink-0 text-cmt-primary-700"
                        aria-hidden="true"
                      />
                      <span className="truncate font-medium">{offerText}</span>
                    </Link>
                  ) : (
                    <span className="flex min-w-0 items-center gap-1.5 text-[12.5px] text-cmt-neutral-700">
                      <TicketPercent
                        size={15}
                        strokeWidth={2}
                        className="shrink-0 text-cmt-primary-700"
                        aria-hidden="true"
                      />
                      <span className="truncate font-medium">{offerText}</span>
                    </span>
                  ))}
                {offerText && couponCode && <CouponCode code={couponCode} />}
              </div>

              {/* Right — the two things people look for by reflex */}
              <div className="hidden shrink-0 items-center gap-3 sm:flex">
                {phoneNumber && (
                  <a
                    href={telHref}
                    className="flex items-center gap-1.5 text-[12.5px] text-cmt-neutral-700 transition-colors hover:text-cmt-neutral-900"
                  >
                    <Phone size={14} strokeWidth={2} aria-hidden="true" />
                    {topBar.phoneLabel && (
                      <span className="hidden text-cmt-neutral-500 lg:inline">
                        {topBar.phoneLabel}
                      </span>
                    )}
                    <span className="font-semibold text-cmt-neutral-900">{phoneNumber}</span>
                  </a>
                )}

                {chatHref && (
                  <a
                    href={chatHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[12.5px] font-medium text-cmt-neutral-700 transition-colors hover:text-cmt-neutral-900"
                  >
                    <WhatsAppMark className="size-3.5 text-[#25D366]" />
                    WhatsApp
                  </a>
                )}

                {(phoneNumber || chatHref) && showTrips && (
                  <span className="h-3.5 w-px bg-cmt-neutral-200" aria-hidden="true" />
                )}

                {showTrips && (
                  <Link
                    href={tripsHref}
                    className="flex items-center gap-1.5 text-[12.5px] font-medium text-cmt-neutral-700 transition-colors hover:text-cmt-neutral-900"
                  >
                    <Luggage size={14} strokeWidth={2} aria-hidden="true" />
                    {tripsLabel}
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 sm:gap-4 sm:px-6">
          {/* Logo. flex-1 here and on the right actions gives both flanks equal
              width, which centres the nav between them without taking it out of
              flow — an absolutely centred nav overlaps the actions once the menu
              grows past the space either side of centre. */}
          <div className="flex min-w-0 flex-1 items-center justify-start">
            <Link href="/" className="flex min-w-0 items-center">
              <Image
                src="/comparemytrip-logo-white-plane.png"
                alt="CompareMyTrip"
                width={1400}
                height={167}
                sizes="235px"
                className="h-auto w-[190px] max-w-full sm:h-7 sm:w-auto"
              />
            </Link>
          </div>

          {/* Desktop nav */}
          <nav
            aria-label="Main navigation"
            className="hidden shrink-0 items-center gap-6 min-[1400px]:flex min-[1400px]:gap-7"
          >
            {navItems.map((item) => {
              const hasChildren = item.children.length > 0;
              const isOpen = openDropdown === item.id;

              return (
                <div
                  key={item.id}
                  className="relative"
                  /* Hover opens on a pointer that can hover — the handlers sit
                     on the wrapper, which spans both the trigger and the menu,
                     so crossing the gap between them is not a mouse-leave.
                     Touch still goes through the click handler below. */
                  onMouseEnter={hasChildren ? () => openOnHover(item.id) : undefined}
                  onMouseLeave={hasChildren ? closeOnHover : undefined}
                >
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={() => activate(item.id)}
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
                      href={item.href}
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
                      {item.children.map((child) => (
                        <Link
                          key={child.id}
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
          ref={mobileMenuRef}
          className="fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-white min-[1400px]:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div className="flex items-center justify-between gap-3 border-b border-cmt-neutral-200 px-4 py-4 sm:px-6">
            <Image
              src="/comparemytrip-logo-white-plane.png"
              alt="CompareMyTrip"
              width={1400}
              height={167}
              className="h-auto w-[190px] max-w-[calc(100%-3.5rem)] sm:h-6 sm:w-auto"
            />
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
              const hasChildren = item.children.length > 0;
              const isExpanded = expandedMobileItem === item.id;

              return (
                <div key={item.id} className={i > 0 ? "border-t border-cmt-neutral-100" : ""}>
                  {hasChildren ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedMobileItem((v) => (v === item.id ? null : item.id))
                        }
                        aria-expanded={isExpanded}
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
                          {item.children.map((child) => (
                            <Link
                              key={child.id}
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
                      href={item.href}
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

          <div className="mt-auto flex flex-col gap-3 border-t border-cmt-neutral-200 px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-4">
            {/* The strip's right half only fits from sm up, so the drawer
                carries the number and the trips link at this width. */}
            {showTopBar && (phoneNumber || chatHref || showTrips) && (
              <div className="flex flex-col gap-3 pb-1">
                {phoneNumber && (
                  <a
                    href={telHref}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex h-11 items-center justify-center gap-2 rounded-cmt-control border border-cmt-neutral-200 text-[15px] font-medium text-cmt-neutral-900"
                  >
                    <Phone size={18} strokeWidth={2} aria-hidden="true" />
                    {phoneNumber}
                  </a>
                )}
                {chatHref && (
                  <a
                    href={chatHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex h-11 items-center justify-center gap-2 rounded-cmt-control border border-cmt-neutral-200 text-[15px] font-medium text-cmt-neutral-900"
                  >
                    <WhatsAppMark className="size-[18px] text-[#25D366]" />
                    WhatsApp
                  </a>
                )}
                {showTrips && (
                  <Link
                    href={tripsHref}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex h-11 items-center justify-center gap-2 rounded-cmt-control border border-cmt-neutral-200 text-[15px] font-medium text-cmt-neutral-900"
                  >
                    <Luggage size={18} strokeWidth={2} aria-hidden="true" />
                    {tripsLabel}
                  </Link>
                )}
              </div>
            )}

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

/* ------------------------------------------------------------------ */
/* The coupon chip. A code is there to be used, so it copies on click   */
/* rather than asking to be read off the screen and retyped; the        */
/* confirmation rides in the label so a screen reader hears it too.     */
/* Clipboard access can be refused (an insecure origin, a locked-down   */
/* browser) — the chip then simply stays as it was, and the code is     */
/* still legible and selectable.                                        */
/* ------------------------------------------------------------------ */

function CouponCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? `Coupon code ${code} copied` : `Copy coupon code ${code}`}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-cmt-full border border-dashed border-cmt-primary-700 bg-cmt-primary-50 px-2.5 py-0.5 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-cmt-neutral-900 transition-colors hover:bg-cmt-primary-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmt-primary-500"
    >
      <span>{code}</span>
      {copied ? (
        <Check size={12} strokeWidth={2.5} aria-hidden="true" />
      ) : (
        <Copy size={12} strokeWidth={2} aria-hidden="true" />
      )}
    </button>
  );
}

/* The WhatsApp glyph, so the link is recognised as WhatsApp rather than as
   some generic chat bubble. Carried over from the floating button this
   replaced. */
function WhatsAppMark({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.347-.347.52-.52.174-.174.232-.297.347-.495.116-.198.058-.372-.058-.52-.116-.15-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

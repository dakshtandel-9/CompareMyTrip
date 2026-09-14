"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, BookOpen, ChevronRight, ExternalLink, LogOut, Menu, Search, X } from "lucide-react";
import { signOut } from "firebase/auth";
import BrandLogo from "@/components/BrandLogo";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { useAuthUser } from "@/lib/firebase/useAuthUser";
import { lockPageScroll } from "@/lib/lockPageScroll";
import { ADMIN_NAV_GROUPS, findAdminPage, searchAdminPages } from "./adminNavigation";
import styles from "./AdminWorkspace.module.css";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthUser();
  const mobileDialog = useRef<HTMLDialogElement>(null);
  const searchDialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const current = findAdminPage(pathname);
  const group = ADMIN_NAV_GROUPS.find((section) => section.items.some((item) => item.href === current?.href));
  const results = searchAdminPages(query);

  function closeDialogs() {
    mobileDialog.current?.close();
    searchDialog.current?.close();
    setModalOpen(false);
  }
  function openSearch() {
    mobileDialog.current?.close();
    setQuery("");
    searchDialog.current?.showModal();
    setModalOpen(true);
  }
  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        mobileDialog.current?.close();
        searchDialog.current?.showModal();
        setModalOpen(true);
      }
    };
    document.addEventListener("keydown", keyboard);
    return () => document.removeEventListener("keydown", keyboard);
  }, []);
  useEffect(() => modalOpen ? lockPageScroll() : undefined, [modalOpen]);

  async function logOut() {
    setSigningOut(true);
    setAccountError("");
    try {
      await signOut(getFirebaseAuth());
      router.replace("/login?next=%2Fadmin");
    } catch {
      setAccountError("Could not sign out. Please try again.");
      setSigningOut(false);
    }
  }

  const navigation = <nav aria-label="Admin navigation" className={styles.navigation}>
    {ADMIN_NAV_GROUPS.map((section) => <div className={styles.navGroup} key={section.label}>
      <p className={styles.navHeading}>{section.label}</p>
      {section.items.map((item) => <Link key={item.href} href={item.href} onClick={closeDialogs} aria-current={current?.href === item.href ? "page" : undefined} className={styles.navLink} title={item.description}>
        <item.icon size={18} strokeWidth={1.8} aria-hidden="true" /><span>{item.label}</span>
        {current?.href === item.href && <span className={styles.activeDot} />}
      </Link>)}
    </div>)}
  </nav>;

  const sidebar = <>
    <Link href="/admin" onClick={closeDialogs} aria-label="CompareMyTrip admin overview" className={styles.brand}><BrandLogo className="w-[181px]" sizes="181px" /><span>ADMIN WORKSPACE</span></Link>
    {navigation}
    <div className={styles.sidebarBottom}>
      <Link href="/admin/guide" onClick={closeDialogs} className={styles.guideLink} aria-current={pathname === "/admin/guide" ? "page" : undefined}><BookOpen size={18} aria-hidden="true" /><span>How to use admin<small>A little help, whenever you need it</small></span><ChevronRight size={15} /></Link>
      <div className={styles.account}>
        <span className={styles.avatar} aria-hidden="true">{(user?.displayName || user?.email || "A").slice(0, 1).toUpperCase()}</span>
        <span className={styles.accountName}>{user?.displayName || "Administrator"}<small>{user?.email || "Admin account"}</small></span>
        <button type="button" onClick={() => void logOut()} disabled={signingOut} aria-label={signingOut ? "Signing out" : "Sign out"} title="Sign out" className={styles.iconButton}><LogOut size={17} /></button>
      </div>
      {accountError && <p role="alert" className={styles.accountError}>{accountError}</p>}
    </div>
  </>;

  return <div className={styles.workspace}>
    <a href="#admin-main" className={styles.skipLink}>Skip to main content</a>
    <aside className={styles.sidebar}>{sidebar}</aside>
    <dialog ref={mobileDialog} className={styles.mobileDialog} aria-label="Admin menu" onClose={() => setModalOpen(Boolean(searchDialog.current?.open))} onClick={(event) => { if (event.target === event.currentTarget && event.clientX > event.currentTarget.getBoundingClientRect().right) closeDialogs(); }}>
      <button type="button" className={styles.closeMenu} aria-label="Close menu" onClick={closeDialogs}><X size={19} /></button>
      {sidebar}
    </dialog>
    <div className={styles.page}>
      <header className={styles.topbar}>
        <button type="button" aria-label="Open menu" className={`${styles.iconButton} ${styles.menuButton}`} onClick={() => { mobileDialog.current?.showModal(); setModalOpen(true); }}><Menu size={20} /></button>
        <div className={styles.breadcrumb}><span>{group?.label || "Help & guidance"}</span><ChevronRight size={14} /><strong>{current?.label || "Admin"}</strong></div>
        <button type="button" className={styles.searchTrigger} onClick={openSearch}><Search size={16} /><span>Find a page or task</span><kbd>⌘ K / Ctrl K</kbd></button>
        <Link href="/" target="_blank" rel="noopener noreferrer" className={styles.viewSite}><ExternalLink size={16} /><span>View website</span></Link>
      </header>
      <main id="admin-main" tabIndex={-1} className={styles.main}>{children}</main>
      <footer className={styles.footer}><span>CompareMyTrip · Admin workspace</span><Link href="/admin/guide">Need a hand? Open the guide <ArrowRight size={13} /></Link></footer>
    </div>
    <dialog ref={searchDialog} className={styles.searchDialog} aria-labelledby="admin-search-title" onClose={() => setModalOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialogs(); } }}>
      <div className={styles.searchHeader}><Search size={21} /><label className="sr-only" htmlFor="admin-task-search" id="admin-search-title">Find a page or task</label><input id="admin-task-search" type="search" autoComplete="off" placeholder="Try “payments”, “photos” or “coupons”…" value={query} onChange={(event) => setQuery(event.target.value)} /><button type="button" aria-label="Close search" onClick={closeDialogs} className={styles.iconButton}><X size={18} /></button></div>
      <div className={styles.searchResults}><p className={styles.navHeading} role="status">{query ? `${results.length} matching pages` : "Where would you like to go?"}</p>{results.map((item) => <Link href={item.href} key={item.href} onClick={closeDialogs}><item.icon size={21} /><span><strong>{item.label}</strong><small>{item.description}</small></span><ArrowRight size={16} /></Link>)}{results.length === 0 && <p className={styles.searchEmpty}>No pages found. Try “packages”, “customers” or “website”.</p>}</div>
      <p className={styles.searchHint}>Use Tab to move between results, Enter to open, or Escape to close.</p>
    </dialog>
  </div>;
}

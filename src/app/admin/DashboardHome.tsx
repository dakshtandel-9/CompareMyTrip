"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, Check, ChevronRight, CircleHelp, ClipboardList, Globe2, MessageSquareText, MessagesSquare, PackagePlus, PackageSearch, PanelsTopLeft, Plane, ShieldAlert, Sparkles, type LucideIcon } from "lucide-react";
import { isPublishedPackage } from "@/lib/packageData";
import { useAllPackagesState } from "@/lib/useAdminPackages";
import { useSiteContentState } from "@/lib/useSiteContent";
import { useAdminOverview } from "./_components/useAdminOverview";
import { ADMIN_NAV_GROUPS } from "./_components/adminNavigation";
import styles from "./DashboardHome.module.css";

function Metric({ label, value, hint, href, icon: Icon, tone = "green" }: { label: string; value: number | string; hint: string; href: string; icon: LucideIcon; tone?: string }) {
  return <Link href={href} className={styles.metric}><div className={styles.metricTop}><span>{label}</span><span className={styles.metricIcon} data-tone={tone}><Icon size={18} strokeWidth={1.7} /></span></div><strong>{value}</strong><div className={styles.metricBottom}><span>{hint}</span><ArrowRight size={15} /></div></Link>;
}

function InboxRow({ href, title, hint, count, loading, error, icon: Icon }: { href: string; title: string; hint: string; count: number; loading: boolean; error: string; icon: LucideIcon }) {
  return <Link href={href} className={styles.inboxRow}><span className={styles.rowIcon}><Icon size={19} strokeWidth={1.7} /></span><span className={styles.rowLabel}><strong>{title}</strong><small>{error ? "Could not load. Open this section to retry." : hint}</small></span><span className={styles.count} data-empty={!count && !error && !loading}>{error ? "Retry" : loading ? "…" : count}</span><ChevronRight size={16} className={styles.rowArrow} /></Link>;
}

export default function DashboardHome() {
  const catalogue = useAllPackagesState();
  const site = useSiteContentState();
  const { enquiries, leads, trips } = useAdminOverview();
  const newContacts = enquiries.records.filter((item) => item.source !== "custom_quote" && item.status === "not_contacted").length;
  const newQuotes = enquiries.records.filter((item) => item.source === "custom_quote" && item.status === "under_review").length;
  const newLeads = leads.records.filter((item) => item.status === "new").length;
  const needsConfirmation = trips.records.filter((item) => item.paymentStatus === "successful" && item.tripStatus === "awaiting_confirmation").length;
  const unscheduled = trips.records.filter((item) => item.paymentStatus === "successful" && item.tripStatus === "accepted" && !item.tripDate).length;
  const paymentIssues = trips.records.filter((item) => item.paymentReportStatus === "open" || item.amountMismatch || Boolean(item.duplicatePaymentIds?.length)).length;
  const paidTrips = trips.records.filter((item) => item.paymentStatus === "successful").length;
  const published = catalogue.packages.filter(isPublishedPackage).length;
  const drafts = catalogue.packages.length - published;
  const inboxLoading = enquiries.loading || leads.loading;
  const inboxError = enquiries.error || leads.error;
  const allLoaded = !inboxLoading && !trips.loading && !inboxError && !trips.error;
  const pending = newContacts + newQuotes + newLeads + needsConfirmation + unscheduled + paymentIssues;
  const display = (value: number, loading: boolean, error: string) => error ? "—" : loading ? "…" : value;

  return <div className={styles.dashboard}>
    <header className={styles.heading}><div><p className={styles.eyebrow}>YOUR WORKSPACE, AT A GLANCE</p><h1>Let’s make great trips happen.</h1><p>Start with what needs your attention, then take care of the details.</p></div><Link href="/admin/packages?create=1" className={styles.primaryButton}><PackagePlus size={17} />Create a package</Link></header>
    <div className={styles.metrics} aria-label="Workspace overview">
      <Metric label="Requests to follow up" value={display(newContacts + newQuotes + newLeads, inboxLoading, inboxError)} hint="Across your three inboxes" href="#follow-ups" icon={MessagesSquare} tone="orange" />
      <Metric label="Bookings to confirm" value={display(needsConfirmation, trips.loading, trips.error)} hint="Paid and awaiting your review" href="/admin/trips" icon={ClipboardList} tone="blue" />
      <Metric label="Paid bookings" value={display(paidTrips, trips.loading, trips.error)} hint="All recorded successful payments" href="/admin/trips" icon={Plane} tone="purple" />
      <Metric label="Published packages" value={display(published, catalogue.loading, catalogue.error)} hint={catalogue.error ? "Open catalogue to check connection" : catalogue.loading ? "Loading your catalogue" : !catalogue.databaseInitialized ? "Default catalogue · set up to edit" : `${drafts} draft${drafts === 1 ? "" : "s"} in your catalogue`} href="/admin/packages" icon={PackageSearch} />
    </div>

    <div className={styles.workGrid}>
      <section id="follow-ups" className={styles.panel}>
        <header className={styles.panelHeader}><div><h2>Your follow-up list <span className={styles.smallDot} /></h2><p>A clear next step for every customer request.</p></div>{allLoaded && <span className={styles.subtleBadge}>{pending ? `${pending} to do` : "Up to date"}</span>}</header>
        <InboxRow href="/admin/enquiries" title="Reply to contact enquiries" hint="Visitors waiting for their first response" count={newContacts} loading={enquiries.loading} error={enquiries.error} icon={MessageSquareText} />
        <InboxRow href="/admin/package-enquiries" title="Review package quote requests" hint="Customised trip requests awaiting review" count={newQuotes} loading={enquiries.loading} error={enquiries.error} icon={MessagesSquare} />
        <InboxRow href="/admin/popup-form" title="Contact new trip planning leads" hint="Travellers who asked for help planning" count={newLeads} loading={leads.loading} error={leads.error} icon={Sparkles} />
        <InboxRow href="/admin/trips" title="Confirm paid bookings" hint="Review each booking before accepting it" count={needsConfirmation} loading={trips.loading} error={trips.error} icon={Plane} />
        <InboxRow href="/admin/trips" title="Review payment issues" hint="Open reports, amount warnings or duplicate payments" count={paymentIssues} loading={trips.loading} error={trips.error} icon={ShieldAlert} />
        <InboxRow href="/admin/trips" title="Set departure dates" hint="Accepted bookings without a travel date" count={unscheduled} loading={trips.loading} error={trips.error} icon={CalendarDays} />
        <div className={styles.panelFoot}>{allLoaded && pending === 0 ? <><Check size={14} />You’re all caught up. New requests will appear here.</> : <><CircleHelp size={14} />Open a list to view the details and update its status.</>}</div>
      </section>
      <div className={styles.rightRail}>
        <section className={`${styles.panel} ${styles.quickActions}`}><header><p className={styles.eyebrow}>MAKE A QUICK UPDATE</p><h2>What would you like to do?</h2></header>
          <Link href="/admin/packages?create=1"><span className={styles.quickIcon}><PackagePlus size={19} /></span><span><strong>Add a travel package</strong><small>Price, photos and a day-by-day plan</small></span><ArrowRight size={16} /></Link>
          <Link href="/admin/content"><span className={styles.quickIcon}><PanelsTopLeft size={19} /></span><span><strong>Edit the website</strong><small>Page text, images and settings</small></span><ArrowRight size={16} /></Link>
          <Link href="/admin/coupons"><span className={styles.quickIcon}><Sparkles size={19} /></span><span><strong>Manage a discount</strong><small>Offers for your travel packages</small></span><ArrowRight size={16} /></Link>
        </section>
        <section className={styles.siteCard}><div className={styles.siteCardTitle}><Globe2 size={18} /><h2>Your website</h2><span className={styles.siteBadge} data-paused={site.content.comingSoon.enabled} data-unknown={Boolean(site.error) || site.loading}>{site.error ? "Status unavailable" : site.loading ? "Checking…" : site.content.comingSoon.enabled ? "Coming soon" : "Open to visitors"}</span></div><p>{site.error ? "Open website settings to check the connection." : site.content.comingSoon.enabled ? "Visitors see the coming-soon page. You can preview the full website as an administrator." : "Use the preview to see the pages your travellers browse."}</p><div><Link href="/" target="_blank" rel="noopener noreferrer">Preview website <ArrowRight size={14} /></Link><Link href="/admin/content?section=comingSoon">Website settings</Link></div></section>
      </div>
    </div>

    <section className={styles.directory}><div className={styles.sectionHeading}><div><h2>Everything has its place.</h2><p>Choose a work area. You’ll find all the tools you need inside.</p></div><Link href="/admin/guide">Explore the admin guide <ArrowRight size={14} /></Link></div><div className={styles.areaGrid}>{ADMIN_NAV_GROUPS.slice(1).map((group) => <section className={styles.areaCard} key={group.label}><h3>{group.label}</h3>{group.items.map((item) => <Link key={item.href} href={item.href}><item.icon size={15} /><span>{item.label}</span><ChevronRight size={13} /></Link>)}</section>)}</div></section>
    <aside className={styles.helpBanner}><span className={styles.helpIcon}><BookOpen size={21} /></span><div><h2>First time here? You’re in the right place.</h2><p>Our short guide explains what each area does and how to complete the everyday tasks.</p></div><Link href="/admin/guide">Show me around <ArrowRight size={15} /></Link></aside>
  </div>;
}

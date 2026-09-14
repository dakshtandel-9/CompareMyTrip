"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AlertCircle,
  BadgePercent,
  BookOpen,
  Check,
  ChevronRight,
  Compass,
  ExternalLink,
  Globe2,
  HelpCircle,
  Images,
  Layers,
  LoaderCircle,
  type LucideIcon,
  Mail,
  MessageSquareQuote,
  Mountain,
  KeyRound,
  MessageSquare,
  Navigation,
  PanelsTopLeft,
  Plane,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  TrainFront,
  TrendingUp,
} from "lucide-react";

import { usePackages } from "@/lib/usePackages";
import { saveHomepageContent } from "@/lib/firebase/homepageContent";
import { useSiteContentState } from "@/lib/useSiteContent";
import {
  DEFAULT_SITE_CONTENT,
  SECTION_ORDER,
  normalizeSiteContent,
  type SectionKey,
  type SiteContent,
} from "@/lib/siteContent";
import { Button, FieldLabel, Toggle, inputClass } from "../_components/ui";
import CategoriesEditor from "./CategoriesEditor";
import HeroEditor from "./HeroEditor";
import ComingSoonEditor from "./ComingSoonEditor";
import AddOnEditor from "./AddOnEditor";
import FooterBadgesEditor from "./FooterBadgesEditor";
import styles from "./ContentWorkspace.module.css";
import { useUnsavedContentChanges } from "./useUnsavedContentChanges";
import {
  CompareEditor,
  DomesticEditor,
  AuthEditor,
  ContactEditor,
  FaqEditor,
  FeaturedEditor,
  HeaderEditor,
  GuidesEditor,
  GalleryEditor,
  InternationalEditor,
  LatestDealsEditor,
  NewsletterEditor,
  ReviewsEditor,
  TrainBannerEditor,
  TrendingEditor,
  WeekendTreksEditor,
  WhyUsEditor,
} from "./SectionEditors";

/* ------------------------------------------------------------------ */
/* Website content CRM.                                                */
/*                                                                     */
/* One screen, a rail of every section down the left in the order they  */
/* appear on the page, and that section's editor on the right. The      */
/* draft lives here so Publish is a single write of the whole document  */
/* rather than fifteen sections saving independently.                   */
/* ------------------------------------------------------------------ */

const SECTION_META: Record<
  SectionKey,
  {
    label: string;
    hint: string;
    icon: LucideIcon;
    /* Most sections are homepage bands the switch simply removes. The ones
       that are not say so themselves rather than claiming to be. */
    toggleLabel?: string;
    toggleOn?: string;
    toggleOff?: string;
  }
> = {
  comingSoon: {
    label: "Website availability",
    hint: "Website launch switch",
    icon: Plane,
    toggleLabel: "Enable coming-soon mode",
    toggleOn: "Visitors will see the coming-soon page after you publish. Signed-in admins can browse the full website.",
    toggleOff: "The regular website is live. Enable this switch and publish to show the coming-soon page.",
  },
  header: {
    label: "Navigation & contact number",
    hint: "Menu links, dropdowns and phone number",
    icon: Navigation,
    toggleLabel: "Show the navigation links",
    toggleOn: "The menu is live on every page.",
    toggleOff: "Hidden — the header keeps its logo and account buttons.",
  },
  auth: {
    label: "Login & signup",
    hint: "Popup and page content",
    icon: KeyRound,
    toggleLabel: "Show the sign-in popup on its own",
    toggleOn: "It appears after a visitor has been browsing a while.",
    toggleOff: "Off — the Log in button still opens it, it just never interrupts.",
  },
  contact: {
    label: "Contact page",
    hint: "Copy, details and offices",
    icon: MessageSquare,
    toggleLabel: "Show the sidebar beside the enquiry form",
    toggleOn: "“What happens next”, your contact details and the browse link.",
    toggleOff: "Hidden — the enquiry form runs the full width of the page.",
  },
  addOn: {
    label: "Extra travel services",
    hint: "Flight, hotel, visa, transport and quote headings",
    icon: Plane,
    toggleLabel: "Show the top section on Add On pages",
    toggleOn: "Each service shows its own top text, heading and description.",
    toggleOff: "Hidden — the service tabs and enquiry forms remain available.",
  },
  hero: { label: "Welcome & main headlines", hint: "First screen, traveller rating and top picks", icon: Sparkles },
  categories: { label: "Travel styles", hint: "Icon and photo cards", icon: PanelsTopLeft },
  trending: { label: "Trending destinations", hint: "Popular destination cards", icon: TrendingUp },
  compare: { label: "Package comparison", hint: "Heading above the comparison tool", icon: Layers },
  featured: { label: "Featured packages", hint: "Tabs and grid", icon: Sparkles },
  weekendTreks: { label: "Weekend treks", hint: "Trek cards", icon: Mountain },
  trainBanner: { label: "Train banner", hint: "Looping video band", icon: TrainFront },
  domestic: { label: "India holidays", hint: "Destination photos and details", icon: Compass },
  international: { label: "International", hint: "Country cards", icon: Globe2 },
  whyUs: { label: "Why travel with us", hint: "Benefits and reasons to book", icon: ShieldCheck },
  latestDeals: { label: "Latest deals", hint: "Promo card and grid", icon: BadgePercent },
  gallery: { label: "Travel gallery", hint: "Photos, captions and layout", icon: Images },
  reviews: { label: "Reviews", hint: "Traveller quotes", icon: MessageSquareQuote },
  guides: { label: "Travel guides", hint: "Article cards", icon: BookOpen },
  faq: { label: "Common questions", hint: "Answers and the contact help card", icon: HelpCircle },
  newsletter: { label: "Trust & newsletter", hint: "Sign-up band", icon: Mail },
  footerBadges: {
    label: "Footer badges",
    hint: "Payment and accreditation images",
    icon: ShieldCheck,
    toggleLabel: "Show payment and accreditation badges",
    toggleOn: "These badges appear in the footer across the website.",
    toggleOff: "Payment and accreditation badges are hidden from the footer.",
  },
};

const SECTION_GROUPS: { id: string; label: string; description: string; keys: SectionKey[] }[] = [
  { id: "homepage", label: "Homepage", description: "Sections in the order visitors see them", keys: SECTION_ORDER.filter((key) => !["comingSoon", "header", "auth", "contact", "addOn", "footerBadges"].includes(key)) },
  { id: "pages", label: "Other pages", description: "Sign-in, enquiries and travel services", keys: ["contact", "addOn", "auth"] },
  { id: "settings", label: "Across the website", description: "Navigation, footer and website availability", keys: ["header", "footerBadges", "comingSoon"] },
];

function sectionState(key: SectionKey, enabled: boolean) {
  if (key === "comingSoon") return enabled ? "Coming soon" : "Website open";
  if (["auth", "header", "contact", "addOn"].includes(key)) return enabled ? "Enabled" : "Disabled";
  return enabled ? "Visible" : "Hidden";
}

export default function ContentEditor({ initialSection = "hero" }: { initialSection?: SectionKey }) {
  const { content, loading, error, exists } = useSiteContentState();

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-9 w-52 rounded-cmt-sm bg-cmt-neutral-200" />
        <div className="h-4 w-96 max-w-full rounded-cmt-sm bg-cmt-neutral-200" />
        <div className="h-64 rounded-cmt-md bg-cmt-neutral-200" />
      </div>
    );
  }

  return <ContentEditorForm saved={content} loadError={error} documentExists={exists} initialSection={initialSection} />;
}

type EditorStatus = { kind: "success" | "error"; message: string };

function ContentEditorForm({
  saved,
  loadError,
  documentExists,
  initialSection,
}: {
  saved: SiteContent;
  loadError: string;
  documentExists: boolean;
  initialSection: SectionKey;
}) {
  const packages = usePackages();

  /* A working copy, so nothing reaches the live site until Publish. */
  const [draft, setDraft] = useState<SiteContent>(saved);
  const [status, setStatus] = useState<EditorStatus | null>(
    loadError ? { kind: "error", message: loadError } : null,
  );
  const [saving, setSaving] = useState(false);
  const [active, setActive] = useState<SectionKey>(initialSection);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState(() => SECTION_GROUPS.find((item) => item.keys.includes(initialSection))?.id ?? "homepage");
  const [reviewChanges, setReviewChanges] = useState(false);
  /* Reset all overwrites every section in Firebase, and there is no undo once
     it lands — so it is held behind a typed confirmation rather than a click. */
  const [resetPrompt, setResetPrompt] = useState(false);
  const [resetTyped, setResetTyped] = useState("");
  const previousSaved = useRef(saved);

  /* `saved` always comes back through the normaliser, so the draft goes
     through it too — otherwise two equal documents could still compare
     unequal purely on key order. */
  const draftChanged = JSON.stringify(normalizeSiteContent(draft)) !== JSON.stringify(saved);
  const dirty = !documentExists || draftChanged;
  useUnsavedContentChanges(draftChanged && !saving);

  /* Adopt remote updates while the form is clean. If an editor is midway
     through a change, keep their draft and let Discard return to the newest
     Firestore version instead of silently throwing their work away. */
  useEffect(() => {
    setDraft((current) =>
      JSON.stringify(normalizeSiteContent(current)) ===
      JSON.stringify(normalizeSiteContent(previousSaved.current))
        ? saved
        : current,
    );
    previousSaved.current = saved;
  }, [saved]);

  const publish = async () => {
    setSaving(true);
    try {
      const normalized = normalizeSiteContent(draft);
      await saveHomepageContent(normalized);
      setDraft(normalized);
      setStatus({ kind: "success", message: "Your changes are published and visible on the website." });
    } catch (error) {
      console.error("Unable to publish site content", error);
      setStatus({
        kind: "error",
        message: "Your changes could not be published. They are still here. Check your connection and try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const revert = () => {
    setDraft(saved);
    setStatus({ kind: "success", message: "Unsaved changes discarded." });
  };

  const RESET_PHRASE = "Reset All";
  /* Case- and whitespace-forgiving: the point is deliberate intent, not a
     spelling test. */
  const resetConfirmed = resetTyped.trim().toLowerCase() === RESET_PHRASE.toLowerCase();

  const closeResetPrompt = () => {
    setResetPrompt(false);
    setResetTyped("");
  };

  const restoreDefaults = async () => {
    if (!resetConfirmed) return;
    closeResetPrompt();
    setSaving(true);
    setDraft(DEFAULT_SITE_CONTENT);
    try {
      await saveHomepageContent(DEFAULT_SITE_CONTENT);
      setStatus({
        kind: "success",
        message: "The original website content has been restored and published.",
      });
    } catch (error) {
      console.error("Unable to restore site content defaults", error);
      setStatus({
        kind: "error",
        message: "The original content could not be restored. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!status || status.kind === "error") return;
    const timer = setTimeout(() => setStatus(null), 4000);
    return () => clearTimeout(timer);
  }, [status]);

  /* One helper per section rather than a generic setter: it keeps each
     editor's props exactly typed to its own slice. */
  const set = <Key extends SectionKey>(key: Key, value: SiteContent[Key] | ((current: SiteContent[Key]) => SiteContent[Key])) =>
    setDraft((current) => ({ ...current, [key]: typeof value === "function" ? value(current[key]) : value }));

  const setEnabled = (key: SectionKey, enabled: boolean) =>
    setDraft((current) => ({ ...current, [key]: { ...current[key], enabled } }));

  const normalizedDraft = normalizeSiteContent(draft);
  const changedSections = SECTION_ORDER.filter((key) =>
    JSON.stringify(normalizedDraft[key]) !== JSON.stringify(saved[key]),
  );
  const meta = SECTION_META[active];
  const currentGroup = SECTION_GROUPS.find((item) => item.id === group) ?? SECTION_GROUPS[0];
  const searchTerm = query.trim().toLowerCase();
  const visibleSections = (searchTerm ? SECTION_ORDER : currentGroup.keys).filter((key) => {
    const item = SECTION_META[key];
    return `${item.label} ${item.hint}`.toLowerCase().includes(searchTerm);
  });
  const previewHref = active === "contact" ? "/contact" : active === "addOn" ? "/add-on" : active === "auth" ? "/login" : "/";
  const selectSection = (key: SectionKey) => {
    setActive(key);
    setGroup(SECTION_GROUPS.find((item) => item.keys.includes(key))?.id ?? "homepage");
  };

  return (
    <div className={styles.workspace}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Your website</p>
          <h1>Website content</h1>
          <p>Update your pages, photos and wording. Choose a section, make your changes, then publish when you are ready.</p>
        </div>
        <Link href="/" target="_blank" className={styles.secondaryLink}>
          <ExternalLink className="size-4" /> View live website
        </Link>
      </header>

      <ol className={styles.steps} aria-label="How to update your website">
        <li><span>1</span><div><strong>Choose a section</strong><p>Find the page or content you want to update.</p></div></li>
        <li><span>2</span><div><strong>Make your changes</strong><p>Switch sections freely; your edits stay here.</p></div></li>
        <li><span>3</span><div><strong>Publish to the website</strong><p>All your changes go live together.</p></div></li>
      </ol>

      <div className={styles.saveBar}>
        <div className={styles.saveState}>
          <span className={`${styles.stateDot} ${dirty ? styles.pendingDot : ""}`} />
          <div>
            <strong>{dirty ? !documentExists ? "Ready for your first publish" : `${changedSections.length} section${changedSections.length === 1 ? "" : "s"} with unpublished changes` : "Everything is published"}</strong>
            <p>{dirty ? "The live website updates only when you publish." : "Choose any section below to make an update."}</p>
          </div>
        </div>
        <div className={styles.actions}>
          {changedSections.length > 0 && <button type="button" onClick={() => setReviewChanges(!reviewChanges)} aria-expanded={reviewChanges} className={styles.textButton}>Review changes</button>}
          <Button variant="ghost" onClick={revert} disabled={!dirty || saving}>Discard changes</Button>
          <Button onClick={() => void publish()} disabled={!dirty || saving}>
            {saving ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
            {saving ? "Publishing…" : "Publish changes"}
          </Button>
        </div>
      </div>
      {status && (
        <div role={status.kind === "error" ? "alert" : "status"} className={`${styles.feedback} ${status.kind === "error" ? styles.error : ""}`}>
          {status.kind === "error" ? <AlertCircle className="size-4 shrink-0" /> : <Check className="size-4 shrink-0" />}
          {status.message}
        </div>
      )}
      {reviewChanges && changedSections.length > 0 && (
        <div className={styles.changeReview}>
          <strong>These sections will be published together</strong>
          <div>{changedSections.map((key) => <button type="button" key={key} onClick={() => selectSection(key)}>{SECTION_META[key].label}<ChevronRight className="size-3.5" /></button>)}</div>
        </div>
      )}

      <div className={styles.groupTabs} role="group" aria-label="Content area">
        {SECTION_GROUPS.map((item) => (
          <button type="button" key={item.id} aria-pressed={group === item.id && !searchTerm} onClick={() => { setGroup(item.id); setQuery(""); setActive(item.keys[0]); }}>
            {item.label}<span>{item.keys.length}</span>
          </button>
        ))}
        <Link href="/admin/banners">Page banners <ChevronRight className="size-4" /></Link>
      </div>

      <div className={styles.editorLayout}>
        <nav aria-label="Website sections" className={styles.sectionNav}>
          <label className={styles.search}>
            <Search className="size-4" aria-hidden="true" />
            <input aria-label="Find a website section" placeholder="Find a section…" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <p className={styles.navDescription}>{searchTerm ? `${visibleSections.length} matching sections` : currentGroup.description}</p>
          <ul className={styles.sectionList}>
            {visibleSections.map((key) => {
              const item = SECTION_META[key];
              const Icon = item.icon;
              const isActive = key === active;
              const changed = changedSections.includes(key);
              return (
                <li key={key}>
                  <button type="button" onClick={() => selectSection(key)} aria-current={isActive ? "true" : undefined} className={`${styles.sectionButton} ${isActive ? styles.activeSection : ""}`}>
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    <span className={styles.sectionName}><strong>{item.label}</strong><small>{item.hint}</small><span className={changed ? styles.changedLabel : styles.visibilityLabel}>{changed ? "Unpublished changes" : sectionState(key, draft[key].enabled)}</span></span>
                    {isActive && <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />}
                  </button>
                </li>
              );
            })}
          </ul>
          {visibleSections.length === 0 && <div className={styles.noResults}><strong>No sections found</strong><p>Try “photos”, “contact” or “reviews”.</p><button type="button" onClick={() => setQuery("")}>Clear search</button></div>}
        </nav>

        <div className="min-w-0 space-y-5" aria-busy={saving}>
          <div className={styles.sectionHeading}>
            <div><p className={styles.eyebrow}>{SECTION_GROUPS.find((item) => item.keys.includes(active))?.label}</p><h2>{meta.label}</h2><p>{meta.hint}. Changes here are included when you publish.</p></div>
            <Link href={previewHref} target="_blank" className={styles.textLink}>View live page <ExternalLink className="size-3.5" /></Link>
          </div>
          <fieldset disabled={saving} className="min-w-0 space-y-5 disabled:opacity-70">
            <legend className="sr-only">Edit {meta.label}</legend>
          <Toggle
            label={meta.toggleLabel ?? `Show “${meta.label}” on the homepage`}
            description={draft[active].enabled ? (meta.toggleOn ?? "This section will be visible after you publish.") : (meta.toggleOff ?? "This section will be hidden after you publish. Your content stays saved so you can show it again later.")}
            checked={draft[active].enabled}
            onChange={(next) => setEnabled(active, next)}
          />
            <SectionEditor active={active} draft={draft} set={set} packages={packages} />
          </fieldset>
        </div>
      </div>

      <details className={styles.advanced}>
        <summary>Advanced: restore original website content</summary>
        <div><p>Replace every section with the original website content. This publishes immediately and cannot be undone.</p><Button variant="danger" onClick={() => setResetPrompt(true)} disabled={saving}><RotateCcw className="size-4" /> Restore all original content</Button></div>
      </details>

      {resetPrompt && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-all-title"
          className="fixed inset-0 z-50 grid place-items-center bg-cmt-neutral-900/50 p-4"
          onClick={closeResetPrompt}
        >
          <form
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              void restoreDefaults();
            }}
            className="w-full max-w-md overflow-hidden rounded-cmt-md bg-white shadow-cmt-xl"
          >
            <div className="flex gap-3 px-5 pt-5">
              <span className="grid size-9 shrink-0 place-items-center rounded-cmt-full bg-red-50 text-red-600">
                <AlertCircle className="size-5" />
              </span>
              <div className="min-w-0">
                <h2
                  id="reset-all-title"
                  className="font-display text-lg font-semibold text-cmt-neutral-900"
                >
                  Reset all website content?
                </h2>
                <p className="mt-1.5 text-sm leading-6 text-cmt-neutral-600">
                  Every section goes back to the content that ships with the site — the
                  header, the sign-in screens, the contact and Add On pages and every homepage band —
                  and it publishes straight away, so the live site changes for
                  everyone. This cannot be undone.
                </p>
              </div>
            </div>

            <div className="px-5 pb-1 pt-4">
              <label className="block">
                <FieldLabel>
                  Type <span className="font-bold text-cmt-neutral-900">{RESET_PHRASE}</span> to
                  confirm
                </FieldLabel>
                <input
                  autoFocus
                  value={resetTyped}
                  onChange={(event) => setResetTyped(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") closeResetPrompt();
                  }}
                  placeholder={RESET_PHRASE}
                  aria-invalid={resetTyped.length > 0 && !resetConfirmed}
                  className={inputClass}
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-cmt-neutral-100 bg-cmt-neutral-50 px-5 py-4">
              <Button variant="ghost" onClick={closeResetPrompt}>
                Cancel
              </Button>
              {/* Stays disabled until the phrase matches, so Enter cannot fire
                  the reset early either. */}
              <Button type="submit" variant="danger" disabled={!resetConfirmed || saving}>
                <RotateCcw className="size-4" /> Reset all
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

/* Split out so the switch stays readable and each branch keeps its exact
   prop types rather than being widened to a common shape. */
function SectionEditor({
  active,
  draft,
  set,
  packages,
}: {
  active: SectionKey;
  draft: SiteContent;
  set: <Key extends SectionKey>(key: Key, value: SiteContent[Key] | ((current: SiteContent[Key]) => SiteContent[Key])) => void;
  packages: ReturnType<typeof usePackages>;
}): ReactNode {
  switch (active) {
    case "footerBadges":
      return <FooterBadgesEditor value={draft.footerBadges} onChange={(next) => set("footerBadges", next)} />;
    case "comingSoon":
      return <ComingSoonEditor value={draft.comingSoon} onChange={(next) => set("comingSoon", next)} />;
    case "header":
      return <HeaderEditor value={draft.header} onChange={(next) => set("header", next)} />;
    case "auth":
      return <AuthEditor value={draft.auth} onChange={(next) => set("auth", next)} />;
    case "contact":
      return <ContactEditor value={draft.contact} onChange={(next) => set("contact", next)} />;
    case "addOn":
      return <AddOnEditor value={draft.addOn} onChange={(next) => set("addOn", next)} />;
    case "hero":
      return (
        <HeroEditor
          hero={draft.hero}
          packages={packages}
          onChange={(hero) => set("hero", hero)}
        />
      );
    case "categories":
      return (
        <CategoriesEditor
          categories={draft.categories}
          onChange={(categories) => set("categories", categories)}
        />
      );
    case "trending":
      return (
        <TrendingEditor value={draft.trending} onChange={(next) => set("trending", next)} />
      );
    case "compare":
      return <CompareEditor value={draft.compare} onChange={(next) => set("compare", next)} />;
    case "featured":
      return (
        <FeaturedEditor value={draft.featured} onChange={(next) => set("featured", next)} />
      );
    case "weekendTreks":
      return (
        <WeekendTreksEditor
          value={draft.weekendTreks}
          onChange={(next) => set("weekendTreks", next)}
        />
      );
    case "trainBanner":
      return (
        <TrainBannerEditor
          value={draft.trainBanner}
          onChange={(next) => set("trainBanner", next)}
        />
      );
    case "domestic":
      return (
        <DomesticEditor value={draft.domestic} onChange={(next) => set("domestic", next)} />
      );
    case "international":
      return (
        <InternationalEditor
          value={draft.international}
          onChange={(next) => set("international", next)}
        />
      );
    case "whyUs":
      return <WhyUsEditor value={draft.whyUs} onChange={(next) => set("whyUs", next)} />;
    case "latestDeals":
      return (
        <LatestDealsEditor
          value={draft.latestDeals}
          onChange={(next) => set("latestDeals", next)}
        />
      );
    case "reviews":
      return <ReviewsEditor value={draft.reviews} onChange={(next) => set("reviews", next)} />;
    case "gallery":
      return <GalleryEditor value={draft.gallery} onChange={(next) => set("gallery", next)} />;
    case "guides":
      return <GuidesEditor value={draft.guides} onChange={(next) => set("guides", next)} />;
    case "faq":
      return <FaqEditor value={draft.faq} onChange={(next) => set("faq", next)} />;
    case "newsletter":
      return (
        <NewsletterEditor
          value={draft.newsletter}
          onChange={(next) => set("newsletter", next)}
        />
      );
  }
}

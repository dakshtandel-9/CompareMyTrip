"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AlertCircle,
  BadgePercent,
  BookOpen,
  Check,
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
    label: "Coming soon",
    hint: "Website launch switch",
    icon: Plane,
    toggleLabel: "Enable coming-soon mode",
    toggleOn: "Visitors will see the coming-soon page after you publish. Admin access stays available.",
    toggleOff: "The regular website is live. Enable this switch and publish to show the coming-soon page.",
  },
  header: {
    label: "Header",
    hint: "Nav links and dropdowns",
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
    label: "Add On",
    hint: "Flight, hotel, visa and quote headings",
    icon: Plane,
    toggleLabel: "Show the top section on Add On pages",
    toggleOn: "Each service shows its own top text, heading and description.",
    toggleOff: "Hidden — the service tabs and enquiry forms remain available.",
  },
  hero: { label: "Hero", hint: "Headlines, trust row, top picks", icon: Sparkles },
  categories: { label: "Travel styles", hint: "Icon and photo cards", icon: PanelsTopLeft },
  trending: { label: "Trending", hint: "Destination rail", icon: TrendingUp },
  compare: { label: "Compare", hint: "Comparison band heading", icon: Layers },
  featured: { label: "Featured packages", hint: "Tabs and grid", icon: Sparkles },
  weekendTreks: { label: "Weekend treks", hint: "Trek cards", icon: Mountain },
  trainBanner: { label: "Train banner", hint: "Looping video band", icon: TrainFront },
  domestic: { label: "Domestic holidays", hint: "Accordion gallery", icon: Compass },
  international: { label: "International", hint: "Country cards", icon: Globe2 },
  whyUs: { label: "Why travel with us", hint: "Proof points", icon: ShieldCheck },
  latestDeals: { label: "Latest deals", hint: "Promo card and grid", icon: BadgePercent },
  gallery: { label: "Travel gallery", hint: "Photos, captions and layout", icon: Images },
  reviews: { label: "Reviews", hint: "Traveller quotes", icon: MessageSquareQuote },
  guides: { label: "Travel guides", hint: "Article cards", icon: BookOpen },
  faq: { label: "FAQ", hint: "Questions and help card", icon: HelpCircle },
  newsletter: { label: "Trust & newsletter", hint: "Sign-up band", icon: Mail },
};

export default function ContentEditor() {
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

  return <ContentEditorForm saved={content} loadError={error} documentExists={exists} />;
}

type EditorStatus = { kind: "success" | "error"; message: string };

function ContentEditorForm({
  saved,
  loadError,
  documentExists,
}: {
  saved: SiteContent;
  loadError: string;
  documentExists: boolean;
}) {
  const packages = usePackages();

  /* A working copy, so nothing reaches the live site until Publish. */
  const [draft, setDraft] = useState<SiteContent>(saved);
  const [status, setStatus] = useState<EditorStatus | null>(
    loadError ? { kind: "error", message: loadError } : null,
  );
  const [saving, setSaving] = useState(false);
  const [active, setActive] = useState<SectionKey>("hero");
  /* Reset all overwrites every section in Firebase, and there is no undo once
     it lands — so it is held behind a typed confirmation rather than a click. */
  const [resetPrompt, setResetPrompt] = useState(false);
  const [resetTyped, setResetTyped] = useState("");
  const previousSaved = useRef(saved);

  /* `saved` always comes back through the normaliser, so the draft goes
     through it too — otherwise two equal documents could still compare
     unequal purely on key order. */
  const dirty =
    !documentExists ||
    JSON.stringify(normalizeSiteContent(draft)) !== JSON.stringify(saved);

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
      setStatus({ kind: "success", message: "Published to Firebase — the site is live." });
    } catch (error) {
      console.error("Unable to publish site content", error);
      setStatus({
        kind: "error",
        message: "Publish failed. Check Firebase access and try again.",
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
        message: "Original site content restored in Firebase.",
      });
    } catch (error) {
      console.error("Unable to restore site content defaults", error);
      setStatus({
        kind: "error",
        message: "Reset failed. Check Firebase access and try again.",
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
  const set = <Key extends SectionKey>(key: Key, value: SiteContent[Key]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const setEnabled = (key: SectionKey, enabled: boolean) =>
    setDraft((current) => ({ ...current, [key]: { ...current[key], enabled } }));

  const hiddenCount = SECTION_ORDER.filter((key) => key !== "comingSoon" && !draft[key].enabled).length;
  const meta = SECTION_META[active];

  return (
    <div>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cmt-primary-700">
            Content
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Website content
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-cmt-neutral-600">
            Every page the site publishes, in the order a visitor meets it — the header,
            the sign-in screens, the contact and Add On pages and each homepage band. Edit the copy,
            the photos, the icons and the cards, then publish and the live site updates
            immediately from Firebase.
          </p>
        </div>

        <Link
          href="/"
          target="_blank"
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-cmt-control border border-cmt-neutral-200 bg-white px-4 text-sm font-semibold text-cmt-neutral-700 shadow-cmt-xs transition-colors hover:bg-cmt-neutral-50"
        >
          <ExternalLink className="size-4" /> Preview site
        </Link>
      </header>

      {/* Sticky action bar: the editors below are long, and Publish has to
          stay in reach from the bottom of the last card. */}
      <div className="sticky top-16 z-20 -mx-4 mt-6 border-y border-cmt-neutral-200 bg-cmt-neutral-50/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-semibold text-cmt-neutral-900">
            {meta.label}
            {hiddenCount > 0 && (
              <span className="ml-2 font-normal text-cmt-neutral-500">
                · {hiddenCount} section{hiddenCount === 1 ? "" : "s"} hidden
              </span>
            )}
          </p>

          <span className="flex-1" />

          {status && (
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                status.kind === "error" ? "text-red-600" : "text-cmt-primary-900"
              }`}
            >
              {status.kind === "error" ? (
                <AlertCircle className="size-3.5" />
              ) : (
                <Check className="size-3.5" />
              )}
              {status.message}
            </span>
          )}

          <Button variant="ghost" onClick={() => setResetPrompt(true)} disabled={saving}>
            <RotateCcw className="size-4" /> Reset all
          </Button>
          <Button variant="ghost" onClick={revert} disabled={!dirty || saving}>
            Discard
          </Button>
          <Button onClick={() => void publish()} disabled={!dirty || saving}>
            {saving ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {saving
              ? "Publishing…"
              : !documentExists
                ? "Publish to Firebase"
                : dirty
                  ? "Publish changes"
                  : "Published"}
          </Button>
        </div>
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[248px_minmax(0,1fr)]">
        {/* Section rail */}
        <nav
          aria-label="Website sections"
          className="lg:sticky lg:top-[132px] rounded-cmt-md border border-cmt-neutral-200 bg-white p-2 shadow-cmt-xs"
        >
          <ul className="max-h-[70vh] space-y-0.5 overflow-y-auto">
            {SECTION_ORDER.map((key, index) => {
              const item = SECTION_META[key];
              const Icon = item.icon;
              const isActive = key === active;
              const isOn = draft[key].enabled;

              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => setActive(key)}
                    aria-current={isActive ? "true" : undefined}
                    className={`flex w-full items-center gap-2.5 rounded-cmt-sm px-2.5 py-2 text-left transition-colors ${
                      isActive
                        ? "bg-cmt-secondary-900 text-white"
                        : "text-cmt-neutral-700 hover:bg-cmt-neutral-100"
                    }`}
                  >
                    <span
                      className={`w-4 shrink-0 text-[10px] font-bold tabular-nums ${
                        isActive ? "text-white/40" : "text-cmt-neutral-300"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <Icon
                      className={`size-4 shrink-0 ${
                        isActive ? "text-cmt-primary-500" : "text-cmt-neutral-400"
                      }`}
                      strokeWidth={2}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold leading-tight">
                        {item.label}
                      </span>
                      <span
                        className={`block truncate text-[11px] leading-tight ${
                          isActive ? "text-white/50" : "text-cmt-neutral-400"
                        }`}
                      >
                        {item.hint}
                      </span>
                    </span>
                    {/* A dot rather than a word: the rail is a map, and the
                        section's own switch is one click away. */}
                    <span
                      title={key === "comingSoon" ? (isOn ? "Coming soon enabled" : "Website live") : (isOn ? "Visible" : "Hidden")}
                      className={`size-1.5 shrink-0 rounded-cmt-full ${
                        isOn ? "bg-cmt-primary-500" : "bg-cmt-neutral-300"
                      }`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Selected section */}
        <div className="min-w-0 space-y-5">
          <Toggle
            label={meta.toggleLabel ?? `Show “${meta.label}” on the homepage`}
            description={
              draft[active].enabled
                ? (meta.toggleOn ?? "This section is live.")
                : (meta.toggleOff ??
                  "Hidden — the page renders without it, and nothing below shifts out of order.")
            }
            checked={draft[active].enabled}
            onChange={(next) => setEnabled(active, next)}
          />

          <SectionEditor
            active={active}
            draft={draft}
            set={set}
            packages={packages}
          />
        </div>
      </div>

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
                  and it publishes to Firebase straight away, so the live site changes for
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
  set: <Key extends SectionKey>(key: Key, value: SiteContent[Key]) => void;
  packages: ReturnType<typeof usePackages>;
}): ReactNode {
  switch (active) {
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

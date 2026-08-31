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
  Layers,
  LoaderCircle,
  type LucideIcon,
  Mail,
  MessageSquareQuote,
  Mountain,
  PanelsTopLeft,
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
import { Button, Toggle } from "../_components/ui";
import CategoriesEditor from "./CategoriesEditor";
import HeroEditor from "./HeroEditor";
import {
  CompareEditor,
  DomesticEditor,
  FaqEditor,
  FeaturedEditor,
  GuidesEditor,
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
/* Homepage CRM.                                                       */
/*                                                                     */
/* One screen, a rail of every section down the left in the order they  */
/* appear on the page, and that section's editor on the right. The      */
/* draft lives here so Publish is a single write of the whole document  */
/* rather than fifteen sections saving independently.                   */
/* ------------------------------------------------------------------ */

const SECTION_META: Record<SectionKey, { label: string; hint: string; icon: LucideIcon }> = {
  hero: { label: "Hero", hint: "Headlines, trust row, top picks", icon: Sparkles },
  categories: { label: "Travel styles", hint: "Icon and photo cards", icon: PanelsTopLeft },
  trending: { label: "Trending", hint: "Destination rail", icon: TrendingUp },
  compare: { label: "Compare", hint: "Comparison band heading", icon: Layers },
  featured: { label: "Featured packages", hint: "Tabs and grid", icon: Sparkles },
  weekendTreks: { label: "Weekend treks", hint: "Trek cards", icon: Mountain },
  trainBanner: { label: "Train banner", hint: "Scrubbed video band", icon: TrainFront },
  domestic: { label: "Domestic holidays", hint: "Accordion gallery", icon: Compass },
  international: { label: "International", hint: "Country cards", icon: Globe2 },
  whyUs: { label: "Why travel with us", hint: "Proof points", icon: ShieldCheck },
  latestDeals: { label: "Latest deals", hint: "Promo card and grid", icon: BadgePercent },
  reviews: { label: "Reviews", hint: "Traveller quotes", icon: MessageSquareQuote },
  guides: { label: "Travel guides", hint: "Article cards", icon: BookOpen },
  faq: { label: "FAQ", hint: "Questions and help card", icon: HelpCircle },
  newsletter: { label: "Trust & newsletter", hint: "Sign-up band", icon: Mail },
};

export default function HomepageEditor() {
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

  return <HomepageEditorForm saved={content} loadError={error} documentExists={exists} />;
}

type EditorStatus = { kind: "success" | "error"; message: string };

function HomepageEditorForm({
  saved,
  loadError,
  documentExists,
}: {
  saved: SiteContent;
  loadError: string;
  documentExists: boolean;
}) {
  const packages = usePackages();

  /* A working copy, so nothing reaches the live homepage until Publish. */
  const [draft, setDraft] = useState<SiteContent>(saved);
  const [status, setStatus] = useState<EditorStatus | null>(
    loadError ? { kind: "error", message: loadError } : null,
  );
  const [saving, setSaving] = useState(false);
  const [active, setActive] = useState<SectionKey>("hero");
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
      setStatus({ kind: "success", message: "Published to Firebase — the homepage is live." });
    } catch (error) {
      console.error("Unable to publish homepage content", error);
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

  const restoreDefaults = async () => {
    setSaving(true);
    setDraft(DEFAULT_SITE_CONTENT);
    try {
      await saveHomepageContent(DEFAULT_SITE_CONTENT);
      setStatus({
        kind: "success",
        message: "Original homepage content restored in Firebase.",
      });
    } catch (error) {
      console.error("Unable to restore homepage defaults", error);
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

  const hiddenCount = SECTION_ORDER.filter((key) => !draft[key].enabled).length;
  const meta = SECTION_META[active];

  return (
    <div>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cmt-primary-700">
            Content
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Homepage
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-cmt-neutral-600">
            Every section of the homepage, in the order it appears. Edit the copy, the
            photos, the icons and the cards — then publish, and the live site updates
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

          <Button variant="ghost" onClick={() => void restoreDefaults()} disabled={saving}>
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
          aria-label="Homepage sections"
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
                      title={isOn ? "Visible" : "Hidden"}
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
            label={`Show “${meta.label}” on the homepage`}
            description={
              draft[active].enabled
                ? "This section is live."
                : "Hidden — the page renders without it, and nothing below shifts out of order."
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

"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  Type,
  UsersRound,
} from "lucide-react";

import { nextId, type HeroContent, type HeroCopyBlock } from "@/lib/siteContent";
import type { TravelPackage } from "@/lib/packageData";
import ImageField from "../_components/ImageField";
import {
  Button,
  Card,
  FieldLabel,
  SegmentedControl,
  TextArea,
  TextField,
  Toggle,
  inputClass,
} from "../_components/ui";

/* ------------------------------------------------------------------ */
/* Hero editor — the three things the hero says: the rotating copy, the */
/* social-proof row, and the shelf of packages under the search panel.  */
/* ------------------------------------------------------------------ */

const MAX_FACES = 6;

const formatINR = (value: number) => `₹${value.toLocaleString("en-IN")}`;

function CopyBlockRow({
  block,
  index,
  total,
  onChange,
  onMove,
  onRemove,
}: {
  block: HeroCopyBlock;
  index: number;
  total: number;
  onChange: (patch: Partial<HeroCopyBlock>) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <li className="rounded-cmt-sm border border-cmt-neutral-200 bg-cmt-neutral-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-cmt-neutral-500">
          <GripVertical className="size-3.5" aria-hidden="true" />
          Slide {index + 1}
        </span>
        <span className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            aria-label={`Move slide ${index + 1} up`}
            className="grid size-8 place-items-center rounded-cmt-sm border border-cmt-neutral-200 bg-white text-cmt-neutral-600 transition-colors enabled:hover:bg-cmt-neutral-100 disabled:opacity-35"
          >
            <ChevronUp className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            aria-label={`Move slide ${index + 1} down`}
            className="grid size-8 place-items-center rounded-cmt-sm border border-cmt-neutral-200 bg-white text-cmt-neutral-600 transition-colors enabled:hover:bg-cmt-neutral-100 disabled:opacity-35"
          >
            <ChevronDown className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={total <= 1}
            aria-label={`Delete slide ${index + 1}`}
            className="grid size-8 place-items-center rounded-cmt-sm border border-cmt-neutral-200 bg-white text-red-600 transition-colors enabled:hover:bg-red-50 disabled:opacity-35"
          >
            <Trash2 className="size-3.5" />
          </button>
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Title — line 1"
          value={block.titleLine1}
          onChange={(value) => onChange({ titleLine1: value })}
          placeholder="Smart travel packages."
        />
        <TextField
          label="Title — line 2"
          value={block.titleLine2}
          onChange={(value) => onChange({ titleLine2: value })}
          placeholder="Better choices."
          hint="Leave blank for a single-line headline."
        />
      </div>

      <TextArea
        className="mt-3"
        label="Description"
        value={block.body}
        onChange={(value) => onChange({ body: value })}
        placeholder="Compare curated travel packages side by side…"
      />
    </li>
  );
}

function PackagePickerRow({
  pkg,
  selected,
  order,
  onToggle,
}: {
  pkg: TravelPackage;
  selected: boolean;
  order: number;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={`flex w-full items-center gap-3 rounded-cmt-sm border p-2 text-left transition-colors ${
        selected
          ? "border-cmt-primary-500 bg-cmt-primary-50"
          : "border-cmt-neutral-200 bg-white hover:border-cmt-neutral-300 hover:bg-cmt-neutral-50"
      }`}
    >
      <span className="relative size-11 shrink-0 overflow-hidden rounded-cmt-sm bg-cmt-neutral-100">
        {pkg.image?.startsWith("data:") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pkg.image} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <Image src={pkg.image} alt="" fill sizes="44px" className="object-cover" />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-cmt-neutral-900">
          {pkg.title}
        </span>
        <span className="mt-0.5 flex items-center gap-2 text-xs text-cmt-neutral-500">
          <span className="truncate">{pkg.destination}</span>
          <span className="inline-flex shrink-0 items-center gap-0.5">
            <Star className="size-3 fill-cmt-primary-500 text-cmt-primary-500" />
            {pkg.rating}
          </span>
          <span className="shrink-0 font-semibold text-cmt-neutral-700">
            {formatINR(pkg.price)}
          </span>
        </span>
      </span>

      <span
        className={`grid size-6 shrink-0 place-items-center rounded-cmt-full text-[11px] font-bold ${
          selected
            ? "bg-cmt-primary-500 text-cmt-neutral-900"
            : "border border-cmt-neutral-200 text-cmt-neutral-300"
        }`}
      >
        {selected ? order : ""}
      </span>
    </button>
  );
}

export default function HeroEditor({
  hero,
  onChange,
  packages,
}: {
  hero: HeroContent;
  onChange: (next: HeroContent) => void;
  packages: TravelPackage[];
}) {
  const [query, setQuery] = useState("");

  const patch = (value: Partial<HeroContent>) => onChange({ ...hero, ...value });

  const updateCopy = (index: number, value: Partial<HeroCopyBlock>) =>
    patch({
      copy: hero.copy.map((block, blockIndex) =>
        blockIndex === index ? { ...block, ...value } : block,
      ),
    });

  const moveCopy = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= hero.copy.length) return;
    const next = [...hero.copy];
    [next[index], next[target]] = [next[target], next[index]];
    patch({ copy: next });
  };

  const addCopy = () =>
    patch({
      copy: [
        ...hero.copy,
        {
          id: nextId("hero", hero.copy),
          titleLine1: "New headline.",
          titleLine2: "Second line.",
          body: "Say what makes this trip worth booking.",
        },
      ],
    });

  const removeCopy = (index: number) =>
    patch({ copy: hero.copy.filter((_, blockIndex) => blockIndex !== index) });

  const setTrust = (value: Partial<HeroContent["trust"]>) =>
    patch({ trust: { ...hero.trust, ...value } });

  const setPicks = (value: Partial<HeroContent["topPicks"]>) =>
    patch({ topPicks: { ...hero.topPicks, ...value } });

  const togglePick = (id: string) => {
    const chosen = hero.topPicks.packageIds;
    setPicks({
      packageIds: chosen.includes(id)
        ? chosen.filter((item) => item !== id)
        : [...chosen, id],
    });
  };

  const visiblePackages = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return packages;
    return packages.filter(
      (pkg) =>
        pkg.title.toLowerCase().includes(term) ||
        pkg.destination.toLowerCase().includes(term) ||
        pkg.location.toLowerCase().includes(term),
    );
  }, [packages, query]);

  return (
    <div className="space-y-5">
      <Card
        icon={<Type className="size-5" />}
        title="Hero headlines"
        description="Each slide takes an equal share of the hero scroll and fades into the next."
        action={
          <Button variant="ghost" onClick={addCopy}>
            <Plus className="size-4" /> Add slide
          </Button>
        }
      >
        <ul className="space-y-3">
          {hero.copy.map((block, index) => (
            <CopyBlockRow
              key={block.id}
              block={block}
              index={index}
              total={hero.copy.length}
              onChange={(value) => updateCopy(index, value)}
              onMove={(direction) => moveCopy(index, direction)}
              onRemove={() => removeCopy(index)}
            />
          ))}
        </ul>
      </Card>

      <Card
        icon={<UsersRound className="size-5" />}
        title="Trusted by"
        description="The social-proof row sitting under the headline."
      >
        <Toggle
          label="Show the trusted-by row"
          description="Hiding it leaves the headline and search panel untouched."
          checked={hero.trust.enabled}
          onChange={(next) => setTrust({ enabled: next })}
        />

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <TextField
            label="Leading text"
            value={hero.trust.prefix}
            onChange={(value) => setTrust({ prefix: value })}
            placeholder="Trusted by"
          />
          <TextField
            label="Highlighted number"
            value={hero.trust.highlight}
            onChange={(value) => setTrust({ highlight: value })}
            placeholder="50K+"
            hint="Rendered in brand gold."
          />
          <TextField
            label="Trailing text"
            value={hero.trust.suffix}
            onChange={(value) => setTrust({ suffix: value })}
            placeholder="travellers"
          />
        </div>

        <div className="mt-6">
          <FieldLabel>Thumbnails — up to {MAX_FACES}</FieldLabel>
          <div className="space-y-4">
            {hero.trust.faces.map((face, index) => (
              /* Keyed by position, not by value: keying on the path would
                 remount the field — and drop focus — on every keystroke. */
              <div key={index} className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <ImageField
                    label={`Thumbnail ${index + 1}`}
                    value={face}
                    aspect="aspect-square"
                    onChange={(value) =>
                      setTrust({
                        faces: hero.trust.faces.map((item, faceIndex) =>
                          faceIndex === index ? value : item,
                        ),
                      })
                    }
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setTrust({
                      faces: hero.trust.faces.filter((_, faceIndex) => faceIndex !== index),
                    })
                  }
                  aria-label={`Remove thumbnail ${index + 1}`}
                  className="mt-6 grid size-9 shrink-0 place-items-center rounded-cmt-sm border border-cmt-neutral-200 bg-white text-red-600 transition-colors hover:bg-red-50"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>

          {hero.trust.faces.length < MAX_FACES && (
            <Button
              variant="ghost"
              className="mt-4"
              onClick={() =>
                setTrust({ faces: [...hero.trust.faces, "/destinations/goa.jpg"] })
              }
            >
              <Plus className="size-4" /> Add thumbnail
            </Button>
          )}
        </div>
      </Card>

      <Card
        icon={<Sparkles className="size-5" />}
        title="Top picks for you"
        description="The package shelf under the hero search panel."
      >
        <Toggle
          label="Show the top-picks shelf"
          checked={hero.topPicks.enabled}
          onChange={(next) => setPicks({ enabled: next })}
        />

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <TextField
            label="Shelf title"
            value={hero.topPicks.title}
            onChange={(value) => setPicks({ title: value })}
            placeholder="Top picks for you"
          />
          <TextField
            label="Shelf sub-line"
            value={hero.topPicks.subtitle}
            onChange={(value) => setPicks({ subtitle: value })}
            placeholder="Curated packages you might love"
          />
        </div>

        <div className="mt-6 flex flex-wrap items-end gap-5">
          <SegmentedControl
            label="Which packages"
            value={hero.topPicks.mode}
            onChange={(mode) => setPicks({ mode })}
            options={[
              { value: "auto", label: "Automatic" },
              { value: "manual", label: "Hand-picked" },
            ]}
          />

          {hero.topPicks.mode === "auto" && (
            <label className="block">
              <FieldLabel>How many cards</FieldLabel>
              <input
                type="number"
                min={1}
                max={12}
                value={hero.topPicks.limit}
                onChange={(event) =>
                  setPicks({
                    limit: Math.max(1, Math.min(12, Number(event.target.value) || 1)),
                  })
                }
                className={`${inputClass} w-28`}
              />
            </label>
          )}
        </div>

        <p className="mt-3 text-xs leading-5 text-cmt-neutral-500">
          {hero.topPicks.mode === "auto"
            ? "Automatic follows the travel-style pills in the hero: the best-rated packages matching the selected style, refreshed as new packages are published."
            : "Hand-picked shows exactly these packages, in this order, whatever style the visitor selects."}
        </p>

        {hero.topPicks.mode === "manual" && (
          <div className="mt-5">
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-cmt-neutral-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search packages by name or destination…"
                className={`${inputClass} pl-9`}
              />
            </div>

            <p className="mb-2 text-xs font-semibold text-cmt-neutral-600">
              {hero.topPicks.packageIds.length} selected
              {hero.topPicks.packageIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPicks({ packageIds: [] })}
                  className="ml-3 font-semibold text-red-600 hover:underline"
                >
                  Clear all
                </button>
              )}
            </p>

            <div className="max-h-[380px] space-y-2 overflow-y-auto rounded-cmt-sm border border-cmt-neutral-200 bg-cmt-neutral-50 p-2">
              {visiblePackages.map((pkg) => (
                <PackagePickerRow
                  key={pkg.id}
                  pkg={pkg}
                  selected={hero.topPicks.packageIds.includes(pkg.id)}
                  order={hero.topPicks.packageIds.indexOf(pkg.id) + 1}
                  onToggle={() => togglePick(pkg.id)}
                />
              ))}

              {visiblePackages.length === 0 && (
                <p className="py-8 text-center text-sm text-cmt-neutral-500">
                  No package matches “{query}”.
                </p>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

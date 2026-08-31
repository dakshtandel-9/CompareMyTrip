"use client";

import Image from "next/image";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  LayoutList,
  Plus,
  Trash2,
} from "lucide-react";

import { Glyph } from "@/lib/adminIcons";
import { nextId, type CategoriesContent, type CategoryCard } from "@/lib/siteContent";
import IconPicker from "../_components/IconPicker";
import ImageField from "../_components/ImageField";
import { Button, Card, TextArea, TextField } from "../_components/ui";

/* ------------------------------------------------------------------ */
/* Travel-styles editor — the second homepage section. Each card is a   */
/* photo, an icon badge, a title and a one-line tagline, so the editor  */
/* shows the assembled card next to the fields that build it.           */
/* ------------------------------------------------------------------ */

/* Destinations the href field offers as one click, matching the routes the
   packages catalogue actually filters on. */
const HREF_PRESETS = [
  "/packages",
  "/packages?type=honeymoon",
  "/packages?type=family",
  "/packages?type=adventure",
  "/packages?type=luxury",
  "/packages?type=beach",
  "/packages?type=weekend",
  "/packages?type=cultural",
  "/packages?region=india",
  "/packages?region=international",
];

function CardPreview({ card }: { card: CategoryCard }) {
  return (
    <div className="w-[200px] shrink-0">
      <div className="flex h-full flex-col rounded-cmt-lg border border-cmt-neutral-200 bg-white p-2 shadow-cmt-sm">
        <div className="relative">
          <div className="relative aspect-[3/2] w-full overflow-hidden rounded-cmt-md bg-cmt-neutral-100">
            {card.image ? (
              card.image.startsWith("data:") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={card.image} alt="" className="absolute inset-0 size-full object-cover" />
              ) : (
                <Image src={card.image} alt="" fill sizes="200px" className="object-cover" />
              )
            ) : null}
          </div>
          <span className="absolute bottom-0 left-1/2 grid size-10 -translate-x-1/2 translate-y-1/2 place-items-center rounded-cmt-full bg-cmt-primary-500 text-cmt-neutral-900 shadow-cmt-md">
            <Glyph name={card.icon} className="size-[18px]" />
          </span>
        </div>

        <div className="flex flex-1 flex-col items-center px-2 pb-3 pt-7 text-center">
          <p className="font-display text-base font-bold leading-tight text-cmt-neutral-900">
            {card.label || "Untitled"}
          </p>
          <p className="mt-1 text-xs leading-snug text-cmt-neutral-600">{card.tagline}</p>
        </div>
      </div>
      <p className="mt-2 text-center text-[10px] uppercase tracking-[0.08em] text-cmt-neutral-400">
        Live preview
      </p>
    </div>
  );
}

function CategoryRow({
  card,
  index,
  total,
  onChange,
  onMove,
  onDuplicate,
  onRemove,
}: {
  card: CategoryCard;
  index: number;
  total: number;
  onChange: (patch: Partial<CategoryCard>) => void;
  onMove: (direction: -1 | 1) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  return (
    <li className="rounded-cmt-sm border border-cmt-neutral-200 bg-cmt-neutral-50 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-cmt-neutral-500">
          Card {index + 1}
        </span>
        <span className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            aria-label={`Move card ${index + 1} left`}
            className="grid size-8 place-items-center rounded-cmt-sm border border-cmt-neutral-200 bg-white text-cmt-neutral-600 transition-colors enabled:hover:bg-cmt-neutral-100 disabled:opacity-35"
          >
            <ChevronUp className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            aria-label={`Move card ${index + 1} right`}
            className="grid size-8 place-items-center rounded-cmt-sm border border-cmt-neutral-200 bg-white text-cmt-neutral-600 transition-colors enabled:hover:bg-cmt-neutral-100 disabled:opacity-35"
          >
            <ChevronDown className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            aria-label={`Duplicate card ${index + 1}`}
            className="grid size-8 place-items-center rounded-cmt-sm border border-cmt-neutral-200 bg-white text-cmt-neutral-600 transition-colors hover:bg-cmt-neutral-100"
          >
            <Copy className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={total <= 1}
            aria-label={`Delete card ${index + 1}`}
            className="grid size-8 place-items-center rounded-cmt-sm border border-cmt-neutral-200 bg-white text-red-600 transition-colors enabled:hover:bg-red-50 disabled:opacity-35"
          >
            <Trash2 className="size-3.5" />
          </button>
        </span>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Card title"
              value={card.label}
              onChange={(value) => onChange({ label: value })}
              placeholder="Honeymoon"
            />
            <IconPicker value={card.icon} onChange={(icon) => onChange({ icon })} />
          </div>

          <TextField
            label="Small line under the title"
            value={card.tagline}
            onChange={(value) => onChange({ tagline: value })}
            placeholder="Romantic escapes"
          />

          <ImageField
            label="Card photo"
            value={card.image}
            onChange={(image) => onChange({ image })}
          />

          <TextArea
            label="Photo description (alt text)"
            value={card.alt}
            onChange={(value) => onChange({ alt: value })}
            placeholder="A balcony with two chairs looking out over a coastal bay at sunset"
            hint="Read aloud by screen readers and shown if the photo fails to load."
          />

          <div>
            <TextField
              label="Where the card links"
              value={card.href}
              onChange={(value) => onChange({ href: value })}
              placeholder="/packages?type=honeymoon"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {HREF_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onChange({ href: preset })}
                  className={`rounded-cmt-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    card.href === preset
                      ? "border-cmt-primary-500 bg-cmt-primary-50 text-cmt-primary-900"
                      : "border-cmt-neutral-200 bg-white text-cmt-neutral-600 hover:bg-cmt-neutral-100"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        <CardPreview card={card} />
      </div>
    </li>
  );
}

export default function CategoriesEditor({
  categories,
  onChange,
}: {
  categories: CategoriesContent;
  onChange: (next: CategoriesContent) => void;
}) {
  const patch = (value: Partial<CategoriesContent>) => onChange({ ...categories, ...value });

  const updateCard = (index: number, value: Partial<CategoryCard>) =>
    patch({
      cards: categories.cards.map((card, cardIndex) =>
        cardIndex === index ? { ...card, ...value } : card,
      ),
    });

  const moveCard = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= categories.cards.length) return;
    const next = [...categories.cards];
    [next[index], next[target]] = [next[target], next[index]];
    patch({ cards: next });
  };

  const addCard = () =>
    patch({
      cards: [
        ...categories.cards,
        {
          id: nextId("cat", categories.cards),
          label: "New style",
          tagline: "Say it in a few words",
          icon: "MapPin",
          href: "/packages",
          image: "/destinations/kerala.jpg",
          alt: "",
        },
      ],
    });

  const duplicateCard = (index: number) => {
    const next = [...categories.cards];
    next.splice(index + 1, 0, {
      ...categories.cards[index],
      id: nextId("cat", categories.cards),
      label: `${categories.cards[index].label} copy`,
    });
    patch({ cards: next });
  };

  const removeCard = (index: number) =>
    patch({ cards: categories.cards.filter((_, cardIndex) => cardIndex !== index) });

  return (
    <div className="space-y-5">
      <Card
        icon={<LayoutList className="size-5" />}
        title="Section heading"
        description="The eyebrow, headline and sub-line above the travel-style rail."
      >
        <div className="grid gap-4">
          <TextField
            label="Eyebrow"
            value={categories.eyebrow}
            onChange={(value) => patch({ eyebrow: value })}
            placeholder="Browse By Travel Style"
          />
          <TextField
            label="Headline"
            value={categories.title}
            onChange={(value) => patch({ title: value })}
            placeholder="What kind of trip are you after?"
          />
          <TextArea
            label="Sub-line"
            value={categories.description}
            onChange={(value) => patch({ description: value })}
            placeholder="Pick a style that matches your next getaway…"
          />
        </div>
      </Card>

      <Card
        icon={<LayoutList className="size-5" />}
        title={`Travel-style cards (${categories.cards.length})`}
        description="The rail scrolls, so there is no cap — but the first four are what most visitors see."
        action={
          <Button variant="ghost" onClick={addCard}>
            <Plus className="size-4" /> Add card
          </Button>
        }
      >
        <ul className="space-y-4">
          {categories.cards.map((card, index) => (
            <CategoryRow
              key={card.id}
              card={card}
              index={index}
              total={categories.cards.length}
              onChange={(value) => updateCard(index, value)}
              onMove={(direction) => moveCard(index, direction)}
              onDuplicate={() => duplicateCard(index)}
              onRemove={() => removeCard(index)}
            />
          ))}
        </ul>
      </Card>
    </div>
  );
}

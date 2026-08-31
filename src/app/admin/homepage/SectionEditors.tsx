"use client";

import {
  BadgePercent,
  BookOpen,
  Compass,
  Globe2,
  HelpCircle,
  Layers,
  Mail,
  MessageSquareQuote,
  Mountain,
  ShieldCheck,
  Sparkles,
  Star,
  TrainFront,
  TrendingUp,
} from "lucide-react";

import { PACKAGE_CATEGORIES } from "@/lib/packageData";
import {
  VISA_TYPES,
  type CompareContent,
  type DomesticContent,
  type FaqContent,
  type FeaturedContent,
  type GuidesContent,
  type InternationalContent,
  type LatestDealsContent,
  type NewsletterContent,
  type ReviewsContent,
  type TrainBannerContent,
  type TrendingContent,
  type VisaType,
  type WeekendTreksContent,
  type WhyUsContent,
} from "@/lib/siteContent";
import IconPicker from "../_components/IconPicker";
import AvatarField from "../_components/AvatarField";
import ImageField from "../_components/ImageField";
import {
  ListEditor,
  NumberField,
  SectionHeaderFields,
  SelectField,
} from "../_components/EditorParts";
import { Card, FieldLabel, TextArea, TextField } from "../_components/ui";

/* ------------------------------------------------------------------ */
/* One editor per homepage section.                                    */
/*                                                                     */
/* They all take the section's slice of the content and hand back a new */
/* one — no saving, no store access. HomepageEditor owns the draft, so  */
/* these stay pure enough to reorder or drop a section without touching */
/* anything else.                                                      */
/* ------------------------------------------------------------------ */

const grid2 = "grid gap-4 sm:grid-cols-2";
const grid3 = "grid gap-4 sm:grid-cols-3";

/* --------------------------- Trending ----------------------------- */

export function TrendingEditor({
  value,
  onChange,
}: {
  value: TrendingContent;
  onChange: (next: TrendingContent) => void;
}) {
  return (
    <div className="space-y-5">
      <Card
        icon={<TrendingUp className="size-5" />}
        title="Section heading"
        description="The band above the destination rail."
      >
        <SectionHeaderFields
          value={value.header}
          onChange={(header) => onChange({ ...value, header })}
        />
      </Card>

      <Card
        icon={<Compass className="size-5" />}
        title={`Destinations (${value.items.length})`}
        description="Cards run left to right in this order; the rank badge follows the order."
      >
        <ListEditor
          items={value.items}
          onChange={(items) => onChange({ ...value, items })}
          idPrefix="trend"
          addLabel="Add destination"
          summary={(item) => item.name}
          blank={{
            name: "New destination",
            subtitle: "",
            image: "/destinations/goa.jpg",
            price: "9,999",
            packages: 100,
            rise: 10,
            href: "/packages",
          }}
        >
          {(item, patch) => (
            <div className="space-y-4">
              <div className={grid2}>
                <TextField
                  label="Destination"
                  value={item.name}
                  onChange={(name) => patch({ name })}
                />
                <TextField
                  label="Sub-line"
                  value={item.subtitle}
                  onChange={(subtitle) => patch({ subtitle })}
                  placeholder="Beach Getaway"
                />
              </div>

              <ImageField
                label="Photo"
                value={item.image}
                aspect="aspect-[3/4]"
                onChange={(image) => patch({ image })}
              />

              <div className={grid3}>
                <TextField
                  label="Starting price"
                  value={item.price}
                  onChange={(price) => patch({ price })}
                  placeholder="7,999"
                  hint="Shown after ₹, exactly as typed."
                />
                <NumberField
                  label="Packages available"
                  value={item.packages}
                  onChange={(packages) => patch({ packages })}
                />
                <NumberField
                  label="Rise in interest (%)"
                  value={item.rise}
                  max={999}
                  onChange={(rise) => patch({ rise })}
                />
              </div>

              <TextField
                label="Where the card links"
                value={item.href}
                onChange={(href) => patch({ href })}
                placeholder="/packages"
              />
            </div>
          )}
        </ListEditor>
      </Card>
    </div>
  );
}

/* --------------------------- Compare ------------------------------ */

export function CompareEditor({
  value,
  onChange,
}: {
  value: CompareContent;
  onChange: (next: CompareContent) => void;
}) {
  return (
    <Card
      icon={<Layers className="size-5" />}
      title="Section heading"
      description="The comparison table itself is filled by whatever the visitor shortlists, so only the framing is editable here."
    >
      <SectionHeaderFields
        value={value.header}
        onChange={(header) => onChange({ ...value, header })}
      />
    </Card>
  );
}

/* ---------------------- Featured packages ------------------------- */

const FEATURED_TAB_OPTIONS = ["India", "International", ...PACKAGE_CATEGORIES];

export function FeaturedEditor({
  value,
  onChange,
}: {
  value: FeaturedContent;
  onChange: (next: FeaturedContent) => void;
}) {
  const toggleTab = (tab: string) =>
    onChange({
      ...value,
      tabs: value.tabs.includes(tab)
        ? value.tabs.filter((item) => item !== tab)
        : [...value.tabs, tab],
    });

  return (
    <div className="space-y-5">
      <Card
        icon={<Sparkles className="size-5" />}
        title="Section heading"
        description="The band above the package grid."
      >
        <SectionHeaderFields
          value={value.header}
          onChange={(header) => onChange({ ...value, header })}
        />
      </Card>

      <Card
        icon={<Layers className="size-5" />}
        title="Filter tabs and grid"
        description="Cards come from the live package catalogue — publish a package and it appears here on its own."
      >
        <div>
          <FieldLabel>Tabs shown above the grid</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {FEATURED_TAB_OPTIONS.map((tab) => {
              const active = value.tabs.includes(tab);
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => toggleTab(tab)}
                  aria-pressed={active}
                  className={`rounded-cmt-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "border-cmt-primary-500 bg-cmt-primary-50 text-cmt-primary-900"
                      : "border-cmt-neutral-200 bg-white text-cmt-neutral-600 hover:bg-cmt-neutral-50"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-cmt-neutral-500">
            The first tab is the one the section opens on. Order follows the order you
            switch them on.
          </p>
        </div>

        <NumberField
          className="mt-6 max-w-[200px]"
          label="Cards in the grid"
          value={value.maxCards}
          min={1}
          max={24}
          onChange={(maxCards) => onChange({ ...value, maxCards })}
        />
      </Card>
    </div>
  );
}

/* ------------------------ Weekend treks --------------------------- */

export function WeekendTreksEditor({
  value,
  onChange,
}: {
  value: WeekendTreksContent;
  onChange: (next: WeekendTreksContent) => void;
}) {
  return (
    <div className="space-y-5">
      <Card
        icon={<Mountain className="size-5" />}
        title="Section heading"
        description="The band above the trek grid."
      >
        <SectionHeaderFields
          value={value.header}
          onChange={(header) => onChange({ ...value, header })}
        />

        <div className={`${grid2} mt-5`}>
          <TextField
            label="Photo badge"
            value={value.badgeLabel}
            onChange={(badgeLabel) => onChange({ ...value, badgeLabel })}
            placeholder="Weekend trek"
          />
          <TextField
            label="Card button label"
            value={value.ctaLabel}
            onChange={(ctaLabel) => onChange({ ...value, ctaLabel })}
            placeholder="View trek"
          />
        </div>
      </Card>

      <Card
        icon={<Mountain className="size-5" />}
        title={`Treks (${value.items.length})`}
        description="One card per trek, four across the grid."
      >
        <ListEditor
          items={value.items}
          onChange={(items) => onChange({ ...value, items })}
          idPrefix="trek"
          addLabel="Add trek"
          summary={(item) => item.name}
          blank={{
            name: "New trek",
            region: "",
            image: "/weekend-treks/nandi-hills.jpg",
            nights: 0,
            days: 1,
            distanceKm: 6,
            peakM: 1200,
            grade: 1,
            price: 1299,
            originalPrice: 1699,
            note: "",
            href: "/packages",
          }}
        >
          {(item, patch) => (
            <div className="space-y-4">
              <div className={grid2}>
                <TextField
                  label="Trek name"
                  value={item.name}
                  onChange={(name) => patch({ name })}
                />
                <TextField
                  label="Region"
                  value={item.region}
                  onChange={(region) => patch({ region })}
                  placeholder="Kukke Subramanya, Coorg"
                />
              </div>

              <ImageField
                label="Photo"
                value={item.image}
                aspect="aspect-[4/3]"
                onChange={(image) => patch({ image })}
              />

              <div className={grid3}>
                <NumberField
                  label="Nights"
                  value={item.nights}
                  max={30}
                  onChange={(nights) => patch({ nights })}
                  hint="0 for a day trek."
                />
                <NumberField
                  label="Days"
                  value={item.days}
                  min={1}
                  max={30}
                  onChange={(days) => patch({ days })}
                />
                <NumberField
                  label="Distance (km)"
                  value={item.distanceKm}
                  max={999}
                  onChange={(distanceKm) => patch({ distanceKm })}
                />
              </div>

              <div className={grid3}>
                <NumberField
                  label="Summit (m)"
                  value={item.peakM}
                  max={9000}
                  onChange={(peakM) => patch({ peakM })}
                />
                <NumberField
                  label="Grade (1–3)"
                  value={item.grade}
                  min={1}
                  max={3}
                  onChange={(grade) => patch({ grade })}
                  hint="1 Easy · 2 Moderate · 3 Difficult"
                />
                <NumberField
                  label="Price (₹)"
                  value={item.price}
                  onChange={(price) => patch({ price })}
                />
              </div>

              <div className={grid2}>
                <NumberField
                  label="Price before discount (₹)"
                  value={item.originalPrice}
                  onChange={(originalPrice) => patch({ originalPrice })}
                  hint="Set equal to the price to hide the strike-through."
                />
                <TextField
                  label="Where the card links"
                  value={item.href}
                  onChange={(href) => patch({ href })}
                  placeholder="/packages/kumara-parvatha-trek"
                />
              </div>

              <TextArea
                label="One-line note"
                value={item.note}
                onChange={(note) => patch({ note })}
                placeholder="The long one. Steep from Bhattaru Mane onward."
              />
            </div>
          )}
        </ListEditor>
      </Card>
    </div>
  );
}

/* ------------------------- Train banner --------------------------- */

export function TrainBannerEditor({
  value,
  onChange,
}: {
  value: TrainBannerContent;
  onChange: (next: TrainBannerContent) => void;
}) {
  return (
    <div className="space-y-5">
      <Card
        icon={<TrainFront className="size-5" />}
        title="Banner copy"
        description="Sits over the scroll-scrubbed train footage. The middle line takes the gold treatment."
      >
        <div className="grid gap-4">
          <TextField
            label="Eyebrow"
            value={value.eyebrow}
            onChange={(eyebrow) => onChange({ ...value, eyebrow })}
            placeholder="Crafted For Every Explorer"
          />

          <div className={grid3}>
            <TextField
              label="Headline — line 1"
              value={value.titleLine1}
              onChange={(titleLine1) => onChange({ ...value, titleLine1 })}
              placeholder="Handpicked Packages."
            />
            <TextField
              label="Line 2 — gold"
              value={value.titleHighlight}
              onChange={(titleHighlight) => onChange({ ...value, titleHighlight })}
              placeholder="Unforgettable"
            />
            <TextField
              label="Line 2 — rest"
              value={value.titleLine2}
              onChange={(titleLine2) => onChange({ ...value, titleLine2 })}
              placeholder="Journeys."
            />
          </div>

          <TextArea
            label="Description"
            value={value.description}
            onChange={(description) => onChange({ ...value, description })}
          />
        </div>
      </Card>

      <Card
        icon={<ShieldCheck className="size-5" />}
        title={`Trust badges (${value.badges.length})`}
        description="The row of icon, title and one line along the bottom of the banner."
      >
        <ListEditor
          items={value.badges}
          onChange={(badges) => onChange({ ...value, badges })}
          idPrefix="train"
          addLabel="Add badge"
          summary={(item) => item.title}
          blank={{ icon: "Sparkles", title: "New badge", description: "" }}
        >
          {(item, patch) => (
            <div className="space-y-4">
              <div className={grid2}>
                <TextField
                  label="Title"
                  value={item.title}
                  onChange={(title) => patch({ title })}
                />
                <IconPicker value={item.icon} onChange={(icon) => patch({ icon })} />
              </div>
              <TextArea
                label="Description"
                value={item.description}
                onChange={(description) => patch({ description })}
              />
            </div>
          )}
        </ListEditor>
      </Card>
    </div>
  );
}

/* ----------------------- Domestic showcase ------------------------ */

export function DomesticEditor({
  value,
  onChange,
}: {
  value: DomesticContent;
  onChange: (next: DomesticContent) => void;
}) {
  return (
    <div className="space-y-5">
      <Card
        icon={<Compass className="size-5" />}
        title="Section heading"
        description="The band above the accordion gallery."
      >
        <SectionHeaderFields
          value={value.header}
          onChange={(header) => onChange({ ...value, header })}
        />

        <NumberField
          className="mt-5 max-w-[220px]"
          label="Panel open by default"
          value={value.defaultIndex + 1}
          min={1}
          max={value.items.length}
          onChange={(next) => onChange({ ...value, defaultIndex: next - 1 })}
          hint={`1 to ${value.items.length}, counting from the left.`}
        />
      </Card>

      <Card
        icon={<Layers className="size-5" />}
        title={`Panels (${value.items.length})`}
        description="Each panel is one photo, one place and one line about it."
      >
        <ListEditor
          items={value.items}
          onChange={(items) => onChange({ ...value, items })}
          idPrefix="dom"
          addLabel="Add panel"
          summary={(item) => item.label}
          blank={{
            image: "/destinations/kerala.jpg",
            label: "New place",
            description: "",
            alt: "",
          }}
        >
          {(item, patch) => (
            <div className="space-y-4">
              <TextField
                label="Place"
                value={item.label}
                onChange={(label) => patch({ label })}
              />
              <ImageField
                label="Photo"
                value={item.image}
                aspect="aspect-[3/4]"
                onChange={(image) => patch({ image })}
              />
              <TextArea
                label="One line about it"
                value={item.description}
                onChange={(description) => patch({ description })}
              />
              <TextArea
                label="Photo description (alt text)"
                value={item.alt}
                onChange={(alt) => patch({ alt })}
              />
            </div>
          )}
        </ListEditor>
      </Card>
    </div>
  );
}

/* --------------------- International holidays --------------------- */

export function InternationalEditor({
  value,
  onChange,
}: {
  value: InternationalContent;
  onChange: (next: InternationalContent) => void;
}) {
  return (
    <div className="space-y-5">
      <Card
        icon={<Globe2 className="size-5" />}
        title="Section heading"
        description="The band above the country cards."
      >
        <SectionHeaderFields
          value={value.header}
          onChange={(header) => onChange({ ...value, header })}
        />

        <TextArea
          className="mt-5"
          label="Small print under the cards"
          value={value.footnote}
          onChange={(footnote) => onChange({ ...value, footnote })}
        />
      </Card>

      <Card
        icon={<Globe2 className="size-5" />}
        title={`Countries (${value.items.length})`}
        description="Visa route, season and flight time — the three things that decide an overseas trip."
      >
        <ListEditor
          items={value.items}
          onChange={(items) => onChange({ ...value, items })}
          idPrefix="intl"
          addLabel="Add country"
          summary={(item) => item.country}
          blank={{
            country: "New country",
            region: "",
            hook: "",
            visa: "e-Visa" as VisaType,
            visaNote: "",
            bestMonths: "",
            flightHours: "",
            price: 59999,
            currency: "",
            href: "/packages?region=international",
          }}
        >
          {(item, patch) => (
            <div className="space-y-4">
              <div className={grid2}>
                <TextField
                  label="Country"
                  value={item.country}
                  onChange={(country) => patch({ country })}
                />
                <TextField
                  label="Region"
                  value={item.region}
                  onChange={(region) => patch({ region })}
                  placeholder="Southeast Asia"
                />
              </div>

              <TextArea
                label="One-line hook"
                value={item.hook}
                onChange={(hook) => patch({ hook })}
                placeholder="Bangkok's street food, then the Andaman islands."
              />

              <div className={grid2}>
                <SelectField
                  label="Visa route"
                  value={item.visa}
                  options={VISA_TYPES}
                  onChange={(visa) => patch({ visa })}
                />
                <TextField
                  label="Visa note"
                  value={item.visaNote}
                  onChange={(visaNote) => patch({ visaNote })}
                  placeholder="Up to 60 days for Indian passports"
                />
              </div>

              <div className={grid3}>
                <TextField
                  label="Best season"
                  value={item.bestMonths}
                  onChange={(bestMonths) => patch({ bestMonths })}
                  placeholder="Nov – Mar"
                />
                <TextField
                  label="Flight time"
                  value={item.flightHours}
                  onChange={(flightHours) => patch({ flightHours })}
                  placeholder="4h 15m"
                  hint="“direct” is added after it."
                />
                <NumberField
                  label="From price (₹)"
                  value={item.price}
                  onChange={(price) => patch({ price })}
                />
              </div>

              <div className={grid2}>
                <TextField
                  label="Currency"
                  value={item.currency}
                  onChange={(currency) => patch({ currency })}
                  placeholder="Thai baht (THB)"
                />
                <TextField
                  label="Where the card links"
                  value={item.href}
                  onChange={(href) => patch({ href })}
                />
              </div>
            </div>
          )}
        </ListEditor>
      </Card>
    </div>
  );
}

/* ------------------------ Why travel with us ---------------------- */

export function WhyUsEditor({
  value,
  onChange,
}: {
  value: WhyUsContent;
  onChange: (next: WhyUsContent) => void;
}) {
  return (
    <div className="space-y-5">
      <Card
        icon={<ShieldCheck className="size-5" />}
        title="Section copy"
        description="The headline's second line takes the gold treatment."
      >
        <div className="grid gap-4">
          <TextField
            label="Eyebrow"
            value={value.eyebrow}
            onChange={(eyebrow) => onChange({ ...value, eyebrow })}
          />
          <div className={grid2}>
            <TextField
              label="Headline — line 1"
              value={value.titleLine1}
              onChange={(titleLine1) => onChange({ ...value, titleLine1 })}
            />
            <TextField
              label="Headline — line 2 (gold)"
              value={value.titleLine2}
              onChange={(titleLine2) => onChange({ ...value, titleLine2 })}
            />
          </div>
          <TextArea
            label="Description"
            value={value.description}
            onChange={(description) => onChange({ ...value, description })}
          />
          <div className={grid2}>
            <TextField
              label="Button label"
              value={value.ctaLabel}
              onChange={(ctaLabel) => onChange({ ...value, ctaLabel })}
            />
            <TextField
              label="Button destination"
              value={value.ctaHref}
              onChange={(ctaHref) => onChange({ ...value, ctaHref })}
            />
          </div>
        </div>
      </Card>

      <Card
        icon={<Star className="size-5" />}
        title={`Proof points (${value.points.length})`}
        description="Four reads best — they lay out as a two-by-two grid."
      >
        <ListEditor
          items={value.points}
          onChange={(points) => onChange({ ...value, points })}
          idPrefix="why"
          addLabel="Add proof point"
          summary={(item) => item.label}
          blank={{ value: "100+", label: "New point", description: "" }}
        >
          {(item, patch) => (
            <div className="space-y-4">
              <div className={grid2}>
                <TextField
                  label="Big number"
                  value={item.value}
                  onChange={(next) => patch({ value: next })}
                  placeholder="500+"
                />
                <TextField
                  label="Label"
                  value={item.label}
                  onChange={(label) => patch({ label })}
                  placeholder="Curated trips"
                />
              </div>
              <TextArea
                label="Description"
                value={item.description}
                onChange={(description) => patch({ description })}
              />
            </div>
          )}
        </ListEditor>
      </Card>

      <Card
        icon={<Layers className="size-5" />}
        title="Side photograph"
        description="The tall image beside the proof grid, with its caption over the bottom."
      >
        <div className="space-y-4">
          <ImageField
            label="Photo"
            value={value.image}
            aspect="aspect-[3/4]"
            onChange={(image) => onChange({ ...value, image })}
          />
          <TextArea
            label="Photo description (alt text)"
            value={value.imageAlt}
            onChange={(imageAlt) => onChange({ ...value, imageAlt })}
          />
          <TextArea
            label="Caption over the photo"
            value={value.imageCaption}
            onChange={(imageCaption) => onChange({ ...value, imageCaption })}
          />
        </div>
      </Card>
    </div>
  );
}

/* --------------------------- Latest deals ------------------------- */

export function LatestDealsEditor({
  value,
  onChange,
}: {
  value: LatestDealsContent;
  onChange: (next: LatestDealsContent) => void;
}) {
  const patchPromo = (promo: Partial<LatestDealsContent["promo"]>) =>
    onChange({ ...value, promo: { ...value.promo, ...promo } });

  return (
    <div className="space-y-5">
      <Card
        icon={<BadgePercent className="size-5" />}
        title="Section heading"
        description="The band above the promotional card."
      >
        <SectionHeaderFields
          value={value.header}
          onChange={(header) => onChange({ ...value, header })}
        />
      </Card>

      <Card
        icon={<BadgePercent className="size-5" />}
        title="Promotional card"
        description="The dark banner. Its headline discount is read off the deepest live discount in the catalogue, so it can never overstate an offer."
      >
        <div className="grid gap-4">
          <TextField
            label="Pill above the headline"
            value={value.promo.badge}
            onChange={(badge) => patchPromo({ badge })}
            placeholder="Limited time offer"
          />

          <div className={grid2}>
            <TextField
              label="Headline before the number"
              value={value.promo.titlePrefix}
              onChange={(titlePrefix) => patchPromo({ titlePrefix })}
              placeholder="Up to"
            />
            <TextField
              label="Headline after the number"
              value={value.promo.titleSuffix}
              onChange={(titleSuffix) => patchPromo({ titleSuffix })}
              placeholder="this month's packages"
            />
          </div>

          <div className={grid3}>
            <TextField
              label="Body before the code"
              value={value.promo.bodyPrefix}
              onChange={(bodyPrefix) => patchPromo({ bodyPrefix })}
              placeholder="Apply code"
            />
            <TextField
              label="Discount code"
              value={value.promo.code}
              onChange={(code) => patchPromo({ code })}
              placeholder="MONSOON25"
            />
            <NumberField
              label="Cards under the banner"
              value={value.maxCards}
              min={1}
              max={12}
              onChange={(maxCards) => onChange({ ...value, maxCards })}
            />
          </div>

          <TextArea
            label="Body after the code"
            value={value.promo.bodySuffix}
            onChange={(bodySuffix) => patchPromo({ bodySuffix })}
          />

          <div className={grid2}>
            <TextField
              label="Button label"
              value={value.promo.ctaLabel}
              onChange={(ctaLabel) => patchPromo({ ctaLabel })}
            />
            <TextField
              label="Button destination"
              value={value.promo.ctaHref}
              onChange={(ctaHref) => patchPromo({ ctaHref })}
            />
          </div>

          <div className={grid2}>
            <TextField
              label="Countdown label"
              value={value.promo.countdownLabel}
              onChange={(countdownLabel) => patchPromo({ countdownLabel })}
              placeholder="Offer ends in"
            />
            <TextField
              label="Countdown note"
              value={value.promo.countdownNote}
              onChange={(countdownNote) => patchPromo({ countdownNote })}
              hint="The clock itself always runs to the end of the current month."
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ------------------------ Traveller reviews ----------------------- */

export function ReviewsEditor({
  value,
  onChange,
}: {
  value: ReviewsContent;
  onChange: (next: ReviewsContent) => void;
}) {
  return (
    <div className="space-y-5">
      <Card
        icon={<MessageSquareQuote className="size-5" />}
        title="Section heading"
        description="The band above the review cards."
      >
        <SectionHeaderFields
          value={value.header}
          onChange={(header) => onChange({ ...value, header })}
        />
      </Card>

      <Card
        icon={<Star className="size-5" />}
        title={`Reviews (${value.items.length})`}
        description="Three reads best — they lay out as one row across desktop."
      >
        <ListEditor
          items={value.items}
          onChange={(items) => onChange({ ...value, items })}
          idPrefix="rev"
          addLabel="Add review"
          summary={(item) => `${item.name} — ${item.trip}`}
          blank={{
            quote: "",
            name: "New traveller",
            initials: "NT",
            avatar: "",
            trip: "",
            travelled: "",
            rating: 5,
          }}
        >
          {(item, patch) => (
            <div className="space-y-4">
              <TextArea
                label="Quote"
                value={item.quote}
                onChange={(quote) => patch({ quote })}
              />
              <div className={grid2}>
                <TextField
                  label="Name"
                  value={item.name}
                  onChange={(name) => patch({ name })}
                  placeholder="Ananya R."
                />
                <NumberField
                  label="Rating (1–5)"
                  value={item.rating}
                  min={1}
                  max={5}
                  onChange={(rating) => patch({ rating })}
                />
              </div>
              <AvatarField
                label="Profile photo"
                value={item.avatar}
                onChange={(avatar) => patch({ avatar })}
                hint="JPG, PNG or WebP up to 5 MB. Leave empty to show their initials instead."
              />
              <div className={grid2}>
                <TextField
                  label="Package they booked"
                  value={item.trip}
                  onChange={(trip) => patch({ trip })}
                />
                <TextField
                  label="When they travelled"
                  value={item.travelled}
                  onChange={(travelled) => patch({ travelled })}
                  placeholder="Travelled July 2026"
                />
              </div>
            </div>
          )}
        </ListEditor>
      </Card>
    </div>
  );
}

/* -------------------------- Travel guides ------------------------- */

export function GuidesEditor({
  value,
  onChange,
}: {
  value: GuidesContent;
  onChange: (next: GuidesContent) => void;
}) {
  return (
    <div className="space-y-5">
      <Card
        icon={<BookOpen className="size-5" />}
        title="Section heading"
        description="The band above the article cards."
      >
        <SectionHeaderFields
          value={value.header}
          onChange={(header) => onChange({ ...value, header })}
        />
      </Card>

      <Card
        icon={<BookOpen className="size-5" />}
        title={`Guides (${value.items.length})`}
        description="Three reads best — they lay out as one row across desktop."
      >
        <ListEditor
          items={value.items}
          onChange={(items) => onChange({ ...value, items })}
          idPrefix="guide"
          addLabel="Add guide"
          summary={(item) => item.title}
          blank={{
            category: "Itinerary",
            title: "New guide",
            excerpt: "",
            image: "/destinations/kerala.jpg",
            alt: "",
            readMinutes: 6,
            href: "/blog",
          }}
        >
          {(item, patch) => (
            <div className="space-y-4">
              <div className={grid2}>
                <TextField
                  label="Category pill"
                  value={item.category}
                  onChange={(category) => patch({ category })}
                  placeholder="Know before you go"
                />
                <NumberField
                  label="Read time (minutes)"
                  value={item.readMinutes}
                  min={1}
                  max={120}
                  onChange={(readMinutes) => patch({ readMinutes })}
                />
              </div>

              <TextField
                label="Title"
                value={item.title}
                onChange={(title) => patch({ title })}
              />
              <TextArea
                label="Excerpt"
                value={item.excerpt}
                onChange={(excerpt) => patch({ excerpt })}
              />

              <ImageField
                label="Photo"
                value={item.image}
                aspect="aspect-[16/10]"
                onChange={(image) => patch({ image })}
              />
              <TextArea
                label="Photo description (alt text)"
                value={item.alt}
                onChange={(alt) => patch({ alt })}
              />
              <TextField
                label="Where the card links"
                value={item.href}
                onChange={(href) => patch({ href })}
                placeholder="/blog/three-days-in-munnar"
              />
            </div>
          )}
        </ListEditor>
      </Card>
    </div>
  );
}

/* ------------------------------- FAQ ------------------------------ */

export function FaqEditor({
  value,
  onChange,
}: {
  value: FaqContent;
  onChange: (next: FaqContent) => void;
}) {
  const patchHelp = (help: Partial<FaqContent["help"]>) =>
    onChange({ ...value, help: { ...value.help, ...help } });

  return (
    <div className="space-y-5">
      <Card
        icon={<HelpCircle className="size-5" />}
        title="Section heading"
        description="Sits in the pinned rail beside the questions, so it has no “view all” link."
      >
        <SectionHeaderFields
          value={value.header}
          withAction={false}
          onChange={(header) => onChange({ ...value, header })}
        />
      </Card>

      <Card
        icon={<HelpCircle className="size-5" />}
        title={`Questions (${value.items.length})`}
        description="The first one opens by default; visitors can open any number at once."
      >
        <ListEditor
          items={value.items}
          onChange={(items) => onChange({ ...value, items })}
          idPrefix="faq"
          addLabel="Add question"
          summary={(item) => item.question}
          blank={{ question: "New question", answer: "" }}
        >
          {(item, patch) => (
            <div className="space-y-4">
              <TextField
                label="Question"
                value={item.question}
                onChange={(question) => patch({ question })}
              />
              <TextArea
                label="Answer"
                value={item.answer}
                onChange={(answer) => patch({ answer })}
              />
            </div>
          )}
        </ListEditor>
      </Card>

      <Card
        icon={<MessageSquareQuote className="size-5" />}
        title="“Still not answered?” card"
        description="The escape hatch pinned under the heading."
      >
        <div className="grid gap-4">
          <div className={grid2}>
            <TextField
              label="Title"
              value={value.help.title}
              onChange={(title) => patchHelp({ title })}
            />
            <IconPicker value={value.help.icon} onChange={(icon) => patchHelp({ icon })} />
          </div>
          <TextArea
            label="Description"
            value={value.help.description}
            onChange={(description) => patchHelp({ description })}
          />
          <div className={grid2}>
            <TextField
              label="Button label"
              value={value.help.ctaLabel}
              onChange={(ctaLabel) => patchHelp({ ctaLabel })}
            />
            <TextField
              label="Button destination"
              value={value.help.ctaHref}
              onChange={(ctaHref) => patchHelp({ ctaHref })}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

/* --------------------- Trust marks + newsletter ------------------- */

export function NewsletterEditor({
  value,
  onChange,
}: {
  value: NewsletterContent;
  onChange: (next: NewsletterContent) => void;
}) {
  return (
    <div className="space-y-5">
      <Card
        icon={<ShieldCheck className="size-5" />}
        title={`Trust marks (${value.points.length})`}
        description="The reassurance row above the newsletter panel. The four shipped marks are hand-drawn two-tone icons; picking any other icon swaps in the library glyph."
      >
        <ListEditor
          items={value.points}
          onChange={(points) => onChange({ ...value, points })}
          idPrefix="trust"
          addLabel="Add trust mark"
          summary={(item) => item.title}
          blank={{ icon: "ShieldCheck", title: "New mark", description: "" }}
        >
          {(item, patch) => (
            <div className="space-y-4">
              <div className={grid2}>
                <TextField
                  label="Title"
                  value={item.title}
                  onChange={(title) => patch({ title })}
                />
                <IconPicker value={item.icon} onChange={(icon) => patch({ icon })} />
              </div>
              <TextArea
                label="Description"
                value={item.description}
                onChange={(description) => patch({ description })}
              />
            </div>
          )}
        </ListEditor>
      </Card>

      <Card
        icon={<Mail className="size-5" />}
        title="Newsletter panel"
        description="The dark sign-up band that closes the page."
      >
        <div className="grid gap-4">
          <div className={grid2}>
            <TextField
              label="Headline — line 1"
              value={value.titleLine1}
              onChange={(titleLine1) => onChange({ ...value, titleLine1 })}
            />
            <TextField
              label="Headline — line 2 (gold)"
              value={value.titleLine2}
              onChange={(titleLine2) => onChange({ ...value, titleLine2 })}
            />
          </div>

          <TextArea
            label="Description"
            value={value.description}
            onChange={(description) => onChange({ ...value, description })}
          />

          <div className={grid2}>
            <TextField
              label="Field placeholder"
              value={value.placeholder}
              onChange={(placeholder) => onChange({ ...value, placeholder })}
            />
            <TextField
              label="Button label"
              value={value.ctaLabel}
              onChange={(ctaLabel) => onChange({ ...value, ctaLabel })}
            />
          </div>

          <TextField
            label="Note under the field"
            value={value.note}
            onChange={(note) => onChange({ ...value, note })}
            placeholder="No spam, just good trips. Unsubscribe anytime."
          />
          <TextField
            label="Message after signing up"
            value={value.successMessage}
            onChange={(successMessage) => onChange({ ...value, successMessage })}
          />
        </div>
      </Card>
    </div>
  );
}

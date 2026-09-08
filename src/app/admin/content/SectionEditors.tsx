"use client";

import {
  BadgePercent,
  BookOpen,
  Compass,
  Globe2,
  HelpCircle,
  Image as ImageIcon,
  KeyRound,
  Layers,
  ListOrdered,
  MapPin,
  MessageSquare,
  Mail,
  MessageSquareQuote,
  Mountain,
  ChevronDown,
  ChevronUp,
  Navigation,
  Plus,
  ShieldCheck,
  Trash2,
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
  type AuthContent,
  type AuthPageContent,
  type ContactContent,
  type GuidesContent,
  type HeaderContent,
  type InternationalContent,
  type LatestDealsContent,
  type NewsletterContent,
  type ReviewsContent,
  type TrainBannerContent,
  type TrendingContent,
  type VisaType,
  type WeekendTreksContent,
  type WhyUsContent,
  nextId,
} from "@/lib/siteContent";
import IconPicker from "../_components/IconPicker";
import AvatarField from "../_components/AvatarField";
import ImageField from "../_components/ImageField";
import LinkField from "../_components/LinkField";
import {
  ListEditor,
  NumberField,
  SectionHeaderFields,
  SelectField,
} from "../_components/EditorParts";
import { Button, Card, FieldLabel, TextArea, TextField, Toggle } from "../_components/ui";
import GoogleBusinessPanel from "./GoogleBusinessPanel";

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

/* ---------------------------- Contact ----------------------------- */

/* The /contact page's copy, the business details that shipped empty, and the
   optional bands. Not the enquiry form — its fields, validation and where it
   submits are code — and not the two link targets, only their wording. */

/* How the value is linked on the page: email → mailto:, phone → tel:, and
   text is printed as-is. */
const CHANNEL_KINDS = ["email", "phone", "text"] as const;

export function ContactEditor({
  value,
  onChange,
}: {
  value: ContactContent;
  onChange: (next: ContactContent) => void;
}) {
  const filledChannels = value.channels.filter((c) => c.value.trim() !== "").length;

  return (
    <div className="space-y-5">
      <Card
        icon={<MessageSquare className="size-5" />}
        title="Page heading"
        description="The band across the top of the contact page."
      >
        <TextField
          label="Eyebrow"
          value={value.eyebrow}
          onChange={(eyebrow) => onChange({ ...value, eyebrow })}
          placeholder="Contact"
        />
        <TextField
          className="mt-4"
          label="Heading"
          value={value.title}
          onChange={(title) => onChange({ ...value, title })}
          placeholder="Tell us about the trip."
        />
        <TextArea
          className="mt-4"
          label="Sub-line"
          value={value.description}
          onChange={(description) => onChange({ ...value, description })}
        />
      </Card>

      <Card
        icon={<MessageSquare className="size-5" />}
        title="Above the enquiry form"
        description="The form's own fields, validation and where it sends to are fixed — this is the heading over them."
      >
        <TextField
          label="Heading"
          value={value.formTitle}
          onChange={(formTitle) => onChange({ ...value, formTitle })}
          placeholder="Send an enquiry"
        />
        <TextArea
          className="mt-4"
          label="Sub-line"
          value={value.formDescription}
          onChange={(formDescription) => onChange({ ...value, formDescription })}
        />
      </Card>

      <Card
        icon={<ListOrdered className="size-5" />}
        title={`What happens next (${value.steps.length})`}
        description="The numbered steps in the sidebar. Numbering follows the order here."
      >
        <TextField
          label="Card heading"
          value={value.sidebarTitle}
          onChange={(sidebarTitle) => onChange({ ...value, sidebarTitle })}
          placeholder="What happens next"
        />

        <div className="mt-4">
          <ListEditor
            items={value.steps}
            onChange={(steps) => onChange({ ...value, steps })}
            idPrefix="contact-step"
            addLabel="Add step"
            summary={(item) => item.title || "Untitled"}
            blank={{ title: "New step", description: "" }}
          >
            {(item, patch) => (
              <div className="space-y-4">
                <TextField
                  label="Title"
                  value={item.title}
                  onChange={(title) => patch({ title })}
                  placeholder="Your enquiry reaches the travel desk"
                />
                <TextArea
                  label="Description"
                  value={item.description}
                  onChange={(description) => patch({ description })}
                />
              </div>
            )}
          </ListEditor>
        </div>
      </Card>

      <Card
        icon={<Mail className="size-5" />}
        title={`Reach us directly (${filledChannels} filled in)`}
        description="Your public contact details. A row with an empty value is left out, and the whole block disappears when nothing is filled in — so it never shows a blank email line."
      >
        <TextField
          label="Block heading"
          value={value.directTitle}
          onChange={(directTitle) => onChange({ ...value, directTitle })}
          placeholder="Reach us directly"
        />

        <div className="mt-4">
          <ListEditor
            items={value.channels}
            onChange={(channels) => onChange({ ...value, channels })}
            idPrefix="contact-channel"
            addLabel="Add a way to reach you"
            minItems={0}
            summary={(item) =>
              item.value.trim() === ""
                ? `${item.label || "Untitled"} — empty, not shown`
                : `${item.label || "Untitled"} · ${item.value}`
            }
            blank={{ icon: "Mail", label: "Email", value: "", kind: "email" as const }}
          >
            {(item, patch) => (
              <div className="space-y-4">
                <div className={grid2}>
                  <IconPicker value={item.icon} onChange={(icon) => patch({ icon })} />
                  <TextField
                    label="Label"
                    value={item.label}
                    onChange={(label) => patch({ label })}
                    placeholder="Email"
                    hint="Read out by screen readers before the value."
                  />
                </div>
                <div className={grid2}>
                  <TextField
                    label="Value"
                    value={item.value}
                    onChange={(value_) => patch({ value: value_ })}
                    placeholder="support@comparemytrip.com"
                    hint="Leave blank to keep this row off the page."
                  />
                  <SelectField
                    label="Behaves as"
                    value={item.kind}
                    onChange={(kind) => patch({ kind })}
                    options={CHANNEL_KINDS}
                    hint="email opens the mail app · phone dials · text is not a link."
                  />
                </div>
              </div>
            )}
          </ListEditor>
        </div>

        <TextField
          className="mt-4"
          label="Opening hours"
          value={value.hours}
          onChange={(hours) => onChange({ ...value, hours })}
          placeholder="Mon–Sat, 9:30am – 7:00pm IST"
          hint="Leave blank to leave the hours line off."
        />
      </Card>

      <Card
        icon={<Compass className="size-5" />}
        title="Browse packages link"
        description="The text link at the bottom of the sidebar. It always goes to the packages page."
      >
        <div className={grid2}>
          <TextField
            label="Prompt"
            value={value.browsePrompt}
            onChange={(browsePrompt) => onChange({ ...value, browsePrompt })}
            placeholder="Would rather look around first?"
          />
          <TextField
            label="Link text"
            value={value.browseLabel}
            onChange={(browseLabel) => onChange({ ...value, browseLabel })}
            placeholder="Browse packages"
          />
        </div>
      </Card>

      <Card
        icon={<MapPin className="size-5" />}
        title={`Offices (${value.offices.items.length})`}
        description="Office addresses and Google Maps on the contact page. Replace the sample address with your real office location; each map updates automatically."
      >
        <Toggle
          label="Show the offices band"
          description={
            value.offices.enabled
              ? value.offices.items.length > 0
                ? "Live on the contact page."
                : "On, but nothing to show yet — add an office below."
              : "Hidden, whatever is listed below."
          }
          checked={value.offices.enabled}
          onChange={(enabled) =>
            onChange({ ...value, offices: { ...value.offices, enabled } })
          }
        />

        <TextField
          className="mt-4"
          label="Band heading"
          value={value.offices.title}
          onChange={(title) => onChange({ ...value, offices: { ...value.offices, title } })}
          placeholder="Where we are"
        />

        <div className="mt-4">
          <ListEditor
            items={value.offices.items}
            onChange={(items) => onChange({ ...value, offices: { ...value.offices, items } })}
            idPrefix="contact-office"
            addLabel="Add office"
            minItems={0}
            summary={(item) => item.city || "Untitled"}
            blank={{ city: "New office", note: "", address: "" }}
          >
            {(item, patch) => (
              <div className="space-y-4">
                <div className={grid2}>
                  <TextField
                    label="City"
                    value={item.city}
                    onChange={(city) => patch({ city })}
                    placeholder="Mumbai"
                  />
                  <TextField
                    label="Note"
                    value={item.note}
                    onChange={(note) => patch({ note })}
                    placeholder="Head office"
                    hint="Optional — the small gold line above the address."
                  />
                </div>
                <TextArea
                  label="Address"
                  value={item.address}
                  onChange={(address) => patch({ address })}
                />
              </div>
            )}
          </ListEditor>
        </div>
      </Card>

    </div>
  );
}

/* ----------------------------- Auth ------------------------------- */

/* Copy, icons and artwork for the three sign-in surfaces. Deliberately no
   field labels, placeholders, button text or routes: those belong to the
   forms, and the forms are code. Nothing here can change what a screen does,
   only what it says and shows. */

/** The artwork column and headings, shared by the login and signup pages. */
function AuthPageFields({
  value,
  onChange,
}: {
  value: AuthPageContent;
  onChange: (next: AuthPageContent) => void;
}) {
  return (
    <>
      <div className={grid2}>
        <TextField
          label="Heading"
          value={value.title}
          onChange={(title) => onChange({ ...value, title })}
          placeholder="Welcome back!"
        />
        <TextField
          label="Sub-line"
          value={value.subtitle}
          onChange={(subtitle) => onChange({ ...value, subtitle })}
          placeholder="Log in to continue…"
        />
      </div>

      <div className={`${grid2} mt-4`}>
        <TextField
          label="Top-right prompt"
          value={value.navPrompt}
          onChange={(navPrompt) => onChange({ ...value, navPrompt })}
          placeholder="New here?"
          hint="The plain text before the link."
        />
        <TextField
          label="Top-right link text"
          value={value.navLinkLabel}
          onChange={(navLinkLabel) => onChange({ ...value, navLinkLabel })}
          placeholder="Sign up"
          hint="Where it goes is fixed — login and signup point at each other."
        />
      </div>
    </>
  );
}

function AuthArtworkFields({
  value,
  onChange,
}: {
  value: AuthPageContent;
  onChange: (next: AuthPageContent) => void;
}) {
  return (
    <>
      <ImageField
        label="Photo"
        value={value.image}
        onChange={(image) => onChange({ ...value, image })}
      />
      <TextField
        className="mt-4"
        label="Photo description"
        value={value.imageAlt}
        onChange={(imageAlt) => onChange({ ...value, imageAlt })}
        placeholder="Airplane wing above the clouds at sunset"
        hint="Read aloud by screen readers — describe the photo, don't label it."
      />

      <div className={`${grid2} mt-4`}>
        <TextField
          label="Headline — line 1"
          value={value.headlineLead}
          onChange={(headlineLead) => onChange({ ...value, headlineLead })}
          placeholder="Travel Smarter,"
        />
        <TextField
          label="Headline — line 2 (gold)"
          value={value.headlineHighlight}
          onChange={(headlineHighlight) => onChange({ ...value, headlineHighlight })}
          placeholder="Save More."
        />
      </div>

      <TextArea
        className="mt-4"
        label="Sub-copy"
        value={value.imageSubcopy}
        onChange={(imageSubcopy) => onChange({ ...value, imageSubcopy })}
      />
    </>
  );
}

export function AuthEditor({
  value,
  onChange,
}: {
  value: AuthContent;
  onChange: (next: AuthContent) => void;
}) {
  const { prompt, login, signup } = value;

  return (
    <div className="space-y-5">
      <Card
        icon={<KeyRound className="size-5" />}
        title="Sign-in popup"
        description="The prompt that appears after a visitor has been browsing a while. Switching the section off stops it appearing on its own — the Log in button still opens it."
      >
        <div className={grid2}>
          <TextField
            label="Headline — first part"
            value={prompt.titleLead}
            onChange={(titleLead) => onChange({ ...value, prompt: { ...prompt, titleLead } })}
            placeholder="Travel smarter,"
          />
          <TextField
            label="Headline — highlighted part"
            value={prompt.titleHighlight}
            onChange={(titleHighlight) =>
              onChange({ ...value, prompt: { ...prompt, titleHighlight } })
            }
            placeholder="save more."
          />
        </div>

        <TextArea
          className="mt-4"
          label="Sub-line on the Log in tab"
          value={prompt.loginSubtitle}
          onChange={(loginSubtitle) =>
            onChange({ ...value, prompt: { ...prompt, loginSubtitle } })
          }
        />
        <TextArea
          className="mt-4"
          label="Sub-line on the Sign up tab"
          value={prompt.signupSubtitle}
          onChange={(signupSubtitle) =>
            onChange({ ...value, prompt: { ...prompt, signupSubtitle } })
          }
        />
        <TextField
          className="mt-4"
          label="Dismiss link"
          value={prompt.dismissLabel}
          onChange={(dismissLabel) =>
            onChange({ ...value, prompt: { ...prompt, dismissLabel } })
          }
          placeholder="Keep browsing"
        />
      </Card>

      <Card
        icon={<ShieldCheck className="size-5" />}
        title={`Popup reassurance row (${prompt.trust.length})`}
        description="The small icon and label pairs along the bottom of the popup."
      >
        <ListEditor
          items={prompt.trust}
          onChange={(trust) => onChange({ ...value, prompt: { ...prompt, trust } })}
          idPrefix="prompt-trust"
          addLabel="Add item"
          summary={(item) => item.label || "Untitled"}
          blank={{ icon: "ShieldCheck", label: "New item", description: "" }}
        >
          {(item, patch) => (
            <div className={grid2}>
              <IconPicker value={item.icon} onChange={(icon) => patch({ icon })} />
              <TextField
                label="Label"
                value={item.label}
                onChange={(label) => patch({ label })}
                placeholder="Secure payments"
              />
            </div>
          )}
        </ListEditor>
      </Card>

      <Card
        icon={<KeyRound className="size-5" />}
        title="Login page"
        description="The headings above the login form. The fields themselves are fixed."
      >
        <AuthPageFields
          value={login}
          onChange={(next) => onChange({ ...value, login: { ...login, ...next } })}
        />
      </Card>

      <Card
        icon={<ImageIcon className="size-5" />}
        title="Login page artwork"
        description="The photo panel beside the login form."
      >
        <AuthArtworkFields
          value={login}
          onChange={(next) => onChange({ ...value, login: { ...login, ...next } })}
        />
      </Card>

      <Card
        icon={<ShieldCheck className="size-5" />}
        title={`Login page trust strip (${login.trust.length})`}
        description="The three cells under the login form."
      >
        <ListEditor
          items={login.trust}
          onChange={(trust) => onChange({ ...value, login: { ...login, trust } })}
          idPrefix="login-trust"
          addLabel="Add item"
          summary={(item) => item.label || "Untitled"}
          blank={{ icon: "ShieldCheck", label: "New item", description: "" }}
        >
          {(item, patch) => (
            <div className="space-y-4">
              <div className={grid2}>
                <IconPicker value={item.icon} onChange={(icon) => patch({ icon })} />
                <TextField
                  label="Label"
                  value={item.label}
                  onChange={(label) => patch({ label })}
                  placeholder="Secure Payments"
                />
              </div>
              <TextField
                label="Description"
                value={item.description}
                onChange={(description) => patch({ description })}
                placeholder="Your data is protected with 256-bit encryption."
              />
            </div>
          )}
        </ListEditor>
      </Card>

      <Card
        icon={<KeyRound className="size-5" />}
        title="Signup page"
        description="The headings above the signup form. The fields themselves are fixed."
      >
        <AuthPageFields
          value={signup}
          onChange={(next) => onChange({ ...value, signup: { ...signup, ...next } })}
        />
      </Card>

      <Card
        icon={<ImageIcon className="size-5" />}
        title="Signup page artwork"
        description="The photo panel beside the signup form."
      >
        <AuthArtworkFields
          value={signup}
          onChange={(next) => onChange({ ...value, signup: { ...signup, ...next } })}
        />
      </Card>

      <Card
        icon={<Sparkles className="size-5" />}
        title={`Signup page feature cards (${signup.features.length})`}
        description="The cards over the signup photo."
      >
        <ListEditor
          items={signup.features}
          onChange={(features) => onChange({ ...value, signup: { ...signup, features } })}
          idPrefix="signup-feature"
          addLabel="Add card"
          summary={(item) => item.title || "Untitled"}
          blank={{ icon: "Sparkles", title: "New card", description: "" }}
        >
          {(item, patch) => (
            <div className="space-y-4">
              <div className={grid2}>
                <IconPicker value={item.icon} onChange={(icon) => patch({ icon })} />
                <TextField
                  label="Title"
                  value={item.title}
                  onChange={(title) => patch({ title })}
                  placeholder="Exclusive Deals"
                />
              </div>
              <TextField
                label="Description"
                value={item.description}
                onChange={(description) => patch({ description })}
                placeholder="Access special member only offers."
              />
            </div>
          )}
        </ListEditor>
      </Card>
    </div>
  );
}

/* ---------------------------- Header ------------------------------ */

export function HeaderEditor({
  value,
  onChange,
}: {
  value: HeaderContent;
  onChange: (next: HeaderContent) => void;
}) {
  /* Children are edited in place rather than through a nested ListEditor:
     that component owns its own collapse state, and nesting one per row
     resets those rows every time the parent list re-renders. */
  const patchChildren = (
    itemId: string,
    map: (children: HeaderContent["items"][number]["children"]) => HeaderContent["items"][number]["children"],
  ) =>
    onChange({
      ...value,
      items: value.items.map((item) =>
        item.id === itemId ? { ...item, children: map(item.children) } : item,
      ),
    });

  const topBar = value.topBar;
  const patchTopBar = (patch: Partial<HeaderContent["topBar"]>) =>
    onChange({ ...value, topBar: { ...topBar, ...patch } });

  return (
    <div className="space-y-5">
      <Card
        icon={<BadgePercent className="size-5" />}
        title="Offer strip"
        description="The thin line above the menu: the offer on the left, the phone number and the visitor's trips on the right. Clear a field to drop just that piece."
      >
        <Toggle
          label="Show the offer strip"
          description={
            topBar.enabled
              ? "Live above the menu on every page."
              : "Hidden, whatever is filled in below."
          }
          checked={topBar.enabled}
          onChange={(enabled) => patchTopBar({ enabled })}
        />

        <div className={`${grid2} mt-4`}>
          <TextField
            label="Offer"
            value={topBar.offerText}
            onChange={(offerText) => patchTopBar({ offerText })}
            placeholder="Flat 12% off on every monsoon package"
            hint="Empty hides the offer and its code."
          />
          <TextField
            label="Coupon code"
            value={topBar.couponCode}
            onChange={(couponCode) => patchTopBar({ couponCode })}
            placeholder="MONSOON12"
            hint="Copies to the clipboard when clicked. Leave empty for an offer with no code."
          />
        </div>

        <TextField
          className="mt-4"
          label="Offer link"
          value={topBar.offerHref}
          onChange={(offerHref) => patchTopBar({ offerHref })}
          placeholder="/packages?deals=1"
          hint="Where the offer text goes. Empty leaves it as plain text."
        />

        <div className={`${grid2} mt-4`}>
          <TextField
            label="Phone number"
            value={topBar.phoneNumber}
            onChange={(phoneNumber) => patchTopBar({ phoneNumber })}
            placeholder="+91 80 4718 2200"
            hint="Printed exactly as typed, and dialled on a tap."
          />
          <TextField
            label="Phone label"
            value={topBar.phoneLabel}
            onChange={(phoneLabel) => patchTopBar({ phoneLabel })}
            placeholder="Talk to a travel expert"
            hint="Sits before the number on wide screens only."
          />
        </div>

        <div className={`${grid2} mt-4`}>
          <TextField
            label="Trips label"
            value={topBar.tripsLabel}
            onChange={(tripsLabel) => patchTopBar({ tripsLabel })}
            placeholder="My Trips"
          />
          <TextField
            label="Trips link"
            value={topBar.tripsHref}
            onChange={(tripsHref) => patchTopBar({ tripsHref })}
            placeholder="/account"
            hint="Both are needed, and the link only shows to a signed-in visitor."
          />
        </div>
      </Card>

      <Card
        icon={<Navigation className="size-5" />}
        title={`Menu links (${value.items.length})`}
        description="The links across the top of every page. Add entries to a link to turn it into a dropdown — the parent then opens the menu instead of navigating, so it does not need a page of its own."
      >
        <ListEditor
          items={value.items}
          onChange={(items) => onChange({ ...value, items })}
          idPrefix="nav"
          addLabel="Add menu link"
          summary={(item) =>
            item.children.length > 0
              ? `${item.label || "Untitled"} · ${item.children.length} in dropdown`
              : item.label || "Untitled"
          }
          blank={{ label: "New link", href: "/", children: [] }}
        >
          {(item, patch) => (
            <div className="space-y-4">
              <div className={grid2}>
                <TextField
                  label="Label"
                  value={item.label}
                  onChange={(label) => patch({ label })}
                  placeholder="Weekend Treks"
                />
                <TextField
                  label="Link"
                  value={item.href}
                  onChange={(href) => patch({ href })}
                  placeholder="/packages?category=weekend-treks"
                  hint={
                    item.children.length > 0
                      ? "Unused while this link has a dropdown."
                      : "A path on this site, or a full https:// address."
                  }
                />
              </div>

              <div className="rounded-cmt-sm border border-cmt-neutral-200 bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-cmt-neutral-900">
                      Dropdown ({item.children.length})
                    </p>
                    <p className="mt-0.5 text-[11px] text-cmt-neutral-500">
                      {item.children.length === 0
                        ? "No dropdown — this stays a plain link."
                        : "Shown when the visitor opens this menu."}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      patchChildren(item.id, (children) => [
                        ...children,
                        { id: nextId(item.id, children), label: "New entry", href: "/" },
                      ])
                    }
                  >
                    <Plus className="size-4" /> Add entry
                  </Button>
                </div>

                {item.children.length > 0 && (
                  <ul className="mt-3 space-y-2.5">
                    {item.children.map((child, childIndex) => (
                      <li
                        key={child.id}
                        className="rounded-cmt-sm border border-cmt-neutral-200 bg-cmt-neutral-50 p-3"
                      >
                        <div className="flex items-start gap-2">
                          <div className={`${grid2} min-w-0 flex-1`}>
                            <TextField
                              label="Label"
                              value={child.label}
                              onChange={(label) =>
                                patchChildren(item.id, (children) =>
                                  children.map((c, i) =>
                                    i === childIndex ? { ...c, label } : c,
                                  ),
                                )
                              }
                              placeholder="Sunrise Track"
                            />
                            <TextField
                              label="Link"
                              value={child.href}
                              onChange={(href) =>
                                patchChildren(item.id, (children) =>
                                  children.map((c, i) => (i === childIndex ? { ...c, href } : c)),
                                )
                              }
                              placeholder="/packages?category=sunrise"
                            />
                          </div>

                          <div className="flex shrink-0 flex-col gap-1 pt-[22px]">
                            <button
                              type="button"
                              aria-label="Move up"
                              disabled={childIndex === 0}
                              onClick={() =>
                                patchChildren(item.id, (children) => {
                                  const next = [...children];
                                  [next[childIndex - 1], next[childIndex]] = [
                                    next[childIndex],
                                    next[childIndex - 1],
                                  ];
                                  return next;
                                })
                              }
                              className="grid size-7 place-items-center rounded-cmt-sm border border-cmt-neutral-200 bg-white text-cmt-neutral-500 transition-colors hover:bg-cmt-neutral-50 disabled:opacity-35"
                            >
                              <ChevronUp className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label="Move down"
                              disabled={childIndex === item.children.length - 1}
                              onClick={() =>
                                patchChildren(item.id, (children) => {
                                  const next = [...children];
                                  [next[childIndex], next[childIndex + 1]] = [
                                    next[childIndex + 1],
                                    next[childIndex],
                                  ];
                                  return next;
                                })
                              }
                              className="grid size-7 place-items-center rounded-cmt-sm border border-cmt-neutral-200 bg-white text-cmt-neutral-500 transition-colors hover:bg-cmt-neutral-50 disabled:opacity-35"
                            >
                              <ChevronDown className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label="Remove entry"
                              onClick={() =>
                                patchChildren(item.id, (children) =>
                                  children.filter((_, i) => i !== childIndex),
                                )
                              }
                              className="grid size-7 place-items-center rounded-cmt-sm border border-cmt-neutral-200 bg-white text-red-600 transition-colors hover:border-red-200 hover:bg-red-50"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </ListEditor>
      </Card>
    </div>
  );
}

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
            link: "",
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
              <LinkField
                label="Opens"
                value={item.link}
                onChange={(link) => patch({ link })}
                hint="Clicking the open panel goes here. Leave it on “Not clickable” and the panel stays a photo."
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
            image: "",
            alt: "",
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

              <ImageField
                label="Photo (optional)"
                value={item.image}
                aspect="aspect-[16/9]"
                onChange={(image) => patch({ image })}
              />
              {item.image ? (
                <TextArea
                  label="Photo description (alt text)"
                  value={item.alt}
                  onChange={(alt) => patch({ alt })}
                  placeholder="Long-tail boats moored off a limestone island in Krabi, Thailand"
                />
              ) : null}

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
        {/* No link fields: the rail is the whole of the reviews on this
            site, so a "view all" would have nowhere to point. */}
        <SectionHeaderFields
          value={value.header}
          onChange={(header) => onChange({ ...value, header })}
          withAction={false}
        />
      </Card>

      <Card
        icon={<Star className="size-5" />}
        title={`Reviews (${value.items.length})`}
        description="They run as one horizontal rail, so add as many as you like — the row scrolls rather than wrapping onto a second line."
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

      {/* Google's reviews are pulled in, not edited here, so the panel sits
          below the hand-written ones — the same order they appear in on the
          page. It saves through its own endpoints rather than this editor's
          draft, because credentials must not travel with homepage content. */}
      <GoogleBusinessPanel />
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

          <ImageField
            label="Background photo"
            value={value.backgroundImage}
            aspect="aspect-[2/1]"
            onChange={(backgroundImage) => onChange({ ...value, backgroundImage })}
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

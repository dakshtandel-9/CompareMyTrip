# CompareMyTrip Design System

**Version:** 1.0 · **Source:** 10 uploaded brand & design-system sheets · **Status:** Single source of truth for all CompareMyTrip web development

---

## How to read this document

Every value in this document carries one of two markers:

| Marker | Meaning |
|---|---|
| **[C]** | **Confirmed.** The value is printed in, or directly measurable from, the uploaded design-system sheets. Do not change it. |
| **[R]** | **Implementation recommendation based on the established visual system.** The sheets did not state this value explicitly; it is derived from surrounding confirmed values and must stay internally consistent. May be refined by the design owner, never by an implementer acting alone. |

### Source sheets referenced

| # | Sheet | Authority |
|---|---|---|
| 01 | Brand Guide Overview | **Summary only — superseded** |
| 02 | Brand Identity & Creative Direction | Canonical |
| 03 | Trending Visual Direction 2026 | Canonical |
| 04 | Complete Color System | Canonical |
| 05 | UI Components & Elements | Canonical |
| 06 | Brand Application & Mockups | Canonical |
| 07 | Typography System | Canonical |
| 08 | Iconography System | Canonical |
| 09 | Visual Style & Imagery | Canonical |
| 10 | Spacing & Layout System | Canonical |

### Conflict resolution rule (global)

Sheet 01 is a one-page compressed overview produced before the detailed sheets. Where sheet 01 disagrees with sheets 02–10, **sheets 02–10 win, always.** All known conflicts are listed in [§22 Conflict Register](#22-conflict-register) with a single binding resolution each.

---

## 0. Business Model — read first

**[C — product owner]** **CompareMyTrip is a travel-package platform.** It does not sell flights, does not operate as an airline, and does not issue tickets.

| | |
|---|---|
| **Primary product entity** | Travel package |
| **Discovery layer** | Destination |
| **Product journey** | Discover → Explore → Compare → Package detail → Enquire / Book |
| **Primary CTA (approved)** | **Explore Packages** — the single site-wide primary action |
| **Package-detail CTA** | **Enquire Now** |
| **Flights are** | supporting information *inside* a package (travel options, suggested flights, airport, transfers) — never the product |

**Never build as a primary pattern:** flight search, airline results, fare tables, baggage or fare-rule workflows, `DEL → BOM` route heroes, "Search Flights" / "Select Flight" / "Book Flight" CTAs.

**Terminology (binding).** Use the right-hand column everywhere — UI copy, component names, page names, file names.

| Never | Always |
|---|---|
| Search Flights | Explore Packages |
| Select Flight | Select Package |
| Flight results | Package results |
| Flight detail | Package detail |
| Book Flight | Book Package / Enquire Now |
| Flight deal | Package deal · Holiday offer · Limited-time package |
| Fare | Package price (always *per person*) |
| Airline comparison | Package comparison |

The airplane and dotted-path motifs remain **brand language** (§12) and do not imply a flight product.

---

## 1. Design System Purpose

### 1.1 What this system controls

This system is binding for every pixel that ships under the CompareMyTrip name:

- All color values, and where each one may appear
- All typography: families, sizes per breakpoint, weights, line heights, tracking
- All spacing, container widths, breakpoints and grid behavior
- All reusable UI components and every one of their interaction states
- Iconography: style, stroke, size, color, category
- Photography, illustration, shape language, texture and effects
- Motion durations and easing
- Reusable page patterns and page blueprints
- Accessibility and performance floors

### 1.2 What this system does not control

- Product copy, tone of voice beyond the brand adjectives, and legal text
- Backend data models, API shapes, pricing logic, inventory rules
- SEO strategy, analytics instrumentation, experiment frameworks
- Third-party embedded widgets (payment iframes, map tiles, chat providers). These must be *contained* by system-compliant chrome (card, radius, border, padding) but their internals are out of scope.
- Native mobile apps. The tokens transfer, the component specs here are web-first.

### 1.3 Design philosophy

CompareMyTrip helps people make a decision. Every visual choice serves one of three jobs:

1. **Clarity** — the user can find, read and compare the information without effort.
2. **Confidence** — the interface reads as trustworthy, accurate and premium.
3. **Optimism** — travel should feel exciting; the brand yellow is the carrier of that feeling and is spent sparingly so it keeps its value.

The visual system is **neutral-dominant with yellow as the decision signal.** Off-white and white surfaces, near-black type, slate secondary text, and yellow reserved almost exclusively for the action the user should take next.

### 1.4 Intended visual outcome

Premium but accessible · Modern but not futuristic · Friendly but not childish · Bold but not aggressive · Minimal but not empty · Travel-focused but not generic.

Concretely, a finished CompareMyTrip page should read as: generous whitespace, one clear yellow action per view, strong geometric headlines in Space Grotesk, calm Inter body copy, soft shadows instead of hard borders, rounded but not pill-soft geometry, and one travel photograph or one dotted flight-path motif — not both competing.

### 1.5 How developers and AI coding agents must use this document

1. **Read §21 Quick Reference first** for the token table, then return here for the component you are building.
2. **Never introduce a raw hex, px size, radius, shadow or duration that is not in this document.** If you need one, it does not exist yet — escalate rather than invent.
3. **Check §8 before writing any component.** If the component already exists, reuse the spec exactly.
4. **Check §15 before building any page section.** Pages are assembled from named patterns, not designed one at a time.
5. **Every component ships with all documented states.** A button without a focus state is an incomplete implementation, not a stylistic choice.
6. **Every layout ships mobile, tablet and desktop.** A desktop-only implementation is rejected.

> **THE RULE:** When uncertain, follow the established visual system rather than inventing a new pattern.

---

## 2. Brand Foundation

### 2.1 Brand personality

**[C — sheet 02]** The brand is positioned on sliders, not absolutes. The dot position on each spectrum is the binding target:

| Spectrum | Target position | Design consequence |
|---|---|---|
| Friendly ←→ Professional | Slightly toward Friendly (~40%) | Warm, human copy; rounded geometry; never corporate-cold |
| Modern ←→ Timeless | Modern (~35%) | Current type and layout, but no fad shapes that date in a year |
| Bold ←→ Minimal | Bold-leaning (~35%) | Large type, strong contrast, restrained color count |
| Premium ←→ Accessible | Centered, tilted Accessible (~60%) | Feels considered and expensive, never exclusive or intimidating |
| Playful ←→ Serious | Slightly Playful (~35%) | Illustration and micro-motion allowed; no jokes in critical flows |
| Futuristic ←→ Classic | Centered (~60% toward Classic) | Clean tech feel, no sci-fi, no neon, no glass everywhere |

### 2.2 Brand attributes

**[C — sheets 02, 09]** Smart · Modern · Friendly · Trustworthy · Adventurous · Optimistic · Confident · Simple.

Visual keywords **[C — sheet 02]**: Smart, Modern, Trustworthy, Dynamic, Friendly, Clear, Reliable, Adventurous, Effortless, Innovative, Organized, Forward-Thinking.

### 2.3 Visual DNA

**[C — sheet 02]** Six DNA traits, each with a direct visual instruction:

| DNA trait | Meaning | Visual instruction |
|---|---|---|
| Organic + Geometric | Balance of soft curves and structured forms | Cloud/blob shapes paired with strict grid layouts |
| Motion & Direction | Sense of forward progress | Diagonal flight paths, arrow-suffixed CTAs, left-to-right motion |
| Smart & Functional | Tools that simplify complex decisions | Dense data made scannable; never decorative at the cost of legibility |
| Bold & Confident | High readability, strong presence | Heavy display weights, near-black on white, no timid greys for headings |
| Friendly & Approachable | Welcoming, human-centric | Rounded corners, warm yellow, real people in photography |
| Modern & Futuristic | Clean, tech-forward | Stencil-cut logo geometry, precise alignment, generous whitespace |

**Logo colour — the binding source of truth [C — logo asset]**

The mark is **black + golden yellow**, on white. Sampled from the asset, the yellow is `rgb(255, 196, 12)` = **`#FFC40C`**, hue **46°**, saturation 100%, lightness 52%.

| Rule | Statement |
|---|---|
| The brand impression is | **BLACK + YELLOW/GOLD + WHITE/NEUTRALS** |
| The primary accent must read as | golden yellow — never orange |
| Hue range for every brand step | **43–48°**. Anything below ~40° is orange and out of the system |
| Orange is | a *semantic warning* colour only (§3.5), never an identity colour |
| Deeper interaction states go | deeper **gold** (`#E8AC00` → `#C99200`), not toward orange |
| Never | neon yellow, red-orange gradients, or an orange primary button |

Anywhere this document and the logo disagree, **the logo wins.**

### 2.4 Core emotions

**[C — sheet 02]** The user should feel: informed, confident and in control · excited about journeys and possibilities · that the best options are within reach · supported in every travel decision · the joy of discovering more for less.

Emotional perception targets: Trust, Excitement, Relief, Confidence, Satisfaction.

### 2.5 Brand principles

**[C — sheet 02]**

| Principle | Design obligation |
|---|---|
| **Simplify complexity** | Any screen with >5 competing choices must introduce hierarchy or progressive disclosure |
| **Empower choice** | Comparison data is never hidden behind interaction; prices and key facts visible at rest |
| **Build trust** | Trust markers (Best Price Guarantee, Secure Payments, 24/7 Support, No Hidden Charges) appear near every conversion point |
| **Move forward** | Motion, arrows and dotted paths always read left-to-right / forward |
| **Stay human** | Real photography over stock clichés; empathetic error and empty states |
| **Create value** | Savings, price drops and "best price" are visually privileged data |

### 2.6 Positioning direction

**[C — sheet 02]** Basic → **Premium** · Complicated → **Simple** · Generic → **Distinctive** · Cost-focused → **Value-focused** · Transactional → **Relationship-driven**.

Positioning statement **[C — sheet 02]**: sitting between technology and human needs — helping travelers compare smarter, travel better and save more.

Archetype: **The Guide / The Explorer / The Simplifier.** Brand energy: Dynamic, Fast, Progressive.

### 2.7 DO and DO NOT

**DO**

- Feel optimistic and forward-moving
- Keep interfaces clear and scannable above all
- Use bold contrast purposefully — near-black type on white, one yellow action
- Make travel feel exciting through photography and shape language, not through color noise
- Give content room to breathe (§5 spacing is a floor, not a ceiling)
- Reuse the established patterns before creating anything new
- Pair every price with the context that makes it trustworthy (destination, duration, inclusions, per-person basis)

**DO NOT**

- Use excessive gradients — gradients are accents, never page backgrounds
- Make the interface overly futuristic (no neon, no heavy glass, no 3D-cartoon shapes)
- Overuse yellow — see the hard cap in §3.9
- Add decoration that carries no meaning
- Create clutter — competing CTAs, more than one accent hue per section, stacked badges
- Use dark, gloomy, over-saturated or generic stock photography **[C — sheet 09]**
- Mix icon styles or sources **[C — sheet 08]**
- Ship a desktop layout scaled down and call it mobile

---

## 3. Complete Design Tokens

All tokens below are **[C — sheet 04]** unless marked otherwise. Naming uses the `--cmt-` prefix to prevent collision.

### 3.1 Primary scale — Sunshine Gold

**[C — logo]** The scale is anchored on the logo mark, whose fill samples at `rgb(255, 196, 12)` = **`#FFC40C`**, hue **46°**. Every step of the ramp stays in hue **43–48°**. No step is orange. If a proposed brand colour reads below hue ~40° it is out of the system.


| Token | HEX | Intended usage | Restrictions |
|---|---|---|---|
| `--cmt-color-primary-50` | `#FFFBEB` | Large tinted washes, soft section backgrounds, hero blobs | Never for text |
| `--cmt-color-primary-100` | `#FFEDA6` | Badge fills, icon backplates, selected-row tint, brand pills | Never for text |
| `--cmt-color-primary-200` | `#FFE066` | Decorative shapes, badge borders, illustration mid-tone | Never for text on white |
| `--cmt-color-primary-300` | `#FFD42E` | Gradient stop (light end), illustration fill | Never for text on white |
| `--cmt-color-primary-400` | `#FFCB19` | Brand-yellow text **on dark surfaces only** (11.4:1 on `#0F172A`), gradient stop | Not for text on white/off-white |
| `--cmt-color-primary-500` | `#FFC40C` | **Primary action colour — sampled from the logo (hue 46°).** All primary buttons, active tabs, toggles, sliders, progress fill, focus rings | Surface only, never text. `#0F172A` on it = 10.8:1 |
| `--cmt-color-primary-600` | `#E8AC00` | **Confirmed hover** for primary surfaces; deep gradient stop | Surface only, never text on white (1.9:1) |
| `--cmt-color-primary-700` | `#C99200` | **Active / pressed state** of primary surfaces | Surface only, never text on white (2.7:1) |
| `--cmt-color-primary-800` | `#A37600` | Two-tone headline highlight on **light** backgrounds at ≥32px; chart series | Text only at ≥24px or ≥18.66px bold (4.1:1, AA-Large) |
| `--cmt-color-primary-900` | `#7A5800` | **Gold text on light surfaces** (6.5:1) — links, brand-accent labels, feature-card CTAs, icon category headings | The only brand-family colour permitted as small text on white |

### 3.2 Secondary scale — Slate Blue

| Token | HEX | Intended usage |
|---|---|---|
| `--cmt-color-secondary-50` | `#F1F5F9` | Alternate section background |
| `--cmt-color-secondary-100` | `#E2E8F0` | Dividers, default borders |
| `--cmt-color-secondary-200` | `#CBD5E1` | Disabled fills, inactive tracks |
| `--cmt-color-secondary-300` | `#94A3B8` | Placeholder text, disabled labels |
| `--cmt-color-secondary-400` | `#64748B` | Muted / tertiary text |
| `--cmt-color-secondary-500` | `#475569` | **Secondary CTA fill**, secondary button background |
| `--cmt-color-secondary-600` | `#334155` | **Body text** |
| `--cmt-color-secondary-700` | `#1E293B` | Dark card surface, dark section background |
| `--cmt-color-secondary-800` | `#0F172A` | **Heading text**, primary dark surface (dark hero, footer, promo cards) |
| `--cmt-color-secondary-900` | `#020617` | Deepest dark — top utility bar, extreme contrast surfaces |

### 3.3 Neutral system

| Token | HEX | Intended usage |
|---|---|---|
| `--cmt-color-white` | `#FFFFFF` | Page background, card background, text on dark |
| `--cmt-color-offwhite` | `#FAFAFA` | Warm alternate page background |
| `--cmt-color-neutral-50` | `#F8FAFC` | **Confirmed secondary background** — the standard alternating section fill |
| `--cmt-color-neutral-100` | `#F1F5F9` | Filled input background, subtle chip fill |
| `--cmt-color-neutral-200` | `#E2E8F0` | **Confirmed default border color** |
| `--cmt-color-neutral-300` | `#CBD5E1` | **Confirmed disabled state** fill/border |
| `--cmt-color-neutral-400` | `#94A3B8` | Placeholder, icon-muted |
| `--cmt-color-neutral-500` | `#64748B` | **Confirmed muted text** |
| `--cmt-color-neutral-600` | `#475569` | Secondary UI surface (dark buttons) |
| `--cmt-color-neutral-700` | `#334155` | **Confirmed body text** |
| `--cmt-color-neutral-800` | `#1E293B` | Dark surface |
| `--cmt-color-neutral-900` | `#0F172A` | **Confirmed heading text**, primary dark surface |
| `--cmt-color-near-black` | `#0A0A0A` | Logo wordmark, boarding-pass/merch black, maximal contrast graphics |
| `--cmt-color-black` | `#000000` | Logo only, and pure-black print applications |

> **Note on the neutral / secondary overlap:** the neutral scale and the slate-blue secondary scale are the same hue family offset by one step (neutral-100 = secondary-50, etc.). This is intentional and safe. Use **neutral-*** tokens for surfaces, borders and text; use **secondary-*** tokens when you are deliberately referencing the brand's dark identity (dark hero, dark CTA, dark promotional card). Never mix the two names for the same purpose in one component.

### 3.4 Accent colors

Accents are for **categorization and data differentiation only** — never for primary actions.

| Family | 100 | 300 | 500 | 700 | Intended usage |
|---|---|---|---|---|---|
| Sky Blue | `#E0F2FE` | `#7DD3FC` | `#0EA5E9` | `#0369A1` | Beach & island packages, informational data, map accents |
| Teal | `#CCFBF1` | `#5EEAD4` | `#14B8A6` | `#0F766E` | Adventure & nature packages, "verified" markers, savings charts |
| Purple | `#EDE9FE` | `#A78BFA` | `#7C3AED` | `#5B21B6` | Honeymoon & luxury packages, premium & loyalty tiers |
| Coral | `#FFE4E6` | `#FDA4AF` | `#F43F5E` | `#BE123C` | Urgency, "limited-time package", price-drop markers |

**Orange — binding rule.** Orange is **not a brand colour** and has no accent ramp. It exists in this system only as the semantic **warning** family (§3.5), where its meaning is "caution". Never use warning amber as a decorative or brand yellow, and never let an orange become the primary action colour. Where a design calls for "a deeper orange-ish brand tone", the answer is always a deeper **gold** — `primary-700` `#C99200` for surfaces, `primary-900` `#7A5800` for text.

**Accent rules:** maximum **one** accent family visible per section. Accent 500 is the only tier permitted for icons/borders on light backgrounds; 100 for fills; 700 for text on a 100 fill.

### 3.5 Semantic colors

| Role | 100 (fill) | 300 (border/illustrative) | 500 (icon/primary) | 700 (text on 100 fill) |
|---|---|---|---|---|
| Success | `#DCFCE7` | `#86EFAC` | `#22C55E` | `#15803D` |
| Warning | `#FEF3C7` | `#FCD34D` | `#F59E0B` | `#B45309` |
| Error | `#FEE2E2` | `#F87171` | `#EF4444` | `#B91C1C` |
| Information | `#DBEAFE` | `#60A5FA` | `#3B82F6` | `#1D4ED8` |

> **Warning vs Brand (binding):** brand gold `#FFC40C` sits at hue **46°**; warning amber `#F59E0B` sits at hue **38°** and is visibly more orange. That separation is deliberate and must be preserved. Warning is status-only — never a decorative yellow. Brand gold never signals a warning. A warning must never be mistakable for the primary action.

### 3.6 Semantic aliases (use these in components)

Components must reference aliases, not raw scale steps. This is what makes a future theme change possible.

```
/* Surfaces */
--bg-page:            var(--cmt-color-white);       /* #FFFFFF  [C] */
--bg-page-alt:        var(--cmt-color-neutral-50);  /* #F8FAFC  [C] secondary background */
--bg-surface:         var(--cmt-color-neutral-50);  /* #F8FAFC  [C] */
--bg-card:            var(--cmt-color-white);       /* #FFFFFF  [C] */
--bg-inset:           var(--cmt-color-neutral-100); /* #F1F5F9  [R] filled input, inset panel */
--bg-dark:            var(--cmt-color-neutral-900); /* #0F172A  [C] dark hero/CTA/footer */
--bg-dark-alt:        var(--cmt-color-neutral-800); /* #1E293B  [R] card on dark */
--bg-utility-bar:     var(--cmt-color-secondary-900);/* #020617 [R] top announcement bar */

/* Text */
--text-primary:       var(--cmt-color-neutral-900); /* #0F172A  [C] headings, 21.0:1 on white */
--text-body:          var(--cmt-color-neutral-700); /* #334155  [C] body, 11.7:1 on white */
--text-secondary:     var(--cmt-color-neutral-600); /* #475569  [R] */
--text-muted:         var(--cmt-color-neutral-500); /* #64748B  [C] 4.6:1 on #FAFAFA */
--text-placeholder:   var(--cmt-color-neutral-400); /* #94A3B8  [C] non-essential text only */
--text-on-dark:       var(--cmt-color-white);       /* #FFFFFF  [C] 17.0:1 on #0F172A */
--text-on-dark-muted: var(--cmt-color-neutral-300); /* #CBD5E1  [C] 8.7:1 on #0F172A */
--text-accent-on-dark:var(--cmt-color-primary-400); /* #FFCB19  [C] 11.4:1 on #0F172A */
--text-accent-on-light:var(--cmt-color-primary-900);/* #7A5800  [C] 6.5:1 on #FFFFFF */
--text-on-primary:    var(--cmt-color-neutral-900); /* #0F172A  [C] text on yellow buttons */

/* Borders */
--border-default:     var(--cmt-color-neutral-200); /* #E2E8F0  [C] */
--border-subtle:      var(--cmt-color-neutral-100); /* #F1F5F9  [R] */
--border-strong:      var(--cmt-color-neutral-300); /* #CBD5E1  [R] hover/emphasis */
--border-focus:       var(--cmt-color-primary-500); /* #FFC40C  [C] */
--border-on-dark:     rgba(255,255,255,0.12);       /* [R] */

/* Actions */
--action-primary:       var(--cmt-color-primary-500); /* #FFC40C [C] brand gold  */
--action-primary-hover: var(--cmt-color-primary-600); /* #E8AC00 [C] deeper gold */
--action-primary-active:var(--cmt-color-primary-700); /* #C99200 [C] deepest gold */
--action-primary-fg:    var(--cmt-color-neutral-900); /* #0F172A [C] */
--action-secondary:       var(--cmt-color-neutral-900);/* #0F172A [C] dark button fill */
--action-secondary-hover: var(--cmt-color-secondary-500);/* #475569 [C] "Secondary CTA" value */
--action-secondary-fg:    var(--cmt-color-white);     /* #FFFFFF [C] */
--action-disabled-bg:   var(--cmt-color-neutral-100); /* #F1F5F9 [R] */
--action-disabled-fg:   var(--cmt-color-neutral-300); /* #CBD5E1 [C] disabled state color */

/* Status */
--status-success: var(--cmt-color-success-500); /* #22C55E [C] */
--status-warning: var(--cmt-color-warning-500); /* #F59E0B [C] */
--status-error:   var(--cmt-color-error-500);   /* #EF4444 [C] */
--status-info:    var(--cmt-color-info-500);    /* #3B82F6 [C] */
```

### 3.7 Confirmed light-theme usage map **[C — sheet 04, panel 6]**

| Role | Value |
|---|---|
| Primary background | `#FFFFFF` |
| Secondary background | `#F8FAFC` |
| Card background | `#FFFFFF` |
| Border color | `#E2E8F0` |
| Heading text | `#0F172A` |
| Body text | `#334155` |
| Muted text | `#64748B` |
| Primary CTA | `#FFC40C` |
| Secondary CTA | `#475569` |
| Hover state | `#E8AC00` |
| Disabled state | `#CBD5E1` |

### 3.8 Confirmed contrast measurements **[C — sheet 04, panel 7]**

| Pair | Ratio | Rating | Implementation rule |
|---|---|---|---|
| `#0F172A` on `#FFFFFF` | 21.0:1 | AAA | Default heading pairing |
| `#334155` on `#FFFFFF` | 11.7:1 | AAA | Default body pairing |
| `#64748B` on `#FAFAFA` | 4.6:1 | AA | Muted text — 14px+ only, never for essential info |
| `#0F172A` on `#FFC40C` | 10.8:1 | AAA | Dark text on brand gold — the primary button pairing |
| `#7A5800` on `#FFFFFF` | 6.5:1 | AA | **The only brand-family text colour on light.** Links, accent labels, card CTAs |
| `#A37600` on `#FFFFFF` | 4.1:1 | AA Large | Two-tone headline highlight, ≥24px or ≥18.66px bold only |
| `#FFC40C` on `#FFFFFF` | 1.6:1 | Fail | **Brand gold is a surface, never text on white.** No exceptions |
| `#FFFFFF` on `#0F172A` | 17.0:1 | AAA | Dark-surface default |
| `#CBD5E1` on `#0F172A` | 8.7:1 | AAA | Muted text on dark |
| `#94A3B8` on `#1E293B` | 4.6:1 | AA | Minimum acceptable on dark cards |
| `#FFCB19` on `#0F172A` | 11.4:1 | AAA | The approved brand-yellow text pairing on dark |

### 3.9 Color balance and the yellow cap

**[C — sheet 04]** The published harmony chart reads Primary 60% / Secondary 25% / Neutrals 10% / Accents 5%.

**Conflict:** taken literally as surface coverage this contradicts the brand rule "do not overuse yellow" and every mockup in sheets 03 and 06, where yellow occupies a small fraction of the page.

**Binding resolution [R]:** the chart describes **brand-color voice** (how much of the *branded, non-neutral* expression is yellow), not surface area. The implementation rule is:

| Rule | Value |
|---|---|
| Neutral surfaces (white / off-white / neutral-50) | ≥ 70% of any viewport |
| Yellow (`primary-*`) coverage | ≤ 10% of any viewport |
| Dark (`neutral-800/900`) coverage | ≤ 20% of any viewport, and never adjacent to another dark block |
| Accent families visible per section | 1 |
| Yellow primary CTAs visible per viewport | **1** (a second yellow element is allowed only as a badge or an active tab indicator) |

---

## 4. Typography System

### 4.1 Font families **[C — sheet 07]**

| Role | Family | Weights available | Character |
|---|---|---|---|
| Primary display | **Space Grotesk** | 300, 400, 500, 600, 700, 800 | Modern · Geometric · Adventurous |
| Primary body & UI | **Inter** | 300, 400, 500, 600, 700 | Clean · Highly readable · Neutral |
| Optional accent | **Sora** | 400, 500, 600, 700 | Friendly · Playful · Rounded |

```
--font-display: 'Space Grotesk', 'Segoe UI', system-ui, sans-serif;
--font-body:    'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
--font-accent:  'Sora', 'Inter', system-ui, sans-serif;
```

**Loading [R]:** ship Space Grotesk 500/600/700 and Inter 400/500/600/700 as the only production weights. Subset to `latin` + the Indian Rupee sign `₹` (U+20B9). Use `font-display: swap` and preload the two most-used files (Inter 400, Space Grotesk 700). Do not load 300 or 800 unless a specific approved design requires it.

### 4.2 Sora — restriction (binding)

Sheet 07 lists Sora as **optional**, for "short labels, badges, prices, highlights."

**Binding production rule [R]:** **Sora is not loaded on the production website.** A third family costs ~30–60KB for a role Inter 600 already fills. Sora is approved for **brand/marketing collateral only** (campaign artwork, merchandise, presentation decks). If a future exception is approved:

- allowed on: numeric price displays ≥24px, badge text, and 1–3 word highlight labels
- forbidden on: headings, body copy, buttons, form labels, navigation, tables
- maximum one Sora weight loaded (600)

Until such an exception is granted in writing, treat any Sora usage in web code as a defect.

### 4.3 Typography hierarchy **[C — sheet 07, panel 4]**

Sizes are Desktop / Tablet / Mobile. Letter-spacing percentages are relative to font size; the `em` value is the implementation form.

| Style | Family | Desktop | Tablet | Mobile | Weight | Line height | Tracking | Usage |
|---|---|---|---|---|---|---|---|---|
| Display XXL | Space Grotesk | 72px | 56px | 40px | 700 | 1.05 | −1.5% (−0.015em) | Big hero headlines |
| Display XL | Space Grotesk | 56px | 44px | 32px | 700 | 1.10 | −1% (−0.01em) | Large statements |
| H1 | Space Grotesk | 40px | 32px | 26px | 600 | 1.20 | −0.5% (−0.005em) | Page titles |
| H2 | Space Grotesk | 32px | 26px | 22px | 600 | 1.25 | −0.3% (−0.003em) | Section headings |
| H3 | Space Grotesk | 24px | 20px | 18px | 600 | 1.30 | 0 | Subsection titles |
| H4 | Space Grotesk | 20px | 18px | 16px | 500 | 1.35 | 0 | Card titles / small titles |
| H5 | Inter | 16px | 15px | 14px | 600 | 1.40 | 0 | Labels / overlines |
| H6 | Inter | 14px | 14px | 12px | 600 | 1.40 | 0.5% (0.005em) | Small labels |
| Body Large | Inter | 18px | 16px | 15px | 400 | 1.60 | 0 | Large paragraphs, hero subcopy |
| Body Regular | Inter | 16px | 15px | 14px | 400 | 1.60 | 0 | Default paragraphs |
| Body Small | Inter | 14px | 13px | 12px | 400 | 1.55 | 0 | Secondary text, helper text |
| Caption | Inter | 12px | 11px | 11px* | 400 | 1.50 | 0 | Captions, legal, metadata |
| Label | Inter | 11px | 11px* | 11px* | 600 | 1.40 | 0.8% (0.008em) | Form labels, overline meta |
| Button | Inter | 16px | 15px | 14px | 600 | 1.20 | 0.5% (0.005em) | Buttons / CTAs |

\* **Legibility floor conflict.** Sheet 07 specifies Caption 10px mobile and Label 10px tablet / 9px mobile. Sizes below 11px fail practical legibility and touch-device rendering.
**Binding resolution [R]:** absolute minimum rendered text size is **11px**, and 12px is preferred for anything a user must read. Caption and Label clamp at 11px on tablet and mobile. Label remains 11px on desktop as published, and must always be uppercase with 0.8% tracking so it reads as an overline, not as copy.

### 4.4 Scaling principle **[C — sheet 07]**

A modular scale of **1.250** governs the ramp. Tablet ≈ 78–80% of desktop; mobile ≈ 55–65% of desktop for display sizes and ≈ 87% for body sizes — body copy shrinks far less than headlines. Do not interpolate arbitrary sizes: use the published per-breakpoint values.

**[R]** Optional fluid implementation for display styles only:
```
--type-display-xxl: clamp(40px, 2.2rem + 3.4vw, 72px);
--type-display-xl:  clamp(32px, 1.9rem + 2.4vw, 56px);
--type-h1:          clamp(26px, 1.5rem + 1.4vw, 40px);
--type-h2:          clamp(22px, 1.3rem + 0.9vw, 32px);
```
H3 and below use fixed per-breakpoint values.

### 4.5 Line length, wrapping and measure

| Rule | Value | Note |
|---|---|---|
| Display XXL / XL max width | 14 words or ~20ch per line | Force a deliberate 2–3 line break; never let a hero headline run 4+ lines |
| H1 max measure | 20ch | |
| H2 max measure | 28ch | |
| H3 / H4 max measure | 40ch | |
| Paragraph measure (Body Large) | 60–72ch, hard max `680px` | |
| Paragraph measure (Body Regular) | 60–75ch, hard max `640px` | |
| Card body measure | 3 lines desktop / 4 lines mobile, then truncate with `…` | |
| Table cell text | no measure limit; wrap disabled on numeric columns | |

**Wrapping rules [R]**
- All headings: `text-wrap: balance` (falls back gracefully).
- All paragraphs: `text-wrap: pretty`.
- Never hyphenate headings. `hyphens: none` on display and heading styles.
- Brand phrases never break across lines: wrap "CompareMyTrip", "Best Price Guarantee", durations ("4 Nights / 5 Days") and prices ("₹12,499") in a non-breaking span.
- The two-tone headline pattern (`Travel Smarter,` in `--text-primary` + `Together.` / `Save More` in yellow) **[C — sheets 06, 07, 09]** always breaks *before* the yellow segment.

**Gold headline segment [C]:** on light backgrounds the highlighted word uses `#A37600` (primary-800) at ≥32px. On dark backgrounds it uses `#FFCB19` (primary-400). Never a bright gold below 32px on white, and **never substitute an orange because it contrasts more** — the two-tone language is black + gold.

### 4.6 Mobile typography behavior

- Body Regular never drops below 14px; helper text never below 12px.
- Headline tracking tightens as size grows; at mobile sizes Display XXL keeps −1.5% but H1 relaxes to −0.5%.
- Line height *increases* as size decreases: display 1.05 → body 1.60. Never apply display line heights to mobile body copy.
- Uppercase is permitted only for Label and H6; always with the published tracking, never for sentences.
- Left-align everything except: hero copy in centered hero patterns, and empty states. Never justify.

---

## 5. Spacing System

### 5.1 Base unit and scale **[C — sheet 10]**

**Base unit: 4px. Every spacing value is a multiple of 4.** The published scale is confirmed and complete — no other values may be used.

| Token | px | rem | Confirmed usage |
|---|---|---|---|
| `--space-1` | 4px | 0.25rem | Fine details, borders, tight gaps |
| `--space-2` | 8px | 0.5rem | Micro spacing, icon gaps, table spacing |
| `--space-3` | 12px | 0.75rem | Small gaps, compact elements |
| `--space-4` | 16px | 1rem | Base spacing, default gaps |
| `--space-5` | 20px | 1.25rem | Small component spacing |
| `--space-6` | 24px | 1.5rem | Medium spacing, between elements |
| `--space-8` | 32px | 2rem | Large spacing, section internals |
| `--space-10` | 40px | 2.5rem | Between cards, large components |
| `--space-12` | 48px | 3rem | Between content blocks |
| `--space-16` | 64px | 4rem | Section spacing (standard) |
| `--space-20` | 80px | 5rem | Large section spacing |
| `--space-24` | 96px | 6rem | Hero section spacing |
| `--space-30` | 120px | 7.5rem | Extra large spacing |
| `--space-40` | 160px | 10rem | Maximum section spacing |

> The brief's proposed scale is **confirmed as correct** against sheet 10. Note the scale deliberately skips 56px, 72px, 88px, 104px, 112px and 144px — those values do not exist in this system.

### 5.2 Section spacing **[C — sheet 10, panel 5]**

| Section type | Desktop padding-Y | Tablet **[R]** | Mobile **[R]** | Use for |
|---|---|---|---|---|
| Small section | 48px (3rem) | 40px | 32px | Dense utility bands, trust rows, breadcrumb bands |
| Standard section | 64px (4rem) | 56px→ use 48px | 40px | Default for every content section |
| Large section | 96px (6rem) | 80px | 64px | Feature sections, editorial blocks, closing CTAs |
| Hero section | 120–160px (7.5–10rem) | 96px | 64px | Homepage and landing heroes only |

Tablet values snap to the scale; 56px does not exist, so tablet Standard = 48px.

### 5.3 Page padding (horizontal gutters) **[C — sheet 10]**

| Breakpoint | Page gutter |
|---|---|
| Desktop (≥1024px) | 24px each side (auto margins beyond that) |
| Tablet (768–1023px) | 20px each side (matches tablet grid gutter) |
| Mobile (<768px) | 16px each side |

### 5.4 Component spacing **[C — sheet 10, panel 6]**

**Button padding**

| Size | Padding (Y × X) |
|---|---|
| Small | 8px × 16px |
| Medium | 12px × 24px |
| Large | 16px × 32px |

**Card padding:** 24px on all four sides (desktop and tablet). **[R]** Mobile cards may reduce to 20px; compact data rows may use 16px.

**Form spacing**

| Relationship | Gap |
|---|---|
| Label → input | 8px **[R]** |
| Input → next label (field to field) | 16px |
| Input → help/error text | 8px **[R]** |
| Help text → next field | 24px |
| Field group → form action | 32px |

**Icon spacing:** 16px between adjacent standalone icons; **8px** between an icon and its adjacent text label **[R, consistent with sheet 10's "micro spacing, icon gaps"]**.

**Text spacing (margin-bottom)**

| Element | Margin-bottom |
|---|---|
| Heading | 24px |
| Subheading | 16px |
| Paragraph | 16px |
| Small text | 12px |

**Additional component gaps [R]**

| Relationship | Gap |
|---|---|
| Between cards in a grid | 24px (matches gutter) |
| Between cards, large/feature | 40px |
| Between content blocks inside a section | 48px |
| Section heading block → content | 40px desktop / 32px mobile |
| Eyebrow label → heading | 12px |
| Heading → sub-copy in a section header | 16px |
| Badge/tag inline gap | 8px |
| Table row padding-Y | 16px (12px in compact results tables) |

### 5.5 Mobile spacing rules

- Page gutter 16px, never less. Content must never touch the viewport edge except full-bleed imagery and horizontally scrolling card rails.
- Section padding-Y drops one to two steps from desktop (see 5.2) but never below 32px.
- Vertical rhythm between stacked cards: 16px (compact lists) or 24px (content cards).
- Sticky elements (booking bar, filter bar) reserve 16px internal padding and clear the safe-area inset.

---

## 6. Layout and Grid System

### 6.1 Breakpoints **[C — sheet 10, panel 3]**

| Name | Range | Device class |
|---|---|---|
| `xl` | ≥ 1440px | Large desktop |
| `lg` | 1024px – 1439px | Laptop / small desktop |
| `md` | 768px – 1023px | Tablet |
| `sm` | 640px – 767px | Large phone |
| `xs` | < 640px | Phone |

```
--bp-xs: 0;      --bp-sm: 640px;  --bp-md: 768px;
--bp-lg: 1024px; --bp-xl: 1440px;
```

### 6.2 Container widths **[C — sheet 10, panels 3 & 4]**

| Device | Max container width | Gutter (page padding) | Effective content width |
|---|---|---|---|
| Desktop (xl, ≥1440px) | **1440px** | 24px each side | **1392px** |
| Laptop (lg, 1024–1439px) | **1140px** | 24px each side | up to 1092px |
| Tablet (md, 768–1023px) | **768px** | 20px each side | 728px |
| Mobile (<768px) | **100%** | 16px each side | viewport − 32px |

Container is centered with `margin: auto`. **[C]** The 1440px container includes the 24px side margins; the true content box is 1392px — grid math must start from 1392, not 1440.

**[R] Narrow container:** for article and legal pages, an inner `--container-narrow: 760px` centered inside the standard container. Derived from the Body Large measure rule in §4.5.

### 6.3 Grid system **[C — sheet 10, panel 4]**

| Breakpoint | Columns | Max width | Gutter | Margin | Column behavior |
|---|---|---|---|---|---|
| Desktop ≥1024px | **12** | 1440px | **24px** | auto | Fluid |
| Tablet 768–1023px | **8** | 768px | **20px** | auto | Fluid |
| Mobile <768px | **4** | 100% | **16px** | 16px | Fluid |

Desktop column width at xl: (1392 − 11 × 24) ÷ 12 = **94px**.

```
.container { width:100%; max-width:1440px; margin-inline:auto; padding-inline:24px; }
.grid      { display:grid; grid-template-columns:repeat(12,1fr); gap:24px; }
@media (max-width:1439px){ .container{ max-width:1140px; } }
@media (max-width:1023px){ .container{ max-width:768px; padding-inline:20px; }
                           .grid{ grid-template-columns:repeat(8,1fr); gap:20px; } }
@media (max-width:767px) { .container{ max-width:100%; padding-inline:16px; }
                           .grid{ grid-template-columns:repeat(4,1fr); gap:16px; } }
```

### 6.4 Layout patterns and when to use each **[C — sheet 10, panel 7]**

| Pattern | Desktop spans | Tablet (8col) | Mobile (4col) | Use when |
|---|---|---|---|---|
| **2-column** | 6 + 6 | 4 + 4 | stack 4 | Two peer content blocks; text + image; compare-two |
| **3-column** | 4 + 4 + 4 | 4 + 4, third wraps | stack 4 | Three features, three destinations, three benefits |
| **Feature grid (4-column)** | 3 + 3 + 3 + 3 | 4 + 4 (2×2) | stack 4, or 2×2 at ≥640px | Icon feature cards, trust points, category tiles |
| **Hero layout** | Content 6–7, media 5–6 (full-bleed media edge allowed) | Content 8 over media | Content stacks above cropped media | Page-opening sections |
| **Asymmetric** | **8 + 4** | 8 + 8 stacked | stack 4 | Main content + sidebar; results + filters; article + TOC |
| **Full-bleed band** | 12 (content still constrained to container) | 8 | 4 | Dark CTA bands, image bands, testimonial bands |
| **Rail (horizontal scroll)** | container-width viewport, cards 3–4 visible | 2.2 visible | 1.15 visible | Deals, destinations, related items |

**Gutter for all layout examples: 24px on desktop [C].**

**Column-span rules [R]**
- Never fewer than 3 desktop columns for a readable text block (3 × 94px + gutters = 330px minimum).
- Never place two 8-column blocks side by side; the asymmetric pattern is 8 + 4 only.
- Media in a split layout may extend to the viewport edge, but its *content-side* edge must land on a grid column.

---

## 7. Responsive Design Rules

### 7.1 Per-breakpoint behavior

| Aspect | Desktop (≥1440) | Laptop (1024–1439) | Tablet (768–1023) | Mobile (<768) |
|---|---|---|---|---|
| Container | 1440px, 24px gutters | 1140px, 24px gutters | 768px, 20px gutters | 100%, 16px gutters |
| Grid | 12 col / 24px | 12 col / 24px | 8 col / 20px | 4 col / 16px |
| Typography | Desktop column of §4.3 | Desktop column | Tablet column | Mobile column |
| Section padding-Y | 64 / 96 / 120–160 | 64 / 80 / 120 | 48 / 80 / 96 | 40 / 64 / 64 |
| Cards | 3–4 across | 3 across | 2 across | 1 across, or rail |
| Card padding | 24px | 24px | 24px | 20px |
| Navigation | Full horizontal nav + utility bar | Full horizontal nav, "More" collapses earlier | Condensed nav or hamburger | Hamburger + bottom-anchored primary action |
| Buttons | Auto width, size Medium/Large | Same | Same | **Full-width primary CTA**, min height 48px |
| Search module | Single horizontal row, inline fields | Single row, tighter | 2 rows | Stacked fields, sticky "Search" button |
| Images | 16:9 hero, 4:3 content | Same | 4:3 / 1:1 | 4:3 crop with subject re-centered, or 1:1 |
| Data tables | Full table | Full table | Horizontal scroll or 2-col pairs | Card-per-row stacking |

### 7.2 Confirmed responsive reference **[C — sheet 10, panel 8]**

The published example shows one hero adapting across all four breakpoints with these behaviors preserved at every size: logo + nav present, headline present with its two-tone treatment, yellow CTA present, decorative flight path retained, and the 3 feature items intact — becoming a 3-across row on desktop/laptop/tablet and a **vertical stacked list on mobile**. Content is never dropped between breakpoints; only its arrangement changes.

### 7.3 Strict responsive rules (non-negotiable)

1. **Never simply shrink a desktop layout.** Each breakpoint's layout is chosen from §6.4, not scaled.
2. **Mobile layouts are intentionally designed.** Reorder for mobile priority: price and primary action move up; secondary metadata moves down or into a disclosure.
3. **Touch targets ≥ 44 × 44px** with ≥ 8px separation. Icon-only buttons get a 44px hit area even when the glyph is 24px.
4. **Text stays readable:** 14px minimum body, 11px absolute floor, 16px minimum for any input (prevents iOS zoom-on-focus).
5. **Horizontal overflow is prohibited.** `overflow-x: hidden` is a bug patch, not a solution — fix the offending element. Exception: intentional card rails, which must show a partial next card (peek ≥ 24px) to signal scrollability.
6. **Cards stack or scroll intentionally.** Never allow a 4-across grid to reflow into an orphaned single card on the last row without design intent.
7. **No hover-only affordances.** Anything revealed on hover must be permanently visible or tap-accessible on touch.
8. **Sticky elements** are capped at one per screen edge; a sticky booking bar and a sticky filter bar may not coexist on mobile.
9. **Images crop, they do not letterbox.** Use `object-fit: cover` with an art-directed focal point per breakpoint (§10.4).
10. **Breakpoint parity of meaning:** if a trust marker, price, or legal disclosure is visible on desktop, it must be reachable on mobile within one interaction.

---

## 8. UI Component System

All component specs are drawn from sheet 05 (states and anatomy), sheet 10 (padding), sheet 04 (color) and sheet 06 (applied examples).

### 8.0 Shared foundations

**Border radius scale [C — sheet 09, panel 5]**

| Token | Value | Confirmed usage |
|---|---|---|
| `--radius-sm` | **8px** | Small elements — badges (rectangular), tags, small thumbnails, inline chips |
| `--radius-md` | **16px** | **Cards** |
| `--radius-lg` | **24px** | **Images**, image containers, large media blocks |
| `--radius-xl` | **32px** | Large surfaces — hero media panels, promotional blocks, modal sheets |
| `--radius-full` | **9999px** | Pills — badges with icon, toggles, avatars, category chips |

**[R] Control radius:** buttons, inputs, selects and other 40–56px-tall controls use **12px** — the value that sits between the 8px small and 16px card steps and matches the applied mockups in sheets 05 and 06. This is the only radius value not printed on a sheet; it is fixed here and must not be re-derived per component.

**Shadow scale [R — derived from sheet 09 "soft, layered shadows for elevation" and sheet 03 "soft, realistic shadows"]**

| Token | Value | Use |
|---|---|---|
| `--shadow-xs` | `0 1px 2px rgba(15,23,42,0.05)` | Inputs at rest, table rows |
| `--shadow-sm` | `0 2px 8px rgba(15,23,42,0.06)` | Cards at rest, navbar at scroll |
| `--shadow-md` | `0 6px 16px rgba(15,23,42,0.08)` | Card hover, dropdown menus, tooltips |
| `--shadow-lg` | `0 12px 32px rgba(15,23,42,0.10)` | Floating search module, sticky booking panel |
| `--shadow-xl` | `0 24px 56px rgba(15,23,42,0.12)` | Modals, command overlays |
| `--shadow-primary` | `0 4px 14px rgba(255,196,12,0.30)` | Yellow CTA hover glow only — never at rest, never on more than one element |
| `--focus-ring` | `0 0 0 3px rgba(255,196,12,0.45)` | Universal focus indicator |

Shadow rules: never more than two elevation levels visible in one section; never a shadow on a dark surface (use a 1px `rgba(255,255,255,0.12)` border instead); never a colored shadow other than `--shadow-primary`.

**Transitions [C — §14]:** `150ms` micro, `200ms` default, `300ms` layout, `400ms` reveal; easing `cubic-bezier(0.4, 0, 0.2, 1)`.

---

### 8.1 Buttons

**Variants [C — sheet 05, panel 1]:** Primary (Yellow), Secondary (Dark), Outline, Text, Icon-only. Every variant ships five states: Default, Hover, Active, Focus, Disabled.

**Sizes [C — sheet 05 + sheet 10]**

| Size | Padding | Font | Min height **[R]** | Icon size | Icon gap **[R]** | Radius |
|---|---|---|---|---|---|---|
| Small | 8px 16px | Inter 600 · 14px | 36px | 16px | 8px | 12px |
| Medium | 12px 24px | Inter 600 · 16px | 44px | 20px | 8px | 12px |
| Large | 16px 32px | Inter 600 · 18px **[R]** | 52px | 24px | 12px | 12px |

Button text style is **[C]**: Inter 600, 16px desktop / 15px tablet / 14px mobile, line-height 1.20, tracking 0.5%.

**Primary (Yellow)** — the single most important control on any page.

| State | Background | Text | Border | Shadow |
|---|---|---|---|---|
| Default | `#FFC40C` | `#0F172A` | none | `--shadow-xs` |
| Hover | `#E8AC00` | `#0F172A` | none | `--shadow-primary`; translateY(−1px) |
| Active | `#C99200` **[R]** | `#0F172A` | none | none; translateY(0) |
| Focus | `#FFC40C` | `#0F172A` | none | `--focus-ring` (3px yellow ring, 2px offset) |
| Disabled | `#F1F5F9` | `#CBD5E1` | none | none; `cursor:not-allowed` |

**Secondary (Dark)**

| State | Background | Text |
|---|---|---|
| Default | `#0F172A` | `#FFFFFF` |
| Hover | `#1E293B` | `#FFFFFF` |
| Active | `#020617` **[R]** | `#FFFFFF` |
| Focus | `#0F172A` + `--focus-ring` | `#FFFFFF` |
| Disabled | `#E2E8F0` | `#94A3B8` |

**Outline**

| State | Background | Text | Border |
|---|---|---|---|
| Default | `#FFFFFF` | `#0F172A` | 1px `#E2E8F0` |
| Hover | `#FFFFFF` | `#0F172A` | 1px `#CBD5E1`; `--shadow-sm` |
| Active | `#F8FAFC` | `#0F172A` | 1px `#CBD5E1` |
| Focus | `#FFFFFF` | `#0F172A` | **2px `#FFC40C`** + `--focus-ring` **[C — sheet 05 shows the yellow focus border]** |
| Disabled | `#FFFFFF` | `#CBD5E1` | 1px `#F1F5F9` |

**Text button** — label + trailing arrow `→`, no background, no border.

| State | Text | Extras |
|---|---|---|
| Default | `#0F172A` | arrow at 16px, 8px gap |
| Hover | `#7A5800` | gold; arrow translates +4px on X |
| Active | `#7A5800` | plus a 1px underline |
| Focus | `#0F172A` | `--focus-ring` on a 12px-radius invisible box |
| Disabled | `#CBD5E1` | |

**[C]** Feature cards use a *gold* text-button (`#7A5800`, 6.5:1) for their "Learn More →"; content and information cards use the dark text-button. Keep this distinction: gold text-link = the promoted card in a set. Never `#FFC40C` or `#E8AC00` as text on white.

**Icon-only**

- 44×44px hit area, glyph 20–24px, radius 12px, 1px `#E2E8F0` border on white.
- Hover: border `#CBD5E1`, background `#F8FAFC`. Active: background `#F1F5F9`. Focus: 2px `#FFC40C` + ring. Disabled: glyph `#CBD5E1`.
- **Always requires `aria-label`.**

**Universal button rules**

- One primary button per view; a second yellow button is a defect unless the views are visually separated sections.
- Icons sit after the label for forward motion (`Explore Packages →`, `View Package →`) and before the label only when the icon is a category marker (`🧳 Beach packages`) **[C — sheets 05, 06, 08]**.
- Transition: `background-color 200ms, box-shadow 200ms, transform 150ms`.
- Never animate width or padding on hover.
- Full-width on mobile for the primary conversion action; auto-width elsewhere.

---

### 8.2 Form Controls

**Input field [C — sheet 05, panel 2]**

| State | Background | Border | Text | Icon / affordance |
|---|---|---|---|---|
| Default | `#FFFFFF` | 1px `#E2E8F0` | placeholder `#94A3B8` | optional leading icon `#64748B` |
| Hover **[R]** | `#FFFFFF` | 1px `#CBD5E1` | — | — |
| Focus | `#FFFFFF` | **2px `#FFC40C`** | `#0F172A` | `--focus-ring` |
| Filled | `#F1F5F9` **[C]** | 1px `#E2E8F0` | `#0F172A` (600 weight for codes like `DEL`) | clear `×` **[C — sheet 05 form example]** |
| Success | `#FFFFFF` | 2px `#22C55E` | `#0F172A` | trailing ✓ circle `#22C55E` |
| Error | `#FFFFFF` | 2px `#EF4444` | `#0F172A` | trailing ! circle `#EF4444` + message below in `#B91C1C` |
| Disabled | `#F8FAFC` | 1px `#F1F5F9` | `#CBD5E1` | `cursor:not-allowed` |

**Dimensions [R, consistent with sheet 10 button padding and sheet 05 proportions]**

| Property | Value |
|---|---|
| Height | 48px default · 40px compact · 56px hero search |
| Padding | 12px 16px (add 40px on the icon side when an icon is present) |
| Radius | 12px |
| Font | Inter 400 · 16px (never below 16px on mobile) |
| Label | Label style — Inter 600 · 11px uppercase · 0.8% tracking · `#64748B`, 8px above the field |
| Help text | Body Small · 12px · `#64748B`, 8px below |
| Error text | Body Small · 12px · `#B91C1C`, 8px below, with a 14px error icon |

**Label behavior [C — sheet 06 UI application]:** the composite travel-search field places a small persistent label *inside* the field top ("From", "To", "Departure", "Passengers") with the value beneath it in 16–18px semibold. This "stacked field" is the standard for all search modules. Ordinary forms use an external label above the field. Never use floating/animated placeholder labels.

**Selects [C — sheet 05, panel 10]**
- Closed: same box as an input, trailing chevron 16px `#64748B`.
- Open: menu panel — white, radius 12px, `--shadow-md`, 1px `#E2E8F0`, 8px internal padding, item height 40px, item padding 12px 16px, 4px item radius.
- Item hover: `#F8FAFC`. Item selected: background `#FFEDA6`, text `#0F172A`, trailing ✓ in `#FFC40C`.
- Menu max-height 320px with scroll; never taller than the viewport minus 32px.

**Search fields [C — sheets 05, 06]**
- Leading magnifier icon 20px `#64748B`, 16px from the left edge, 12px gap to text.
- The hero search module is a white card: radius 16px, padding 24px (16px on mobile), `--shadow-lg`, sitting over the hero image and overlapping its lower edge.
- Field separators inside the search module: 1px `#E2E8F0` vertical rules, not gaps.
- The submit button inside a search module is always Primary Large and is the rightmost element on desktop, full-width bottom on mobile.

**Date inputs [C — sheet 06]:** stacked field showing `12 May, Mon` in 16px/600 with a trailing 20px calendar icon. Two date fields ("Depart" / "Return") share one bordered group. Calendar popover **[R]**: white, radius 16px, `--shadow-lg`, 320px wide, 40px day cells, selected day = `#FFC40C` fill + `#0F172A` text, range = `#FFEDA6` fill, today = 1px `#CBD5E1` ring, disabled = `#CBD5E1` text.

**Passenger / traveller controls [C — sheet 06]:** stacked field showing `1 Traveller, Economy` with a trailing chevron; opens a popover with stepper rows. **[R]** Stepper: 32px circular `−` / `+` icon buttons with 1px `#E2E8F0` border, 40px numeral in Inter 600 16px between them; disabled steppers use `#CBD5E1`.

**Price range slider [C — sheet 05, panel 10]**
- Rail: 4px tall, `#E2E8F0`, radius full.
- Active range: `#FFC40C`.
- Handles: 20px circle, `#FFC40C` fill, 2px white border, `--shadow-sm`; 44px invisible hit area.
- Min/max labels above the rail in Body Small `#0F172A` 600 (`₹0` / `₹50,000+`).
- Focus: `--focus-ring` on the handle. Keyboard: arrow = one step, PageUp/Down = ten steps.

**Progress indicator [C — sheet 05]:** 6px rail `#E2E8F0`, fill `#FFC40C`, radius full, with a right-aligned "3 of 5" caption in `#64748B`.

---

### 8.3 Cards

**Shared card spec [C]:** background `#FFFFFF`, radius **16px**, border 1px `#E2E8F0`, padding **24px**, shadow `--shadow-sm`.

**Hover (all interactive cards) [R]:** `--shadow-md`, border `#CBD5E1`, `translateY(-2px)`, 200ms. Image inside scales to 1.03 over 300ms. Never change the card's background color on hover.

| Card type | Structure (top → bottom) | Media | Title | CTA |
|---|---|---|---|---|
| **Feature card** | Icon (32px, in a 48px circular `#FFEDA6` backplate) → H4 title → Body Small → text link | none | H4 · Space Grotesk 500 · `#0F172A` | Yellow text button "Learn More →" |
| **Service card** | Icon (32px, tinted square backplate radius 12px) → H4 → Body Small → text link | none | H4 | Dark text button "Explore →" |
| **Content card** | Image → 20px gap → H4 → Body Small → text link | **16:9**, radius 12px (inner) or full-bleed to card radius | H4 | Dark text button "Read More →" |
| **Information card** | Image/product shot on a tinted `#FAFAFA` plate → H4 → Body Small → text link | 4:3 or 1:1 | H4 | Dark text button "View Tips →" |
| **Deal card** | Offer badge → image → package name → duration → was/now price → primary button | 16:9 | H4 | Primary button, full card width |
| **Destination card** | Image (full-bleed top) → destination name → package count → "From ₹X" | **4:3** or 1:1 | H4 or H3 on large tiles | Whole card is the target; no separate button |
| **Package card** | Badge → image → destination eyebrow → package name → duration → highlights → price *per person* → rating → primary button | **4:3** | H4 package name; price in Space Grotesk 700 | Primary button "View Package" |

**Typography hierarchy inside every card:** eyebrow/badge (Label 11px) → title (H4) → body (Body Small, max 3 lines) → meta (Caption `#64748B`) → CTA. Never skip from badge straight to body.

**Dark card variant [C — sheet 06 promo card, sheet 07 deal card]:** background `#0F172A`, radius 16px, no border, no shadow. Title `#FFFFFF`, body `#CBD5E1`, price/highlight `#FFCB19`, primary button unchanged yellow. Used for promotions and countdown offers only — maximum one per page.

**CTA placement:** bottom-left of the card for text buttons; full-width at card bottom for primary buttons. Never centered, never top.

---

### 8.4 Alerts **[C — sheet 05, panel 5]**

Full-width bar, radius 12px **[R]**, 1px border of the family's 300 tint, background of the family's 100 tint, 16px padding, 12px gap between icon and text, 24px leading icon circle, trailing 20px `×` close button.

| Type | Background | Border | Icon | Icon color | Text |
|---|---|---|---|---|---|
| Success | `#DCFCE7` | `#86EFAC` | check-circle (filled) | `#22C55E` | `#0F172A`, bold lead-in + regular detail |
| Warning | `#FEF3C7` | `#FCD34D` | triangle-exclamation (filled) | `#F59E0B` | `#0F172A` |
| Error | `#FEE2E2` | `#F87171` | x-circle (filled) | `#EF4444` | `#0F172A` |
| Information | `#DBEAFE` | `#60A5FA` | info-circle (filled) | `#3B82F6` | `#0F172A` |

Rules: bold lead word ("Success!", "Error") + regular sentence **[C]**. Close button color `#64748B`, hover the family's 700. Alerts stack with 12px gaps, newest on top, maximum 2 visible. `role="status"` for success/info, `role="alert"` for warning/error.

---

### 8.5 Badges and Tags **[C — sheet 05, panel 4]**

**Status badges** — pill (`--radius-full`), 4px 12px padding **[R]**, Inter 600 12px, 16px leading icon, 6px icon gap, 1px border of the 300 tint.

| Badge | Fill | Text/icon | Icon | Use |
|---|---|---|---|---|
| Popular | `#FFEDA6` | `#7A5800` | star / flame | Most-booked option (5.6:1) |
| Best Price | `#DCFCE7` | `#15803D` | check / leaf | Cheapest verified option — one per result set |
| New | `#DBEAFE` | `#1D4ED8` | check-circle | Newly added inventory/feature |
| Limited Time | `#FEE2E2` | `#BE123C` | alert | Expiring offers only, with a real deadline |

**Category tags** — outline pills: background `#FFFFFF`, 1px `#E2E8F0`, text `#334155` Inter 500 14px, padding 8px 16px, radius full. Selected state **[R]**: background `#FFEDA6`, border `#FFC40C`, text `#0F172A`. Confirmed set: Flight, Hotel, Holiday, Car, Insurance, Deal.

**Rules:** one status badge per card. Badges sit top-left of a card's image or top-left of the content block. Never stack two status badges; if two apply, priority is Best Price > Limited Time > Popular > New.

---

### 8.6 Navigation

**Desktop navigation [C — sheets 05 panel 11, 06 panel 1]**

- **Utility bar (optional, top):** background `#020617`, height 40px, Caption 12px `#CBD5E1` text left ("Smart Comparisons. Real Savings."), right-side links: Help, Support ▾, language ▾, currency ▾.
- **Main bar:** background `#FFFFFF`, height 72px **[R]**, bottom border 1px `#E2E8F0`; on scroll it becomes sticky with `--shadow-sm` and no border.
- **Left:** logo, 160–180px wide, 24px from container edge.
- **Center/left group:** primary links — Flights, Hotels, Holidays, Deals, More ▾ — Inter 500 16px `#334155`, 32px apart **[R]**.
- Link hover: `#0F172A` + a 2px `#FFC40C` underline that grows from center over 200ms. Active page: `#0F172A` 600 with a persistent 2px yellow underline.
- **Right:** icon buttons (search, saved/heart) then **Log in** as a text button and **Sign Up** as a Primary Small/Medium button.
- Dropdown menus: white panel, radius 16px, `--shadow-md`, 24px padding, 12px row gap.

**Mobile navigation [C — sheet 06 panel 2]**

- 56px bar: logo left, hamburger right (44px hit area).
- Drawer: full-screen or 90% width, white, 24px padding, links at H4 20px `#0F172A` with 24px vertical rhythm, dividers 1px `#F1F5F9`.
- Primary action (Sign Up / Search) pinned at the drawer bottom, full width, Primary Large.
- Close = `×` at the same coordinates as the hamburger.

**Tabs [C — sheet 05 panel 6]**
- Horizontal row, 32px gaps, bottom border 1px `#E2E8F0` spanning the full row.
- Active: text `#0F172A` Inter 600 16px + **3px `#FFC40C` underline** flush to the row border.
- Inactive: `#64748B` Inter 500. Hover: `#334155`.
- Optional leading 20px icon, 8px gap (the search-module tabs use ✈ / 🏨 / 🏝 style icons **[C — sheet 06]**).
- Mobile: horizontally scrollable, 16px gutter, no wrapping, active tab auto-scrolled into the first third.
- **Pill tab variant [C — sheet 06 mobile mockup]:** for the mobile search-type switcher only — active pill = `#FFC40C` fill, `#0F172A` text, radius full; inactive = `#FFFFFF` fill, `#E2E8F0` border, `#334155` text.

**Breadcrumbs [C — sheet 05 panel 10]**
- Home icon 16px, then chevron/slash separators in `#CBD5E1` with 8px gaps.
- Links Body Small 14px `#64748B`; current page `#0F172A` 500, not a link.
- Truncate the middle with `…` beyond 4 levels; never wrap to a second line.

**Pagination [C — sheet 05 panel 9]**
- 40×40px cells, radius 8px **[R]**, 8px gaps.
- Default: `#FFFFFF`, 1px `#E2E8F0`, text `#334155`. Hover: background `#F8FAFC`, border `#CBD5E1`.
- **Current page: `#FFC40C` fill, `#0F172A` text, no border.**
- Prev/next: chevron icon cells, same box; disabled at the ends with `#CBD5E1` glyph.
- Ellipsis `…` is plain text `#94A3B8`, no box.
- Mobile: prev / "Page 2 of 10" / next only.

---

### 8.7 Selection Controls **[C — sheet 05 panels 7–8]**

**Checkbox** — 20px box, radius 4px **[R]**, 2px border.

| State | Box | Mark |
|---|---|---|
| Unchecked | `#FFFFFF`, border `#CBD5E1` | none |
| Hover | `#FFFFFF`, border `#94A3B8` | none |
| Checked | fill `#FFC40C`, no border | 12px check in `#0F172A` |
| Indeterminate | fill `#FFC40C` | 10px horizontal bar `#0F172A` |
| Focus | + `--focus-ring` | |
| Disabled | fill `#F1F5F9`, border `#E2E8F0` | mark `#CBD5E1` |

Label: Body Regular `#334155`, 12px gap, entire label is clickable.

**Radio** — 20px circle, 2px border.

| State | Ring | Dot |
|---|---|---|
| Unselected | `#CBD5E1` | none |
| Selected | `#FFC40C` | 8px `#FFC40C` dot with a 2px white gap |
| Focus | + `--focus-ring` | |
| Disabled | `#E2E8F0` | `#CBD5E1` |

**Toggle** — track 44 × 24px, radius full; knob 20px white circle with `--shadow-xs`, 2px inset.

| State | Track | Knob position |
|---|---|---|
| On | `#FFC40C` | right |
| Off | `#CBD5E1` | left |
| Disabled (off) | `#F1F5F9` | left, knob `#FAFAFA` |
| Focus | + `--focus-ring` | |

Transition 200ms on both track color and knob transform. Toggles are for instant-effect settings only (price alerts, "include taxes"); use checkboxes inside forms that need submission.

---

### 8.8 Other Controls

**Dropdown menu** — see §8.2 Selects. Also used for nav menus and action menus. Opens 8px below the trigger, aligned to the trigger's left edge (right edge if it would overflow), 200ms fade + 4px rise.

**Tooltip [C — sheet 05 panel 10]** — background `#0F172A`, text `#FFFFFF` Body Small 14px, padding 12px 16px, radius 12px, max-width 280px, 8px caret, `--shadow-md`. Appears after 300ms hover / immediately on focus, dismisses on blur or `Esc`. Tooltips explain, they never carry information required to complete a task.

**Progress indicator** — see §8.2.

**Price range slider** — see §8.2.

**Search controls** — see §8.2 and the search patterns in §15.3.

**Modal [R — derived from card and shadow rules]** — white, radius 24px, max-width 560px (720px for comparison modals), padding 32px, `--shadow-xl`, backdrop `rgba(15,23,42,0.48)`. Title H3, close icon-button top-right, actions bottom-right (desktop) / stacked full-width (mobile). Traps focus, returns focus to the trigger, closes on `Esc`.

**Empty state [R]** — centered, max-width 420px: brand decorative illustration (compass / suitcase / dotted path) at 120px, H4 title, Body Regular `#64748B`, one Primary button. Never a bare "No results" string.

**Loading [R]** — skeletons only, never spinners for content: `#F1F5F9` blocks at the true final dimensions, radius matching the real element, a 1.5s shimmer sweep to `#F8FAFC`. Buttons in a pending state keep their size, swap the label for a 20px spinner, and set `aria-busy`.

---

## 9. Iconography System

### 9.1 Core icon style **[C — sheet 08]**

Rounded geometry · bold strokes · outlined style as the default · friendly & modern · high legibility · consistent visual weight. All caps, joins and terminals are rounded (`stroke-linecap: round`, `stroke-linejoin: round`).

### 9.2 Stroke weights **[C — sheet 08, panel 2]**

| Weight | Value | Use |
|---|---|---|
| Regular | **1.5px** | 16px icons; dense tables and metadata |
| **Medium (default)** | **2px** | 20px and 24px icons — the standard for all UI |
| Bold | **2.5px** | 32px+ icons, feature icons, headline-adjacent marks |

Strokes are specified on a 24×24 viewBox and must **not** scale with the icon: set `vector-effect: non-scaling-stroke` or export per size. A 32px icon at 2px stroke is wrong; it must be 2.5px.

### 9.3 Icon sizes **[C — sheet 08, panels 3 & 9]**

| Size | Grid | Use case |
|---|---|---|
| **16px** | 16 × 16 | Small UI elements, labels, inputs, table cells, breadcrumbs |
| **20px** | 20 × 20 | Buttons, small components, form field affordances |
| **24px** | 24 × 24 | Navigation, lists, icon + text pairings |
| **32px** | 32 × 32 | Feature icons, headings, highlights, card icons |

No other icon sizes exist. 48px "icons" are illustrations (§11), not icons.

### 9.4 Styles and when to use each **[C — sheet 08, panels 4–5]**

| Style | Definition | Use for |
|---|---|---|
| **Outline (default)** | Stroked, no fill | Navigation, general UI, controls, inputs, tables, breadcrumbs, inactive states |
| **Filled** | Solid shape | Active/selected states, emphasis, important actions, notification and status marks |
| **Brand decorative** | Custom, yellow + black, illustrative | Storytelling, empty states, section decoration, marketing — never inside a control |

**Pairing rule [C]:** an icon toggles between its outline and filled twin for inactive→active (bottom nav, favorites/heart, tabs). Never swap between two different glyphs.

### 9.5 Icon color variations **[C — sheet 08, panel 6]**

| Variation | Color | Use |
|---|---|---|
| Default | `#0A0A0A` / `#0F172A` with a yellow accent detail | Standard icons in content |
| Primary | `#FFC40C` | Active, selected, brand-emphasis |
| Gray | `#64748B` | Secondary/metadata icons |
| Light Gray | `#CBD5E1` | Disabled |
| Brand Yellow (outline) | `#FFC40C` stroke | Decorative and feature icons on light tinted plates |

**Two-tone rule [C]:** the signature CompareMyTrip icon treatment is a black glyph with a single yellow accent stroke (the airplane's contrail, the suitcase handle). Use it for feature and brand icons at 24px+; use flat single-color icons for functional UI.

### 9.6 Icon categories and confirmed set **[C — sheet 08, panels 4–5]**

| Category | Icons |
|---|---|
| **Navigation** | Home, Search, Menu, Close, Arrow Left, Arrow Right, Arrow Up, Arrow Down |
| **Communication** | Mail, Phone, Message, Notification (with dot) |
| **User** | User, Profile, Settings, Login |
| **Actions** | Plus, Minus, Check, Delete, Edit, Download, Upload |
| **Content** | Calendar, Clock, Heart, Star, Location, External Link |
| **Packages & Travel** | Package (suitcase), Destination (pin), Accommodation, Itinerary, Activity, Meals, Transport, Guide, Travellers, Compare, Deals, Voucher, Secure Booking, Travel path (plane) |

### 9.7 Confirmed usage examples **[C — sheet 08, panel 7]**

| Context | Treatment |
|---|---|
| In buttons | Filled or outline glyph matching the label color, 20px, 8px gap |
| In input fields | Outline, 20px, `#64748B`, 16px from the edge |
| Icon + text block | 32px two-tone icon, 12px gap, H4 title |
| In navigation | 24px; active item filled + `#FFC40C`, inactive outline + `#64748B` |
| In badges | 16px filled, matching the badge's text color |
| In tabs | 20px; active filled + `#0F172A`, inactive outline + `#64748B` |

### 9.8 Icon rules

1. **Do not mix unrelated icon styles.** One icon library, one geometry, one stroke system across the entire product. Third-party or partner icons are not permitted in UI chrome.
2. All icons ship as **SVG** with `currentColor` on strokes/fills so they inherit text color.
3. Decorative icons: `aria-hidden="true"`. Meaningful icons: `<title>` or an adjacent visible label. Icon-only buttons: `aria-label` (§18).
4. Optical alignment beats mathematical alignment — nudge to align the visual mass with the text baseline.
5. Never rotate, mirror, skew, add a drop shadow to, or re-color an icon outside the §9.5 variations.
6. Never place an icon inside a colored circle unless it is the confirmed feature-card treatment (48px `#FFEDA6` backplate).

---

## 10. Imagery and Photography System

### 10.1 Photography style **[C — sheet 09, panel 1]**

| Attribute | Direction |
|---|---|
| **Lighting** | Natural light, golden hour |
| **Mood** | Uplifting, inspiring, free |
| **Contrast** | Moderate to high |
| **Composition** | Clean, balanced, with depth |
| **Cropping** | Dynamic crops, focus on the subject |
| **Color treatment** | Vibrant with warm yellow accents |

### 10.2 Usage by context **[C — sheet 09]**

| Context | Direction | Ratio |
|---|---|---|
| **Hero images** | Wide, inspiring, aspirational; travel, freedom, new experiences. A person seen from behind looking outward is the signature framing | **16:9** |
| **Website content images** | Bright, clean, destination-focused; builds desire and trust | **4:3** |
| **Social media images** | Square/vertical, bold, high-energy, text-overlay friendly | **1:1**, **3:4**, **1:2** (stories) |
| **Product / service images** | Clean backgrounds, detail-oriented, clear and simple (flat-lay luggage, camera, hat, map) | **1:1** or 4:3 |

### 10.3 Image shapes **[C — sheet 09, panel 5]**

Approved aspect ratios: **16:9** (hero) · **4:3** (web) · **1:1** (social) · **3:4** (social) · **1:2** (stories).
Approved radii on imagery: **8px** small · **16px** cards · **24px** images · **32px** large.
Full-bleed hero media may carry a single large curved edge (the "wing" curve seen in sheets 03 and 06) — implemented as a `border-radius` on one corner or a clip-path, never as a decorative overlay image.

### 10.4 Subject positioning, negative space and cropping

**[C]** The subject sits off-center on a third; negative space (sky, sea, cloud) is reserved on the side where copy will land. Confirmed crop examples keep the horizon low and the sky open.

**[R] Implementation:** every image record stores a focal point (`x%,y%`) and uses `object-fit: cover; object-position: var(--focal)`. Art-direct at breakpoints: 16:9 desktop → 4:3 tablet → 4:3 or 1:1 mobile with the focal point re-anchored to the subject. Never letterbox, never distort, never allow a face or a price to be cropped.

### 10.5 Overlays and text on images

**[C — sheet 09]** "Light overlays to improve readability."
**[R]** Approved treatments, in order of preference:
1. A solid content panel (white card, radius 16px) beside or over the image — the preferred pattern.
2. A linear scrim: `linear-gradient(90deg, rgba(15,23,42,0.72) 0%, rgba(15,23,42,0.35) 45%, transparent 70%)` for left-aligned copy; the vertical equivalent for bottom-aligned copy.
3. A flat `rgba(15,23,42,0.40)` wash for full-image text — last resort.
Text over imagery must measure ≥ 4.5:1 against the *lightest* pixel region it covers. Never place body copy over a busy image region.

### 10.6 DO and DO NOT **[C — sheet 09, panel 6]**

**USE:** bright natural photography · yellow as an accent within the frame · clean compositions · minimal clear illustrations · optimistic, real and authentic subjects · high-quality visuals.

**AVOID:** dark, gloomy photos · overly saturated colors · busy, cluttered images · complex, heavy illustrations · generic stock look (handshakes, posed groups, cliché "team" shots) · low-quality or blurry images.

---

## 11. Illustration System

### 11.1 Style **[C — sheet 09, panel 2]**

| Attribute | Direction |
|---|---|
| **Line style** | Clean, rounded, **monoline** with open shapes |
| **Shape language** | Rounded corners, soft edges, friendly geometric forms |
| **Level of detail** | Minimal to medium — clear and purposeful |
| **Color usage** | Primary yellow + black with light neutrals |

Confirmed palette for illustration: `#FFC40C`, `#0A0A0A`/`#0F172A`, `#94A3B8`, `#E2E8F0`, `#FAFAFA`. **No more than five colors in one illustration**, and no gradients inside line illustrations.

**Bold black outlines** are correct for the hero figure and primary objects; secondary scenery (clouds, signposts, ground line) drops to a lighter `#CBD5E1` monoline so it recedes. Fill yellow only on the story's focal object (suitcase, backpack, plane trail).

### 11.2 Confirmed illustration elements

Airplane · dotted flight path · suitcase · cloud · location pin · ticket · compass · signpost · walking traveller (subtle human presence, back or side view, no facial detail beyond simple features).

### 11.3 Where illustrations are used

| Placement | Treatment |
|---|---|
| Empty states / zero results | Single object at 120–160px, centered |
| Onboarding, help and FAQ headers | Scene at 240–320px wide, left or right of the copy |
| Feature sections without photography | One scene per section, max |
| 404 / error pages | Full scene, 320–480px |
| Section decoration | Dotted flight path only, at 8–15% opacity or in `#E2E8F0` |
| Never | Inside data-heavy results, inside form fields, behind body copy, on price cards |

**[R]** One illustration per viewport. An illustration and a photograph never share a section.

---

## 12. Shape Language

### 12.1 Logo-inspired forms **[C — sheets 02, 09]**

The logo supplies the whole shape vocabulary: a **soft organic cloud** (freedom, flexibility), a **diagonal airplane path** (movement, forward momentum), **stencil-cut geometric letterforms** (modern, tech-forward), and **rounded-corner suitcase blocks** (smart, functional). Every decorative shape must trace back to one of these.

### 12.2 Confirmed shape set **[C — sheet 09, panel 3]**

| Form | Description | Where to use |
|---|---|---|
| **Cloud / blob** | Soft asymmetric organic mass, yellow | Behind hero media, behind product shots, section corners |
| **Geometric forms** | Circles, half-circles, quarter-rounds in yellow/black/grey | Abstract accents, statistic blocks, icon backplates |
| **Organic forms** | Overlapping translucent blobs, `#FFEDA6`/`#F1F5F9` | Very light background interest only |
| **Gradients** | Warm yellow, top-left light → bottom-right deep | Cards, promo blocks, small accent panels |
| **Dot patterns** | Regular dot grid, `#E2E8F0` with occasional `#FFC40C` dots | Behind product/illustration, corner texture |
| **Wave patterns** | Thin yellow contour lines, topographic feel | Section dividers, footer band, quiet backgrounds |
| **Dotted journey path** | Dashed curved line with a plane glyph and pin endpoints | The brand's signature motif — hero, step flows, between sections |

**Brand patterns [C — sheet 09, panel 7]:** Pattern 01 Travel Path · Pattern 02 Cloud Forms · Pattern 03 Ticket Blocks · Pattern 04 Dot Grid · Pattern 05 Wave Flow.

### 12.3 Decoration budget (binding)

| Rule | Limit |
|---|---|
| Decorative shapes per section | **1** primary + optionally 1 secondary at ≤10% opacity |
| Decorative shapes per page | ≤ 4, never two in adjacent sections |
| Pattern opacity behind text | ≤ 10%, and never behind body copy |
| Dotted path length | May cross at most one section boundary |
| Shape z-index | Always behind content; decoration never overlaps interactive elements or text |
| Shape color | Yellow family, `#E2E8F0`, or `#F8FAFC` only — never accent families |

> Decorative elements support content, never overwhelm it. If removing a shape does not weaken the message, remove it.

---

## 13. Texture and Effects

**[C — sheets 03 and 09]** Five effect families are approved, each with a defined strength.

| Effect | Confirmed intent | Strength / spec | Appropriate use | Inappropriate use |
|---|---|---|---|---|
| **Gradients** | "Warm yellow gradients for highlights & energy" | `linear-gradient(135deg, #FFD42E 0%, #FFC40C 55%, #E8AC00 100%)` — **yellow → gold, never yellow → orange**; also `#FFFBEB → #FFFFFF` for tints **[R]** | Small accent panels, promo cards, illustration fills, decorative shapes | Page backgrounds, text fills, buttons at rest, more than one gradient per viewport |
| **Grain** | "Subtle grain for depth & premium feel"; "very light grain" | Opacity **3–6%**, monochrome noise, tiled | Large flat color panels, dark CTA bands, hero media plates | Over text, over data tables, on white surfaces, above 8% opacity |
| **Shadows** | "Soft, layered shadows for elevation" | §8.0 scale; blur ≥ 3× the Y-offset; color always `rgba(15,23,42,α)` | Cards, menus, sticky panels, modals | Dark surfaces, text, icons, more than two levels per section |
| **Glows** | "Gentle yellow glow for CTAs & highlights" | `--shadow-primary` only, hover state only | The single primary CTA on hover; a highlighted price card | Rest states, multiple elements, any non-yellow glow, neon |
| **Overlays** | "Light overlays to improve readability" | §10.5 | Text over imagery | Decorative darkening with no text, opacity > 0.6 |

**Glass / transparency [C — sheet 03 "USE CAREFULLY"]:** subtle transparency is permitted **only** for a floating card or overlay above imagery: `background: rgba(255,255,255,0.86); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.6)`. Maximum **one** glass surface per page. Never for navigation, never on flat backgrounds, never on dark surfaces.

**Dark mode [C — sheet 03]:** "great for power users but not default." Ship light mode only for v1; if added later, invert using `neutral-900/800` surfaces with the confirmed dark-surface contrast pairs from §3.8.

**Parallax [C — sheet 03]:** subtle only — maximum **8%** travel, disabled under `prefers-reduced-motion`, never on text.

**Prohibited outright:** heavy glassmorphism · excessive neon · harsh glows · excessive blur · heavy texture everywhere · 3D cartoon shapes · strong repeating patterns · low-contrast "aesthetic" text.

---

## 14. Motion and Interaction Principles

Motion is fast, purposeful, subtle, responsive and accessible. It confirms an action or reveals structure — it never performs.

### 14.1 Durations and what uses them

| Duration | Token | Applies to |
|---|---|---|
| **150ms** | `--motion-fast` | Button hover/press, icon color change, checkbox/radio marks, tooltip fade-out, link underline |
| **200ms** | `--motion-base` | **Default.** Card hover lift, input focus ring, toggle, tab underline slide, dropdown open, badge state |
| **300ms** | `--motion-slow` | Navigation drawer, accordion/FAQ expand, image zoom on hover, filter panel, tooltip appear delay |
| **400ms** | `--motion-slower` | Modal enter, section reveal on scroll, image/hero reveal, page-level transitions |

**Easing:** `--ease-standard: cubic-bezier(0.4, 0, 0.2, 1)` for everything entering or changing; `--ease-exit: cubic-bezier(0.4, 0, 1, 1)` for exits; `--ease-emphasis: cubic-bezier(0.2, 0, 0, 1)` for modals and drawers. No spring, no bounce, no `ease-in-out` on hover.

### 14.2 Interaction specifics

| Interaction | Motion |
|---|---|
| Button hover | Background 200ms; `translateY(-1px)` 150ms; shadow 200ms |
| Button press | `translateY(0)` + darker fill, 150ms |
| Card hover | `translateY(-2px)` + shadow, 200ms; inner image `scale(1.03)`, 300ms |
| Navigation link | Underline scales from center, 200ms |
| Dropdown / menu | Opacity 0→1 + `translateY(-4px)→0`, 200ms |
| Modal | Backdrop fade 200ms; panel opacity + `scale(0.98)→1`, 400ms `--ease-emphasis` |
| Drawer (mobile nav) | `translateX` 300ms |
| Section reveal | Opacity 0→1 + `translateY(16px)→0`, 400ms, once, triggered at 15% visibility |
| Image reveal | Opacity + `scale(1.02)→1`, 400ms |
| Skeleton shimmer | 1.5s linear, infinite — the only permitted loop |
| Dotted flight path | Optional single 1.2s draw-in on first view; never looping |

### 14.3 Prohibited

Excessive bouncing · unnecessary looping (except skeleton shimmer) · dramatic movement · scroll-jacking · parallax over text · auto-advancing carousels that cannot be paused · any animation longer than 400ms in a task flow · animated page-load splash screens.

### 14.4 Accessibility

```
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration:.01ms !important; animation-iteration-count:1 !important;
                            transition-duration:.01ms !important; scroll-behavior:auto !important; }
}
```
Reveal animations must leave content visible when motion is reduced — never gate content behind an animation.

---

## 15. Website Page Patterns

Pages are assembled from these named patterns. Every pattern below defines layout, spacing, hierarchy, imagery, CTA and responsive behavior. Section padding-Y defaults to Standard (64px desktop / 40px mobile) unless stated.

### 15.1 Hero patterns

**H-1 · Image Hero (full-bleed) [C — sheets 03, 06, 09]**
- Layout: content constrained to columns 1–6; media bleeds from column 7 to the viewport's right edge with a large curved left/bottom edge (radius 32px+ or a wing curve).
- Padding-Y 120–160px desktop / 64px mobile.
- Hierarchy: Display XXL two-tone headline → 16px gap → Body Large sub-copy (max 60ch) → 32px gap → Primary Large CTA (+ optional Text button, 24px apart) → 32px gap → trust row (4 items, 16px icons, Body Small).
- Decoration: dotted flight path crossing the media.
- Responsive: tablet — content 8 col over a 4:3 crop; mobile — copy first, media below at 4:3, CTA full-width.

**H-2 · Split Hero**
- 6 + 6 columns, media in a 24px-radius card rather than bleeding. Equal vertical centering. Best for category and campaign pages.
- Mobile: stack, media second.

**H-3 · Dark Hero [C — sheets 01, 03]**
- Background `#0F172A` full-bleed, optional 4% grain, headline `#FFFFFF` with the highlight word in `#FFCB19`, body `#CBD5E1`, Primary yellow CTA.
- Use for: promotional campaigns, premium/loyalty pages, "Compare" landing. Maximum one dark hero per journey.

**H-4 · Search-focused Hero [C — sheet 06]**
- Media band (16:9, 420–520px tall) with a white search card overlapping its lower edge by 40–80px.
- Headline sits above the search card inside the media, left-aligned, Display XL.
- Search card: radius 16px, padding 24px, `--shadow-lg`, tab row on top, field row below, Primary Large submit right/bottom.
- Trust row directly beneath the card, 24px gap.
- Mobile: headline → pill tab switcher → stacked fields → full-width Search button → trust list.

**H-5 · Destination Hero**
- Full-bleed 16:9 photo with a bottom scrim; overlay: breadcrumb → H1 place name → Body Large one-liner → meta chips (best season, avg. price, flight time).
- Below the fold: a sticky sub-nav (Overview · Flights · Hotels · Things to do).
- Mobile: 4:3 crop, H1 at 26px, chips scroll horizontally.

### 15.2 Feature patterns

**F-1 · 3-card features** — 4 + 4 + 4, 24px gutter, feature cards (§8.3), section header centered or left. Use for three benefits or three product lines.

**F-2 · 4-card features [C — sheet 06 "Why CompareMyTrip?"]** — 3 + 3 + 3 + 3, feature cards with a 32px two-tone icon on a 48px `#FFEDA6` circle, H4 title, 2–3 line body. Section header centered: H2 + Body Regular sub-line, 40px above the grid. Tablet 2×2, mobile stacked.

**F-3 · Icon + text row** — a 4-column horizontal strip of 16–20px icon + Body Small label, used for trust markers (Best Price Guarantee · Secure Payments · 24/7 Customer Support · No Hidden Charges) **[C — sheet 06]**. Padding-Y 24–32px, background `#FFFFFF` or `#F8FAFC`, 1px top/bottom border optional. Mobile: 2×2 grid, or a vertical list of 4.

**F-4 · Alternating image/content** — 6 + 6, image radius 24px, alternating sides per row, 48px between rows, 96px section padding. Each row: Label eyebrow → H2/H3 → Body Regular → Text button. Mobile: always image-then-copy, never alternating.

### 15.3 Search patterns

One search module, one job: **find a package**. White card, radius 16px, `--shadow-lg`, padding 24px, tab row + field row, Primary Large submit, stacked-label fields (§8.2). Keep it short — five fields is the ceiling.

| Pattern | Desktop field row | Mobile |
|---|---|---|
| **S-1 · Package discovery search [C]** | Tab row (Packages · Destinations · Experiences) → `Destination` · `Travel dates` · `Duration` · `Travellers` · `Package type` · **Explore Packages** | Stacked fields, 48px each; package type becomes a chip row; sticky full-width submit |
| **S-2 · Destination-scoped search** | `Package type` · `Travel dates` · `Duration` · `Budget` · **Find Packages** | Stacked; budget becomes a range sheet |
| **S-3 · Inline results refine** | Single row above results: `Destination` · `Dates` · `Travellers` · edit-pencil icon button | Collapses to a one-line summary chip that opens the full sheet |

**Package categories [R]** — the approved set for tabs, chips and the `Package type` field: Honeymoon · Family · Adventure · Luxury · Beach · Weekend · Cultural · International · Domestic. Do not invent additional categories per page.

Field widths follow the 12-column grid; the submit is the last column and never wraps to its own row on desktop. **There is no origin/destination swap control** — package search has one destination, not a route.

### 15.4 Deal patterns

**D-1 · Destination grid** — 4-across destination cards (4:3 image, destination, package count, "From ₹X"), 24px gutter, "View All →" text button right-aligned in the section header. Tablet 2-across, mobile 2-across compact or a rail.

**D-2 · Horizontal package rows** — full-width rows: 200px image left (radius 12px), content centre (destination eyebrow, package name, duration, inclusion chips, rating), price *per person* + Primary button right-aligned. Row padding 24px, 16px between rows. Mobile: image top 16:9, content below, price row above a full-width button.

**D-3 · Featured package** — asymmetric 8 + 4: large image card left, package content right with offer badge, duration, price *per person*, Primary CTA and a 3-item inclusion list.

**D-4 · Dark promotional card [C — sheet 06]** — `#0F172A` band, radius 16px, inside the container: badge ("Limited Time Offer") → H2 with a yellow number/percentage → Body Small with the promo code → Primary CTA on the left; countdown timer (4 boxes: Days/Hours/Mins/Secs, `#1E293B` fill, radius 12px, numerals in Space Grotesk 600 24px `#FFFFFF`, labels Caption `#94A3B8`) center; product/plane image bleeding right. Mobile: stack — badge, headline, code, countdown row, full-width CTA; image becomes a cropped background at 30% opacity or is dropped.

### 15.5 Content patterns

**C-1 · Article layout** — asymmetric 8 + 4 (content + sticky TOC/related). Content measure 680px, H2 sections 48px apart, images 24px radius full content width, pull quotes in H3 with a 3px left yellow rule.

**C-2 · Information layout** — 2-column definition grid (label column 4, content column 8), 24px row padding, 1px `#F1F5F9` row dividers. For inclusions, exclusions, accommodation detail, cancellation policy and package quick facts.

**C-3 · Comparison layout** — see §17.3.

**C-4 · Trust section [C — sheets 06, 09]** — background `#F8FAFC`, 4 stat/trust blocks: Display XL numeral (e.g. `120K+`) in Space Grotesk 700 `#0F172A` with a Body Small label `#64748B`. Optionally a partner-logo row beneath in `#94A3B8` monochrome at 60% opacity. Mobile 2×2.

**C-5 · Testimonial pattern** — 3-across cards: 5 yellow star icons (16px, `#FFC40C`) → Body Large quote (max 3 lines) → 40px avatar + name (Body Small 600) + trip meta (Caption `#64748B`). Alternative single featured testimonial: 5 + 7 asymmetric with a 1:1 photo. Mobile: rail with 1.15 cards visible.

**C-6 · FAQ pattern** — single column, max 760px, centered. Accordion rows: 1px `#E2E8F0` dividers, 24px row padding, question in H4/Body Large 600 `#0F172A`, chevron right-aligned rotating 180° over 300ms, answer in Body Regular `#334155` with 16px top gap. One row open by default; multiple may be open. Left-align everything.

### 15.6 CTA patterns

| Pattern | Spec |
|---|---|
| **CTA-1 · Gold CTA** | Full-width band `#FFC40C` (or a 24px-radius inset block), H2 `#0F172A`, Body Regular `#0F172A` at 80% opacity, **Secondary (Dark) button** — never a yellow button on yellow. Padding-Y 64–96px. Use sparingly: one per page maximum. |
| **CTA-2 · Dark CTA** | `#0F172A` band, H2 `#FFFFFF` with a `#FFCB19` highlight word, body `#CBD5E1`, Primary yellow button. The default closing CTA. |
| **CTA-3 · Image CTA** | Full-bleed 16:9 photo, left scrim, copy on the left third, Primary button. Min height 400px desktop / 320px mobile. |
| **CTA-4 · Newsletter CTA [C — sheet 07]** | Two-column: H2 + Body Regular left; email input + Primary "Subscribe →" right (input and button in one 12px-radius group on desktop; stacked on mobile). Consent line in Caption `#64748B` below. Background `#F8FAFC` or `#FFEDA6`. |

**CTA rules:** every page ends with exactly one CTA section; consecutive CTA sections are prohibited; a CTA band never sits directly against a dark hero.

---

## 16. Website UI Mockup Blueprint

Each page below is defined as a stack of §15 patterns and §8 components. Global rules: every page uses the desktop utility bar + main nav (§8.6) and the standard footer; every page ends with a CTA section; breadcrumbs appear on every page except Home, Login and Signup.

**Standard footer [R — derived from sheets 04 and 06 footer bands]:** background `#0F172A`, padding-Y 64px (40px mobile). Row 1: logo + tagline (4 col) and four link columns (2 col each) — Company, Explore, Support, Legal; headings H6 uppercase `#94A3B8`, links Body Small `#CBD5E1` (hover `#FFFFFF`). Row 2 (48px later, 1px `rgba(255,255,255,0.12)` top border): copyright Caption `#64748B` left, payment/security marks and social icons (20px, `#CBD5E1`) right. Mobile: link columns become accordions.

| # | Page | Purpose | Layout pattern | Sections (in order) | Primary CTA | Visual treatment |
|---|---|---|---|---|---|---|
| 1 | **Homepage** | Turn a visitor into a package search | H-4 discovery hero | Hero → trust row → 4 features → destination grid → featured packages → dark promo → testimonials → stats → CTA | Explore Packages | 1 photo hero, 1 dark band; everything else white/`#F8FAFC` alternating |
| 2 | **Destinations** | Open the discovery layer | D-1 grid | Hero → region tags → destination grid → popular packages rail → CTA | Browse Destination | Photography-led; 4:3 tiles, no separate buttons |
| 3 | **Destination detail** | Sell a place, then its packages | H-5 hero | Hero → sticky sub-nav → overview → best time to visit → packages in X → experiences → travel tips → testimonials → FAQ → CTA | View Packages | Editorial; one illustration maximum |
| 4 | **Packages** | Browse the catalogue | H-2 + filter grid | Compact hero → category tags → package grid (3-across) → featured package → newsletter | View Package | Package cards are the whole page; one badge per card |
| 5 | **Package results** | Compare and shortlist | Asymmetric 8 + 4 | Sticky search summary → sort row + count → filters + package list → pagination | View Package | Dense; white cards on `#F8FAFC`; filters become a bottom sheet on mobile |
| 6 | **Package detail** | The decision page | Gallery + 8 + 4 | Gallery → title/destination/duration/rating → price → quick facts → overview → highlights → day-by-day itinerary → inclusions → exclusions → accommodation → activities → transport & support → dates/availability → reviews → FAQ → related packages → final CTA | **Enquire Now** | Itinerary uses the dotted journey path as its spine; sticky booking panel desktop, fixed bottom bar mobile |
| 7 | **Compare packages** | Side-by-side decision | Comparison table | Selection summary → comparison table (destination, duration, price, accommodation, inclusions, activities, transfers, meal plan, rating, availability, best suited for) → recommendation callout → CTA | Select Package | Neutral; the only colour is the one gold "Recommended" column |
| 8 | **Experiences** | Discovery by interest | F-4 alternating | Hero → experience categories → experience grid → packages featuring them → CTA | Find Packages | Photography-led; activity imagery, not landmarks |
| 9 | **Deals** | Convert on offers | Deal card grid | Tinted hero → offer tags → package deal grid → dark promo → newsletter | View Offer | Badges carry the page; "Package Deal" / "Holiday Offer" language only |
| 10 | **Travel guides** | Earn trust and search traffic | C-1 article index | Hero → category tags → article grid → related destinations → CTA | Read Guide | Editorial, 760px measure |
| 11 | **Saved packages** | Return path | D-2 list | Header → saved package rows → empty state → recommendations | View Package | Empty state uses the compass illustration |
| 12 | **About** | Build trust | Alternating F-4 | Split hero → mission → stats → values → team → press → CTA | Explore Packages | Highest illustration budget of any page |
| 13 | **Contact** | Route an enquiry | 2-column 7 + 5 | Compact hero → enquiry form + contact card → offices → FAQ link | Send Enquiry | Form-led, minimal decoration |
| 14 | **Help / FAQ** | Self-service support | Search + accordions | Search hero → category cards → accordions → still-need-help CTA | Contact Support | No photography; illustration for empty results |
| 15 | **Login** | Authenticate | Split 6 + 6 | Brand panel + form card (logo only, no menu) | Log In | Brand panel hidden below 1024px |
| 16 | **Signup** | Create an account | Split 6 + 6 | Benefit list + form card with success validation | Create Account | Green success borders on validated fields |
| 17 | **Enquiry confirmation** | Close the loop | Centred 6 col | Success alert → enquiry summary → what happens next (3 steps) → related packages | Browse More Packages | One success alert, one dark CTA; no upsell clutter |
| 18 | **User dashboard** | Manage trips and enquiries | Sidebar 3 + 9 | Sidebar → greeting → upcoming trip card → enquiries → saved packages → recommendations | Manage Enquiry | Voucher motif for the trip card; otherwise calm and neutral |

---

## 17. Design Patterns for Data-Heavy Pages

### 17.1 Visual hierarchy in results

Read order per result row is fixed: **badge → primary identity → key facts → price → action.**

| Level | Element | Style |
|---|---|---|
| 1 | Price (always *per person*) | Space Grotesk 700 · 24px desktop / 20px mobile · `#0F172A` |
| 2 | Identity (destination + package name) | H4 · Space Grotesk 500/600 · `#0F172A` |
| 3 | Key facts (duration, inclusions, rating) | Body Small 14px · `#334155` |
| 4 | Meta (accommodation tier, meal plan, cancellation) | Caption 12px · `#64748B` |
| 5 | Action | Primary button, right-aligned desktop / full-width mobile |

Rules: one badge per row; one yellow element per row (the button); row background `#FFFFFF` on a `#F8FAFC` page; row height ≥ 96px desktop; 16px between rows; hover = `--shadow-sm` + border `#CBD5E1`, never a background tint.

### 17.2 Number and price emphasis

- Prices always use **Space Grotesk** (the numerals are geometric and align well) with tabular figures: `font-variant-numeric: tabular-nums`.
- Currency symbol at 70% of the numeral size, baseline-aligned, 2px gap: `₹` `2,450` **[C — sheet 06]**.
- Qualifier ("One Way", "per night", "total") in Caption `#64748B`, immediately right of or beneath the price.
- Strikethrough original price in Body Small `#94A3B8` before the live price; the saving in `#15803D` 600 ("Save ₹1,200").
- **Never color a price yellow on a light background.** Prices are `#0F172A`; only a price on a dark surface may be `#FFCB19`.
- Price change/alert deltas: down = `#15803D` with ↓, up = `#BE123C` with ↑ — always with the arrow glyph, never color alone.

### 17.3 Filters and sorting

**Filter sidebar (desktop, 4 columns / 300–320px):** white card, radius 16px, 24px padding, sticky at 24px from the top. Group structure: H5 group label → 16px → controls → 24px → 1px `#F1F5F9` divider. Checkbox lists cap at 6 visible items with a "Show all (12)" text button. Each group shows an inline count (`(24)` in `#94A3B8`). A "Clear all" text button sits in the sidebar header, enabled only when filters are active.

**Applied-filter chips:** pill tags with a trailing 12px `×`, `#FFEDA6` fill, `#7A5800` text, placed above the results list, wrapping to at most 2 rows before "+3 more".

**Mobile filters:** a sticky bottom-left "Filters (3)" outline button opening a full-height bottom sheet (radius 24px top corners, drag handle, sticky footer with "Clear all" text button + "Show 128 results" Primary full-width).

**Sort:** a select on the right of the result-count row: "Sort by: Cheapest ▾". Options — Price (low to high), Duration (short to long), Best value (default), Newest, Rating. The active sort is echoed in the mobile filter sheet.

### 17.4 Comparison tables

- Attribute column fixed at 3 grid columns (or 140px mobile) with `#F8FAFC` background; option columns equal-width, max 4.
- Header row: option name (H4), price (Level-1 style), Primary button. Sticky on scroll with `--shadow-sm`.
- Row height 56px, 1px `#F1F5F9` dividers, alternating rows *not* tinted (dividers are enough).
- Values: ✓ `#22C55E` / ✕ `#CBD5E1` filled icons plus a text label for screen readers — never icon-only.
- Recommended column: 2px `#FFC40C` border, a "Best Value" badge above the header, and a `#FFEDA6` header fill. Exactly one.
- Mobile: horizontal scroll with the attribute column pinned (`position: sticky; left: 0`), and a shadow on the pinned edge to signal scroll.

### 17.5 Availability, ratings and badges

- **Availability:** text + color, never color alone — "3 spots left" `#B45309` on `#FEF3C7`; "Dates available" `#15803D`; "Sold out" `#64748B` with the row at 60% opacity and the button disabled.
- **Ratings:** 16px star icons `#FFC40C` (filled/half/outline) + numeric value in Body Small 600 `#0F172A` + review count in Caption `#64748B`. Hotel star class uses smaller 12px outline stars in `#94A3B8` to avoid confusion with the review rating.
- **Badges:** §8.5; maximum one per row; "Best Price" is computed, not editorial.

### 17.6 Sticky booking panel

Desktop: 4 columns, sticky 24px from the top, white card radius 16px, `--shadow-lg`, padding 24px. Contents: price block → 16px → key facts list → 24px → Primary full-width CTA → 12px → trust line with a 16px shield icon.
Mobile: fixed bottom bar, height 72px + safe-area inset, white, top border 1px `#E2E8F0`, `--shadow-lg` upward: price left, Primary button right (min 160px). It appears only after the user scrolls past the inline CTA.

### 17.7 Mobile stacking for data

Order on mobile is re-authored, not reflowed: **badge → identity → price → key facts → action.** Price moves above the details because it is the comparison variable. Secondary metadata collapses behind a "Details ▾" text button. Tables become cards; each card repeats the attribute labels in Caption `#64748B` above each value.

---

## 18. Accessibility Rules

### 18.1 Color and contrast

- Body text ≥ 4.5:1; large text (≥24px, or ≥18.66px bold) ≥ 3:1; UI borders and icons carrying meaning ≥ 3:1.
- Use the confirmed pairings in §3.8. **`#FFC40C` on white is 1.6:1 — never text, never a thin border carrying meaning.** The only brand-family text colour on light is `#7A5800` (6.5:1).
- Text on yellow surfaces is always `#0F172A`.
- `#94A3B8` is placeholder-only on white; it fails for real content.
- Never rely on color alone: pair every status with an icon and a text label (alerts, availability, price deltas, comparison ticks, form validation).

### 18.2 Focus states

- Every interactive element has a **visible** focus state: `outline: 2px solid #FFC40C; outline-offset: 2px` plus `--focus-ring` where a glow reads better.
- On dark surfaces the focus ring switches to `#FFFFFF` with a 2px offset.
- Use `:focus-visible` for pointer users, but never suppress focus for keyboard users. `outline: none` without a replacement is a defect.
- Focus order follows visual order. Modals and drawers trap focus and restore it to the trigger on close.

### 18.3 Keyboard navigation

- A "Skip to content" link is the first focusable element on every page (visible on focus, Primary styling).
- Menus: `Enter`/`Space` opens, arrows move, `Esc` closes and returns focus.
- Tabs: arrow keys move between tabs, `Tab` moves into the panel.
- Sliders: arrows step, Home/End jump to min/max.
- Date pickers: full arrow-key grid navigation with `aria-selected`.
- Card rails: reachable by keyboard with visible focus on each card; scroll follows focus.

### 18.4 Typography and readability

- 11px absolute floor, 14px body floor, 16px minimum for inputs.
- Line height ≥ 1.5 for all body copy (the system specifies 1.55–1.60 — compliant).
- Measure 60–75ch (§4.5). Text must reflow at 320px width and at 200% zoom with no horizontal scrolling and no loss of content.
- Never use `text-transform: uppercase` for sentences; only for Label/H6 with the specified tracking.

### 18.5 Buttons, icons and labels

- Button labels state the outcome: "Explore Packages", "View Package", "Enquire Now" — never "Click here" or "Submit".
- Icon-only buttons require `aria-label`; decorative icons require `aria-hidden="true"`.
- Icons that carry meaning need an accessible name and must not be the only indicator.
- Loading buttons set `aria-busy="true"` and keep an accessible name.
- Toggles use `role="switch"` with `aria-checked`; their state must also be readable from the label ("Price alerts: On").

### 18.6 Forms and errors

- Every input has a programmatically associated `<label>`. Placeholders are never labels.
- Errors: `aria-invalid="true"`, `aria-describedby` pointing at the message, an inline icon, red border, and text that says how to fix it ("Enter a destination city or airport code") — never just "Invalid".
- Errors appear on blur and on submit, never on every keystroke.
- On submit failure, focus moves to the first invalid field and a summary alert (`role="alert"`) lists the errors.
- Required fields are marked in the label text, not by color or an asterisk alone.

### 18.7 Semantic hierarchy

- One `<h1>` per page; heading levels never skip. Visual size is chosen from §4.3 independently of the semantic level.
- Landmarks: `header`, `nav`, `main`, `aside`, `footer`. Multiple navs get `aria-label`.
- Lists are lists; result sets use `<ul>`/`<li>` or a table with proper `<th scope>`.
- Live regions announce result counts and filter changes politely (`aria-live="polite"`).
- Images: meaningful `alt` describing the content, empty `alt=""` for decoration. Never "image of".

---

## 19. Performance-Friendly Design Rules

| Rule | Specification |
|---|---|
| **Optimize images** | AVIF with a WebP fallback. Hero ≤ 200KB, content images ≤ 120KB, thumbnails ≤ 40KB. Always serve `srcset` at 1×/2× for the real rendered box — never a 2400px file in a 400px card. |
| **Explicit dimensions** | Every image and media box declares `width`/`height` or `aspect-ratio` from the §10.3 ratio list. Zero layout shift; CLS target < 0.05. |
| **Lazy-load** | `loading="lazy"` + `decoding="async"` on everything below the fold. The hero image is `fetchpriority="high"` and never lazy. |
| **No video backgrounds** | Prohibited in v1. If ever approved: muted, ≤ 6s, ≤ 1.5MB, poster image required, paused under `prefers-reduced-motion` and on save-data. |
| **Animation cost** | Animate only `transform` and `opacity`. Never animate `width`, `height`, `top`, `left`, `box-shadow` spread, or `filter`. No animation on more than ~10 elements at once. |
| **Shadows** | Use the §8.0 tokens only. No shadow blur above 56px, no multi-layer stacks beyond two, no shadows on scroll-linked elements. |
| **Blur** | `backdrop-filter` on at most one element per page (§13). Never on a scrolling container. |
| **Icons** | SVG only, inline or via a sprite. **No icon fonts.** Total icon payload ≤ 30KB. |
| **Decorative assets** | Patterns, blobs and dotted paths ship as inline SVG or CSS gradients, never as PNG. Each ≤ 8KB. |
| **Fonts** | 6 files maximum (Inter 400/500/600/700, Space Grotesk 600/700), WOFF2, subset, `font-display: swap`, preload the two most-used. |
| **Third-party** | Maps, chat and review widgets load on interaction or when scrolled into view, never on first paint. |
| **Budgets** | LCP < 2.5s on 4G · CLS < 0.05 · INP < 200ms · initial CSS ≤ 60KB gz · above-the-fold images ≤ 300KB total. |

---

## 20. Final Implementation Rules

### 20.1 Before building any component

1. Search §8 for an existing component. If it exists, implement it exactly — including every state.
2. Search §15 for an existing pattern before designing any page section.
3. Use tokens: colors from §3.6 aliases, spacing from §5.1, type from §4.3, radius and shadow from §8.0, motion from §14.1.
4. Confirm which grid columns the element occupies at all four breakpoints (§6).
5. Confirm the accessible name, focus state and keyboard behavior before writing markup.

### 20.2 When creating a new component

1. Match the established visual language: 12px control radius / 16px card radius, 1px `#E2E8F0` borders, `--shadow-sm` at rest, 24px internal padding.
2. Define **all** states: default, hover, active/pressed, focus-visible, disabled, loading, error, empty.
3. Define behavior at desktop, laptop, tablet and mobile — with touch targets ≥ 44px.
4. Reuse existing tokens; if a needed value does not exist, escalate to the design owner rather than inventing it.
5. Document it back into §8 of this file. An undocumented component is technical debt.

### 20.3 Never

- Introduce an arbitrary color. Every hex must come from §3.
- Introduce an arbitrary border radius. Only 8 / 12 / 16 / 24 / 32 / 9999.
- Introduce a random font size. Only the §4.3 ladder.
- Introduce an unrelated icon or a second icon library.
- Overuse yellow — one primary CTA per viewport, ≤10% coverage (§3.9).
- Create inconsistent shadows — the §8.0 scale is the entire set.
- Create desktop-only layouts, or ship a breakpoint untested.
- Use yellow text on white, or `#94A3B8` for meaningful content.
- Use Sora on the website (§4.2).
- Place two dark sections, two CTA sections, or two illustrations back to back.
- Rely on hover to reveal essential information.
- Suppress focus outlines.

### 20.4 Definition of done (per screen)

- [ ] Renders correctly at 375, 768, 1024, 1440 and 1920px
- [ ] No horizontal overflow at any width; readable at 200% zoom
- [ ] Every interactive element has a visible focus state and an accessible name
- [ ] All type, color, spacing, radius, shadow and motion values trace to a token
- [ ] Exactly one primary CTA per viewport
- [ ] Empty, loading and error states implemented
- [ ] Images use approved ratios, have `alt` text and explicit dimensions
- [ ] `prefers-reduced-motion` respected
- [ ] Contrast verified against §3.8

---

## 21. Quick Reference Section

### Colors

```
PRIMARY   50 #FFFBEB  100 #FFEDA6  200 #FFE066  300 #FFD42E  400 #FFCB19 ← text on dark
          500 #FFC40C ← ACTION (logo) 600 #E8AC00 ← HOVER  700 #C99200 ← ACTIVE
          800 #A37600 ← headline gold  900 #7A5800 ← gold TEXT on light
          all steps hue 43-48deg — no step is orange
NEUTRAL   #FFFFFF  #FAFAFA  50 #F8FAFC  100 #F1F5F9  200 #E2E8F0  300 #CBD5E1
          400 #94A3B8  500 #64748B  600 #475569  700 #334155  800 #1E293B
          900 #0F172A  near-black #0A0A0A  black #000000
ACCENTS   sky #0EA5E9 · teal #14B8A6 · purple #7C3AED · coral #F43F5E
STATUS    success #22C55E · warning #F59E0B · error #EF4444 · info #3B82F6

page #FFFFFF · alt #F8FAFC · card #FFFFFF · border #E2E8F0
heading #0F172A · body #334155 · muted #64748B · placeholder #94A3B8
CTA #FFC40C (text #0F172A) · hover #E8AC00 · active #C99200 · dark CTA #0F172A · disabled #CBD5E1
```

### Typography

```
Display: Space Grotesk 500/600/700   Body/UI: Inter 400/500/600/700   (Sora: NOT on web)

                    desktop / tablet / mobile   weight  lh     tracking
Display XXL   SG      72 / 56 / 40                700   1.05   -1.5%
Display XL    SG      56 / 44 / 32                700   1.10   -1%
H1            SG      40 / 32 / 26                600   1.20   -0.5%
H2            SG      32 / 26 / 22                600   1.25   -0.3%
H3            SG      24 / 20 / 18                600   1.30    0
H4            SG      20 / 18 / 16                500   1.35    0
H5            Inter   16 / 15 / 14                600   1.40    0
H6            Inter   14 / 14 / 12                600   1.40    0.5%
Body Large    Inter   18 / 16 / 15                400   1.60    0
Body Regular  Inter   16 / 15 / 14                400   1.60    0
Body Small    Inter   14 / 13 / 12                400   1.55    0
Caption       Inter   12 / 11 / 11                400   1.50    0
Label         Inter   11 / 11 / 11 UPPER          600   1.40    0.8%
Button        Inter   16 / 15 / 14                600   1.20    0.5%
```

### Spacing — base 4px

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96 · 120 · 160`
Sections: 48 small · 64 standard · 96 large · 120–160 hero
Card padding 24 · Button 8/16, 12/24, 16/32 · Field gap 16 · Heading margin-bottom 24 · Paragraph 16
Page gutters: 24 desktop · 20 tablet · 16 mobile

### Breakpoints & grid

```
xl ≥1440   lg 1024–1439   md 768–1023   sm 640–767   xs <640
Container  1440 / 1140 / 768 / 100%      Content @xl 1392, column 94px
Grid       12 col / 24px  ·  8 col / 20px  ·  4 col / 16px
Layouts    6+6 · 4+4+4 · 3+3+3+3 · 8+4 (asymmetric) · hero split
```

### Border radius

`8 small · 12 controls (buttons, inputs) · 16 cards · 24 images/modals · 32 large surfaces · 9999 pills`

### Shadows

```
xs  0 1px 2px  rgba(15,23,42,.05)   inputs, rows
sm  0 2px 8px  rgba(15,23,42,.06)   cards at rest
md  0 6px 16px rgba(15,23,42,.08)   hover, menus, tooltips
lg  0 12px 32px rgba(15,23,42,.10)  search module, sticky panel
xl  0 24px 56px rgba(15,23,42,.12)  modals
primary 0 4px 14px rgba(255,196,12,.30)   yellow CTA hover only
focus   0 0 0 3px rgba(255,196,12,.45)
```

### Buttons

```
              bg         text      hover bg   active bg
Primary       #FFC40C    #0F172A   #E8AC00    #C99200
Secondary     #0F172A    #FFFFFF   #1E293B    #020617
Outline       #FFFFFF    #0F172A   border #CBD5E1 + shadow-sm
Text          —          #0F172A   #7A5800    #7A5800 + underline
Disabled      #F1F5F9    #CBD5E1

Sizes  S 8/16 · 14px · h36   M 12/24 · 16px · h44   L 16/32 · 18px · h52
Radius 12px · icon after label · arrow shifts +4px on hover · focus 2px #FFC40C ring
```

### Cards

`#FFFFFF · radius 16 · border 1px #E2E8F0 · padding 24 · shadow-sm`
Hover: shadow-md + border #CBD5E1 + translateY(-2px), 200ms; image scale 1.03, 300ms
Order: badge → media → H4 → Body Small (≤3 lines) → meta → CTA
Dark variant: `#0F172A`, title #FFFFFF, body #CBD5E1, highlight #FFCB19

### Inputs

`h48 · padding 12/16 · radius 12 · 16px text · border 1px #E2E8F0`
focus 2px `#FFC40C` + ring · filled `#F1F5F9` · success 2px `#22C55E` · error 2px `#EF4444` · disabled `#F8FAFC`/`#CBD5E1`
Label above (11px uppercase `#64748B`) or stacked inside for search fields · help/error 12px, 8px below

### Icons

`16 · 20 · 24 · 32` — strokes `1.5 / 2 (default) / 2.5`, rounded caps and joins
Outline = default & inactive · Filled = active/emphasis · Two-tone black+yellow = brand/feature
Colors: `#0F172A` · `#FFC40C` (active) · `#64748B` (meta) · `#CBD5E1` (disabled)
SVG only, `currentColor`, `aria-label` on icon-only buttons

### Motion

`150ms` micro · `200ms` default · `300ms` layout/drawer · `400ms` modal & reveal
Easing `cubic-bezier(.4,0,.2,1)` · animate transform + opacity only · honor `prefers-reduced-motion`

---

## 22. Conflict Register

Every discrepancy found across the ten sheets, with its binding resolution.

| # | Conflict | Sources | **Binding resolution** |
|---|---|---|---|
| 1 | Three different primary ramps: sheet 01 (Material amber, `#FFF8E1 → #E65100`), sheet 04 (`#FFAA00 → #A64200`), and the logo itself | 01 vs 04 vs logo | **The logo wins.** Its fill samples at `#FFC40C` (hue 46°), so the scale is re-anchored on it: `#FFC40C` action, `#E8AC00` hover, `#C99200` active. Both published ramps are void — they drifted to hue 30–40 (orange). |
| 2 | Secondary scale is a neutral grey ramp on sheet 01 vs a slate-blue ramp on sheet 04 | 01 vs 04 | **Sheet 04 wins.** The secondary family is slate blue (`#F1F5F9 … #020617`). |
| 3 | Neutral scale on sheet 04 labels two swatches "NEUTRAL 600" (`#64748B` and `#475569`), skipping 500 | 04 (internal) | The scale is the standard 10-step slate ramp. **`#64748B` = neutral-500, `#475569` = neutral-600.** |
| 4 | Neutral and secondary ramps overlap but are offset by one step (`#F1F5F9` is neutral-100 and secondary-50) | 04 (internal) | Both retained. **Use `neutral-*` for surfaces/text/borders; use `secondary-*` only for deliberate dark-brand surfaces.** Never mix names for one purpose. |
| 5 | Type scale differs: sheet 01 lists H1 64/72px, H2 48/56px, Body Base 14px; sheet 07 lists H1 40px, H2 32px, Body Regular 16px | 01 vs 07 | **Sheet 07 wins in full.** Sheet 01's ladder is void; its 64px "H1" corresponds to the Display tier. |
| 6 | Spacing base: sheet 01 says "8px system"; sheet 10 says "Base unit 4px, all values multiples of 4" | 01 vs 10 | **Sheet 10 wins. Base unit is 4px.** The published scale in §5.1 is the complete set. |
| 7 | Container widths: sheet 01 shows 360 / 768 / 1300 / 1440; sheet 10 shows 1440 / 1140 / 768 / 100% | 01 vs 10 | **Sheet 10 wins.** Desktop 1440, laptop 1140, tablet 768, mobile fluid. |
| 8 | Container 1440px vs "Content Width 1392px, side margin auto (24px each side)" | 10 (internal) | Not a conflict once stated precisely: **max-width 1440 including 24px gutters ⇒ 1392px content box.** Grid math starts at 1392. |
| 9 | Laptop container 1140px sits inside the `lg` range 1024–1439 | 10 (internal) | **Container max-width 1140px applies across the whole `lg` range**, naturally constrained by the viewport minus 24px gutters below 1188px. |
| 10 | Icon stroke: sheet 01 says "2px stroke weight"; sheet 08 lists 1.5 / 2 / 2.5 | 01 vs 08 | Compatible. **2px is the default; 1.5px at 16px; 2.5px at 32px+.** |
| 11 | Color harmony chart (Primary 60%) vs the brand rule "do not overuse yellow" and all mockups | 04 vs 02/03/06 | **Read the chart as brand-voice, not coverage.** Binding coverage rule in §3.9: neutrals ≥70%, yellow ≤10%, dark ≤20%, one yellow CTA per viewport. |
| 12 | Caption 10px mobile and Label 10px/9px fall below legible size | 07 | **Floor of 11px.** Caption and Label clamp at 11px on tablet and mobile (§4.3). |
| 13 | Warning `#F59E0B` and the old primary `#FFC40C` were visually close (hue 38 vs 40) | 04 (internal) | Resolved by the re-anchor: brand gold is hue 46, warning amber hue 38. **Warning is status-only; brand gold is action-only.** |
| 14 | Sora is listed as an available accent font with no production rule | 07 | **Not loaded on the website** (§4.2). Brand collateral only, unless a written exception is granted. |
| 15 | Sheet 09 publishes radii 8/16/24/32 with no value for buttons and inputs | 09 | **Controls use 12px** (§8.0) — the single value fixed by this document, applied to every control. |
| 16 | Accent list in the brief includes orange; no orange ramp exists in sheet 04 | brief vs 04 | **Orange is not a brand colour.** It exists only as the semantic warning family. Where a "deeper orange" tone is wanted, use deeper **gold**: `primary-700 #C99200` (surface) or `primary-900 #7A5800` (text). |
| 17 | Sheet 01 shows a rounded-square search pill and sheet 05 shows a 12px-radius button | 01 vs 05 | **Sheet 05 wins.** Buttons are 12px-radius rectangles; full pills are reserved for badges, tags and toggles. |
| 18 | The first implementation used `#FFAA00`/`#E87400`, which reads orange against the logo | logo vs build v1 | **Re-anchored on the logo** — see row 1. Every brand hex in the code and this document was remapped; no orange brand hex remains. |
| 19 | Brand yellow was used as small text on white (feature-card CTAs, category headings, blueprint CTA column, badge text) at 2–3:1 | §3.8 vs build v1 | **`#7A5800` (primary-900, 6.5:1)** is the single approved brand-family text colour on light surfaces. Bright gold is a surface only. |
| 20 | `#94A3B8` was used for information-bearing labels (token names, rem column, pattern codes, slider poles) at 2.5:1 | §3.6 vs build v1 | **`#94A3B8` is placeholder- and disabled-only** on light surfaces. All label text uses `--text-muted` `#64748B` (4.6:1). On **dark** surfaces `#94A3B8` remains correct (4.6:1 on `#1E293B`). |
| 21 | The whole system was authored around flights (search, results, fare cards, blueprints) while the business sells travel packages | product owner vs build v1 | **§0 is binding.** The package is the product entity, the destination is the discovery layer, flights are supporting detail inside a package. Search, cards, results, comparison, deals and all 18 page blueprints were re-authored around packages. |

---

*CompareMyTrip Design System v1.0 — derived from sheets 01–10. Sheets 02–10 are canonical; sheet 01 is superseded. Any value not present in this document does not exist in the system.*


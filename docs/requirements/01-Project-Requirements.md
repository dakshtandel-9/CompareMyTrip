# CompareMyTrip — Project Requirements Document (PRD)

**Status:** DRAFT — built from client answers so far. Sections marked **PENDING** need client input before build scoping is final (see §11).
**Source of answers:** [00-Client-Intake-Questionnaire.md](./00-Client-Intake-Questionnaire.md) — Answer Log.
**Visual/brand system:** Locked separately in `CompareMyTripBranding/Design system documentation/design.md`. This PRD does not restate colors, type, or component specs — it defines *what* gets built; that doc defines *how it looks*.

---

## 1. Executive Summary

CompareMyTrip is a **travel-package sales platform** run by a travel agency / tour operator that curates and sells its own packages (not an OTA reselling third-party inventory, not a flight-booking site). Customers discover, compare, and pay for packages directly on the site. Per the design system's binding product journey:

**Discover → Explore → Compare → Package detail → Enquire / Book**

The comparison flow (selecting 2–3 packages and viewing them side by side) is a **core, first-class feature** — not a secondary one — since it's central to the product name and positioning.

---

## 2. Business Model & Monetization

| | |
|---|---|
| **Business type** | Travel agency / tour operator — sells own curated packages |
| **Revenue model** | Direct package sales |
| **Payment** | **Online, on-site** — customer pays a deposit or full amount through the website. Requires a live payment gateway integration. |
| **Payment gateway** | **Razorpay** (signal: India-centric market — cards, UPI, netbanking). Base currency assumed **INR** — **PENDING confirmation.** |
| **Package sourcing** | Manually curated and entered by the client's own team — no supplier/DMC API integration at launch |
| **Package volume at launch** | Medium — 25 to 100 live packages |
| **Package categories (launch)** | Domestic, International, Honeymoon/Couples, Family/Group |

---

## 3. Target Audience & Success Metrics

| | |
|---|---|
| **Target audience** | **PENDING** — age range, income bracket, travel style not yet provided |
| **Primary KPI** | Enquiry-to-booking conversion rate |
| **Competitive benchmark** | **PENDING** — 2–3 named competitors not yet provided |
| **Migration status** | Brand new, greenfield build — no existing site or traffic to account for |

---

## 4. Core Feature Scope (MVP)

### Must-have for launch
- **Package browsing** — destination and package listing pages
- **Search & filters** — Destination, Budget range, Duration, Travel dates
- **Package comparison** — select 2–3 packages, view side-by-side comparison table (price, inclusions, duration) — **core differentiator, treat as first-class flow**
- **Package detail page** — itinerary, inclusions/exclusions, photos, pricing
- **Online payment checkout** — Razorpay integration for deposit/full payment
- **User accounts** — signup/login, saved favorites/wishlist, enquiry & order history
  - Login methods: multiple options supported (e.g. email+password plus Google/phone OTP) — **exact combination PENDING**
- **Enquiry/lead form** — routes to email/admin panel (no CRM at launch)
- **Admin/CMS panel** — self-managed by client's team; single admin role (no multi-tier permissions for v1); used to add/edit packages, destinations, pricing, promos, blog posts
- **Deals & promos** — promo codes, limited-time-offer badges/banners on packages
- **Curated testimonials** — client-supplied quotes displayed on site (no open user-review system)
- **Blog / travel-guide section** — for SEO, destination articles
- **Analytics** — Google Analytics 4 + Google Tag Manager

### Explicitly out of scope for v1
- Open user-submitted reviews/ratings (testimonials only)
- WhatsApp Business API integration (email/form only)
- CRM integration (none exists yet)
- Multi-currency display/toggle (single currency)
- Multi-language support (not raised — assume English-only unless stated otherwise; **PENDING confirmation**)
- Supplier/DMC API sync (all package data manual)

---

## 5. Sitemap

- Home
- Destinations (listing)
- Destination detail
- Packages (search/listing results)
- Package detail
- Compare (selected packages)
- Account (login/signup, saved favorites, enquiry/order history)
- Checkout / Payment
- Blog / Travel Guide (listing + article)
- About Us — **content PENDING** (founder bios, company story)
- Contact
- FAQs
- Terms & Conditions — **PENDING, needs drafting**
- Privacy Policy — **PENDING, needs drafting**
- Refund / Cancellation Policy — **PENDING, needs drafting**

---

## 6. Technical Requirements & Integrations

| Area | Requirement |
|---|---|
| Domain | Already owned by client — ready to point at new site |
| Hosting | Not yet specified — **PENDING or to be recommended** |
| Payment gateway | Razorpay |
| CRM | None — enquiries route to email/admin panel for now |
| Email service | Not yet specified — needed for transactional enquiry/order emails — **PENDING or to be recommended** |
| Analytics | Google Analytics 4 + Google Tag Manager |
| WhatsApp | Not integrated (out of scope v1) |
| Maps | Not raised — likely needed for destination pages — **PENDING confirmation** |
| Compliance | No specific regulation targeted; apply general best practice — cookie consent banner + compliant Privacy Policy recommended regardless |
| Accessibility | Not specified — **PENDING** (recommend WCAG 2.1 AA as a sane default, matches design system's accessibility floor per design.md §1.1) |

---

## 7. Content & Copy Ownership

| | |
|---|---|
| Page/marketing copy | Client provides final copy |
| Package content (itineraries, inclusions, pricing, photos) | Client's team supplies per package |
| Blog content | Needed for SEO — ownership (client vs. dev team) not yet specified — **PENDING** |
| Launch-package assets readiness (photos/videos/itineraries for 25–100 packages) | **PENDING** |
| Testimonials, partner logos, press mentions | **PENDING** |
| About Us content (founder bios, company story) | **PENDING** |

---

## 8. Legal & Compliance

- Terms & Conditions, Privacy Policy, Refund/Cancellation Policy: **none exist yet — must be drafted as part of this project.** Recommend legal review before publishing, especially for a site that processes online payments.
- No specific data-privacy regulation targeted by the client; general best practice applies. A cookie consent banner is still recommended given online payment + accounts + analytics tracking are all in scope.
- Business licensing/registration details for footer/trust badges: **PENDING**

---

## 9. Timeline & Phasing

**Target: Fast MVP, under 2 months.**

This is an aggressive timeline against the confirmed scope — online payments, accounts with multiple login methods, a self-serve admin CMS, and a genuine comparison engine are all "must-have," which is a substantial build for that window. Recommend explicitly agreeing a **phase 1 / phase 2 split** with the client before work starts, e.g.:

- **Phase 1 (MVP, ~2 months):** Browse, filter, package detail, compare, single-method login + accounts, Razorpay checkout, basic single-role admin CMS, enquiry form, testimonials, GA4/GTM.
- **Phase 2 (fast-follow):** Blog/SEO content section, promo/deals engine, additional login methods, refinements to admin roles/permissions.

This split is a **recommendation for the client to confirm, not a decision already made** — flag explicitly in the next client conversation.

---

## 10. Post-Launch

- Ongoing retainer with the dev team for maintenance, bug fixes, hosting support.
- Single admin role at launch — no multi-tier permission system needed yet.
- Content update cadence (packages/blog posts per week/month): **PENDING** — informs how much CMS polish/training is worth investing in.

---

## 11. Open Items — Pending Client Input

These are free-text items from the intake questionnaire not yet answered. Nothing above marked **PENDING** should be treated as final until these are filled in.

**Business identity & contact**
1. Legal/registered business name (if different from "CompareMyTrip")
2. Country of registration + confirm INR as base currency
3. Travel-trade licensing/registration number to display
4. Registered business address
5. Support email and phone number
6. Social media handles to link

**Audience & competitors**
7. Target audience — age range, income bracket, travel style
8. 2–3 direct competitors to benchmark against

**Assets & content**
9. Photo/video and itinerary readiness for the 25–100 launch packages
10. Testimonials, partner/supplier logos, press mentions
11. About Us content — founder bios, company story

**Other technical**
12. Hosting preference (or confirm dev team should recommend one)
13. Email service preference (or confirm dev team should recommend one)
14. Maps integration needed for destination pages?
15. Multi-language requirement, or English-only?
16. Exact login method combination (email+password, Google, phone OTP — which ones together)
17. Blog content ownership — client-written or needs copywriting support
18. Content update cadence post-launch
19. Confirm phase 1 / phase 2 split proposed in §9

---

## Change Log

- Draft 1 — compiled from intake answers collected 2026-08-24.

# CompareMyTrip — Client Requirements Intake Questionnaire

**Status:** OPEN — awaiting client answers
**Purpose:** Capture every business, content, functional, technical, legal, and operational requirement needed to scope and build the full CompareMyTrip site. The visual/brand system is already locked in `CompareMyTripBranding/Design system documentation/design.md` — this document does NOT re-ask branding questions (colors, type, tone). It covers everything the design system explicitly leaves out (§1.2 of that doc): product copy, backend data, pricing logic, integrations, legal text, SEO/analytics.

Answers get filled in under each question as they come in. Once complete, this becomes the source-of-truth PRD for build scoping.

---

## 1. Client & Business Info

1. Legal business name / registered entity name?
2. Trading name (confirm "CompareMyTrip" is final, incl. capitalization/spacing)?
3. Country of registration and primary market(s)/countries served?
4. Business type — travel agency, OTA, package aggregator/marketplace, meta-search/comparison-only, or something else?
5. Any travel-trade licensing/registration numbers to display (e.g., IATA, TAAI, state tourism registration)?
6. Registered business address (for footer / legal pages)?
7. Support contact channels — email, phone, WhatsApp Business number?
8. Social media handles to link (Instagram, Facebook, YouTube, LinkedIn, X, TikTok)?
9. Who are the 2–3 direct competitors you want this site benchmarked against?

## 2. Business Model & Monetization

10. How is revenue made — commission from suppliers, markup on packages, lead-generation fee, subscription, or a mix?
11. Does the site take payment directly (deposits/full booking) or is "Enquire Now" strictly a lead-capture step handled offline?
12. Are package prices fixed/published, or "starting from" with a quote-on-enquiry model?
13. Package sourcing — manually curated/entered by your team, pulled live from supplier/DMC APIs, or a mix?
14. Expected number of live packages at launch, and expected growth rate?
15. Package categories to support (e.g., domestic, international, honeymoon, family, group/GIT, corporate/MICE, adventure, cruise, visa-only, flight+hotel)?

## 3. Audience & Goals

16. Primary target audience — geography, age range, income bracket, travel style (budget/luxury/family/solo)?
17. Primary goal of the website — enquiries/leads, direct bookings, brand awareness, or a defined mix?
18. Top 3 KPIs you'll judge this site by post-launch (e.g., enquiry conversion rate, monthly unique visitors, avg. package value)?
19. Any existing site/traffic to migrate from, or is this greenfield?

## 4. Content & Sitemap

20. Confirm required pages — Home, Destinations (listing), Destination detail, Packages (listing/search results), Package detail, Compare, About Us, Contact, Blog/Travel Guide, FAQs, Careers, Terms & Conditions, Privacy Policy, Refund/Cancellation Policy — any to add or remove?
21. Who provides page copy — your team supplies final copy, or do you need copywriting as part of this engagement?
22. Who supplies package content per listing (title, itinerary day-by-day, inclusions/exclusions, photos, pricing tiers)?
23. Do you need a blog/content-marketing section for SEO (travel guides, destination articles)?
24. Any multi-language requirement, or English-only for v1?
25. Do you have existing brand photography/video for destinations and packages, or is stock/AI imagery needed?

## 5. Core Features & Functionality

26. Search & filter — which filters matter (destination, travel dates, budget range, duration, package type, group size, rating)?
27. Package comparison — should users be able to select 2–3 packages and view a side-by-side comparison table (this is implied by the brand name — confirm scope)?
28. User accounts — required (login/signup, saved favorites/wishlist, enquiry history) or not needed for v1?
29. If accounts are needed — email/password, Google/social login, or phone OTP?
30. Enquiry/lead form — what fields are required, and where should submissions go (email inbox, CRM, WhatsApp, all of the above)?
31. Reviews & ratings — do you want user-submitted reviews on packages/destinations, or curated testimonials only?
32. Live chat or chatbot for instant support — needed?
33. Newsletter signup / email marketing capture — needed?
34. Admin/CMS panel — does your team need to self-manage packages, destinations, pricing, and blog content without a developer, or will a dev team push all content updates?
35. Deals, offers, or promo-code / limited-time-offer functionality — needed?
36. Currency display — single currency or multi-currency toggle?
37. "Enquire Now" downstream flow — does an enquiry trigger an automated email/WhatsApp confirmation to the customer, and an internal notification to sales staff?

## 6. Technical & Integrations

38. Domain — do you already own the production domain (e.g., comparemytrip.com/.in), or does that need to be acquired?
39. Hosting/infrastructure preference, or should we recommend one?
40. CRM to integrate enquiries into (HubSpot, Zoho, Salesforce, custom sheet, none yet)?
41. Email service for transactional + marketing email (e.g., SendGrid, Mailchimp, Brevo)?
42. Analytics/tracking required — Google Analytics 4, Google Tag Manager, Meta Pixel, others?
43. Payment gateway needed if taking deposits/bookings online (Razorpay, Stripe, PayPal, other)?
44. WhatsApp Business API integration for enquiries/support — needed?
45. Maps integration for destinations (Google Maps or alternative)?
46. Any existing backend, database, or supplier/DMC API that package data must integrate with, or is content fully manual/static at launch?
47. SEO requirements — structured data/schema markup, XML sitemap, specific target keywords or markets already researched?

## 7. Legal & Compliance

48. Do you already have drafted Terms & Conditions, Privacy Policy, and Refund/Cancellation Policy, or do these need drafting?
49. Cookie consent / data-privacy compliance needed (e.g., India's DPDP Act, GDPR for EU visitors, CCPA)?
50. Any accessibility standard to meet (e.g., WCAG 2.1 AA)?

## 8. Timeline & Budget

51. Target launch date?
52. Approved budget range (even a rough band helps scope realistically)?
53. Should this ship as a phased MVP first (core browse + enquire flow) with features added later, or full-scope in one release?

## 9. Post-Launch Operations

54. Who owns the site after launch — your internal team, or ongoing support/retainer with the dev team?
55. If there's an admin/CMS panel, who needs training and how many admin user roles are required (e.g., super admin, content editor, sales/enquiry viewer)?
56. Expected content update frequency (new packages/blog posts per week/month) — informs whether CMS ease-of-use is a priority?

## 10. Assets Client Will Provide

57. Package photos/videos, day-wise itineraries, inclusions/exclusions, and pricing sheets for initial launch packages?
58. Team/About Us photography, founder bios, company history/story for the About page?
59. Testimonials, partner/supplier logos, press mentions, or awards to feature?
60. Any existing legal documents, business registration certificates, or licensing proof needed for footer/trust badges?

---

## Answer Log

**Q10 (Revenue model):** We sell travel packages. *(Follow-up needed: confirm whether payment is taken on-site or enquiry routes to offline sale — see clarifying question below.)*
**Q13 (Package sourcing):** Manually curated by client's team.
**Q28 (User accounts):** Required for v1 — login/signup, saved favorites, enquiry history.
**Q34 (Admin/CMS):** Yes, self-managed — client's team needs a non-technical admin panel to add/edit packages, destinations, blog content.
**Q11 (Payment):** Online payment on-site — customer pays directly through the website. **A payment gateway is required.**
**Q27 (Comparison feature):** Yes — core feature. Users select 2-3 packages and view a side-by-side comparison table (price/inclusions/duration). This is central to the product name and must be a first-class flow, not an afterthought.
**Q31 (Reviews):** Curated testimonials only — client supplies hand-picked quotes/testimonials; no open user-review system for v1.
**Q51/52 (Timeline):** Fast MVP — target under 2 months. *(Flag: online payment + accounts + self-serve admin CMS + comparison engine is a substantial scope for a sub-2-month MVP. Will need to discuss phasing — see Recommendations section once intake is complete.)*
**Q38 (Domain):** Already owned.
**Q40 (CRM):** No CRM yet — enquiries can route to email/admin panel for now.
**Q48 (Legal docs):** Not drafted — Terms & Conditions, Privacy Policy, Refund/Cancellation Policy need to be written as part of this project. *(Recommend legal review before publishing.)*
**Q3 (Markets):** Single currency, but serves travelers from multiple countries — no multi-currency toggle needed at launch.
**Q15 (Package categories):** Domestic, International, Honeymoon/Couples, Family/Group at launch.
**Q21 (Copywriting):** Client provides final copy for all pages/packages.
**Q23 (Blog/SEO):** Yes — needed. Destination guides/travel articles for organic search.
**Q44 (WhatsApp):** No — email/form only for v1, no WhatsApp Business API integration.
**Q55 (Admin roles):** Single admin role — no multi-tier permissions needed for v1.
**Q14 (Package volume):** Medium — 25 to 100 packages live at launch.
**Q54 (Post-launch support):** Ongoing retainer with the dev team for maintenance/support.
**Q35 (Deals/promos):** Yes — needed. Promo codes and limited-time offer badges/banners on packages.
**Q26 (Search filters):** Destination, Budget range, Duration, Travel dates.
**Q18 (Primary KPI):** Enquiry-to-booking conversion rate.
**Q42 (Analytics):** Google Analytics 4 + Google Tag Manager.
**Q19 (Migration):** Brand new, greenfield build — no existing site to migrate.
**Q4 (Business type):** Travel agency / tour operator — packages own curated trips.
**Q43 (Payment gateway):** Razorpay. *(Signal: market is India-centric — supports cards/UPI/netbanking; implies INR as base currency, confirm in follow-up.)*
**Q29 (Login method):** Multiple options — support more than one login method (e.g. email + Google/phone OTP), specifics TBD at design stage.
**Q49 (Compliance):** No specific regulation targeted — apply general privacy best practices (still recommend basic cookie consent banner + a compliant Privacy Policy per Q48).

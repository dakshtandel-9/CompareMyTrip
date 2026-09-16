**CompareMyTrip — product detail and CRM redesign plan**

Research date: 17 September 2026. Status: analysis and proposed implementation sequence. This document does not change the application or publish package content.

**1. Recommended direction**

Build a calm, information-led travel page that helps a visitor decide whether the trip suits them, understand the full price, and take one clear next step. Use authentic photography, readable text and useful logistics to establish quality. Reduce repeated cards, decorative badges, nested boxes and generic marketing subtitles.

Working priority: quick comparison and easy booking, supported by enough operational detail to book confidently. A trek and a multi-day holiday should share a visual system but have different relevant fields.

Preserve the user's explicit requirements:

- The product section bar stays in its original position in normal document flow. No sticky/fixed section bar, scrolling tab track or scroll-driven movement.
- Transfers, pickup/drop information, things to carry and trail guidelines are collapsed initially and expand when clicked.
- Difficulty and all package-specific facts, labels and practical content are editable per package in the CRM.
- Content entry and upload should be understandable without preparing technical JSON.
- Complete this plan before another redesign implementation.

**2. What the five references do well**

These are design judgments based on the inspected pages, not a claim that one operator has the best overall service, fastest site or most accurate information.

| Reference | Most useful pattern | How to adapt it |
| --- | --- | --- |
| [TourBazaar — Majestic Jaisalmer](https://tourbazaar.in/packages/majestic-jaisalmer-cffc) | Large gallery beside a compact quote card; operator identity; readable itinerary and inclusion groups. | Best starting point for the commercial layout. Give our page one clear primary action and show who operates the trip. Avoid borrowing unverified urgency or popularity claims. |
| [Escape2Explore — Skandagiri](https://www.escape2explore.com/tours/sunrise-treks/skandagiri-sunrise-trek-with-water-activities/41) | Detailed pickup points with time, landmark and map link; Day 0/Day 1 sequence; explicit pricing treatment. | Best logistics reference. Use structured pickup rows and explain overnight departure dates beside the date selector. Keep our overview shorter. |
| [Tripbae — Skandagiri](https://tripbae.com/st_tour/skandagiri-sunrise-trek/) | With/without transport choices and expandable itinerary, packing and guidelines. | Show variants only when genuinely sold. Put compulsory extras next to the price rather than leaving them in long descriptions. |
| [Plan The Unplanned — Skandagiri](https://plantheunplanned.com/tours/skandagiri-trek) | A prominent trek snapshot with difficulty, distance, altitude, age and group size. | Best reference for trek suitability facts. Show a compact set once, and avoid repeated snapshots and long promotional copy. |
| [Veena World — Coorg/Mysore/Bengaluru](https://www.veenaworld.com/package/coorg-mysore-bengaluru-tour-package-kamg) | Departure-specific prices, joining options, dated itineraries, accommodation/logistics and cancellation information. | Best reference for a mature holiday booking flow. Adopt its clarity progressively; exact departure inventory and occupancy pricing need backend support. |

Recommended combination: TourBazaar's layout hierarchy, Plan The Unplanned's trip facts, Escape2Explore's logistics, Tripbae's relevant choices and Veena World's price/booking clarity.

The reference pages disagree on trek difficulty, start times and some transport details. They are inspiration for presentation, not a source of truth for CompareMyTrip's operating facts. “Easy” must remain an explicit admin value and be verified with the actual operator before publication. Do not silently replace it using another site's classification.

**3. Current page: concrete findings**

The current local Skandagiri page was inspected in a desktop browser, including its actual automatic enquiry overlay. Source inspection covered the product route and CRM. Mobile/tablet behavior below is source-derived unless stated otherwise; a full responsive visual pass is still required.

| Finding | Why it matters | Proposed correction |
| --- | --- | --- |
| The quote card repeats the destination in a truncated header and displays an “NA” flight badge. | Useful content competes with irrelevant metadata. | Show the full trip name in the page heading; hide inapplicable flight fields; keep the card focused on price and selection. |
| Quote, pay/book and compare are all large actions. | The next step and availability promise are unclear. | Define the package's booking mode and give it one primary action; make compare a compact secondary action. |
| Pickup information appears in both a custom prose section and a structured location section. | Visitors have to reconcile duplicate information. | Use one canonical pickup section; merge existing content carefully during migration. |
| Long introductory/story paragraphs come before decision-critical information. | Visitors scroll before learning what the price includes. | Short overview, concise highlights and visible inclusion/exclusion summary before optional storytelling. |
| Many sections have similar rounded containers, tinted headers, generic subtitles and repeated labels. | Everything receives similar visual emphasis. | Use shared spacing and type hierarchy, plain section dividers and a small number of meaningful containers. |
| The gallery has a single image surrounded by unused horizontal space. | The first screen feels unfinished despite a strong photograph. | Support one-image and multiple-image layouts deliberately; preserve full-image viewing and offer an authored landscape cover/focal point. |
| The sample related holiday is labelled Goa while titled Coorg. | Content inconsistency undermines comparison. | Add a content review step for destination, categories and media, and recommend relevant packages. |
| The page says a quote date can be left blank, but quote validation requires a date. | A promised flow fails. | Allow a flexible date for quotes; require a valid date when actual booking needs one. |
| Login redirect retains only the package URL. | Chosen date and traveller count can be lost. | Preserve and restore selection through authentication; show a clear loading state. |
| The mobile booking link can proceed using default traveller values while full selection controls occur after the content. | A visitor may enter checkout without reviewing their choices. | Place compact booking choices near the top; the mobile action opens or validates those choices first. |

Additional checks: the cancellation link can target a hidden policy section; the tall desktop booking card can exceed a short laptop viewport; tablet comparison and booking overlays may collide. These belong in the acceptance checklist, with the last two verified at their actual breakpoints before choosing the final layout.

**4. Proposed traveller page**

Desktop: a readable page width of roughly 1,200–1,280 px, with a main column and a compact 340–380 px booking column. Start with the booking card in normal flow. Keep the primary price and action visible together without a long stack of nested panels.

| Order | Content | Behavior |
| --- | --- | --- |
| 1 | Breadcrumb, complete trip title, destination/route, duration and review summary when available | Share/download/compare use restrained secondary controls. Hide empty ratings. |
| 2 | Real trip gallery and compact booking card | One image still looks intentional; additional images open on demand. No autoplay. |
| 3 | Trip facts | Treks: difficulty, distance, duration, elevation and age/group details when known. Holidays: nights per city, stay category, meals and transport. Do not fill unknown values with invented defaults. |
| 4 | Stationary section navigation | Overview, itinerary, inclusions, practical details and reviews when present. Thin underline or color response on hover/focus/click. No scrollspy needed. On narrow screens use wrapping links or a compact contents dropdown, with no horizontal scroll track. |
| 5 | Short overview and 4–6 specific highlights | Plain language; remove repeated SEO phrasing. An optional story sits behind “Read the story.” |
| 6 | What is included / additional costs | Critical permit, meal and tax exclusions stay visible near the price as well as in the full list. |
| 7 | Timed itinerary | Clear Day 0/Day 1 for overnight treks. Show departure and return expectations; expand longer day descriptions only when useful. Holidays show cities, stays and meals. |
| 8 | Practical details | Four closed disclosure rows: Transfers; Pickup & drop; Things to carry; Trail guidelines. Optional rows render only with content. |
| 9 | Reviews, operator and cancellation | Genuine review data and operator identity; short cancellation summary near booking with full terms here. FAQs answer remaining questions without repeating the overview. |
| 10 | Relevant alternatives | A small, useful comparison set with consistent facts and price basis. |

For mobile, move the price and date/traveller choices above the long content. The existing bottom booking action should open that selector or validate its state before checkout. Avoid multiple floating widgets over the same area. Keep the section navigation in the page flow on mobile too.

**Practical dropdown design:** a single clean bordered group or closely spaced rows; small consistent line icon; direct title; a useful summary only when data supports it, such as a pickup count; clear chevron. Opening reveals a pickup table, checklist or short paragraph appropriate to the content. Avoid invented subtitles that add height without information. Use native disclosure semantics, visible keyboard focus and a restrained chevron/color transition around 150–180 ms; honor reduced-motion preferences. A navigation link targeting a closed section must reveal its content before focusing it.

**Visual system:** keep the existing brand yellow as the main action/accent color, dark text and neutral surfaces. Use one font family, a small type scale, body text around 16 px, comfortable line height and consistent 8 px spacing increments. Use fewer shadows and modest radii. Real landscape, trail and group photographs create character. Keep full images available; do not crop away important content simply to force every upload into the same frame.

**Booking clarity:** use “Request a quote” for an unconfirmed quote-led package. Use “Choose date” followed by booking when the product supports confirmed departures. Explain the price basis and mandatory extras, show the total for the selected party, and distinguish an estimate from a payable total. A strike-through price, scarcity message or verified-agent claim should render only when supported by actual data. Do not turn weekday restrictions into a claim of live seat availability.

**5. Easier CRM workflow**

Most of the requested fields already exist. Difficulty, booking labels/notes, weekdays, prices, media, itinerary, transfers, policies and custom sections are editable. The larger problem is discovering them and saving reliably. The current main editor is a long public-page preview with settings in a narrow sidebar.

Use a labelled editor with a compact section menu and an explicit preview button. Keep inline preview editing as a convenient secondary mode.

| Step | Editor content | Entry shortcuts |
| --- | --- | --- |
| Start | Choose day trek, overnight trek or holiday; choose blank, duplicate or paste content | Package type is separate from marketing categories. Avoid pre-filling treks with generic hotel/day defaults. |
| Basics & photos | Title, route/destination, short summary, duration, operator, cover/gallery, image caption/alt text | Drag to reorder photos, select cover, show upload progress and actionable errors. |
| Price & departures | Price basis, optional original price, booking mode, weekdays or supported departures, relevant suitability facts | Clear labels for difficulty, permit inclusion and availability. No hidden title/category inference. |
| Itinerary & inclusions | Day/activity rows, stays/meals where relevant, included/excluded lists | Add, duplicate and reorder rows; paste a list into separate items; enable Day 0 only when needed. |
| Practical details & policies | Pickup time/landmark/map rows, transfer notes, packing, guidelines, FAQs and cancellation | Reusable templates, readable text toolbar, optional sections and visibility controls. |
| Preview & publish | Actual traveller page at desktop/mobile widths; completeness and conflict checks | Each error links to its field. Save draft and Publish update are distinct actions. |

**Fix save behavior first:**

- Pasted/uploaded section text currently has an intermediate “Apply text” state that global Save does not see. Make all edits part of the same draft, or block Save with a clear unresolved-edit message. Never silently omit them.
- Permit genuinely incomplete drafts. Publication validation should be stricter than draft validation.
- Saving should keep the editor open and show the saved state/time.
- Maintain a working draft separately from the published revision. Today, changing a live package's status to Draft changes the same stored record and can remove the public listing.
- Add recoverable autosave for the working draft, with visible saving/saved/error states and retry. Define conflict handling before allowing concurrent editors to overwrite each other.
- “View as traveller” must use the actual booking card. The current preview still injects the settings sidebar.

**Content upload:** begin with paste text and the existing text/Markdown uploads. Show the destination sections and proposed values, let the admin accept only selected changes, and preserve existing photos. Offer a simple rich-text toolbar for headings, bullets and links instead of requiring special bracket syntax. Keep JSON import as an advanced option. Direct PDF/document extraction can follow, with a review screen and unresolved facts highlighted; it is a new integration, not an existing capability to claim.

**6. Data model and migration**

| Data | Rule |
| --- | --- |
| Package type | Explicit trek/holiday type controls field groups. Preserve existing category tags independently. |
| Difficulty | Store declared level and optional explanation per package. Reuse that value everywhere; allow a hidden/unknown state without substituting Easy. |
| Shared facts | Duration, transport, permit and meals each have a canonical field. Overrides should be explicit with a reset to the automatic value. |
| Overnight schedule | Store whether the selection refers to departure night or activity date; display both dates clearly. |
| Pickup/drop | Structured locality, landmark, time/day offset, map link and notes. One section renders the data. |
| Pricing | Model included, compulsory extra, optional and unknown amounts explicitly. Do not compute an “all-in” total when required amounts are unknown. |
| Editorial state | Separate draft/published revisions; record update/publish status and recoverable history. |
| Content provenance | Allow operational facts to carry an internal verification date/source. Imported content remains reviewable. |

Retain current package IDs, URLs, photos, custom section order, visibility, reviews and optional field behavior. Existing imports remain compatible or receive an explicit schema-version migration. Preview migrated samples before publishing; do not guess prices, difficulty, permit rules, pickups or review authenticity. Audit shared rendering used by comparison, itinerary download and checkout so the same fact cannot differ between surfaces.

Exact dated inventory, capacity, seasonal pricing, child rates, occupancy and add-ons are separate business features. Design for them where appropriate, but do not expand the first redesign into a full inventory system without confirming the selling model.

**7. Performance and interaction plan**

Verified mechanisms from source inspection:

- The global trip-planning dialog opens after about one second on package pages and locks scrolling. It was reproduced visually. Make enquiries action-triggered on this route.
- Published content is fetched immediately and every 30 seconds, including the full package catalogue and blog posts. One local development request returned 57,048 uncompressed bytes for two packages plus ten posts. The detail route already receives server-loaded package data.
- The now-stationary section navigation still measures section styles/bounds during scroll. Remove this continuous work or use a narrowly scoped observer only if needed.
- Much of the public page shares a client component and inline-editing plumbing; date/quantity changes can rerender surrounding content. Profile and isolate booking, gallery and disclosures from stable editorial rendering.
- A signed-in profile check can cover public content while resolving. Defer requirements to actions that need them, so reading the page remains available.
- CRM keystrokes reconstruct preview data and store full form history. Profile large packages; use section-scoped updates and an on-demand preview if needed.

These findings identify avoidable work and interruption. They do **not** establish a measured cause for every reported lag. No production Lighthouse score, field Core Web Vitals result or device performance trace was collected in this audit.

Before implementation, capture a production-build baseline for initial load, scroll, calendar, quantity, gallery, disclosures, login return and CRM typing/import. Record device, viewport, network and CPU conditions. Inspect actual request waterfalls, long tasks and rerenders. Use server content with publish revalidation, refresh only data that needs freshness, defer heavy optional UI, and size/lazy-load images appropriately. Read the installed Next.js guides when changing caching, client boundaries or loading behavior.

Targets: LCP at or below 2.5 seconds, INP at or below 200 ms and CLS at or below 0.1 at the 75th percentile, assessed separately for mobile and desktop. These are Google's [Core Web Vitals guidance](https://web.dev/articles/vitals). Lab measurements help prevent regressions; actual user data is needed to validate field results.

**8. Implementation sequence and acceptance**

| Phase | Deliverable | Exit criteria |
| --- | --- | --- |
| 1 — Fix unreliable flows | Consistent quote dates, preserved selections, reliable staged-content saves, noninterrupting public reading | No lost selection/content; quote and booking requirements match their copy; draft save keeps editing context. |
| 2 — Design the complete flow | Desktop/mobile wireframes for one trek and one holiday, booking states and all CRM steps | One clear main action; stationary navigation; closed practical rows; relevant facts; no duplicated pickups. |
| 3 — Implement shared structure | Refined page components, grouped CRM forms and canonical package fields | Existing content/imports remain readable; public preview matches the actual page; all displayed package facts editable. |
| 4 — Complete draft and import workflow | Separate working/published revision, recovery, selective import review | Saving a live package's draft does not change the published version; failed saves preserve work; import changes are reviewable. |
| 5 — Verify and release | Production measurements, regression checks, content review and deployment-ready change | Critical flows pass with recorded evidence; remaining business-data limitations are explicit. |

Acceptance checklist:

- Desktop 1440 px and short 1280×720 laptop, tablet around 900 px, mobile 360/390 px; no horizontal overflow or overlapping floating actions.
- Section navigation scrolls away with the document. No scroll-driven translation, auto-centering tabs or continuous section measurement.
- Practical details start closed; click, Enter/Space and direct section links work; focus remains visible.
- No automatic enquiry modal or profile gate blocks reading.
- Gallery works with one, several, portrait, landscape, slow and missing images; no unrelated destination fallback.
- Long titles, missing optional facts, zero reviews, hidden sections and empty custom content do not create broken layout or empty labels.
- Flexible-date quote, dated booking, weekday restrictions, overnight date labels, price extras, changed party size and login return all agree across page and checkout.
- Any displayed cancellation link reveals a real policy section.
- Comparison and download reflect the same current package facts.
- Difficulty, badges, all practical sections and price notes can be edited and verified in the real preview.
- Pasted/file content survives Save, navigation recovery and failed requests. Incomplete drafts save. Publishing validates and links to missing fields.
- Import supports selective changes, malformed files and partial upload failure without destroying existing photos or content.
- Existing published packages remain available during draft editing and after migration.
- Check keyboard navigation, screen reader labels, contrast, touch targets, reduced motion and image alt text.
- Run appropriate existing package/import/render tests plus focused integration checks for save and booking state. Measure a production build; do not infer production speed from the development issue overlay.

**9. Source pointers for implementation**

Paths are relative to the repository root; line numbers may move during implementation.

| Area | Files inspected |
| --- | --- |
| Main page, booking and navigation | `src/app/packages/[packageId]/PackageDetailClient.tsx`, `BookingCard.tsx`, `QuoteModal.tsx`, `page.tsx` |
| Public section/gallery design | `src/app/packages/_components/PackagePageSections.tsx`, `PackageGallery.tsx`, `PackageFactsBar.tsx`, `SimplePackagePage.module.css` |
| Public fetching and interruptions | `src/lib/usePublicContent.ts`, `src/app/api/content/route.ts`, `src/components/TripPlanPromptDialog.tsx`, `ProfileCompletionGate.tsx`, `SiteExperience.tsx`, `FloatingActions.tsx` |
| CRM form and saves | `src/app/admin/packages/AdminPackageBuilder.tsx`, `AdminPackagesManager.tsx`, `PackagePreviewSettings.tsx`, `catalogueEditorState.ts`, `packageFormModel.ts` |
| Text/import and shared data | `src/app/packages/_components/PackageSectionTextEditor.tsx`, `PackageInlineEditing.tsx`, `src/app/admin/packages/PackageAiImporter.tsx`, `src/lib/packageAiImport.ts`, `packageFacts.ts`, `packageData.ts`, `firebase/packages.ts` |

Research scope: all five supplied references opened in the browser and their desktop layouts/content were inspected; Escape2Explore's day disclosure was also exercised. The supplied Tripbae date-query URL loaded in the browser, although the text research tool needed its canonical URL. No competitor checkout, enquiry submission or CRM write was performed. CRM findings are based on source inspection, not an authenticated admin usability session. Production performance, current operator facts and full responsive behavior remain explicit implementation verification tasks.

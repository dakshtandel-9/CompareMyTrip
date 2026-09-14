# Non-payment fixes — 15 September 2026

These are local changes following **test report 2**. Payment integration remains deferred. The website and Firebase rules have not been deployed by this task. Existing package-editor and page-section changes were preserved.

## Implemented

- Maintenance retains the last verified setting during outages and closes a cold worker conservatively. Middleware supplies its decision to the coming-soon page, preventing a second lookup from turning a redirect into a 404. The setting is read through a same-origin server endpoint using Firebase Admin; only the public boolean is returned. Sign-in and administration remain reachable.
- Maintenance smoke checks now verify the preserved original path and query.
- Gallery and quote overlays use native modal dialogs, explicit keyboard wrapping, background inertness, scroll restoration and focus return. Every quote state has an accessible name.
- Mandatory fields in all five add-on forms have required semantics. Customized quotes accept only whole traveller counts from 1 through 20, with checks in the form, writer and candidate Firestore rules.
- Public package/blog browsing uses `/api/content`, which returns published content only. The CRM keeps its separate collection subscriptions. Legacy packages without a status remain supported; drafts, blank titles and email/link test titles are withheld from public discovery. CMS records were not deleted.
- Package, blog, destination-cover and homepage saves call an authenticated cache-refresh endpoint. Tagged catalogue data and page/sitemap caches expire immediately; already-open public tabs refresh within 30 seconds while visible. A failed refresh reports that the save succeeded and asks the editor to retry publishing.
- Production cannot silently replace a failed CMS read with seed packages/posts. `npm run check:content` also checks the CMS before either production build. Development fallback remains explicit.
- The canonical `/add-on` URL is included in the sitemap. Small destination badges use 12 px text.
- The synthetic viewing-now number is removed. Homepage traveller totals, manually entered reviews, accreditation badges and tourism-board logos require explicit verification in the CRM before display. Synced Google reviews can still appear independently.
- Packages without detailed content no longer invent schedules, inclusions, hotels, unrelated photos or free cancellation. Their download is labelled **Trip overview (PDF)**. The Tadiandamol fallback now fits on one page and states what is missing. Real operator itineraries are retained.

## Verification

- 234 automated tests passed, including 10 new regressions for maintenance outages/recovery, quote validation, public filtering, production fallback rejection, authenticated cache refresh and endpoint failure handling.
- ESLint passed. All 8 Google authentication configuration checks passed.
- Production asset and CMS-content checks passed. Production builds and HTTP smoke results are recorded in `tmp/todo-qa/`.
- Builds still emit Next.js middleware-deprecation and framework Edge-runtime warnings. The application keeps its existing middleware convention for adapter compatibility; a fresh Cloudflare deployment build was not validated here.
- The isolated production preview passed 37 public-route smoke checks and 24 browser samples across 12 routes at 1440 px and 390 px. No uncaught browser errors, horizontal overflow or broken completed images were found. Aborted requests during navigation were recorded separately.
- The normal maintenance build passed 42 smoke checks, including a query-bearing redirect. The final settings endpoint is also verified by regression tests.
- 18 focused Chromium fixture checks cover gallery/quote focus, all quote states, fractional rejection, successful mocked quote submission and required-field errors for all five add-ons. The actual package gallery was also checked in the production preview. Quote fixture authentication and submission were mocked; this does not establish a real account or database journey.
- The revised one-page Tadiandamol overview was extracted, rendered and visually inspected. It is an honest overview, not an approved trekking schedule.
- The standalone HTML checklist passed 14 browser checks, including default progress, filters, reload persistence, notes, export/import, printing and unavailable browser storage.

The public preview was a temporary source copy with only its maintenance decision disabled. It used the configured CMS for reads. It did not switch off maintenance on the live website or create customer records. Physical-device, screen-reader and controlled performance acceptance remain open.

## Remaining requirements

| Requirement | Current evidence / next step |
| --- | --- |
| Private quote storage | `CLOUDFLARE_R2_QUOTE_BUCKET_NAME` is missing. Current R2 credentials returned `AccessDenied` for bucket discovery. Supply a separate private bucket and appropriately scoped access, then test the real upload/download/cleanup lifecycle. |
| App Check | No Enterprise site key is configured locally or in the registered app's returned config. Firestore and authentication currently report `UNENFORCED`. The account cannot list reCAPTCHA keys. Configure the real key/domains, validate browser and server/admin flows, and review metrics before enforcement. |
| Google reviews | Both the Google Business integration document and synced review document are absent. Connect the intended business and authorize its review sync. Unverified sample reviews remain hidden. |
| Business policies | Supply the legal business name, address and support email, then approve the actual terms/privacy/refund copy. The approval flag remains false. |
| Trek content and claims | Supply the approved itinerary and verify remaining package/operator/contact claims. CRM verification controls do not themselves establish that a claim is true. |
| Rules deployment | The deployed Firestore rules matched the pre-fix repository. Candidate changes protect drafts/test titles and whole-number quote counts. The service account could read releases but the Rules test API returned 403; it cannot validate/deploy the candidate through that API. No Storage rules release was listed. |
| Account/CMS/submissions | Real email/Google sign-in, password-reset receipt, admin editing/publication and successful live form submissions still require controlled accounts and a test environment. |
| Broader acceptance | Safari/Firefox, real iOS/Android, screen readers and a controlled production performance benchmark still need verification. |

## Deployment order

1. Review and deploy the application with the published-content endpoint and updated CRM refresh calls. Keep maintenance enabled during acceptance.
2. Validate and deploy `firestore.rules` using an account with Rules permissions. The old browser application queried entire collections, so deploy the application first. Verify guest, customer and administrator boundaries, including direct draft reads and invalid quote headcounts.
3. Complete the cloud/business requirements above and the authenticated journeys. Do not enable App Check enforcement until legitimate client and server/admin access has been checked.
4. Run `npm test`, `npm run lint`, `npm run check:auth`, `npm run build`, and `npm run check:release`. Run public and maintenance smoke against matching controlled modes. Reopen the site only after the remaining acceptance work is complete.

Open `to-do list.html` for per-task outcomes and remaining work. Its progress describes local implementation and verification; it is not a live-deployment certificate.

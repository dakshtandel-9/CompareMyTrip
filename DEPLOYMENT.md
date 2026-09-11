# CompareMyTrip manual deployment

Target origin: **https://comparemytrip.in**. Nothing was deployed during this remediation.
PayU intentionally remains in **test** mode at the owner's request. Test checkout is labelled;
real payments remain guarded until policies and live settings are approved.

## Local checks

Use Node.js 22 and the committed package lock:

```sh
npm ci
npm test
npm run test:worker:firestore
npm run lint
npx tsc --noEmit
npm run check:release
npm run build:cloudflare
npx wrangler deploy --dry-run --outdir /tmp/comparemytrip-dry-run
```

With `npm run start -- --port 3100` running, run `npm run test:smoke` for read-only HTTP
checks. To test the actual Worker, prepare an ignored `.dev.vars` with the runtime settings,
run `npx wrangler dev --local --port 8787`, then run
`SMOKE_BASE_URL=http://localhost:8787 npm run test:smoke`. Stop servers before rebuilding.
Do not trigger the scheduled event in local testing against real credentials: it deletes
expired data. Local cache bindings are emulated; this is not a remote preview deployment.

`check:release` checks local configuration without printing secrets. It deliberately fails when
required settings are missing. It cannot prove remote secrets, App Check enforcement, bucket
existence, rules or payment behavior. The build runs static-asset limit checks before and after
OpenNext packaging; building and Wrangler `--dry-run` do not deploy anything.

### Validation and current limits

- 24 unit tests pass, including payment/coupon logic and Firestore serialization with
  request-time code generation disabled. Lint and the production TypeScript build pass.
- The isolated Worker transport test passes document reads, queries, simulated writes and
  error decoding using native response streams. It intercepts every RPC, has no Firebase
  credentials and changes no real records.
- The read-only page suite checks 24 routes on both Node and local workerd, including
  headers, prerendered catalogue content, auth forms, policy metadata and real 404s.
- **Firebase returned `429 RESOURCE_EXHAUSTED: Quota exceeded` during final validation.**
  Further real-database checks were stopped. Final builds/page checks use the app's seed
  fallback with Admin access disabled. Check Firebase usage and quota, then rebuild with
  the real environment after service recovers so the initial catalogue comes from the CRM.
  Run `SMOKE_DATABASE=1 npm run test:smoke` against a credentialed local server and inspect
  its logs for failed data reads. The isolated fixture does not prove live database access.
- `npm run check:release` currently reports two missing local settings:
  `CLOUDFLARE_R2_QUOTE_BUCKET_NAME` and `NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY`.
  Complete the account steps below before opening the site to traffic.

Next builds use Webpack: this adapter/Next combination failed at runtime with the
Turbopack route handler. The browser Firebase client uses its browser transport during SSR.
Server Firestore uses REST/native fetch in Workers, with protobuf schemas compiled during
startup by `src/instrumentation.ts`. The transport dependencies are pinned and externalized
so the startup preparation and request handlers share the same schema cache. Rerun the
isolated Worker test and actual Worker smoke checks after SDK/Next/adapter upgrades.

OpenNext 1.20.6 emits a non-fatal `Failed to copy ... data-uri-to-buffer` diagnostic when
processing that package's string-valued export. The build completes and runtime checks
pass; record this upstream adapter diagnostic separately from build/runtime failures.

## Required account configuration before opening the site to traffic

1. **Firebase rules:** review and manually deploy the repository's rules to the correct project:
   `firebase deploy --only firestore:rules,storage:rules --project YOUR_PROJECT_ID`.
   Storage writes now require an `admins/{uid}` document, matching Firestore. Allow the
   cross-service permissions requested by Firebase for the Storage-to-Firestore rule lookup.
   Recheck unauthenticated access to `siteContent/googleReviews`, and confirm an ordinary
   registered user cannot write homepage/package/blog images or access CRM records.
   The locally tested browser still reports permission denied on Google reviews with the
   currently deployed rules; this is unresolved until that manual rules release.
2. **Firebase App Check:** create/register a reCAPTCHA Enterprise website key for
   `comparemytrip.in` (and any preview hostname used for testing). Set
   `NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY` before the build. The client initializes
   App Check before Firebase services. In Firebase Console, inspect valid requests, then
   enable **Cloud Firestore enforcement**. Merely setting the key does not block direct
   REST abuse. Check contact, newsletter and trip-planning forms after enforcement.
   App Check is attestation, not a per-user rate limiter; monitor usage/billing and set alerts.
3. **Quote PDFs:** create a separate private R2 bucket, e.g. `comparemytrip-quotes-private`;
   keep its public r2.dev endpoint and custom domains disabled. Set
   `CLOUDFLARE_R2_QUOTE_BUCKET_NAME` to the actual bucket name and give the existing R2
   access credentials object read/write/delete access to it. Never use the public images
   bucket for quotes. Configure bucket CORS for `https://comparemytrip.in`, method `PUT`,
   allowed headers `Content-Type`, `Cache-Control`, `Content-Length`, and any checksum
   headers required by the signed request. Add localhost only to a testing configuration.
   Confirm an upload, expired-link refusal, and cleanup with a disposable test PDF.
4. **Cron secret:** a missing local `CRON_SECRET` was generated in ignored `.env.local`.
   Copy its value securely into the Worker's runtime secrets; never commit it. The Worker
   runs quote cleanup hourly. Check the scheduled invocation in Cloudflare logs after launch.
   PDFs expire after 72 hours; cleanup removes the data afterwards. Configure a Firestore
   TTL policy on `quoteUploadLimits.expiresAt` to remove expired rate-limit records.
5. **Domain and services:** configure the Cloudflare custom domain `comparemytrip.in`,
   HTTPS, the `comparemytrip-next-cache` R2 bucket, Images binding and the Durable Object
   migration in `wrangler.jsonc`. Add the domain to Firebase Authentication authorized
   domains and Google/reCAPTCHA configuration. Update the Google Business Profile OAuth
   redirect URI if that integration is enabled. Set Worker runtime values as well as the
   build environment; `.env.local` is not a Cloudflare secret store.
6. **Secrets:** provide Firebase Admin credentials, PayU test key/salt, `CRON_SECRET`,
   and the R2 settings listed in `.env.example` through Cloudflare's secret store. Keep
   `PAYU_MODE=test`. `NEXT_PUBLIC_*` values are embedded at build time: rebuild after
   changing them. Do not put secrets in `NEXT_PUBLIC_*` variables or `wrangler.jsonc`.

## Policies and eventual live payments

Review public CRM content before launch as well: local browser testing showed a destination
named `dsvf`. Remove or unpublish test entries through the CRM, and verify the displayed
accreditations, cancellation promises and support numbers against the actual business.

The three original policy drafts are in `src/lib/legalPolicies.ts`. They use the verified
brand and domain plus the direct-support number already present in `SupportPhones.tsx`.
The legal name, address and email remain blank because neither repository nor CRM provided
real values. A sample office entry is hidden from the public Contact page.

Before accepting real bookings:

- Supply the legal business name, registered address, support/grievance email and confirm
  the phone. Approve cancellation charges, refund handling deadlines and retention practices.
  The drafts defer package-specific terms to a written offer; they must reflect actual operations.
- Review the drafts with the business's legal adviser and replace review-only passages.
  Set `LEGAL_POLICIES_APPROVED = true`, set the three pages' metadata to indexable and
  add them back to the sitemap in the same change.
- Set `PAYU_MODE=live`, live key/salt and `PAYU_LIVE_PAYMENTS_ENABLED=true` in the intended
  runtime; keep `NEXT_PUBLIC_SITE_URL=https://comparemytrip.in`. No API URL edit is needed:
  `src/lib/payu.ts` selects PayU's live endpoint. Test mode is the current intentional setting.
- Run `npm run check:live`, rebuild, and manually exercise success, failure, callback replay,
  coupon use, account trip visibility, and a refund with the appropriate PayU environment.
  Review `trips` after sandbox testing so test records are not mistaken for real bookings.

Reference structure was researched from [MakeMyTrip's user agreement](https://www.makemytrip.com/legal/in/eng/user_agreement.html),
[Thomas Cook's booking terms](https://customize.thomascook.in/terms_conditions/) and
[Thomas Cook's privacy policy](https://www.thomascook.in/privacy-policy).
The drafts are original, tailored to this app, and are not a claim of legal approval.
App Check setup follows [Firebase's Enterprise provider guide](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider).

## Media and caching

Only the selected hero video (6.25 MiB), compressed train video (about 0.52 MiB) and their
posters ship. Unused originals and all candidate hero clips were preserved locally under
ignored `media-source/prelaunch/`; they are not deleted from the user's machine. `/home1`
through `/home4` have no source routes and return 404. Mobile, reduced-motion and data-saving
visitors use posters; desktop video downloads are about 6.8 MiB combined. Actual total page
transfer/LCP needs measurement on the real host; moving bytes to a CDN alone would not shrink them.

`NEXT_PUBLIC_VIDEO_CDN_URL` optionally serves `/videos/hero-scroll.mp4` and `/videos/train.mp4`
from an HTTPS CDN. Leave it blank to use the small bundled files; no media upload is needed
for that fallback. Upload the selected assets and verify URLs before setting the CDN value.

`/packages` and `/destinations` prerender their content with hourly ISR, then hydrate URL
filters. Catalogue, blog and destination-cover reads use the existing
OpenNext incremental data cache across requests, serializing dates explicitly. React `cache`
still deduplicates reads within a request. `unstable_cache` is used intentionally with this
project's ISR configuration: enabling Cache Components globally changes route caching and
404 behavior. Allow up to one hour for server-rendered catalogue changes to refresh.

Security headers are configured for application responses in Next and assets in `_headers`.
Framing, objects and base URI restrictions are enforced; the wider CSP remains Report-Only
for integration tuning. Monitor browser violations before tightening the policy.

## Report disposition

| Report item | Disposition |
| --- | --- |
| B1 | jose traced; Webpack handler, browser client transport and startup-prepared Firestore REST transport fix additional workerd failures. Build, dry run and isolated runtime checks pass; real Firebase quota remains a release check. |
| B2, H2 | Unused large media archived; train compressed; small bundle passes 25 MiB limit; mobile uses stills. |
| B3 | Test gateway intentionally retained; production origin corrected; explicit live-payment safeguards. |
| B4 | Local secret generated; hourly cron. Worker secret still needs manual setup. |
| B5 | Private R2 bucket and runtime bucket name still need manual provisioning. |
| B6 | Original drafts provided; actual business details and approval still required. |
| B7 | Repository rules ready; manual Firebase deployment and public-read verification still required. |
| H1 | Hero image uses Next 16 preload, not lazy loading. |
| H3 | Static catalogue routes plus cross-request catalogue cache; client filter navigation preserved. |
| H4 | Security headers added to app and static assets; broad CSP initially Report-Only. |
| H5 | App Check client integrated; site key and Firestore enforcement still required in Firebase. |
| H6 | Storage writes restricted to admins. |
| M1 | Root streaming loader removed; unknown package/destination/blog routes return actual HTTP 404. |
| M2 | Unapproved/noindex policy drafts removed from sitemap. |
| M3 | Preview routes absent and tested 404; candidate media archived. |
| M4 | Guest gate renders auth content during session initialization; login avoids a query-dependent SSR bailout. |
| L1 | Required field semantics added, including phone. |
| L2 | Small badges raised to 12px; catalogue checkbox labels have 44px minimum height. |
| L3 | Loader logo sizes fixed to 190px. |
| L4 | Added PayU hash, pricing, gateway/origin and coupon eligibility/resolution regression tests. |

## Manual release commands — not executed by the assistant

Once the account configuration above is complete, build again in the final environment and
run your own deployment with `npm run deploy:cloudflare`. Check response headers, mobile
layout and media transfer on the real domain. Verify cold-start performance, quote uploads,
App Check and authorized admin workflows there; local build/HTTP checks do not substitute
for those account-dependent end-to-end checks. Do not call the site live-payment-ready while
test mode, draft policies or the account configuration steps remain outstanding.

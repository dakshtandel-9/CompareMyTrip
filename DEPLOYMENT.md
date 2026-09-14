# CompareMyTrip deployment — 13 September 2026

Target origin: **https://comparemytrip.in**. The current deployment uses **Vercel**.
Local application changes have not been deployed. The Firebase Authentication domain
configuration was updated directly to fix the production Google-login configuration.
The existing CMS coming-soon switch remains enabled. PayU remains in test mode.

## Release status

Code validation and account provisioning are separate checks. See
[the performance audit](docs/performance-audit.md) for current test/build evidence.
`npm run check:release` intentionally fails while either of these required settings is absent:

- `CLOUDFLARE_R2_QUOTE_BUCKET_NAME`: no private quote bucket has been verified.
- `NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY`: App Check has no Enterprise provider key.

The existing R2 object credentials cannot list buckets (403). The Google service account
can read App Check configuration, which confirms no site key and Firestore enforcement
`UNENFORCED`; the reCAPTCHA Enterprise API reports `SERVICE_DISABLED`. These are account
setup tasks, not values that can safely be invented or bypassed to make a check green.

## Local verification

Use Node.js 22 and preserve the real environment in ignored `.env.local`:

```sh
npm ci
npm test
npm run lint
npm run check:assets
npm run check:auth
npm run check:release
npm run build
npm run start -- --port 3100
# From another terminal, when coming-soon is disabled:
npm run test:smoke
# Or, when coming-soon is enabled:
npm run test:smoke:maintenance
```

Build includes TypeScript checking and the asset budget check. `check:auth` reads Firebase
configuration and helper endpoints without signing anyone in or changing settings.
Smoke tests make read-only or deliberately unauthorized requests; they create no records,
bookings or payments. Stop the local server before rebuilding.

## Vercel release

1. Use the existing `comparemytrip` project linked to this repository. Keep the Next.js
   framework preset, Node 22, and `npm run build` (Webpack). Do not publish the Cloudflare
   `.open-next` output to Vercel.
2. Set all required values from `.env.example` in the intended Vercel environment.
   `.env.local` is not the deployment secret store. Firebase public values and the App Check
   key are embedded at build time; rebuild after changing them. Keep server credentials,
   PayU salt and R2 credentials server-only.
3. `vercel.json` schedules `/api/cron/quote-cleanup` daily at `0 0 * * *` and
   `/api/cron/pending-payments` daily at `15 0 * * *`, in UTC. Set runtime `CRON_SECRET`
   to the existing secret securely; Vercel supplies the bearer header automatically.
   Daily schedules work with Hobby limits. Timing can vary within the hour. Hourly
   operation requires an eligible plan or a separately configured authenticated scheduler;
   do not promise hourly cleanup with the committed daily schedules.
4. Quote access checks expiry independently of cron. Scheduled deletion removes expired
   data later; pending-payment cleanup likewise runs on the configured cadence. Inspect
   production cron logs after release; local tests do not run authenticated cleanup against
   real data. Monitor failures and backlog against each endpoint's batch/runtime limits.
5. Deploy the reviewed revision through the project's existing Git/Vercel workflow after
   required account setup. Include both new versioned MP4s and the new source/scripts in
   that revision; archived originals deliberately stay out of the deployment. Keep coming-soon enabled while verifying protected/admin flows.
   Turn it off through the CMS only when the launch checks below are complete.

References: [Vercel cron setup](https://vercel.com/docs/cron-jobs/quickstart),
[cron security](https://vercel.com/docs/cron-jobs/manage-cron-jobs),
[plan limits and timing](https://vercel.com/docs/cron-jobs/usage-and-pricing).

## Required service configuration

### Administrator access during coming-soon mode

Open `https://comparemytrip.in/admin` or use **Admin sign in** in the coming-soon
page header. Signed-out visitors are sent to the regular login form with the requested
admin destination preserved. Email/password and Google sign-in both work with an
existing administrator account. Password-reset navigation keeps that destination too.
Before this revision is deployed, use
`https://comparemytrip.in/login?next=%2Fadmin%2Fcontent` directly.

Admin and authentication routes do not require the customer phone/profile form.
The admin gate still verifies membership from the server before mounting the CRM;
network failures show retry, and non-admin accounts can sign out and choose another
account. Firestore rules and protected API checks remain the source of authorization.

An existing Firebase user is not automatically an administrator. The project owner
must provision `admins/{uid}` through the Firebase console or a trusted server, using
the account's exact Authentication UID; a boolean field such as `enabled: true` is
sufficient to create the document. The current authorization model uses document
existence, so remove the document to revoke access. Clients cannot grant themselves
membership. Do not create membership for an unverified account.

Once signed in, open **Website content → Coming-soon page**, turn the switch off and
publish when ready to launch. Verify this path with coming-soon mode still enabled
after deploying the updated application.

### Google login

`comparemytrip.in` and `www.comparemytrip.in` have been added to Firebase Authentication's
authorized domains, preserving localhost and both default Firebase domains. The Google
provider is enabled and its helper endpoints respond. Keep the existing working
`*.firebaseapp.com` auth domain for the popup flow; changing it to the custom site hostname
requires correctly hosting/proxying Firebase's `/__/auth/` helpers.

The application starts the Google popup directly from the click, preserves the validated
return page and Remember me preference, and separates authentication from profile saving.
The returning-user flow completed successfully in the local production build and preserved
the `/account` return address. On the deployed domain, verify Google sign-in, canceled popup,
returning user, new-user profile completion,
and a checkout return on the deployed domain. An automated configuration check does not
complete Google's account consent or prove physical Safari/Android behavior.

Reference: [Firebase Google sign-in](https://firebase.google.com/docs/auth/web/google-signin).

### App Check

Enable the reCAPTCHA Enterprise API and create a website key for the real site domains.
Register the web app's provider in Firebase App Check. Put the site key into
`NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY` in both the build environment and local testing
configuration. Inspect valid requests, then enable **Cloud Firestore enforcement** and
exercise contact, newsletter and trip-planning forms. Do not enforce before a valid client
configuration is deployed. Monitor usage and billing; App Check does not provide per-user
rate limiting. [Enterprise provider setup](https://firebase.google.com/docs/app-check/web/recaptcha-enterprise-provider).

### Private quote uploads

Create or identify a separate private R2 bucket. Keep its r2.dev endpoint and custom domains
disabled. Set its actual name as `CLOUDFLARE_R2_QUOTE_BUCKET_NAME`; it must differ from the
public images bucket. Give the server's existing R2 credentials object read/write/delete
access to that bucket. Configure CORS for `https://comparemytrip.in`, method `PUT`, headers
`Content-Type`, `Cache-Control`, `Content-Length` and any checksum headers required by the
signed request. Add localhost only to test CORS. Verify a disposable PDF upload, refusal
of an expired download, and cleanup. Do not publish private PDFs to the images bucket.

### Firebase data and rules

Review and deploy the repository's Firestore/Storage rules to the correct Firebase project:

```sh
firebase deploy --only firestore:rules,storage:rules --project compare-my-trip-8e035
```

Storage admin checks use Firestore `admins/{uid}`; grant the cross-service permission
Firebase requests for that lookup. Verify ordinary users cannot change package/homepage
images or access CRM records. Current public probes return homepage 200 and Google reviews
404 NOT_FOUND (the review document is absent), not the earlier permission-denied error.
The earlier audit's Firebase quota failure is historical; final launch still needs live
usage/quota review and end-to-end form checks. Configure TTL for `quoteUploadLimits.expiresAt`.

Review CRM content before publishing: remove test entries and verify published contact
numbers, package data, accreditations, review authenticity and traveller-count claims.

## Payments and policies

Real payments remain guarded. `npm run check:live` additionally fails on disabled live PayU,
unapproved policies, and missing legal business name, address and support email. Supply real
business details in `src/lib/legalPolicies.ts`, approve cancellation/refund/retention terms,
and have the business review them. Do not set approval flags just to pass checks.

After approval, update the policy pages from noindex drafts and add them to the sitemap.
Set `PAYU_MODE=live`, actual live key/salt and `PAYU_LIVE_PAYMENTS_ENABLED=true`, retaining
`NEXT_PUBLIC_SITE_URL=https://comparemytrip.in`. Test success, failure, callback replay,
coupons, account trip visibility and refunds in the appropriate environment. Review test
records so they cannot be mistaken for real bookings.

## Cloudflare alternative

The repository retains the Workers/OpenNext option; this is not the currently observed host:

```sh
npm run test:worker:firestore
npm run build:cloudflare
npx wrangler deploy --dry-run --outdir tmp/worker-dry-run
```

For a deliberate migration, provision the R2 incremental-cache bucket, Images binding,
Durable Object migration, custom domain and Worker secrets from `wrangler.jsonc`. The
existing Worker scheduled handler runs both cleanup jobs hourly. Do not run both hosting
schedulers against one project unintentionally. Use `npm run deploy:cloudflare` only for
that chosen migration, not to update the existing Vercel deployment.

The browser Firebase transport is selected during SSR. Server Firestore uses native REST
in Workers with startup-prepared protobuf schemas. Keep its pinned transport dependencies
until the isolated Worker test and actual Worker page checks pass after any upgrade.
Next's middleware deprecation notice is expected: this adapter still uses the Edge
middleware convention. OpenNext's existing `data-uri-to-buffer` copy diagnostic and
third-party bundling warnings must be distinguished from a failed build or runtime test.

## Media and launch verification

The versioned hero renditions ship with the project; see
[hero-scroll-performance.md](docs/hero-scroll-performance.md). They are same-origin.
`NEXT_PUBLIC_VIDEO_CDN_URL` applies to the train video only; upload `/videos/train.mp4`
before enabling it. Archived originals are local-only under ignored `media-source/`.

After deploying, verify both new media URLs with GET 200, range GET 206, MP4 content type,
and `Cache-Control: public, max-age=31536000, immutable`. Use the smoke command against the
deployed origin in the appropriate maintenance mode. Inspect server-rendered public pages,
expected 404s, browser errors, Google login, private uploads, forms and scheduled jobs.
Recheck cold-load performance and fast forward/reverse touch scrolling on physical iOS and
Android phones. Local phone-width Chrome checks do not certify those devices or establish
production Core Web Vitals. Do not call the site fully launch-ready while account setup,
policy approval or these end-to-end checks are outstanding.

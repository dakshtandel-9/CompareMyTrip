# Performance follow-up — 25 September 2026

Implemented locally; not deployed. The design, content, Featured shuffle, forms,
admin access and hero playback remain in place.

## Report checklist

| Item | Result |
| --- | --- |
| 1. Public polling | Removed the 30-second timer. One shared fetch on entry, with a five-minute freshness window and refresh on stale tab activation. Server-seeded homepage content also seeds layout consumers after hydration. `/api/content` permits five-minute shared caching; failures remain uncached. |
| 2. Coming-soon middleware | Successful decisions are cached per project/origin for 60 seconds in each worker. Concurrent reads share a promise. Failed reads retain the last decision and retry; a cold configured worker fails closed. Admin membership verification remains uncached. |
| 3. Homepage | Packages, posts and CMS settings are supplied by the server. The page revalidates every five minutes and on admin publication. Featured package shuffling is unchanged. The produced HTML includes 42 package links. |
| 4. Hero videos | Already optimized into versioned desktop/mobile H.264 files. A further desktop trial saved only about 3% and doubled the keyframe gap. Rejected that tradeoff; retained existing files, immediate loading and scroll behavior. No poster delay was introduced. |
| 5–7. Images | Eight large PNG photos converted to lossless WebP at the same dimensions, verified pixel-for-pixel. BrandLogo uses a lossless WebP copy; alpha and all visible pixels are identical. The PNG remains for PDF/manifest users. Eight compatibility rewrites preserve saved CMS URLs. Corrected card `sizes` for real columns and the 1440px cap; reduced allowed image widths from 15 to 11 and explicitly allow quality 75. |
| 8. Unused images | Authenticated scan read 115 Firestore documents, including nested collections, and checked source references. Twenty hotel/visa PNGs had no references: 22,967,739 bytes removed from public assets. Originals archived locally under ignored `media-source/performance-2026-09-25/`. See the adjacent JSON audit. |
| 9. Old deployments | The stale local Vercel association returned 403. Inspected the signed-in dashboard for `comparemytrip/compare-my-trip`, cleared filters and found one active Ready production deployment, with retention enabled. No older active deployments were listed to delete. No remote changes made. |
| 10. Deployment exclusions | Added `.vercelignore` for local secrets, archives, generated outputs, tests and review materials. Required source, content and prebuild scripts remain included. |
| 11. Conditional JavaScript | Profile completion dynamically loads only for signed-in customers. Preview token subscription loads asynchronously for signed-in users, while anonymous cookie cleanup needs no preview SDK and runs once per tab. Header sign-out code is imported on click. Existing login/signup pages keep their route-specific authentication code and popup timing. |
| 12. Admin sample catalogue | Split public and admin package/blog hooks. Moved the sample catalogue into `packageSeed.ts`; it remains available to admin setup, development/server fallback and the legacy Kerala sample route. Verified that the homepage startup chunks no longer contain the sample catalogue. |

## Measured assets

Tracked public files before: **76,164,526 bytes**. Public files after:
**47,697,070 bytes**. Reduction: **28,467,456 bytes (37.4%)**.
This measures deployment assets, not a visitor's download or a Core Web Vitals score.

Image conversion savings total 5,755,243 bytes before retaining the PNG logo for
existing consumers. Originals can regenerate photo replacements with
`node scripts/optimize-static-images.mjs`. The read-only unused-image audit script
fails closed if any database read fails and never deletes files itself.

## Validation

- Production Next.js build and TypeScript pass; 172 pages generated.
- Whole-repository ESLint passes; diff whitespace check passes.
- 118 focused tests pass, including cache expiry, request sharing, no idle polling,
  hydration seeding, admin sign-out races, publication rules, packages and payments.
- Full suite: **401 pass, 5 fail** (406 total). All five failures reproduced on an
  isolated original HEAD checkout: three AI import/example fixture failures, one
  old booking-note assertion, and a missing StayPhotoField test mock. They were
  not introduced or suppressed by this work.
- **38 full-site HTTP smoke checks pass** against the local production server.
  Replaced the smoke script's retired hardcoded package slug with an actual
  published CMS package. No records or payments created.
- All eight legacy PNG URLs return HTTP 200 and exactly match their WebP replacement
  bytes. Representative legacy URLs also return 200 through `/_next/image`.
- Desktop browser review: homepage content, hero, navigation and trip-planning
  dialog render; no warning/error console entries observed.
- At 390px, the existing mobile hero rendition is selected. A 429px document
  scroll width also occurs on the isolated original checkout at the same 390px
  viewport, so this existing overflow is not a regression from this change.
- Existing middleware deprecation notice remains because the Cloudflare adapter
  still uses Edge middleware. No framework or hosting migration attempted.

## Behavior and deployment

An already open page no longer polls for publications. Reload to pick up new
content; unseeded views refresh their shared data on stale tab activation. A warm
middleware instance can take up to 60 seconds to pick up a coming-soon toggle.
Each cold worker still performs its first status read. Failed status reads do not
extend the cache. Publication still invalidates tagged server data immediately;
the public API's shared cache can retain content for five minutes plus its
60-second stale-while-revalidate window.

The active dashboard project is `compare-my-trip` under `comparemytrip`; the ignored
local `.vercel/repo.json` points at a different project/team. Verify the deployment
target before publishing. No commit, push, deployment, database mutation or Vercel
configuration mutation was performed.

Vercel references: [deployment management](https://vercel.com/docs/deployments/managing-deployments),
[deployment exclusions](https://vercel.com/docs/deployments/vercel-ignore).

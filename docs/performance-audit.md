# Performance and launch audit — 13 September 2026

The application fixes are local and have **not been deployed** to comparemytrip.in.
The live domain uses Vercel and its CMS coming-soon switch is currently enabled.
One remote fix was applied: Firebase Authentication now authorizes `comparemytrip.in`
and `www.comparemytrip.in` for Google sign-in, preserving all existing domains.

## Findings and implemented fixes

| Area | Finding | Result |
| --- | --- | --- |
| Hero download | The old deployment served the same 12,723,524-byte 1920 × 1080 video to desktop and phones. | Versioned 720p desktop and 432p phone renditions; 57.6% and 80.8% fewer bytes. |
| Hero scrolling | GSAP catch-up, frequent decoding and repeated video backdrop blurs added work. | Native passive scrolling, one scheduled update, frame-aligned seeks, one seek in flight, translucent cards without live video blur. |
| Stalled/phone media | Loading, decoding or a seek could leave a sticky hero stuck. | Metadata/canplay/seeked recovery, phone touchend/click priming, bounded stalled-request fallback, request cancellation and sticky-distance release. |
| Idle/background work | Decorative rails ran while offscreen; background tabs kept work pending. | Visibility, tab state, motion and pointer preferences govern animation; manual controls remain usable. |
| Carousel controls | Reviews measured a zero-width wrapper and inaccurate loop boundaries; two-item arrows could move a full period and land at the same position. | Actual card/duplicate geometry, corrected steps and seams, short-list handling, resize remeasurement and keyboard/hover holds. |
| Initial visibility | A timed loading cover and anonymous profile-check overlay covered public content. | Both removed from anonymous public loading; signed-in profile completion remains enforced. |
| Google configuration | Production domains were absent from Firebase's authorized list. | Both domains added remotely; provider enabled and helper endpoints verified. |
| Authentication flow | Async storage delayed popup creation; profile writes masqueraded as login failure; redirects lost checkout return URLs. | Direct popup initiation, Remember me support, separate profile completion, captured and validated return addresses, actionable errors. |
| Profile recovery | Offline reads/writes could trap signed-in users; stale reads or another account's pending save could affect the form. | 10-second read/save deadlines, retry/sign-out recovery, one pending save, stale-result protection and save state scoped to its account. |
| Admin access during coming-soon | Signed-out admin bookmarks went to 404; customer onboarding could block admins; reset navigation lost the admin destination. | Visible header sign-in, login return to the requested admin page, no customer onboarding on admin/auth routes, server-confirmed membership with timeout/retry/account switching, preserved reset return address. |
| Runtime recovery | Unexpected rendering errors had no application recovery screen. | Page and root error boundaries with retry and homepage navigation. |
| Dependencies/lint | UUID and js-yaml advisories; ignored scratch files caused repository lint failure. | Patched UUID override and js-yaml lockfile; scratch ignore aligned with Git; whole-repository lint passes. |
| Hosting jobs | Cleanup was wired only to Cloudflare although the site runs on Vercel. | Vercel daily authenticated cleanup/reconciliation schedules added; Cloudflare hourly jobs retained for that alternative host. |
| Release checks | Local configuration checks accepted malformed credentials/URLs and missed media behavior. | Stronger credential/project/config checks, read-only Google configuration check, video budgets/200/206/cache smoke checks and maintenance mode coverage. |

## Hero assets

| Rendition | Size | Dimensions | Reduction from old live file |
| --- | ---: | --- | ---: |
| Desktop | 5,392,265 bytes | 1280 × 720 | 57.6% |
| Phone | 2,443,288 bytes | 768 × 432 | 80.8% |

Both preserve all 372 frames and the full 15.5-second sequence at 24fps. FFprobe confirms
H.264, two-frame keyframe intervals (186 keyframes), no B-frames and no audio. MP4 inspection
confirms `moov` precedes `mdat`. Both new URLs use one-year immutable caching in Next and
Cloudflare headers. Change filenames before shipping a different encode.

The controller does no continuous idle animation and pauses in hidden tabs. Reduced-motion,
data-saving and slow-connection preferences retain the still hero. A stalled load or seek
gets a 12-second foreground recovery window; returning from a hidden tab restarts it.
Video failure cancels its source and restores ordinary page flow.

Three unused videos totaling 35.3 MB were moved to ignored
`media-source/prelaunch/2026-09-13/`, preserving the originals locally. Public assets now
contain 129 files totaling 68.51 MiB; this is deployment storage, not page-load transfer.
`node scripts/optimize-hero-video.mjs` reproduces the renditions with FFmpeg and the archived
master. On a fresh checkout, pass the master file explicitly. See
[hero details](hero-scroll-performance.md).

## Validation

- **131 automated tests pass**, including media scheduling, carousel movement, auth return
  races, offline profile saves, admin access/recovery, account-state isolation, payments
  and release configuration.
- **Whole-repository ESLint passes**; production TypeScript/build validation passes.
- **npm audit reports zero known vulnerabilities** in the final installed dependency tree.
  UUID 11.1.1 preserves CommonJS compatibility without upgrading the pinned Worker
  Firestore transport. js-yaml is patched to 4.3.2.
- **Production Next and Cloudflare/OpenNext builds pass**, with asset checks on public files
  and generated Worker assets. The isolated Worker Firestore transport test passes without
  Firebase requests or real writes. Wrangler packaging dry-run passes without deployment.
- **33 full-site HTTP smoke checks passed** on an isolated local production fixture in
  the initial launch audit. After the admin-access fix, **41 maintenance-mode checks pass**
  on the actual local production configuration, including admin and reset entry routes.
  Both media URLs return 200 and 206, MP4 signatures, correct sizes and immutable caching.
- **84/84 public routes return HTTP 200 with a server-rendered heading** in the production
  fixture. See [current route results](launch-route-audit.json). The fixture mocks only the
  CMS coming-soon switch off locally; it does not change the live setting. The
  [earlier live route audit](performance-route-audit.json) is preserved as historical evidence.
- **Eight read-only Google configuration checks pass**: authorized domains, matching project
  configuration, enabled Google provider and working Firebase handler/iframe endpoints.
- **Google sign-in completed successfully in the local production build** and returned to
  the requested `/account` page for an existing account. The deployed-domain and new-user
  physical-device checks remain separate launch requirements.
- Browser checks verify the desktop and 390px phone renditions, readiness, forward/reverse
  seeking, final-frame hold, exit into the next section and no horizontal document overflow.
  Offscreen reviews remain stationary; desktop review arrows and manual horizontal
  scrolling at phone width work. Responsive testing uses Chrome viewport emulation;
  it does not emulate all touch hardware or replace physical iOS/Android testing.
- After the admin-access fix, the production Next build and whole-repository lint were
  rerun successfully. Browser checks confirm coming-soon → admin → login and reset/back
  navigation preserve `/admin/content`. At 390px width, the header sign-in button is
  visible without scrolling, and coming-soon/login have no horizontal overflow. Admin
  membership, denied accounts, offline recovery and fresh-session checks are covered by
  isolated automated tests; a real administrator login still needs deployed verification.

Next emits the known middleware deprecation notice while retaining the Edge middleware
needed by the Cloudflare adapter. OpenNext also emits its existing `data-uri-to-buffer`
copy diagnostic and third-party bundling warnings; build/packaging/transport results above
are recorded separately. These are not silently presented as warning-free builds.

## Remaining launch requirements

The release check intentionally remains red for these missing account settings:

1. **Private quote bucket:** set a verified `CLOUDFLARE_R2_QUOTE_BUCKET_NAME`, bucket CORS,
   private access and object permissions. Current credentials cannot list buckets (403),
   so an existing private bucket has not been established or verified.
2. **App Check:** reCAPTCHA Enterprise API is disabled; the App Check provider has no site
   key, and Firestore enforcement is off. Complete provider setup, deploy the public key,
   observe valid requests, then enable enforcement and test forms.
3. **Live payments:** PayU is still in test mode. Business legal name, address and support
   email are absent, and the policies remain unapproved drafts. Real payment enablement
   requires those business decisions and end-to-end merchant testing.
4. **Deployment and final account/device testing:** configure production runtime secrets,
   deploy the reviewed application changes, verify jobs/media headers, complete a real
   Google account sign-in and profile save, test uploads/forms, and test touch scrolling on
   physical phones. Only then disable coming-soon in the CMS for launch.

See [DEPLOYMENT.md](../DEPLOYMENT.md) for concrete Vercel instructions and the Cloudflare
alternative. No bookings, emails, quote submissions, authenticated cleanup jobs or real
payments were created during these checks. Google domain authorization is the only remote
configuration change made in this remediation.

## Measurement limits and references

The earlier live observation measured one full old-video download at 19.41 seconds and one
compressed homepage response at 66,498 bytes in 0.51 seconds. Range requests already worked
and the old MP4 already used fast-start metadata; size and rendering work were the issues.
Those observations are historical individual requests, not production speed guarantees.
One smoke attempt timed out around the interrupted session; its complete rerun passed all
33 checks without a code change, and catalogue requests returned promptly on recheck. No Lighthouse score, field
Core Web Vitals improvement or physical-device result is claimed.

Research used [web.dev video performance](https://web.dev/learn/performance/video-performance),
[WebKit iOS playback policies](https://webkit.org/blog/6784/new-video-policies-for-ios/),
[Firebase Google sign-in](https://firebase.google.com/docs/auth/web/google-signin),
[Firebase browser storage guidance](https://firebase.google.com/docs/auth/web/redirect-best-practices),
[Google's narrowly scoped configuration update API](https://docs.cloud.google.com/identity-platform/docs/reference/rest/v2/projects/updateConfig),
and [Vercel cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing).

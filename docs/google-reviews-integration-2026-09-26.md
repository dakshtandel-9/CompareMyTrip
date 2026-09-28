# Google reviews integration — 26 September 2026

Local changes only; no credentials, Google profile data or production content were changed remotely.

## Findings

- Business Profile manager access verified in the signed-in browser; Google displayed 4.9 stars and 52 ratings/reviews.
- Existing Cloud project: compare-my-trip-8e035, project number 184152450420.
- None of the three required Business Profile APIs appears among the 41 enabled APIs.
- Google My Business API does not appear in the project library search. This suggests Basic API Access approval is needed; quota approval was not independently confirmed.
- Firestore integration has no OAuth credentials or refresh token; public Google review count is zero.

## Changes

- Discover accounts and locations with pagination; select the intended business before importing.
- Import only the selected location, follow review pages with updateTime desc, deduplicate and cap display cache at 100 written reviews.
- Preserve comment text and anonymous reviewers; identify Google as the source within existing card details.
- Fix OAuth return link to use section=reviews; allow a server-only redirect URI override for local testing.
- Distinguish zero quota from permission errors and temporary rate limits.
- Clear imported reviews on disconnect; hide stale imports at expiry and remove expired records before scheduled refresh.
- Register the protected daily refresh route for Vercel and the existing Cloudflare scheduler. CRON_SECRET is configured locally; deployed configuration must be checked at release.
- Provide setup instructions in google-reviews-setup.html and the Downloads copy.

## Validation

20 tests passed across google-business.test.mjs, review-rail.test.mjs and content-seo.test.mjs. These mock Google responses; no live API import has occurred. ESLint passed for edited code; git diff --check passed. The local admin panel loads with the production callback URI. Full typecheck reports only the existing missing departureCity in src/lib/packageAiPrompt.ts. No production deployment performed.

## Next step

Request/confirm Basic API Access for project number 184152450420, enable the three APIs after approval, configure the OAuth web client and consent, then connect from Admin → Pages & content → Reviews → Google Business Profile. Select CompareMyTrip and Sync now. See the HTML guide for exact callback and local testing instructions.

## Follow-up setup completed

At the user’s explicit request to perform setup:

- Created the dedicated **CompareMyTrip Google Reviews** OAuth web client in project 184152450420, preserving the existing Firebase Google sign-in client.
- Registered https://comparemytrip.in/api/integrations/google-business/callback and http://localhost:3000/api/integrations/google-business/callback.
- Saved the client ID and secret through the authenticated website admin panel. Secret values are not included in this document or logs.
- Set the local-only GOOGLE_BUSINESS_REDIRECT_URI override in the ignored .env.local file.
- Completed owner/manager OAuth consent. The admin panel now reports Connected.
- Enabled My Business Account Management API and My Business Business Information API.
- Live account discovery returns HTTP 429 with structured quota_limit_value=0; Cloud Console confirms 0 requests/minute. No review import is possible until Google grants Basic API Access.
- Fixed the error handler to recognize explicit zero quota in Google ErrorInfo metadata; 17 integration/carousel tests and targeted ESLint passed.
- Opened the official API access workflow, selected the verified CompareMyTrip listing, entered project/company details, and answered the 60-day verified-profile question based on the user’s confirmation.
- Application is **not submitted**: awaiting the user’s answer to whether the organisation already has another allowlisted project. Do not guess this answer.

Earlier “no credentials” and “APIs disabled” findings above describe the state before this follow-up. No public reviews or production application deployment were performed.


## Manual reviews selected by the owner

The owner cancelled Google review imports and chose manual uploads. The saved website Google reviews integration was disconnected through the admin panel, clearing its saved credentials and imported-review document. No Google Cloud project or general Google sign-in configuration was changed. The unfinished API application was not submitted.

The homepage now reads only manually approved reviews from website content. Google links, the Google setup panel and scheduled review-sync entries were removed. Existing review card design and carousel controls remain. Default sample reviews were removed; previously stored entries are preserved and remain hidden until explicitly enabled.

To add a review: open `/admin/content?section=reviews`, select **Add review**, enter the quote, name, rating and optional photo/trip/date, enable **Show this review**, then **Publish changes**. Name initials are generated when editing the name. Blank reviews stay off the homepage.

Validation: lint passed for the three changed source files; seven content and carousel checks passed. Browser verification covered the manual entry form, visibility toggle, draft discard and homepage text. No test review was published. Type-checking still reports the pre-existing missing `departureCity` in `src/lib/packageAiPrompt.ts:25`. Code changes are local and have not been deployed.

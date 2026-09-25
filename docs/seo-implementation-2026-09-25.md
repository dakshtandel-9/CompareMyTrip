# SEO implementation — 25 September 2026

Implemented the SEO-only scope from the revised report. This work is local;
it has not been deployed or submitted to Search Console.

## Changes

- Homepage: replace the operator-based search description with the approved
  description of CompareMyTrip travel plans and direct enquiries. The existing
  metadata helper applies the same description to Open Graph and Twitter.
- Add-on page: shorten the search title to
  `Flights, Hotels, Visa & Transport | CompareMyTrip`. Keep its description,
  service tabs, forms, canonical and index controls.
- Article JSON-LD: identify CompareMyTrip bylines as the existing Organization
  entity. Preserve Person for named authors; omit an empty author. Visible
  bylines, published SEO overrides and article text are unchanged.

Only these application files changed during this task:

- `src/app/page.tsx` — metadata description only.
- `src/app/add-on/page.tsx` — metadata title only.
- `src/app/blog/[slug]/page.tsx` — schema author and the required constant import.

The homepage file already contained earlier uncommitted performance work.
That work and all other pre-existing modifications were preserved.

## Verified and retained

Existing unique page metadata, production canonicals, filter consolidation,
robots rules, public sitemap, destination structured data, social images and
private/draft indexing controls were retained. No new landing pages, FAQ
schema, ratings, guarantees or business-model claims were added to JSON-LD.

No page text, FAQ answer, package record, package detail template, UI component,
media asset, interaction, form, payment flow or CMS data was changed.

## Validation

- Production build passed, including asset checks, CMS content checks and
  TypeScript validation. CMS checks reported 60 published packages and 10 posts.
- ESLint passed for the three changed application files.
- Local production HTTP verification passed for 81 URLs: 61 in-scope sitemap
  pages, nine catalogue query variants, seven restricted/draft/demo routes and
  four add-on tab URLs. The disabled demo correctly returned 404 with noindex.
- Verified single titles/descriptions, canonical origins, matching social
  descriptions, absolute social image URLs, JSON-LD parsing and index controls.
- Sitemap contained 121 unique clean production URLs. The 60 package detail
  URLs were excluded from the page crawl; their eligibility rules were retained.
- Confirmed all ten rendered article schemas reference the Organization for
  brand authors. Additional fixture checks covered personal and blank authors,
  unchanged visible article rendering and preserved metadata overrides.
- File hashes confirm all other source files, public assets and application
  configuration match the pre-edit baseline. AST comparisons confirm the three
  edited files retain their visible rendering and page logic outside SEO fields.

## Google snippet follow-up

At the user's request after reviewing the Google search screenshot, added
`data-nosnippet=""` to the existing answer wrapper in
`src/app/home/_sections/Faq.tsx`. The shared component applies this to FAQ
answers on both the homepage and contact page, in the initial HTML and React
rendering. Questions, answers, styling, links and disclosure behavior are
unchanged. This is one additional application file beyond the original three.

The attribute excludes FAQ answer text from Google snippets; it does not
remove the FAQ from the website or force Google to use the meta description.
The user will deploy manually. After deployment, request indexing for the
homepage and contact page in Search Console and allow Google to recrawl.
Other page text remains eligible for snippets, including any other existing
operator-based wording. No immediate search-result update is promised.

Reference: https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag#data-nosnippet-attr

## Remaining external and content limits

- The visible operator-based FAQ remains unchanged at the user's request.
  The new exclusion controls Google snippets after reprocessing; it does not
  resolve the underlying content conflict or control every answer engine.
- A fresh HTTPS request to `www.comparemytrip.in` still failed certificate
  validation. This needs a hosting/domain certificate correction, not a page edit.
- The public Vercel alias still returned 200 without a redirect. Hosting-level
  alias/preview indexing policy remains unchanged.
- No deployment, DNS change, Search Console action or analytics change was made.
  Search ranking, indexing speed and AI citations have not been measured.

Temporary validation scripts and results are in `tmp/seo-implementation/`.

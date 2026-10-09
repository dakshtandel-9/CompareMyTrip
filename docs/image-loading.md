# Image loading — 9 October 2026

Images were painting in one by one: every `next/image` is served as-is since
`images.unoptimized` was turned on (the hosting plan's transformation quota ran out), so
phones downloaded full-size originals, and the photos inside below-the-fold homepage bands
only started downloading once `content-visibility` let the band render.

## What changed

**Lighter originals.** `node scripts/optimize-static-images.mjs` re-encodes the site's own
photos at their existing dimensions: JPEG with mozjpeg at quality 82, WebP at 82, keeping a
file only when it comes out at least 10% smaller. 49 files went from 33.8 MB to 10.4 MB.
The 25 September lossless WebPs (`popular-destinations/`, `auth/`) are now lossy: 100%
crops at quality 82 were indistinguishable from the originals. The airline tails moved from
PNG to WebP (about 650 KB to 25 KB each); `legacyImagePaths.json` keeps the old `.png` URLs
working. The header/footer logo is resized to 1086px wide, still lossless.

Originals are archived once under `media-source/static-image-originals/` (ignored by Git)
and every run encodes from there, so re-running never compresses twice. Transparent
artwork, files loose in `public/` and anything under 100 KB are left alone. CMS uploads
on R2 were already WebP at about 110 KB each, so they are not part of this.

**Fade in when complete.** Public pages use `SiteImage` (`src/components/SiteImage.tsx`)
instead of `next/image`. A lazy image stays transparent over its card's background until it
has fully arrived, then fades in over 250ms. Preloaded, eager and `fetchPriority="high"`
images are excluded, so the first screen and the LCP image paint as before. An inline
script, first in `<body>`, marks images as they load or fail; the CSS only hides images
once that script has flagged `<html>`, so without it images paint as they arrive.
Reduced motion skips the fade.

**Look-ahead.** `ImageLookahead` waits for the page's `load` event, then switches the lazy
images in each homepage band, the footer and each listing card to eager about a screen and
a half before they scroll into view. Catalogue cards are watched individually, so a long
listing is never fetched at once. Save-Data and `prefers-reduced-data` keep plain lazy
loading.

Admin pages, `BrandLogo` and the package demo routes still use `next/image` directly.

## Not addressed

- Phones still download the same file as desktops: without the optimiser there are no
  responsive sizes. Pre-generated widths with a custom `loader` would fix that.
- The homepage HTML is about 1.1 MB before any image.

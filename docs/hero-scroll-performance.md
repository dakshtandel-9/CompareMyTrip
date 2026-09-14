# Homepage scroll video

The hero uses a paused H.264 video whose frame follows native page scrolling. Desktop loads
`/videos/hero-scroll-desktop-v2.mp4` (5,392,265 bytes, 1280 × 720); below 768px it selects
`/videos/hero-scroll-mobile-v2.mp4` (2,443,288 bytes, 768 × 432). Both preserve all 372 frames
of the 15.5-second scene at 24fps, with a keyframe every two frames, no B-frames or audio,
and fast-start metadata. These assets are served from the site itself, with one-year
immutable caching in Next and Cloudflare headers.

`startScrollVideo` coalesces passive scroll events into one animation-frame update. It
measures layout on resize, seeks to frame boundaries and keeps only one seek in flight.
Changing direction replaces the requested target. The final 13% of scroll holds the last
frame. It does not run an animation loop while idle, and suspends updates in hidden tabs.

The playhead eases toward scroll progress with a 100ms time constant on desktop and 180ms
on phones, so wheel bursts do
not immediately jump across scenes. Restored scroll positions initialize directly at the
correct frame. Where supported, the controller waits for `requestVideoFrameCallback`
before issuing another seek, allowing the decoded frame to reach the compositor. A 100ms
fallback after seek completion handles omitted callbacks on paused/offscreen video.
Desktop headlines follow completed frames rather than running ahead of the video while it decodes.
Frame callbacks and both timeouts are cancelled on teardown, failure, or tab suspension.

Metadata, loaded-frame, can-play and seek-completion events all retry synchronization.
Touch devices attempt a muted play/pause to prime decoding; a real touchend/click can retry
if browser autoplay policy refused that attempt. A stalled load or seek times out after
12 foreground seconds, removes the video source, reveals the poster and releases the
sticky scroll distance. The timeout restarts when returning from a hidden tab. Reduced
motion, reduced data, Save-Data and slow connections use the still hero and normal flow.
Content changes and connection-preference changes are handled without per-scroll React renders.

On phones, the video occupies its own unobstructed 320–390px panel. The first headline,
supporting copy and trust row appear below it on a light background, followed by the
two-column search and the same admin-configured Top Picks shelf used on desktop.
The phone panel stays pinned at the top for one small viewport height (`100svh`) of scroll,
giving the full clip roughly twice the scroll distance it had when mapped to the video
height alone. The final 13% holds the last frame before the whole panel releases, so the
search and Top Picks remain reachable. The stage's measured content height keeps the
release point correct when its package shelf or copy changes. Static/reduced-motion
heroes stay in normal flow.
Picks swipe horizontally, and date, traveller and budget panels open above the bottom
navigation. These layout and copy changes apply only below 768px; desktop keeps its
full-screen sticky video, overlaid copy and synchronized headline transitions.

The original source and unused legacy exports are preserved locally under
`media-source/prelaunch/2026-09-13/`, which is ignored by Git. They are not deployed.
Generate replacement renditions with FFmpeg installed:

```sh
node scripts/optimize-hero-video.mjs
# On a fresh checkout, supply the original 15.5-second master:
node scripts/optimize-hero-video.mjs /absolute/path/to/hero-combined-scroll.mp4
```

Change the versioned output filenames, source references and cache-header matchers before
shipping a different encode; never replace bytes under an immutable public URL.

Regression coverage is in `tests/scroll-video.test.mjs`, `tests/video-source.test.mjs` and
`tests/visible-animation.test.mjs`. `npm run test:smoke` checks media budgets, 200/206,
MP4 signatures and immutable headers. See [the current audit](performance-audit.md) for
browser validation and outstanding physical-device/production checks.

References: [WebKit’s iOS video policies](https://webkit.org/blog/6784/new-video-policies-for-ios/),
[web.dev video performance](https://web.dev/learn/performance/video-performance).
Frame presentation: [Chrome's video frame callback guide](https://web.dev/articles/requestvideoframecallback-rvfc).

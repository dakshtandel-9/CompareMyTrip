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
Headlines on both desktop and phones follow completed frames rather than running ahead of the video while it decodes.
Frame callbacks and both timeouts are cancelled on teardown, failure, or tab suspension.

Metadata, loaded-frame, can-play and seek-completion events all retry synchronization.
Touch devices attempt a muted play/pause to prime decoding; a real touchend/click can retry
if browser autoplay policy refused that attempt. A stalled load or seek times out after
12 foreground seconds, removes the video source, reveals the poster and releases the
sticky scroll distance. The timeout restarts when returning from a hidden tab. Reduced
motion, reduced data, Save-Data and 2G connections use the still hero and normal flow.
The hero attempts video on estimated 3G connections; the existing load/seek timeout
returns to the poster if the actual request stalls.
Content changes and connection-preference changes are handled without per-scroll React renders.

On phones, the pinned stage fills the small viewport above the fixed 64px bottom
navigation (including its safe-area inset), with a 16px gap below the rounded video.
On first load, the stage also subtracts the measured header space above it; that
reservation shrinks to zero as the hero reaches the top. The video scroll distance
stays fixed during this opening resize.
Rotating headlines and descriptions sit
above the video; the video fills the remaining height. All copy blocks share a grid
cell so their transitions do not shift the video. Copy follows decoded frames in both
scroll directions, with a `220svh` scroll runway and a final 13% hold.
Search and Top Picks render once, outside the phone scroll wrapper, so they only enter
view after the sequence releases. Reduced-motion/data-saving and failed-video fallbacks
stay in normal flow with the first message. Desktop retains its full-screen sticky
video, overlaid copy and booking controls.
Picks swipe horizontally, and date, traveller and budget panels open above the bottom
navigation.

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

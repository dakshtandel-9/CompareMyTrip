# Homepage scroll video

The hero uses `public/videos/1-scroll.mp4`, derived from the user-provided `public/videos/1.mp4`. It is a paused video whose playback position follows GSAP ScrollTrigger progress with 0.35-second scrub smoothing. There is no autoplay, loop, audio or visible playback UI. Scrolling backward reverses the scene. Text follows the same eased progress.

The original is preserved. Its keyframes were about 2.67 seconds apart. The derived H.264 video has a keyframe every 0.2 seconds, no B-frames or audio, and faststart metadata. Both files are about 25 MiB: this export targets seeking performance rather than download-size reduction. The full 39.7-second scene is retained.

Reproduce the assets with FFmpeg (use new output filenames if the existing files should be preserved):

```sh
ffmpeg -i public/videos/1.mp4 -an -c:v libx264 -preset fast -crf 23 -g 6 -keyint_min 6 -sc_threshold 0 -bf 0 -pix_fmt yuv420p -movflags +faststart public/videos/1-scroll.mp4
ffmpeg -i public/videos/1.mp4 -frames:v 1 -q:v 3 public/videos/1-poster.jpg
```

The wrapper is 450vh, with the closing 13% of the scroll holding the final frame. The browser receives only one seek at a time; a `seeked` event applies the newest requested position. Metadata arriving after a scroll jump uses the latest progress. Errors reveal the poster.

The existing mobile and reduced-motion layout uses the poster and normal page flow. The video source is attached only while the desktop animation is active, and removed on cleanup. The hero no longer requests the R2 image sequence; the shared frame controller remains available unchanged for other consumers.

Validation: `node --test tests/scroll-video.test.mjs`, `npx tsc --noEmit`, and `npx eslint src/lib/scrollVideo.ts src/app/home/_sections/ScrollFrameSequence.tsx`. Browser checks cover forward/reverse seeking, paused playback and responsive fallback. Test cold loading on the deployed host as well; the 25 MiB asset still depends on network bandwidth and HTTP range support.

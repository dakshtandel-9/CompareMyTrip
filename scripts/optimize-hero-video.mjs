import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

// Requires ffmpeg. Keep filenames versioned so long-lived CDN/browser caches
// cannot reuse an old encode when the footage or encoding settings change.
const input = process.argv[2] ?? 'media-source/prelaunch/2026-09-13/FINAL_COMBINED_FIRST_3SEC_2X.mp4';
if (!existsSync(input)) {
  throw new Error(`Hero master not found: ${input}. Pass the original footage path as the first argument.`);
}

// v3 raised both renditions by 25% in width (1280 → 1600, 768 → 960) at the
// same CRF: VMAF against the 1080p master went 85.9 → 89.7 on desktop and
// 67.9 → 75.9 on phones.
// v4 (mobile only): phones show the hero as a tall portrait card, so a 16:9
// encode was cropped to its middle third and enlarged ~3x on screen. Encode
// that portrait centre crop at the master's full 1080px height instead.
for (const [rendition, filter, crf] of [
  ['desktop-v3', 'scale=1600:-2', 28],
  ['mobile-v4', 'crop=trunc(ih*0.62/2)*2:ih', 28],
]) {
  const result = spawnSync('ffmpeg', [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-i', input,
    '-an', '-vf', `${filter},fps=24`,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf),
    '-g', '2', '-keyint_min', '2', '-bf', '0', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', `public/videos/hero-scroll-${rendition}.mp4`,
  ], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

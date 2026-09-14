import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

// Requires ffmpeg. Keep filenames versioned so long-lived CDN/browser caches
// cannot reuse an old encode when the footage or encoding settings change.
const input = process.argv[2] ?? 'media-source/prelaunch/2026-09-13/FINAL_COMBINED_FIRST_3SEC_2X.mp4';
if (!existsSync(input)) {
  throw new Error(`Hero master not found: ${input}. Pass the original footage path as the first argument.`);
}

for (const [device, width, crf] of [['desktop', 1280, 28], ['mobile', 768, 29]]) {
  const result = spawnSync('ffmpeg', [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-i', input,
    '-an', '-vf', `scale=${width}:-2,fps=24`,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf),
    '-g', '2', '-keyint_min', '2', '-bf', '0', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', `public/videos/hero-scroll-${device}-v2.mp4`,
  ], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

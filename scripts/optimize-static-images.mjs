// Rebuild lossless assets from the archived PNGs without changing dimensions.
// Usage: node scripts/optimize-static-images.mjs /path/to/original-public-files
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.argv[2] ?? 'media-source/performance-2026-09-25';
const mappings = JSON.parse(await readFile('src/lib/legacyImagePaths.json', 'utf8'));
for (const [source, destination] of Object.entries(mappings)) {
  const original = await readFile(path.join(root, source));
  const optimized = await sharp(original).webp({ lossless: true, effort: 6 }).toBuffer();
  const before = await sharp(original).ensureAlpha().raw().toBuffer();
  const after = await sharp(optimized).ensureAlpha().raw().toBuffer();
  if (!before.equals(after)) throw new Error(`Decoded pixels differ: ${source}`);
  const output = path.join('public', destination);
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, optimized);
  console.log(`${source}: ${original.length} -> ${optimized.length} bytes, identical decoded pixels`);
}

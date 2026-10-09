// Re-encode the site's own photos for the web, keeping their dimensions.
// Every next/image is served as-is (images.unoptimized), so these bytes are
// exactly what a visitor downloads.
//
// Each original is archived once under media-source/ (ignored by Git) and
// every run encodes from that archive, so re-running never compresses an
// already compressed file again. PNG sources listed in legacyImagePaths.json
// are written to their WebP destination; the rewrite keeps the old URL alive.
//
// Usage: node scripts/optimize-static-images.mjs [--dry-run] [archive-dir]
import { copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const archive = args.find((arg) => !arg.startsWith('--')) ?? 'media-source/static-image-originals';
const PUBLIC = 'public';
// Smaller files have little to give back.
const MIN_BYTES = 100_000;
// Keep the original unless the re-encode is at least this much smaller.
const MIN_SAVING = 0.1;
// Header/footer logo: shown at most 235px wide, so 1086px covers 3x screens.
// Lossless, because its edges and transparency must stay exact.
const RESIZE_LOSSLESS = { 'comparemytrip-logo.webp': 1086 };

const legacy = JSON.parse(await readFile('src/lib/legacyImagePaths.json', 'utf8'));
const destinationFor = (rel) => legacy[`/${rel}`]?.slice(1) ?? rel;

async function list(root, dir = root, found = []) {
  let entries = [];
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return found; }
  for (const entry of entries) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await list(root, file, found);
    else if (/\.(jpe?g|png|webp)$/i.test(entry.name)) found.push(path.relative(root, file).split(path.sep).join('/'));
  }
  return found;
}

async function exists(file) {
  try { await stat(file); return true; } catch { return false; }
}

async function encode(rel, original) {
  const image = sharp(original).rotate();
  const { hasAlpha } = await sharp(original).metadata();
  if (RESIZE_LOSSLESS[rel]) return image.resize({ width: RESIZE_LOSSLESS[rel] }).webp({ lossless: true, effort: 6 }).toBuffer();
  // Transparent artwork needs its own visual check; leave it alone.
  if (hasAlpha) return null;
  const target = destinationFor(rel);
  if (/\.jpe?g$/i.test(target)) return image.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  if (/\.webp$/i.test(target)) return image.webp({ quality: /\.png$/i.test(rel) ? 90 : 82, effort: 6 }).toBuffer();
  return null;
}

const paths = [...new Set([...(await list(PUBLIC)), ...(await list(archive))])].sort();
let before = 0;
let after = 0;
for (const rel of paths) {
  // Files loose in public/ are logos and one-off artwork, not photos.
  if (!rel.includes('/') && !RESIZE_LOSSLESS[rel]) continue;
  const archived = path.join(archive, rel);
  const source = (await exists(archived)) ? archived : path.join(PUBLIC, rel);
  const original = await readFile(source);
  if (original.length < MIN_BYTES) continue;
  const optimized = await encode(rel, original);
  if (!optimized || optimized.length > original.length * (1 - MIN_SAVING)) continue;

  const target = destinationFor(rel);
  before += original.length;
  after += optimized.length;
  console.log(`${rel}${target === rel ? '' : ` -> ${target}`}: ${original.length} -> ${optimized.length} bytes`);
  if (dryRun) continue;
  if (source !== archived) {
    await mkdir(path.dirname(archived), { recursive: true });
    await copyFile(source, archived);
  }
  await writeFile(path.join(PUBLIC, target), optimized);
  if (target !== rel) await rm(path.join(PUBLIC, rel), { force: true });
}
console.log(`${dryRun ? 'Would save' : 'Saved'} ${before - after} bytes (${before} -> ${after}).`);

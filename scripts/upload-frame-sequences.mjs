/* ------------------------------------------------------------------ */
/* Moves the scroll-scrubbed frame sequences out of public/ and into R2. */
/*                                                                      */
/* 1383 frames across two sequences is ~132MB — far too much to ship in  */
/* a git repo or a deploy bundle, and they are plain static assets that  */
/* belong in object storage. (Not Firestore: 1MB per document, and this  */
/* is not document-shaped data.)                                         */
/*                                                                      */
/*   node --env-file=.env.local scripts/upload-frame-sequences.mjs <prefix> */
/*   node --env-file=.env.local scripts/upload-frame-sequences.mjs <prefix> --verify */
/*                                                                      */
/* Naming a prefix limits the run to that sequence; with none named,     */
/* every sequence below is attempted.                                    */
/*                                                                      */
/* Uploads are idempotent — re-running skips objects already present at  */
/* the right size, so an interrupted run can simply be repeated. Nothing */
/* local is deleted here; deletion is a separate, deliberate step taken   */
/* only after --verify passes.                                           */
/* ------------------------------------------------------------------ */

import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const ALL_SEQUENCES = [
  { dir: "public/hero-frames-v3", prefix: "hero-frames-v3" },
  { dir: "public/hero-frames-v3-sm", prefix: "hero-frames-v3-sm" },
  { dir: "public/train-banner", prefix: "train-banner" },
];

/* Frames are JPEG or WebP depending on when the sequence was cut. */
const CONTENT_TYPES = { ".jpg": "image/jpeg", ".webp": "image/webp" };

/* Name one or more prefixes to work on just those. Without it every sequence
   above is attempted — which only works while all of them still have their
   local frames, and they are deleted once verified. */
const wanted = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const SEQUENCES = wanted.length
  ? ALL_SEQUENCES.filter((sequence) => wanted.includes(sequence.prefix))
  : ALL_SEQUENCES;

if (SEQUENCES.length === 0) {
  console.error(`Unknown sequence. Known: ${ALL_SEQUENCES.map((s) => s.prefix).join(", ")}`);
  process.exit(1);
}

/* R2 rate-limits hard on bursts; 12 keeps it saturated without 429s. */
const CONCURRENCY = 12;

const {
  CLOUDFLARE_R2_ACCOUNT_ID: accountId,
  CLOUDFLARE_R2_ACCESS_KEY_ID: accessKeyId,
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: secretAccessKey,
  CLOUDFLARE_R2_BUCKET_NAME: bucket,
  CLOUDFLARE_R2_PUBLIC_URL: publicUrlRaw,
} = process.env;

if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrlRaw) {
  console.error("Missing CLOUDFLARE_R2_* variables. Run with --env-file=.env.local");
  process.exit(1);
}
const publicUrl = publicUrlRaw.replace(/\/$/, "");

const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

const verifyOnly = process.argv.includes("--verify");

/** Size of the object in R2, or null when it is not there. */
async function remoteSize(key) {
  try {
    const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return head.ContentLength ?? null;
  } catch (cause) {
    if (cause?.$metadata?.httpStatusCode === 404 || cause?.name === "NotFound") return null;
    throw cause;
  }
}

/** Runs `worker` over `items`, at most `limit` at a time. */
async function pooled(items, limit, worker) {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      await worker(items[index], index);
    }
  });
  await Promise.all(runners);
}

let uploaded = 0;
let skipped = 0;
let missing = 0;
let failed = 0;

for (const sequence of SEQUENCES) {
  const files = (await readdir(sequence.dir))
    .filter((name) => path.extname(name) in CONTENT_TYPES)
    .sort();
  process.stdout.write(`\n${sequence.prefix}: ${files.length} frames\n`);

  await pooled(files, CONCURRENCY, async (name, index) => {
    const localPath = path.join(sequence.dir, name);
    const key = `${sequence.prefix}/${name}`;
    const localBytes = (await stat(localPath)).size;

    try {
      const already = await remoteSize(key);

      if (already === localBytes) {
        skipped++;
      } else if (verifyOnly) {
        missing++;
        console.error(`  MISSING ${key}${already === null ? "" : ` (size ${already} ≠ ${localBytes})`}`);
      } else {
        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: await readFile(localPath),
            ContentType: CONTENT_TYPES[path.extname(name)],
            // Frames never change once generated; let the CDN and browser
            // hold them forever rather than revalidating 1383 times.
            CacheControl: "public, max-age=31536000, immutable",
          }),
        );
        uploaded++;
      }
    } catch (cause) {
      failed++;
      console.error(`  FAILED  ${key}: ${cause.message}`);
    }

    if ((index + 1) % 100 === 0) process.stdout.write(`  …${index + 1}/${files.length}\n`);
  });
}

console.log(
  `\n${verifyOnly ? "verify" : "upload"} complete — ` +
    `${uploaded} uploaded, ${skipped} already present, ${missing} missing, ${failed} failed`,
);
console.log(`base URL: ${publicUrl}`);

// A non-zero exit is what makes this safe to chain before any deletion.
process.exit(failed > 0 || missing > 0 ? 1 : 0);

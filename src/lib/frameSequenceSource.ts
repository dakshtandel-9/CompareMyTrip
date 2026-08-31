/* ------------------------------------------------------------------ */
/* Where the scroll-scrubbed frame sequences are served from.           */
/*                                                                      */
/* The two sequences are ~1400 JPEGs / 132MB between them — far too      */
/* much to keep in the repo or ship in a deploy bundle, so they live in  */
/* Cloudflare R2 and are uploaded by                                     */
/* scripts/upload-frame-sequences.mjs.                                   */
/*                                                                      */
/* Set NEXT_PUBLIC_FRAME_CDN_URL to the bucket's public base. Leave it   */
/* unset and the paths fall back to /public, which is what you want if   */
/* you have regenerated the frames locally from /media-source and are    */
/* checking them before uploading.                                       */
/* ------------------------------------------------------------------ */

const BASE = (process.env.NEXT_PUBLIC_FRAME_CDN_URL ?? "").replace(/\/$/, "");

/** Base path for a sequence, no trailing slash — absolute when a CDN is
    configured, root-relative when it is not. */
export function frameSequenceDir(name: "hero-frames" | "train-banner") {
  return `${BASE}/${name}`;
}

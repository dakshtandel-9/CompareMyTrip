import { getFirebaseAuth } from "@/lib/firebase/client";

/* Images uploaded while an editor is still open are recorded under these
   sessionStorage keys, so a draft that is never saved does not leave
   orphaned objects behind in the bucket. */
export const PACKAGE_DRAFT_IMAGE_KEY_PREFIX = "cmt:package-draft-images:";
export const BLOG_DRAFT_IMAGE_KEY_PREFIX = "cmt:blog-draft-images:";
export const BANNER_DRAFT_IMAGE_KEY_PREFIX = "cmt:banner-draft-images:";

export type UploadFolder = "homepage" | "packages" | "blog" | "destinations";

export async function uploadImageToCloudflare(file: File, folder: UploadFolder) {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > 5_000_000) throw new Error("Each image must be 5 MB or smaller.");

  const auth = getFirebaseAuth();
  await auth.authStateReady();
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Sign in to the CRM before uploading images.");

  const body = new FormData();
  body.set("file", file);
  body.set("folder", folder);
  const response = await fetch("/api/uploads/image", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
  const result = await response.json() as { url?: string; error?: string };
  if (!response.ok || !result.url) throw new Error(result.error || "The image could not be uploaded.");
  return result.url;
}

export async function deleteImageFromCloudflare(url: string) {
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Sign in to the CRM before deleting images.");
  const response = await fetch("/api/uploads/image", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const result = await response.json() as { error?: string };
  if (!response.ok) throw new Error(result.error || "The image could not be deleted.");
}

/** Deletes every image left behind by an editor that was closed without
    saving. Anything that fails to delete is written back so the next visit
    to the section retries it rather than losing the reference. */
export async function cleanupAbandonedDraftImages(prefix: string): Promise<{ failedCount: number }> {
  const keys = Object.keys(sessionStorage).filter((key) => key.startsWith(prefix));
  let failedCount = 0;
  for (const key of keys) {
    const stored = sessionStorage.getItem(key);
    sessionStorage.removeItem(key);
    if (!stored) continue;
    let images: string[];
    try { images = [...new Set(JSON.parse(stored) as string[])]; }
    catch { continue; }
    const results = await Promise.allSettled(images.map(deleteImageFromCloudflare));
    const failed = images.filter((_, index) => results[index].status === "rejected");
    if (failed.length) { sessionStorage.setItem(key, JSON.stringify(failed)); failedCount += failed.length; }
  }
  return { failedCount };
}

export const cleanupAbandonedBannerImages = () => cleanupAbandonedDraftImages(BANNER_DRAFT_IMAGE_KEY_PREFIX);
export const cleanupAbandonedPackageImages = () => cleanupAbandonedDraftImages(PACKAGE_DRAFT_IMAGE_KEY_PREFIX);
export const cleanupAbandonedBlogImages = () => cleanupAbandonedDraftImages(BLOG_DRAFT_IMAGE_KEY_PREFIX);

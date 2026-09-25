// Edge middleware cannot use Next's Data Cache. Keep a bounded per-origin
// decision for one minute and share concurrent reads in each worker instance.
const decisions = new Map<string, { enabled: boolean; expiresAt: number }>();
const pending = new Map<string, Promise<boolean>>();
const CACHE_MS = 60_000;

/** Only the public switch crosses into middleware; credentials stay server-side. */
export async function readComingSoonEnabled(origin?: string): Promise<boolean> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) return false;
  const url = new URL("/api/content/status", origin ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://comparemytrip.in");
  const key = `${projectId}:${url.origin}`;
  const previous = decisions.get(key);
  if (previous && previous.expiresAt > Date.now()) return previous.enabled;
  const inflight = pending.get(key);
  if (inflight) return inflight;

  const read = (async () => {
    try {
      const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(3000) });
      if (!response.ok) throw new Error("Settings unavailable");
      const enabled = (await response.json())?.enabled;
      if (typeof enabled !== "boolean") throw new Error("Invalid maintenance setting");
      if (decisions.size >= 32 && !decisions.has(key)) decisions.delete(decisions.keys().next().value!);
      decisions.set(key, { enabled, expiresAt: Date.now() + CACHE_MS });
      return enabled;
    } catch {
      // Do not cache failures: retry next request and retain the last verified
      // decision. A cold configured worker fails closed.
      return previous?.enabled ?? true;
    } finally {
      pending.delete(key);
    }
  })();
  pending.set(key, read);
  return read;
}

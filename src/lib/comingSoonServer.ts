// Retain the last successful decision during an outage. Reads remain uncached
// so an explicit switch-off is effective on the next request. A cold worker
// with configured Firebase stays closed until it can verify the setting.
const lastKnown = new Map<string, boolean>();

/** Keep Admin SDK credentials and authenticated Firestore reads on the server,
 * while middleware receives only the public switch from the same origin. */
export async function readComingSoonEnabled(origin?: string): Promise<boolean> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) return false;

  try {
    const url = new URL("/api/content/status", origin ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://comparemytrip.in");
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(3000) });
    if (!response.ok) throw new Error("Settings unavailable");
    const document = await response.json();
    const enabled = document?.enabled;
    if (typeof enabled !== "boolean") throw new Error("Invalid maintenance setting");
    lastKnown.set(projectId, enabled);
    return enabled;
  } catch {
    return lastKnown.get(projectId) ?? true;
  }
}

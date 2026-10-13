import { getFirebaseAuth } from "./client";
import type { ContentScope } from "@/lib/contentScopes";
import type { SiteContent } from "@/lib/siteContent";

/** Refreshes the public pages that show `scope`. For site content, `sections`
    narrows the refresh to what changed; leave it out to refresh every section. */
export async function revalidatePublicContent(scope: ContentScope, sections?: (keyof SiteContent)[]) {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Content was saved. Sign in again and republish to refresh the public pages.");
  try {
    const response = await fetch("/api/admin/revalidate-content", {
      method: "POST",
      headers: { Authorization: `Bearer ${await user.getIdToken()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ scope, sections }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error("Refresh failed");
  } catch {
    throw new Error("Content was saved, but public pages could not be refreshed. Please retry publishing.");
  }
}

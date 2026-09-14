import { getFirebaseAuth } from "./client";

export async function revalidatePublicContent() {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Content was saved. Sign in again and republish to refresh the public pages.");
  try {
    const response = await fetch("/api/admin/revalidate-content", {
      method: "POST", headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error("Refresh failed");
  } catch {
    throw new Error("Content was saved, but public pages could not be refreshed. Please retry publishing.");
  }
}

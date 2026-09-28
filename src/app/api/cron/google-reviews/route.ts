import { timingSafeEqual } from "node:crypto";
import { loadIntegration, NotApprovedError, removeExpiredGoogleReviews, saveIntegration, syncGoogleReviews } from "@/lib/googleBusinessServer";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = Buffer.from(request.headers.get("authorization") || "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (!secret || provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    await removeExpiredGoogleReviews();
    const integration = await loadIntegration();
    if (!integration.refreshToken || !integration.selectedLocation) return Response.json({ skipped: "Not connected to a selected business." });
    // Cloudflare's shared scheduler runs hourly; refresh reviews once per day.
    if (Date.now() - Date.parse(integration.lastSyncedAt) < 86_400_000) return Response.json({ skipped: "Already refreshed today." });
    const result = await syncGoogleReviews();
    return Response.json({ count: result.count });
  } catch (error) {
    await saveIntegration({ error: (error as Error).message, awaitingApproval: error instanceof NotApprovedError }).catch(() => {});
    return Response.json({ error: "Google review refresh failed. See the admin connection status." }, { status: 502 });
  }
}

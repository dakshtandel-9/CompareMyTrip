import { discoverGoogleLocations, NotApprovedError, saveIntegration } from "@/lib/googleBusinessServer";
import { isFirebaseAdmin, notFound } from "@/lib/serverAdminGuard";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!(await isFirebaseAdmin(request))) return notFound();
  try {
    return Response.json({ locations: await discoverGoogleLocations() });
  } catch (error) {
    const awaitingApproval = error instanceof NotApprovedError;
    const message = (error as Error).message;
    await saveIntegration({ error: message, awaitingApproval }).catch(() => {});
    return Response.json({ error: message, awaitingApproval }, { status: 502 });
  }
}

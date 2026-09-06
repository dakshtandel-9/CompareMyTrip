/* ------------------------------------------------------------------ */
/* The CRM's view of the Google Business connection.                    */
/*                                                                      */
/* GET    → status, with no secret in it                                */
/* PUT    → save the OAuth client id and secret                         */
/* DELETE → forget the connection entirely                              */
/* ------------------------------------------------------------------ */

import { EMPTY_GOOGLE_STATUS, type GoogleBusinessStatus } from "@/lib/googleBusiness";
import {
  clearIntegration,
  loadIntegration,
  redirectUri,
  saveIntegration,
} from "@/lib/googleBusinessServer";
import { isFirebaseAdmin, notFound } from "@/lib/adminApiGuard";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!(await isFirebaseAdmin(request))) return notFound();

  const integration = await loadIntegration();

  /* Built field by field rather than spread from the stored record: a
     spread would ship clientSecret and refreshToken to the browser the
     moment either is added to the type. */
  const status: GoogleBusinessStatus = {
    ...EMPTY_GOOGLE_STATUS,
    connected: Boolean(integration.refreshToken),
    credentialsSaved: Boolean(integration.clientId && integration.clientSecret),
    clientId: integration.clientId,
    account: integration.account,
    locations: integration.locations,
    lastSyncedAt: integration.lastSyncedAt,
    lastSyncCount: integration.lastSyncCount,
    error: integration.error,
    awaitingApproval: integration.awaitingApproval,
    redirectUri: redirectUri(),
  };

  return Response.json(status);
}

export async function PUT(request: Request) {
  if (!(await isFirebaseAdmin(request))) return notFound();

  const body = (await request.json().catch(() => ({}))) as {
    clientId?: string;
    clientSecret?: string;
  };

  const clientId = (body.clientId ?? "").trim();
  const clientSecret = (body.clientSecret ?? "").trim();
  if (!clientId || !clientSecret) {
    return Response.json({ error: "Both the client ID and secret are required." }, { status: 400 });
  }

  if (!redirectUri()) {
    return Response.json(
      { error: "NEXT_PUBLIC_SITE_URL is not set on the server, so the redirect URI cannot be built." },
      { status: 500 },
    );
  }

  try {
    /* Changing the client invalidates any token minted by the old one, so
       the refresh token is dropped rather than left to fail confusingly on
       the next sync. */
    await saveIntegration({ clientId, clientSecret, refreshToken: "", account: "", error: "" });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }

  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!(await isFirebaseAdmin(request))) return notFound();

  try {
    await clearIntegration();
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }

  return Response.json({ ok: true });
}

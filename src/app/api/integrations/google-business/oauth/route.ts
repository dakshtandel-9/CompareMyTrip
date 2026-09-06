/* ------------------------------------------------------------------ */
/* Step one of the connect flow: hand the CRM a consent URL.            */
/*                                                                      */
/* The CRM asks for the URL here (authenticated, with the admin's ID    */
/* token) and then navigates to it. It cannot simply link straight to   */
/* this route: a top-level navigation carries no Authorization header,  */
/* so the admin check would have nothing to read.                       */
/*                                                                      */
/* The `state` minted here is the CSRF defence for the callback, which  */
/* is necessarily an unauthenticated endpoint — Google is the caller.   */
/* ------------------------------------------------------------------ */

import { randomBytes } from "node:crypto";

import { consentUrl, loadIntegration, redirectUri, saveIntegration } from "@/lib/googleBusinessServer";
import { isFirebaseAdmin, notFound } from "@/lib/adminApiGuard";

export const runtime = "nodejs";

/** Long enough to get through Google's consent screen, short enough that a
    leaked state is worthless by the time anyone finds it. */
const STATE_TTL_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  if (!(await isFirebaseAdmin(request))) return notFound();

  const integration = await loadIntegration();
  if (!integration.clientId || !integration.clientSecret) {
    return Response.json({ error: "Save the client ID and secret first." }, { status: 400 });
  }

  if (!redirectUri()) {
    return Response.json(
      { error: "NEXT_PUBLIC_SITE_URL is not set on the server." },
      { status: 500 },
    );
  }

  const state = randomBytes(24).toString("hex");
  await saveIntegration({ oauthState: state, oauthStateExpiresAt: Date.now() + STATE_TTL_MS });

  return Response.json({ url: consentUrl(integration.clientId, state) });
}

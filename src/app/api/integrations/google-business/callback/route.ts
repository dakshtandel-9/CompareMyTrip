/* ------------------------------------------------------------------ */
/* Step two: Google sends the admin's browser back here with a code.    */
/*                                                                      */
/* Unauthenticated by necessity — the caller is Google, not the CRM —   */
/* so `state` is what proves the round trip started from an admin who   */
/* had already authenticated at /oauth. It is single-use and expires.   */
/*                                                                      */
/* Everything here ends in a redirect back to the CRM rather than JSON: */
/* a person is looking at this response, not a fetch.                   */
/* ------------------------------------------------------------------ */

import { exchangeCode, loadIntegration, saveIntegration } from "@/lib/googleBusinessServer";

export const runtime = "nodejs";

const CRM_PATH = "/admin/content?tab=reviews";

function backToCrm(request: Request, params: Record<string, string>) {
  const url = new URL(CRM_PATH, new URL(request.url).origin);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return Response.redirect(url, 303);
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;

  /* The admin pressed "cancel" on Google's consent screen. */
  const denied = query.get("error");
  if (denied) return backToCrm(request, { google: "error", message: denied });

  const code = query.get("code") ?? "";
  const state = query.get("state") ?? "";
  if (!code || !state) return backToCrm(request, { google: "error", message: "missing_code" });

  const integration = await loadIntegration();

  /* Compared before anything is exchanged, and cleared immediately after,
     so a replayed callback finds nothing to match. */
  const expected = integration.oauthState ?? "";
  const expiry = integration.oauthStateExpiresAt ?? 0;
  if (!expected || state !== expected || Date.now() > expiry) {
    return backToCrm(request, { google: "error", message: "expired_state" });
  }

  try {
    const refreshToken = await exchangeCode(code, integration.clientId, integration.clientSecret);
    await saveIntegration({
      refreshToken,
      oauthState: "",
      oauthStateExpiresAt: 0,
      error: "",
      awaitingApproval: false,
    });
  } catch (error) {
    await saveIntegration({ oauthState: "", oauthStateExpiresAt: 0 });
    return backToCrm(request, { google: "error", message: (error as Error).message });
  }

  return backToCrm(request, { google: "connected" });
}

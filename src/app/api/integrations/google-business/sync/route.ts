/* ------------------------------------------------------------------ */
/* Pull locations and reviews from Google and publish them.             */
/*                                                                      */
/* This is also the honest answer to "has Google approved us yet?" — a  */
/* project without quota authenticates perfectly and then refuses the   */
/* data, so the only way to know is to ask for some. The refusal is     */
/* recorded as awaitingApproval rather than as a generic failure, so    */
/* the CRM can say "waiting on Google" instead of "something broke".    */
/* ------------------------------------------------------------------ */

import { NotApprovedError, saveIntegration, syncGoogleReviews } from "@/lib/googleBusinessServer";
import { isFirebaseAdmin, notFound } from "@/lib/adminApiGuard";

export const runtime = "nodejs";
/* Pulling every review of every location runs well past the default. */
export const maxDuration = 300;

export async function POST(request: Request) {
  if (!(await isFirebaseAdmin(request))) return notFound();

  try {
    const { count, locations } = await syncGoogleReviews();
    return Response.json({ ok: true, count, locations });
  } catch (error) {
    const awaitingApproval = error instanceof NotApprovedError;
    const message = (error as Error).message;

    /* Recorded so the CRM still shows the reason after a refresh, rather
       than only in the response to the press that caused it. */
    await saveIntegration({ error: message, awaitingApproval }).catch(() => {});

    return Response.json({ error: message, awaitingApproval }, { status: 502 });
  }
}

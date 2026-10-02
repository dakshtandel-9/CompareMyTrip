/* The admin check for the Edge middleware: verify the Firebase ID token,
   then confirm that uid is in `admins`, over REST because the Admin SDK
   cannot run on the Edge. Node route handlers use serverAdminGuard instead:
   these REST lookups carry no App Check token, so once App Check is enforced
   for Firestore this check fails closed (an admin preview while coming-soon
   mode is on stops working; nothing is exposed). */

export async function isFirebaseAdmin(request: Request, signal?: AbortSignal): Promise<boolean> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!token || !apiKey || !projectId) return false;

  const authResponse = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ idToken: token }),
      cache: "no-store",
      signal,
    },
  );
  if (!authResponse.ok) return false;

  const authResult = (await authResponse.json()) as { users?: Array<{ localId?: string; disabled?: boolean }> };
  if (authResult.users?.[0]?.disabled) return false;
  const uid = authResult.users?.[0]?.localId;
  if (!uid) return false;

  const adminResponse = await fetch(
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/admins/${encodeURIComponent(uid)}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal },
  );
  return adminResponse.ok;
}

/** Matches the uploads route: a non-admin is told the route does not exist
    rather than that it exists and refused them. */
export const notFound = () => Response.json({ error: "Not found." }, { status: 404 });

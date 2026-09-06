/* The same admin check the uploads route uses: verify the Firebase ID
   token, then confirm that uid is in `admins`. Kept in its own module so
   every route under /api/integrations shares one definition of "admin"
   rather than four drifting copies. */

export async function isFirebaseAdmin(request: Request): Promise<boolean> {
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
    },
  );
  if (!authResponse.ok) return false;

  const authResult = (await authResponse.json()) as { users?: Array<{ localId?: string }> };
  const uid = authResult.users?.[0]?.localId;
  if (!uid) return false;

  const adminResponse = await fetch(
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/admins/${encodeURIComponent(uid)}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
  );
  return adminResponse.ok;
}

/** Matches the uploads route: a non-admin is told the route does not exist
    rather than that it exists and refused them. */
export const notFound = () => Response.json({ error: "Not found." }, { status: 404 });

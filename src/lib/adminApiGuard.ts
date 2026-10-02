/* The Edge middleware cannot use the Admin SDK. Delegate the admin check to a
   same-origin Node route so it can verify the Firebase ID token and query the
   `admins` collection with Admin credentials. A direct Firestore REST lookup
   here would carry no App Check token and fail once Firestore enforcement is
   enabled. */

export async function isFirebaseAdmin(request: Request, signal?: AbortSignal): Promise<boolean> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return false;

  const endpoint = new URL("/api/admin/preview-check", request.url);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        origin: endpoint.origin,
      },
      cache: "no-store",
      signal,
    });
    if (!response.ok) return false;
    const result = await response.json() as { authorized?: unknown };
    return result.authorized === true;
  } catch {
    return false;
  }
}

/** Matches the uploads route: a non-admin is told the route does not exist
    rather than that it exists and refused them. */
export const notFound = () => Response.json({ error: "Not found." }, { status: 404 });

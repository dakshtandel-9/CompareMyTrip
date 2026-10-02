import { getAdminAuth, getAdminDb } from "./firebase/admin";

/* The admin check for Node route handlers: verify the Firebase ID token and
   look up `admins/{uid}` with the Admin SDK.

   adminApiGuard delegates the Edge middleware check to a Node route using this
   guard. The Admin SDK bypasses App Check enforcement, so admin preview and
   CRM requests continue working when Firestore enforcement is enabled.

   checkRevoked also refuses tokens of disabled or signed-out accounts. */

export async function isFirebaseAdmin(request: Request, signal?: AbortSignal): Promise<boolean> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const auth = getAdminAuth();
  const db = getAdminDb();
  if (!token || !auth || !db) return false;

  const check = (async () => {
    const { uid } = await auth.verifyIdToken(token, true);
    return (await db.collection("admins").doc(uid).get()).exists;
  })();
  // An abandoned check must not surface later as an unhandled rejection.
  check.catch(() => {});

  try {
    if (!signal) return await check;
    return await Promise.race([check, new Promise<never>((_, reject) => {
      if (signal.aborted) reject(signal.reason);
      signal.addEventListener("abort", () => reject(signal.reason), { once: true });
    })]);
  } catch {
    return false;
  }
}

export { notFound } from "./adminApiGuard";

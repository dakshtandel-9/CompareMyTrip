import { getAdminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

/** Only the public switch leaves the server. Admin credentials keep this
 * settings read working when Firebase App Check enforcement is enabled. */
export async function GET() {
  try {
    const db = getAdminDb();
    if (!db) throw new Error("Settings unavailable");
    const snapshot = await db.collection("siteContent").doc("homepage").get();
    const enabled = snapshot.data()?.content?.comingSoon?.enabled === true;
    return Response.json({ enabled }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Settings temporarily unavailable." }, {
      status: 503, headers: { "Cache-Control": "no-store" },
    });
  }
}

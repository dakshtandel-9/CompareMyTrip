import { revalidatePath, revalidateTag } from "next/cache";
import { isFirebaseAdmin, notFound } from "@/lib/adminApiGuard";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return notFound();
  try {
    if (!await isFirebaseAdmin(request, AbortSignal.timeout(8000))) return notFound();
    revalidateTag("public-content", { expire: 0 });
    revalidatePath("/", "layout");
    revalidatePath("/sitemap.xml");
    return Response.json({ revalidated: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "Content was saved, but refreshing public pages failed. Please retry publishing." }, {
      status: 503, headers: { "Cache-Control": "private, no-store" },
    });
  }
}

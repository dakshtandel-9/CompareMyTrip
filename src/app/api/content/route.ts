import { getPublishedBlogPosts, getPublishedPackages } from "@/lib/serverContent";

export const dynamic = "force-dynamic";

/** The public browser never downloads the CRM's draft collection. */
export async function GET() {
  try {
    const [packages, posts] = await Promise.all([getPublishedPackages(), getPublishedBlogPosts()]);
    return Response.json({ packages, posts }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Travel content is temporarily unavailable. Please try again." }, {
      status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "30" },
    });
  }
}

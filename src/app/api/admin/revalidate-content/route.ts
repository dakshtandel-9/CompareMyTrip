import { revalidateTag } from "next/cache";
import { isFirebaseAdmin, notFound } from "@/lib/serverAdminGuard";
import { CONTENT_SCOPES, PUBLIC_CONTENT_TAG, siteSectionTag, type ContentScope } from "@/lib/contentScopes";
import { DEFAULT_SITE_CONTENT, type SiteContent } from "@/lib/siteContent";

const SITE_SECTIONS = Object.keys(DEFAULT_SITE_CONTENT) as (keyof SiteContent)[];

/* Only the pages showing what was published are regenerated. A site-content
   publish names the sections it changed; without them every section is
   refreshed, and a request that names no scope (an admin tab still running
   older code) refreshes all public content as before. */
async function tagsFor(request: Request): Promise<string[]> {
  const body = await request.json().catch(() => null) as { scope?: unknown; sections?: unknown } | null;
  const scope = CONTENT_SCOPES.find((item) => item === body?.scope) as ContentScope | undefined;
  if (!scope) return [PUBLIC_CONTENT_TAG];
  if (scope !== "site") return [scope];
  const requested = body?.sections;
  const named = Array.isArray(requested) ? SITE_SECTIONS.filter((section) => requested.includes(section)) : [];
  return (named.length ? named : SITE_SECTIONS).map(siteSectionTag);
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return notFound();
  try {
    if (!await isFirebaseAdmin(request, AbortSignal.timeout(8000))) return notFound();
    for (const tag of await tagsFor(request)) revalidateTag(tag, { expire: 0 });
    return Response.json({ revalidated: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "Content was saved, but refreshing public pages failed. Please retry publishing." }, {
      status: 503, headers: { "Cache-Control": "private, no-store" },
    });
  }
}

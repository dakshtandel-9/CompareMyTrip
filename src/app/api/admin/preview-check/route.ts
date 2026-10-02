import { isFirebaseAdmin } from "@/lib/serverAdminGuard";

export const dynamic = "force-dynamic";

function response(authorized: boolean, status: number) {
  return Response.json({ authorized }, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return response(false, 403);
  }

  try {
    const authorized = await isFirebaseAdmin(request, AbortSignal.timeout(8000));
    return response(authorized, authorized ? 200 : 403);
  } catch {
    return response(false, 503);
  }
}

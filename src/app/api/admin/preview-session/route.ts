import { NextResponse } from "next/server";
import { isFirebaseAdmin } from "@/lib/adminApiGuard";
import { ADMIN_PREVIEW_COOKIE } from "@/lib/adminPreview";

function sessionResponse(request: Request, authorized: boolean, token = "", status = 200) {
  const response = NextResponse.json({ authorized }, { status });
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.cookies.set(ADMIN_PREVIEW_COOKIE, token, {
    httpOnly: true,
    secure: new URL(request.url).protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: authorized ? 3600 : 0,
  });
  return response;
}

function sameOrigin(request: Request) {
  return request.headers.get("origin") === new URL(request.url).origin;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ authorized: false }, { status: 403 });
  try {
    if (!await isFirebaseAdmin(request, AbortSignal.timeout(8000))) return sessionResponse(request, false, "", 403);
    const token = request.headers.get("authorization")!.replace(/^Bearer\s+/i, "");
    return sessionResponse(request, true, token);
  } catch {
    return sessionResponse(request, false, "", 503);
  }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ authorized: false }, { status: 403 });
  return sessionResponse(request, false);
}

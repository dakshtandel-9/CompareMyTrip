import { NextResponse, type NextRequest } from "next/server";
import { bypassComingSoon } from "@/lib/comingSoon";
import { readComingSoonEnabled } from "@/lib/comingSoonServer";
import { isFirebaseAdmin } from "@/lib/adminApiGuard";
import { ADMIN_PREVIEW_COOKIE } from "@/lib/adminPreview";

// Next 16 retains middleware for the Edge runtime. Use it here because this
// project's Cloudflare adapter does not offer stable Node proxy support.
export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/coming-soon" && ["GET", "HEAD"].includes(request.method)) {
    if (await readComingSoonEnabled()) return NextResponse.next();
    // Decide before Next starts streaming; a page-level notFound() alone
    // can leave the HTTP status at 200 once the root shell has been sent.
    const response = NextResponse.rewrite(new URL("/404", request.url), { status: 404 });
    response.headers.set("Cache-Control", "no-store, max-age=0");
    response.headers.set("X-Robots-Tag", "noindex");
    return response;
  }
  if (bypassComingSoon(request.nextUrl.pathname) || !["GET", "HEAD"].includes(request.method)) {
    return NextResponse.next();
  }
  if (!await readComingSoonEnabled()) return NextResponse.next();

  const token = request.cookies.get(ADMIN_PREVIEW_COOKIE)?.value;
  if (token) {
    try {
      const identity = new Request(request.url, { headers: { authorization: `Bearer ${token}` } });
      if (await isFirebaseAdmin(identity, AbortSignal.timeout(8000))) {
        const response = NextResponse.next();
        // An administrator's preview must never become a public cached response.
        response.headers.set("Cache-Control", "private, no-store, max-age=0");
        response.headers.set("Vary", "Cookie");
        return response;
      }
    } catch {
      // Failed verification must leave the public coming-soon gate in place.
    }
  }

  const destination = request.nextUrl.clone();
  destination.pathname = "/coming-soon";
  destination.search = "";
  destination.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  const response = NextResponse.redirect(destination, 307);
  response.headers.set("Cache-Control", "no-store, max-age=0");
  if (token) response.cookies.delete(ADMIN_PREVIEW_COOKIE);
  return response;
}

export const config = {
  matcher: ["/((?!api(?:/|$)|_next(?:/|$)|.*\\.[^/]+$).*)"],
};

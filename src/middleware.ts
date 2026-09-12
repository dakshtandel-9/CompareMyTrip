import { NextResponse, type NextRequest } from "next/server";
import { bypassComingSoon } from "@/lib/comingSoon";
import { readComingSoonEnabled } from "@/lib/comingSoonServer";

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

  const destination = request.nextUrl.clone();
  destination.pathname = "/coming-soon";
  destination.search = "";
  const response = NextResponse.redirect(destination, 307);
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

export const config = {
  matcher: ["/((?!api(?:/|$)|_next(?:/|$)|.*\\.[^/]+$).*)"],
};

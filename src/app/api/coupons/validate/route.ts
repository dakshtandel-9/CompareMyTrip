import { NextResponse } from "next/server";

import { uidFromIdToken } from "@/lib/firebase/admin";
import { resolveCoupon } from "@/lib/couponServer";
import { normaliseCode } from "@/lib/coupons";
import { normaliseTravellers, priceOrder, resolvePackage } from "@/lib/payu";

/* ------------------------------------------------------------------ */
/* What a coupon would do to this order — the checkout's preview.        */
/*                                                                      */
/* Advisory only. Nothing here decides what anyone pays: the same        */
/* resolveCoupon() runs again inside /api/payu/initiate, against the     */
/* same catalogue price, at the moment the amount is signed. A stale or  */
/* tampered answer from this route buys nothing.                         */
/*                                                                      */
/* Coupons are not readable from the browser (firestore.rules), so this  */
/* is also the only way the checkout can learn a code exists — which     */
/* keeps the code list from being enumerable a document at a time. It    */
/* still answers one code per request, so a determined guesser is        */
/* rate-limited by the round trip and nothing more; codes are a          */
/* discount, not a credential.                                           */
/* ------------------------------------------------------------------ */

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, message: "Malformed request." }, { status: 400 });
  }

  const read = (key: string) => (typeof body[key] === "string" ? (body[key] as string).trim() : "");

  const pkg = resolvePackage(read("packageId"));
  if (!pkg) {
    return NextResponse.json(
      { ok: false, message: "We can't price that package here." },
      { status: 400 },
    );
  }

  const order = priceOrder(pkg, normaliseTravellers(read("travellers")));
  const code = normaliseCode(read("code"));

  /* Identity is best-effort at this point: a signed-out visitor has no
     token yet, and their account is created at submit. Offers keyed to a
     first booking or a per-person limit are re-checked in initiate, once
     there is an account to check against. */
  const userId = await uidFromIdToken(read("idToken"));
  const email = read("email").toLowerCase();

  const { applied, error } = await resolveCoupon({
    requestedCode: code,
    packageId: pkg.id,
    subtotal: order.subtotal,
    identity: { userId, email },
  });

  if (!applied) {
    return NextResponse.json({ ok: false, message: error });
  }

  return NextResponse.json({
    ok: true,
    coupon: applied,
    subtotal: order.subtotal,
    total: order.subtotal - applied.discount,
  });
}

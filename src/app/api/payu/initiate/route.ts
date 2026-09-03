import { NextResponse } from "next/server";

import { uidFromIdToken } from "@/lib/firebase/admin";
import { createPendingTrip } from "@/lib/firebase/serverTrips";
import { resolveCoupon } from "@/lib/couponServer";
import { normaliseCode } from "@/lib/coupons";
import {
  buildRequestHash,
  getPayuConfig,
  newTransactionId,
  normaliseTravellers,
  priceOrder,
  resolvePackage,
  siteOrigin,
  type Udf,
} from "@/lib/payu";

/* ------------------------------------------------------------------ */
/* Takes the checkout form, prices the order server-side, signs it, and  */
/* hands back a self-submitting form aimed at PayU. The hash is built    */
/* here and only here — the browser never sees the salt, and the amount   */
/* it posted is ignored in favour of the catalogue price.                */
/* ------------------------------------------------------------------ */

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!,
  );

function fail(origin: string, reason: string) {
  const url = new URL("/checkout/status", origin);
  url.searchParams.set("state", "error");
  url.searchParams.set("reason", reason);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const origin = siteOrigin(request);
  const config = getPayuConfig();

  if (!config) {
    return fail(origin, "not-configured");
  }

  const form = await request.formData();
  const read = (name: string) => String(form.get(name) ?? "").trim();

  const pkg = resolvePackage(read("packageId"));
  if (!pkg) {
    // Includes admin packages, which live only in the visitor's localStorage
    // and therefore have no price the server can stand behind.
    return fail(origin, "unknown-package");
  }

  const firstname = read("firstname");
  // Lower-cased so a traveller is one traveller: coupon limits and the
  // "first booking" test both match bookings on the address, and Priya@
  // and priya@ are the same inbox.
  const email = read("email").toLowerCase();
  const phone = read("phone").replace(/[^\d+]/g, "");

  if (!firstname || !email || phone.replace(/\D/g, "").length < 10) {
    return fail(origin, "invalid-details");
  }

  const travellers = normaliseTravellers(read("travellers"));

  // Tie the booking to the buyer's account when the browser supplied a
  // usable ID token. A missing or bad token loses the link to My Trips, but
  // must never stop the payment — the CRM still gets the record.
  const userId = await uidFromIdToken(read("idToken"));

  // The coupon is decided here, not at the checkout: the browser posts a
  // code, and this is the only place that turns one into money off. The
  // preview the traveller saw ran the same rules a minute earlier, so a
  // rejection now means something changed underneath them (the code ran
  // out, the campaign closed, it was their second use) — they go back to
  // checkout to see the real total rather than being charged a different
  // one than the screen promised.
  const requestedCode = normaliseCode(read("coupon"));
  const subtotal = priceOrder(pkg, travellers).subtotal;
  const coupon = await resolveCoupon({
    requestedCode,
    packageId: pkg.id,
    subtotal,
    identity: { userId, email },
  }).catch((cause) => {
    // A coupon lookup that falls over must not cost the booking. Full price
    // is always a price we can stand behind.
    console.error("coupon could not be resolved", cause);
    return { applied: null, error: "" };
  });

  if (requestedCode && !coupon.applied) {
    return fail(origin, "coupon-rejected");
  }

  const order = priceOrder(pkg, travellers, coupon.applied?.discount ?? 0);

  const txnid = newTransactionId();
  const productinfo = pkg.title;
  const udf: Udf = [pkg.id, String(order.travellers), coupon.applied?.code ?? "", "", ""];

  // Recorded as pending before the redirect so a booking exists even if the
  // traveller closes the tab at PayU. The callback settles it later.
  await createPendingTrip({
    txnid,
    userId,
    packageId: pkg.id,
    packageTitle: pkg.title,
    travellers: order.travellers,
    perPerson: order.perPerson,
    subtotal: order.subtotal,
    discount: order.discount,
    couponCode: coupon.applied?.code ?? "",
    couponLabel: coupon.applied?.label ?? "",
    amount: order.total,
    name: firstname,
    email,
    phone,
  }).catch((cause) => {
    console.error("pending trip could not be recorded", cause);
  });

  const hash = buildRequestHash({
    key: config.key,
    txnid,
    amount: order.amount,
    productinfo,
    firstname,
    email,
    udf,
    salt: config.salt,
  });

  const fields: Record<string, string> = {
    key: config.key,
    txnid,
    amount: order.amount,
    productinfo,
    firstname,
    email,
    phone,
    surl: `${origin}/api/payu/callback`,
    furl: `${origin}/api/payu/callback`,
    udf1: udf[0],
    udf2: udf[1],
    udf3: udf[2],
    udf4: udf[3],
    udf5: udf[4],
    hash,
  };

  const inputs = Object.entries(fields)
    .map(
      ([name, value]) =>
        `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}" />`,
    )
    .join("");

  // A self-submitting form rather than a JSON round-trip: the signed fields
  // go straight from the server to PayU without passing through page state.
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8" />
<title>Redirecting to payment…</title><meta name="robots" content="noindex" />
<style>body{margin:0;display:grid;place-items:center;min-height:100vh;font:15px/1.6 system-ui,sans-serif;color:#0f172a;background:#f8fafc}</style>
</head><body>
<p>Taking you to PayU to complete the payment…</p>
<form id="payu" method="post" action="${escapeHtml(config.endpoint)}" accept-charset="UTF-8">${inputs}
<noscript><button type="submit">Continue to payment</button></noscript>
</form>
<script>document.getElementById("payu").submit();</script>
</body></html>`;

  return new NextResponse(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

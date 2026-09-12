import { NextResponse } from "next/server";
import { createPendingTrip } from "@/lib/firebase/serverTrips";
import { uidFromIdToken } from "@/lib/firebase/admin";
import { CUSTOM_PAYMENT_PACKAGE_ID, parseCustomAmount } from "@/lib/customPayment";
import { buildRequestHash, getPayuConfig, newTransactionId, siteOrigin, type Udf } from "@/lib/payu";

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

/** Separate from package checkout: a custom payment never settles a quoted booking. */
export async function POST(request: Request) {
  const origin = siteOrigin(request);
  const fail = (error: string) => NextResponse.redirect(new URL(`/pay?error=${error}`, origin), 303);
  const config = getPayuConfig();
  if (!config) return fail("unavailable");
  let form: FormData;
  try { form = await request.formData(); } catch { return fail("invalid-details"); }
  const read = (key: string) => typeof form.get(key) === "string" ? String(form.get(key)).trim() : "";
  const amount = parseCustomAmount(read("amount"));
  if (!amount) return fail("invalid-amount");
  const firstname = read("firstname");
  const email = read("email").toLowerCase();
  const rawPhone = read("phone");
  const phone = rawPhone.replace(/[ ()-]/g, "");
  const reference = read("reference");
  if (!firstname || firstname.length > 80 || /[|\r\n]/.test(firstname) ||
      email.length > 254 || !/^[^\s@|]+@[^\s@|]+\.[^\s@|]+$/.test(email) ||
      !/^\+?\d{10,15}$/.test(phone) || read("agreed") !== "yes") return fail("invalid-details");
  if (reference.length > 120 || /[|\r\n]/.test(reference)) return fail("invalid-reference");

  const idToken = read("idToken");
  const userId = await uidFromIdToken(idToken);
  if (idToken && !userId) return fail("session-expired");

  const txnid = newTransactionId();
  const productinfo = reference ? `Custom payment — ${reference}` : "Custom payment — agreed with travel team";
  // Its own record and signed identity keep arbitrary amounts out of package pricing.
  const udf: Udf = [CUSTOM_PAYMENT_PACKAGE_ID, "0", "", txnid, userId];
  try {
    const saved = await createPendingTrip({
      txnid, userId, packageId: CUSTOM_PAYMENT_PACKAGE_ID, packageTitle: productinfo,
      travellers: 0, perPerson: 0, subtotal: Number(amount), discount: 0,
      couponCode: "", couponLabel: "", amount: Number(amount), name: firstname,
      email, phone, tripDate: "", payuEnvironment: config.mode,
      paymentKind: "custom", paymentReference: reference,
    });
    if (!saved) return fail("storage-unavailable");
  } catch {
    console.error("Custom payment record could not be created.");
    return fail("storage-unavailable");
  }

  const hash = buildRequestHash({ key: config.key, salt: config.salt, txnid, amount, productinfo, firstname, email, udf });
  const fields: Record<string, string> = {
    key: config.key, txnid, amount, productinfo, firstname, email, phone,
    surl: `${origin}/api/payu/custom/callback`, furl: `${origin}/api/payu/custom/callback`,
    udf1: udf[0], udf2: udf[1], udf3: udf[2], udf4: udf[3], udf5: udf[4], hash,
  };
  const inputs = Object.entries(fields).map(([name, value]) => `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}" />`).join("");
  return new NextResponse(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Opening payment</title></head><body><p>Taking you to PayU to complete your payment…</p><form id="payu" method="post" action="${escapeHtml(config.endpoint)}">${inputs}<button type="submit">Continue to payment</button></form><script>document.getElementById("payu").submit();</script></body></html>`, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

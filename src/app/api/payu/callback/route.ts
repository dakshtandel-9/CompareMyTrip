import { NextResponse } from "next/server";

import { settleTrip } from "@/lib/firebase/serverTrips";
import {
  buildResponseHash,
  getPayuConfig,
  hashesMatch,
  siteOrigin,
  type Udf,
} from "@/lib/payu";

/* ------------------------------------------------------------------ */
/* PayU posts the result here (both surl and furl point at this route).  */
/* Nothing is believed until the reverse hash checks out — without that   */
/* verification anyone could POST a "success" and be shown a paid page.   */
/* ------------------------------------------------------------------ */

export async function POST(request: Request) {
  const origin = siteOrigin(request);
  const status = new URL("/checkout/status", origin);
  const config = getPayuConfig();

  if (!config) {
    status.searchParams.set("state", "error");
    status.searchParams.set("reason", "not-configured");
    return NextResponse.redirect(status, 303);
  }

  const form = await request.formData();
  const read = (name: string) => String(form.get(name) ?? "");

  const udf: Udf = [read("udf1"), read("udf2"), read("udf3"), read("udf4"), read("udf5")];
  const additionalCharges = read("additionalCharges");

  const expected = buildResponseHash({
    salt: config.salt,
    status: read("status"),
    udf,
    email: read("email"),
    firstname: read("firstname"),
    productinfo: read("productinfo"),
    amount: read("amount"),
    txnid: read("txnid"),
    key: read("key"),
    additionalCharges: additionalCharges || undefined,
  });

  if (!hashesMatch(expected, read("hash").toLowerCase())) {
    status.searchParams.set("state", "error");
    status.searchParams.set("reason", "hash-mismatch");
    return NextResponse.redirect(status, 303);
  }

  if (read("key") !== config.key) {
    status.searchParams.set("state", "error");
    status.searchParams.set("reason", "hash-mismatch");
    return NextResponse.redirect(status, 303);
  }
  const payuStatus = read("status").toLowerCase();
  // Pending is not a failed payment. Leave it available for reconciliation.
  if (!["success", "failure", "failed"].includes(payuStatus)) {
    status.searchParams.set("state", "pending");
    status.searchParams.set("txnid", read("udf4") || read("txnid"));
    return NextResponse.redirect(status, 303);
  }
  status.searchParams.set("state", payuStatus === "success" ? "success" : "failed");
  status.searchParams.set("txnid", read("txnid"));
  status.searchParams.set("amount", read("amount"));
  if (read("productinfo")) status.searchParams.set("item", read("productinfo"));
  if (payuStatus !== "success" && read("error_Message")) {
    status.searchParams.set("reason", read("error_Message"));
  }

  // The hash checked out, so this is genuinely PayU speaking. Record the
  // outcome before redirecting; a failure to write must not cost the
  // traveller their confirmation screen, so it is logged, not surfaced.
  await settleTrip({
    txnid: read("txnid"),
    ...(read("udf4") ? { tripId: read("udf4") } : {}),
    ...(read("udf5") ? { recovery: {
      userId: read("udf5"), packageId: read("udf1"), packageTitle: read("productinfo"),
      travellers: Number(read("udf2")) || 0, name: read("firstname"), email: read("email"),
    } } : {}),
    paymentStatus: payuStatus === "success" ? "successful" : "failed",
    payuPaymentId: read("mihpayid"),
    paymentMode: read("mode"),
    failureReason: payuStatus === "success" ? "" : read("error_Message"),
    reportedAmount: read("amount"),
  }).catch((cause) => {
    console.error("trip could not be settled", cause);
  });

  // TODO: email the traveller and the ops inbox once a mail provider exists.
  return NextResponse.redirect(status, 303);
}

/* PayU occasionally probes the URL with GET; keep it from 405-ing. */
export async function GET(request: Request) {
  const status = new URL("/checkout/status", siteOrigin(request));
  status.searchParams.set("state", "error");
  status.searchParams.set("reason", "no-result");
  return NextResponse.redirect(status, 303);
}

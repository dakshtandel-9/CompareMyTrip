import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { settleTrip } from "@/lib/firebase/serverTrips";
import { CUSTOM_PAYMENT_PACKAGE_ID } from "@/lib/customPayment";
import { buildResponseHash, getPayuConfig, hashesMatch, siteOrigin, type Udf } from "@/lib/payu";

export async function POST(request: Request) {
  const statusUrl = new URL("/pay/status", siteOrigin(request));
  const redirect = () => NextResponse.redirect(statusUrl, 303);
  const config = getPayuConfig();
  if (!config) return redirect();
  let form: FormData;
  try { form = await request.formData(); } catch { return redirect(); }
  const read = (name: string) => String(form.get(name) ?? "");
  const udf: Udf = [read("udf1"), read("udf2"), read("udf3"), read("udf4"), read("udf5")];
  const txnid = read("txnid");
  const expected = buildResponseHash({
    salt: config.salt, status: read("status"), udf, email: read("email"),
    firstname: read("firstname"), productinfo: read("productinfo"),
    amount: read("amount"), txnid, key: read("key"),
    additionalCharges: read("additionalCharges") || undefined,
  });
  if (read("key") !== config.key || !hashesMatch(expected, read("hash").toLowerCase()) ||
      udf[0] !== CUSTOM_PAYMENT_PACKAGE_ID || udf[3] !== txnid || !/^[A-Z0-9]{10,40}$/.test(txnid)) return redirect();

  statusUrl.searchParams.set("txnid", txnid);
  try {
    const db = getAdminDb();
    if (!db) return redirect();
    const record = (await db.collection("trips").doc(txnid).get()).data();
    if (!record || record.paymentKind !== "custom" || record.payuEnvironment !== config.mode) return redirect();
    const paymentStatus = read("status").toLowerCase();
    if (["success", "failure", "failed"].includes(paymentStatus)) {
      await settleTrip({
        txnid, paymentStatus: paymentStatus === "success" ? "successful" : "failed",
        payuPaymentId: read("mihpayid"), paymentMode: read("mode"),
        failureReason: paymentStatus === "success" ? "" : read("error_Message"), reportedAmount: read("amount"),
      });
    }
  } catch {
    // The receipt reads persisted state, so a storage failure cannot claim success.
    console.error("Custom payment callback could not be recorded.");
  }
  return redirect();
}

export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/pay/status", siteOrigin(request)), 303);
}

import { isFirebaseAdmin, notFound } from "@/lib/adminApiGuard";
import { checkBookingPayment, listPaymentReports, PaymentActionError, resolvePaymentReport } from "@/lib/serverPendingPayments";
import { paymentBody, paymentError, paymentJson, paymentText } from "@/lib/paymentApi";

export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    if (!await isFirebaseAdmin(request)) return notFound();
    return paymentJson({ reports: await listPaymentReports() });
  } catch (error) { return paymentError(error); }
}
export async function POST(request: Request) {
  try {
    if (!await isFirebaseAdmin(request)) return notFound();
    const body = await paymentBody(request);
    const tripId = paymentText(body.tripId);
    if (body.action === "check") return paymentJson(await checkBookingPayment(tripId));
    if (body.action !== "resolve") throw new PaymentActionError("Choose a valid request action.", 400);
    await resolvePaymentReport(tripId, paymentText(body.note));
    return paymentJson({ message: "Request resolved. The traveller can see your reply in their account." });
  } catch (error) { return paymentError(error); }
}

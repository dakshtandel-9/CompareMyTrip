import { checkBookingPayment, PaymentActionError, reportPendingPayment, retryPendingPayment } from "@/lib/serverPendingPayments";
import { paymentBody, paymentError, paymentJson, paymentText, paymentUser } from "@/lib/paymentApi";
import { siteOrigin } from "@/lib/payu";

export const runtime = "nodejs";
export async function POST(request: Request, context: { params: Promise<{ tripId: string }> }) {
  try {
    const uid = await paymentUser(request);
    const { tripId } = await context.params;
    const body = await paymentBody(request);
    if (body.action === "retry") return paymentJson(await retryPendingPayment(tripId, uid, siteOrigin(request)));
    if (body.action === "report") return paymentJson(await reportPendingPayment(tripId, uid, paymentText(body.reference), paymentText(body.message)));
    if (body.action === "check") return paymentJson(await checkBookingPayment(tripId, uid));
    throw new PaymentActionError("Choose a valid payment action.", 400);
  } catch (error) { return paymentError(error); }
}

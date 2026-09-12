import { listPaymentReports } from "@/lib/serverPendingPayments";
import { paymentError, paymentJson, paymentUser } from "@/lib/paymentApi";

export const runtime = "nodejs";
export async function GET(request: Request) {
  try { return paymentJson({ reports: await listPaymentReports(await paymentUser(request)) }); }
  catch (error) { return paymentError(error); }
}

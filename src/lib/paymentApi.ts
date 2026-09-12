import { uidFromIdToken } from "./firebase/admin";
import { PaymentActionError } from "./serverPendingPayments";

export async function paymentUser(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  const uid = await uidFromIdToken(token);
  if (!uid) throw new PaymentActionError("Please sign in to manage your payments.", 401);
  return uid;
}
export function paymentJson(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}
export function paymentError(error: unknown) {
  return paymentJson({ error: error instanceof PaymentActionError ? error.message : "We could not complete this request. Please try again shortly." }, error instanceof PaymentActionError ? error.status : 503);
}
export async function paymentBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    return body;
  } catch { throw new PaymentActionError("Invalid request.", 400); }
}
export const paymentText = (value: unknown) => typeof value === "string" ? value.trim() : "";

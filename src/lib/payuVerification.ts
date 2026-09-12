import { createHash } from "node:crypto";
import { getPayuConfig, type PayuConfig } from "./payu";

export type VerifiedPayment = {
  state: "successful" | "failed" | "pending" | "not_found" | "unknown";
  txnid: string;
  amount: string;
  payuPaymentId: string;
  paymentMode: string;
  failureReason: string;
};

const text = (value: unknown) => typeof value === "string" || typeof value === "number" ? String(value) : "";

export function parseVerifiedPayment(txnid: string, value: unknown): VerifiedPayment {
  const item = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const status = text(item.status).toLowerCase();
  const unmapped = text(item.unmappedstatus).toLowerCase();
  let state: VerifiedPayment["state"] = "unknown";
  // A bank authorization is already a debit; never offer another payment.
  if (status === "success" || unmapped === "captured" || unmapped === "auth") state = "successful";
  else if (status === "not found" && text(item.mihpayid).toLowerCase() === "not found") state = "not_found";
  else if (status === "pending" || ["pending", "in progress", "initiated"].includes(unmapped)) state = "pending";
  else if (status === "failure" || ["failed", "usercancelled", "bounced", "dropped"].includes(unmapped)) state = "failed";
  if (item.txnid && text(item.txnid) !== txnid) state = "unknown";
  return {
    state, txnid, amount: text(item.amt ?? item.amount ?? item.transaction_amount),
    payuPaymentId: text(item.mihpayid), paymentMode: text(item.mode),
    failureReason: text(item.error_Message ?? item.error_message),
  };
}

/** https://docs.payu.in/reference/verify_payment_api — never trust browser status. */
export async function verifyPayuPayments(ids: string[], config: PayuConfig | null = getPayuConfig()) {
  if (!config) throw new Error("Payment verification is unavailable. Please contact support.");
  const unique = [...new Set(ids)];
  if (!unique.length || unique.length > 100 || unique.some(id => !/^[A-Za-z0-9_-]{1,100}$/.test(id))) {
    throw new Error("Invalid payment references.");
  }
  const var1 = unique.join("|");
  const hash = createHash("sha512").update(`${config.key}|verify_payment|${var1}|${config.salt}`).digest("hex");
  const endpoint = config.mode === "live"
    ? "https://info.payu.in/merchant/postservice.php?form=2"
    : "https://test.payu.in/merchant/postservice.php?form=2";
  const response = await fetch(endpoint, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ key: config.key, command: "verify_payment", var1, hash }),
    cache: "no-store", signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("PayU could not be reached. Please try again shortly.");
  const body = await response.json() as { transaction_details?: Record<string, unknown> };
  if (!body.transaction_details || typeof body.transaction_details !== "object") {
    throw new Error("PayU could not confirm the payment status. Please try again shortly.");
  }
  return new Map(unique.map(id => [id, parseVerifiedPayment(id, body.transaction_details?.[id])]));
}

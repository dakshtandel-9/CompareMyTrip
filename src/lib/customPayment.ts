export const CUSTOM_PAYMENT_PACKAGE_ID = "custom-payment";
export const MIN_CUSTOM_PAYMENT = 1;
export const MAX_CUSTOM_PAYMENT = 1000000;

/** Accept rupees with at most two decimal places; never silently round money. */
export function parseCustomAmount(raw: string): string | null {
  const value = raw.trim();
  if (!/^\d{1,7}(?:\.\d{1,2})?$/.test(value)) return null;
  const amount = Number(value);
  if (amount < MIN_CUSTOM_PAYMENT || amount > MAX_CUSTOM_PAYMENT) return null;
  return amount.toFixed(2);
}

export const CUSTOM_PAYMENT_ERRORS: Record<string, string> = {
  "session-expired": "Your session could not be verified. Please sign in again before paying so we can save this payment to your history.",
  "invalid-amount": "Enter an amount from ₹1 to ₹10,00,000, with no more than two decimal places.",
  "invalid-details": "Enter your name, a valid email address and a phone number with 10–15 digits.",
  "invalid-reference": "Keep your booking reference or payment note within 120 characters.",
  unavailable: "Online payments are temporarily unavailable. Please contact our team before paying.",
  "storage-unavailable": "We could not create your payment reference. No payment was started. Please try again shortly.",
};

export const QUOTE_TRAVELLERS_ERROR = "Enter a whole number from 1 to 20 travellers.";

/** Canonical decimal input also matches the Firestore write rule. */
export function isValidQuoteTravellers(value: string): boolean {
  return /^(?:[1-9]|1[0-9]|20)$/.test(value.trim());
}

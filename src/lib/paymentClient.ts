"use client";

import { getFirebaseAuth } from "./firebase/client";

export const PAYMENT_REPORT_CHANGED_EVENT = "cmt:payment-report-changed";
export async function paymentRequest<T>(url: string, body?: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Please sign in to manage your payments.");
  const response = await fetch(url, {
    method: body ? "POST" : "GET", cache: "no-store", signal,
    headers: { Authorization: `Bearer ${await user.getIdToken()}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "We could not complete this request. Please try again.");
  return data as T;
}

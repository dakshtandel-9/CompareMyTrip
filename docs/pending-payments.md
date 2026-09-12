# Pending payments

The account's pending booking cards now offer **Pay again**, **Check payment status**, and **I’ve already paid**.

Retry checks every known attempt with PayU first. A successful payment repairs the booking instead of initiating another charge; a bank authorization or payment still in progress blocks a retry. A retry uses the original stored amount, coupon, travellers and booking ID, with a new signed PayU transaction ID. Concurrent requests are serialized, and another retry is blocked for five minutes. Retry does not extend the original 48-hour expiry.

A traveller can submit a bank/UPI transaction reference and an optional message. One request is stored per booking in the server-only `paymentReports` collection. Admin → Trips includes a Payment requests panel, where the admin can verify with PayU and resolve the request with a reply. The traveller can see that reply in My trips. Resolving a request does not itself mark a booking paid.

## Expiry and deletion

Pending records disappear from the customer and admin trip lists once `createdAt + 48 hours` passes. The open page refreshes its clock every 30 seconds. Successful and failed records are unaffected.

`GET /api/cron/pending-payments` reconciles expired pending rows against PayU before deleting them in Firestore transactions. It checks again inside the transaction so concurrent confirmed payments and retry changes cannot be deleted. It handles 50 records per run and stores a cursor to avoid repeatedly processing the same unresolved records. Confirmed payments are recovered, not deleted. If PayU is unavailable or returns an unknown outcome, the record stays hidden and is retained for a later cleanup attempt.

Reported payments keep their separate request and booking snapshot after the pending `trips` document is deleted. A late verified success can restore that booking. New payment signatures include the original booking ID and user ID to recover ownership if a delayed callback arrives after cleanup. Older callbacks without those fields or a saved report appear as unmatched payments for manual reconciliation. Distinct successful attempts on one booking are flagged in the admin trip list for review.

## Deployment

1. Deploy the Firestore composite index in `firestore.indexes.json` and wait for it to finish building. `firebase.json` now references this file. The cleanup index is `trips: paymentStatus ASC, createdAt ASC`.
2. Configure `CRON_SECRET`, `FIREBASE_SERVICE_ACCOUNT_KEY_BASE64`, and the existing PayU merchant configuration on the deployment. Never expose these as `NEXT_PUBLIC_*` variables. Verification uses the configured test/live environment; a record explicitly created in another environment is retained for investigation.
3. Deploy the application and scheduler. Cloudflare's existing hourly trigger invokes both cleanup routes independently. `vercel.json` schedules pending-payment cleanup hourly on Vercel.

**Vercel:** hourly cron jobs require a Pro or Enterprise plan. For a Hobby deployment, use an external hourly scheduler that sends `Authorization: Bearer <CRON_SECRET>` to the cleanup route, and remove the Vercel hourly cron entry before deployment. Do not put the secret in a URL.

Deletion runs at the next scheduled cleanup after expiry, rather than at the exact timestamp. A local development server does not run scheduled jobs. The implementation and automated tests do not activate a deployment or run cleanup against the production database.

References: [PayU verification API](https://docs.payu.in/reference/verify_payment_api), [PayU payment states](https://docs.payu.in/reference/payment-state-explanations), [Vercel cron plan limits](https://vercel.com/docs/cron-jobs/usage-and-pricing).

# Custom payments from the footer

The footer's **Pay an amount** link opens `/pay`. Customers enter the INR amount agreed with the team, their name, email and phone, and an optional booking reference or note. No account is required. For signed-in customers, a fresh Firebase ID token is verified on the server and the payment is linked to their account. Invalid supplied tokens stop checkout so a payment is not silently saved without its history link. The form accepts ₹1–₹10,00,000 with up to two decimal places; the limits live in `src/lib/customPayment.ts`.

The flow uses the existing PayU merchant configuration and live-payment readiness checks. Test mode is visibly labelled. It does not switch on live payments or alter package prices. Test credentials cannot collect real money.

Each payment is saved in the existing admin Trips records before opening PayU, with a title beginning **Custom payment**, `paymentKind: custom`, the contact details and the reference. It has its own transaction ID and does not automatically pay off another booking. The travel team matches it to the agreed arrangements manually.

`POST /api/payu/custom` validates and signs the amount. Storage failures stop checkout. PayU returns to `/api/payu/custom/callback`, which validates the response signature, merchant, transaction identity and payment environment before using the existing atomic settlement logic. `/pay/status?txnid=…` reads the saved status and amount; query parameters cannot declare payment success. It displays no customer contact information.

Existing payment reconciliation can confirm these records. Pending custom records retain their references during scheduled cleanup so delayed callbacks and customer receipts still work. A payment acknowledgement does not promise a booking confirmation or an automated email.

Validation: `node --test tests/custom-payments.test.mjs tests/payments.test.mjs tests/pending-payments.test.mjs tests/coming-soon.test.mjs`, ESLint on changed files, and `npx tsc --noEmit`. Gateway behavior is tested with mocks; a real charge is not part of automated verification.

The `/pay` page includes payment history beside the form on desktop and below it on mobile. It reuses the owner-scoped Firestore subscription and existing read rules to show account-linked custom and booking records, newest first, with amount, date (IST), payment method, transaction ID, status and test-environment labels. Updates arrive automatically; older records can be expanded. Each booking shows its saved payment state, not a ledger of individual retry attempts. Missing payment methods are labelled unavailable. Guest payments from before account linking are not claimed by matching an entered email; customers can contact the team with their reference.

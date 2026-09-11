# Temporary quote PDFs in Cloudflare R2

The add-on forms accept one optional PDF up to **10,000,000 bytes (10 MB)**. PDF bytes live in a **private R2 bucket**; Firestore holds enquiry details and the temporary upload/expiry record. Enquiries without files retain the existing submission path.

The browser uploads the raw file using a ten-minute presigned R2 PUT URL. Its signature binds the exact validated content length, PDF content type and private cache headers. This avoids passing the 10 MB file through the Next.js function. Finalization checks R2's stored size, MIME type and PDF signature, then copies the validated object to the final path using an ETag precondition. A reused upload URL cannot replace the accepted final object.

## Production setup

1. Create a private R2 bucket (for example, `comparemytrip-quotes`). Keep its **r2.dev public URL and custom domains disabled**, and do not expose it through a public Worker. Do not use the public image bucket. Set `CLOUDFLARE_R2_QUOTE_BUCKET_NAME` to its name. The code refuses the configured image bucket.
2. The existing `CLOUDFLARE_R2_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID` and `CLOUDFLARE_R2_SECRET_ACCESS_KEY` are reused. Ensure these credentials have object read/write access to the private quote bucket. Credentials stay server-side.
3. Set this bucket's CORS policy to the actual website origins. Add localhost only for development:
   ```json
   [{"AllowedOrigins":["https://comparemytrip.in"],"AllowedMethods":["PUT"],"AllowedHeaders":["Content-Type","Cache-Control"],"ExposeHeaders":["ETag"],"MaxAgeSeconds":3600}]
   ```
   The browser generates `Content-Length` automatically for the File body; do not manually set this forbidden browser header. Uploads use the R2 S3 endpoint, not a public/custom-domain URL.
4. Keep `FIREBASE_SERVICE_ACCOUNT_KEY_BASE64` configured for server-side Firestore records. Google Cloud/Firebase Storage is not used for these PDFs. The old `QUOTE_STORAGE_BUCKET` setting is no longer used.
5. Set a random `CRON_SECRET` of at least 32 random bytes. Deploy the included `vercel.json` on a plan supporting minute-level cron, or schedule an external worker every minute to GET `/api/cron/quote-cleanup` with `Authorization: Bearer <CRON_SECRET>`. Monitor non-200 results and retry failures. Avoid bucket locks that would block expiry deletion.
6. Verify upload and CRM download with a synthetic PDF. For a retention check, expire only that test upload's Firestore `expiresAt`, invoke authenticated cleanup, and verify both R2 objects and the `quoteUploads` document disappear.

No production bucket, CORS settings, or scheduler was provisioned by this code change. The existing default-deny Firestore rules protect upload metadata; no public database access is added. Upload initiation is limited to ten attempts per hour per hashed IP, recorded transactionally. When hosting outside Vercel, configure the trusted proxy to replace incoming `x-forwarded-for` headers and apply edge rate limiting.

## Retention

The server sets expiry to **72 hours after upload initiation**. Admin-only download URLs last at most 60 seconds and never past that expiry; requests for expired PDFs are rejected immediately.

The minute cleanup job deletes expired staging and final R2 objects, removes the attachment field from the enquiry, and deletes the upload record. Physical deletion normally happens on the first sweep after expiry, within one minute. Outages can delay deletion; storage failures retain metadata for retry. Each sweep handles up to 100 uploads, so monitor capacity. Abandoned and rejected uploads also expire. Enquiry contact/trip details stay in the CRM. Rate-limit records are removed after one hour by the same sweep.

Do not enable Firestore TTL on `quoteUploads`: deleting the record before the R2 object loses its cleanup reference. Do not change the configured bucket with pending uploads; records with a different provider/bucket are retained and reported as cleanup failures, not silently discarded. No earlier Google Cloud uploads were performed during development; any independently created legacy uploads need cleanup in their original bucket before migration.

## Checks

- `node --test tests/quote-upload.test.mjs`
- `npx tsc --noEmit`
- `npx eslint src/app/api/quotes src/app/api/cron/quote-cleanup src/lib/quoteUpload.ts src/lib/quoteStorage.ts tests/quote-upload.test.mjs`

References: [R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/), [R2 CORS](https://developers.cloudflare.com/r2/buckets/cors/), [R2 S3 compatibility](https://developers.cloudflare.com/r2/api/s3/api/).

import { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getAdminDb } from './firebase/admin';
import { MAX_QUOTE_BYTES } from './quoteUpload';

/** Private PDFs use their own R2 bucket; never fall back to the public image bucket. */
export function createR2QuoteBucket(name: string, client: S3Client) {
  return {
    name,
    async signUpload(key: string, size: number) {
      if (!Number.isInteger(size) || size <= 0 || size > MAX_QUOTE_BYTES) throw new Error('Invalid PDF size.');
      const url = await getSignedUrl(client, new PutObjectCommand({
        Bucket: name, Key: key, ContentType: 'application/pdf', ContentLength: size,
        CacheControl: 'private, no-store',
      }), { expiresIn: 600, signableHeaders: new Set(['content-length', 'content-type', 'cache-control']) });
      // The browser supplies Content-Length automatically for the raw File body.
      return { url, headers: { 'Content-Type': 'application/pdf', 'Cache-Control': 'private, no-store' } };
    },
    async inspect(key: string) {
      const result = await client.send(new HeadObjectCommand({ Bucket: name, Key: key }));
      return { size: result.ContentLength, contentType: result.ContentType, etag: result.ETag };
    },
    async readHeader(key: string, etag: string) {
      const result = await client.send(new GetObjectCommand({ Bucket: name, Key: key, Range: 'bytes=0-4', IfMatch: etag }));
      if (!result.Body) throw new Error('PDF body missing.');
      return Buffer.from(await result.Body.transformToByteArray());
    },
    async copy(source: string, destination: string, etag: string) {
      await client.send(new CopyObjectCommand({
        Bucket: name, Key: destination,
        CopySource: `${name}/${source.split('/').map(encodeURIComponent).join('/')}`,
        CopySourceIfMatch: etag,
        MetadataDirective: 'REPLACE', ContentType: 'application/pdf',
        CacheControl: 'private, no-store', ContentDisposition: 'attachment; filename="travel-quote.pdf"',
      }));
    },
    async remove(key: string) {
      // S3 DeleteObject is idempotent: a missing object is already deleted.
      await client.send(new DeleteObjectCommand({ Bucket: name, Key: key }));
    },
    async signDownload(key: string, expiresAt: number) {
      const seconds = Math.min(60, Math.floor((expiresAt - Date.now()) / 1000));
      if (seconds < 1) throw new Error('PDF expired.');
      return getSignedUrl(client, new GetObjectCommand({
        Bucket: name, Key: key, ResponseContentDisposition: 'attachment; filename="travel-quote.pdf"',
        ResponseCacheControl: 'private, no-store',
      }), { expiresIn: seconds });
    },
  };
}

export function quoteStorage() {
  const db = getAdminDb();
  const name = process.env.CLOUDFLARE_R2_QUOTE_BUCKET_NAME;
  const account = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  if (!db || !name || !account || !accessKeyId || !secretAccessKey || !process.env.CRON_SECRET || name === process.env.CLOUDFLARE_R2_BUCKET_NAME) {
    throw new Error('Private R2 quote uploads are not configured yet.');
  }
  const client = new S3Client({ region: 'auto', endpoint: `https://${account}.r2.cloudflarestorage.com`, credentials: { accessKeyId, secretAccessKey }, requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED' });
  return { db, bucket: createR2QuoteBucket(name, client) };
}

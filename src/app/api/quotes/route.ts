import { createHmac, randomBytes, createHash } from 'node:crypto';
import { Timestamp } from 'firebase-admin/firestore';
import { quoteStorage } from '@/lib/quoteStorage';
import { QUOTE_RETENTION_MS, quoteFileError, validQuoteEnquiry } from '@/lib/quoteUpload';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({ error: 'Invalid request origin.' }, { status: 403 });
  if (Number(request.headers.get('content-length')) > 20_000) return Response.json({ error: 'Request too large.' }, { status: 413 });
  try {
    const data = await request.json();
    if (!data.file || typeof data.file.name !== 'string' || data.file.name.length > 240 || typeof data.file.type !== 'string' || !Number.isInteger(data.file.size)) return Response.json({ error: 'Choose a PDF file.' }, { status: 400 });
    const error = quoteFileError(data.file);
    if (error || !validQuoteEnquiry(data.enquiry)) return Response.json({ error: error || 'Please check your contact and trip details.' }, { status: 400 });
    const { db, bucket } = quoteStorage();
    const now = Date.now();
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const key = createHmac('sha256', process.env.CRON_SECRET!).update(`${ip}:${Math.floor(now / 3_600_000)}`).digest('hex');
    const limitRef = db.collection('quoteUploadLimits').doc(key);
    const allowed = await db.runTransaction(async tx => {
      const record = await tx.get(limitRef);
      const count = record.data()?.count || 0;
      if (count >= 10) return false;
      tx.set(limitRef, { count: count + 1, expiresAt: Timestamp.fromMillis(now + 3_600_000) });
      return true;
    });
    if (!allowed) return Response.json({ error: 'Too many uploads. Please try again in an hour.' }, { status: 429 });
    const ref = db.collection('quoteUploads').doc();
    const token = randomBytes(32).toString('hex');
    const expiresAt = Timestamp.fromMillis(now + QUOTE_RETENTION_MS);
    const stagingPath = `quotes/${ref.id}/pending.pdf`;
    const finalPath = `quotes/${ref.id}/quote.pdf`;
    const upload = await bucket.signUpload(stagingPath, data.file.size);
    // Record before issuing upload credentials: abandoned uploads are swept too.
    await ref.set({ tokenHash: createHash('sha256').update(token).digest('hex'), stagingPath, finalPath,
      storageProvider: 'r2', bucket: bucket.name, size: data.file.size, enquiry: data.enquiry, state: 'pending', createdAt: Timestamp.fromMillis(now), expiresAt });
    return Response.json({ id: ref.id, token, url: upload.url, headers: upload.headers }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (cause) {
    if (cause instanceof SyntaxError) return Response.json({ error: 'Invalid upload request.' }, { status: 400 });
    console.error('Quote upload initiation failed', cause instanceof Error ? cause.name : 'Unknown error');
    return Response.json({ error: 'Quote uploads are unavailable. Please try again later or send your enquiry without an attachment.' }, { status: 503 });
  }
}

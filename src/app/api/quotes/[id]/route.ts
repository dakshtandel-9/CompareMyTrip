import { createHash } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { isFirebaseAdmin } from '@/lib/adminApiGuard';
import { quoteStorage } from '@/lib/quoteStorage';
import { MAX_QUOTE_BYTES } from '@/lib/quoteUpload';

export const runtime = 'nodejs';
const validId = (id: string) => /^[a-zA-Z0-9]{20}$/.test(id);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!validId(id)) return Response.json({ error: 'Not found.' }, { status: 404 });
  try {
    const { token } = await request.json();
    if (typeof token !== 'string' || token.length !== 64) return Response.json({ error: 'Invalid upload.' }, { status: 403 });
    const { db, bucket } = quoteStorage();
    const ref = db.collection('quoteUploads').doc(id);
    const data = (await ref.get()).data();
    if (!data || data.tokenHash !== createHash('sha256').update(token).digest('hex')) return Response.json({ error: 'Not found.' }, { status: 404 });
    if (data.expiresAt.toMillis() <= Date.now()) return Response.json({ error: 'This upload has expired. Please upload again.' }, { status: 410 });
    if (data.state === 'ready') return Response.json({ saved: true });
    if (data.storageProvider !== 'r2' || data.bucket !== bucket.name) throw new Error('Storage configuration changed.');
    const stagingPath = `quotes/${id}/pending.pdf`;
    const finalPath = `quotes/${id}/quote.pdf`;
    const metadata = await bucket.inspect(stagingPath);
    if (Number(metadata.size) !== data.size || Number(metadata.size) > MAX_QUOTE_BYTES || metadata.contentType !== 'application/pdf') return Response.json({ error: 'The PDF must be 10 MB or smaller.' }, { status: 400 });
    // Both requests must match the validated ETag: a reused upload URL cannot
    // race validation by replacing the staging object before it is copied.
    if (!metadata.etag) throw new Error('PDF ETag missing.');
    const header = await bucket.readHeader(stagingPath, metadata.etag);
    if (header.toString('ascii') !== '%PDF-') {
      return Response.json({ error: 'This file is not a PDF. Please choose a valid PDF.' }, { status: 400 });
    }
    await bucket.copy(stagingPath, finalPath, metadata.etag);
    await db.runTransaction(async tx => {
      const current = (await tx.get(ref)).data();
      if (!current || current.expiresAt.toMillis() <= Date.now()) throw new Error('Upload expired');
      if (current.state === 'ready') return;
      tx.set(db.collection('contactEnquiries').doc(id), { ...data.enquiry, packageId: '', packageTitle: '', pricePerPerson: 0, userId: '', source: 'contact', status: 'not_contacted', submittedAt: FieldValue.serverTimestamp(), quoteExpiresAt: data.expiresAt });
      tx.update(ref, { state: 'ready', enquiry: FieldValue.delete() });
    });
    // Leave staging cleanup to the scheduled sweep: a still-valid PUT URL
    // could recreate it, so its tracked record must survive until expiry.
    return Response.json({ saved: true });
  } catch {
    return Response.json({ error: 'Your PDF could not be submitted. Please try again.' }, { status: 503 });
  }
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isFirebaseAdmin(request))) return Response.json({ error: 'Not found.' }, { status: 404 });
  const { id } = await context.params;
  if (!validId(id)) return Response.json({ error: 'Not found.' }, { status: 404 });
  try {
    const { db, bucket } = quoteStorage();
    const data = (await db.collection('quoteUploads').doc(id).get()).data();
    if (!data || data.state !== 'ready' || data.expiresAt.toMillis() <= Date.now() || !(await db.collection('contactEnquiries').doc(id).get()).exists) return Response.json({ error: 'This PDF has expired or was removed.' }, { status: 410 });
    if (data.storageProvider !== 'r2' || data.bucket !== bucket.name) throw new Error('Storage configuration changed.');
    const url = await bucket.signDownload(`quotes/${id}/quote.pdf`, data.expiresAt.toMillis());
    return Response.json({ url }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch { return Response.json({ error: 'The PDF is unavailable. Please try again.' }, { status: 503 }); }
}

import { timingSafeEqual } from 'node:crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { quoteStorage } from '@/lib/quoteStorage';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  const provided = request.headers.get('authorization') || '';
  const wanted = `Bearer ${expected}`;
  if (!expected || provided.length !== wanted.length || !timingSafeEqual(Buffer.from(provided), Buffer.from(wanted))) return Response.json({ error: 'Unauthorized.' }, { status: 401 });
  try {
    const { db, bucket } = quoteStorage();
    const expired = await db.collection('quoteUploads').where('expiresAt', '<=', Timestamp.now()).orderBy('expiresAt').limit(100).get();
    let deleted = 0;
    const results = await Promise.allSettled(expired.docs.map(async record => {
      const data = record.data();
      if (data.storageProvider !== 'r2' || data.bucket !== bucket.name) throw new Error('Storage configuration changed; record retained.');
      // Delete storage first. Any failure keeps the record for the next run.
      // Paths are derived from our ID, never accepted from a client.
      await bucket.remove(`quotes/${record.id}/pending.pdf`);
      await bucket.remove(`quotes/${record.id}/quote.pdf`);
      await db.runTransaction(async tx => {
        const enquiry = db.collection('contactEnquiries').doc(record.id);
        const existing = await tx.get(enquiry);
        if (existing.exists) tx.update(enquiry, { quoteExpiresAt: FieldValue.delete() });
        tx.delete(record.ref);
      });
      deleted++;
    }));
    const limits = await db.collection('quoteUploadLimits').where('expiresAt', '<=', Timestamp.now()).limit(400).get();
    if (!limits.empty) {
      const batch = db.batch();
      limits.docs.forEach(record => batch.delete(record.ref));
      await batch.commit();
    }
    const failed = results.filter(result => result.status === 'rejected').length;
    return Response.json({ deleted, failed }, { status: failed ? 500 : 200, headers: { 'Cache-Control': 'no-store' } });
  } catch { return Response.json({ error: 'Cleanup failed; retry required.' }, { status: 500 }); }
}

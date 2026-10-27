import { sendPasswordReset } from '@/lib/passwordResetEmails';

export const runtime = 'nodejs';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* The forgot-password form posts here. An unknown address gets the same
   answer as a sent one. A 503 tells the browser to fall back to Firebase's
   own reset email. */
export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({ error: 'Invalid request origin.' }, { status: 403 });
  if (Number(request.headers.get('content-length')) > 2_000) return Response.json({ error: 'Request too large.' }, { status: 413 });
  const body = await request.json().catch(() => null) as { email?: unknown } | null;
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) return Response.json({ error: 'Enter a valid email address.' }, { status: 400 });
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const result = await sendPasswordReset(email, ip);
  if (result === 'rate-limited') return Response.json({ error: 'Too many reset requests. Please try again in an hour.' }, { status: 429 });
  if (result === 'unavailable') return Response.json({ error: 'Reset email is unavailable.' }, { status: 503 });
  return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}

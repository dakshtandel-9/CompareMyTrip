import { uidFromIdToken } from '@/lib/firebase/admin';
import { welcomeNewAccount } from '@/lib/welcomeEmails';

export const runtime = 'nodejs';

/* Called by the browser right after an account is created. The account is
   identified from its ID token, never from the body, and welcomeNewAccount
   only sends for an account created in the last hour, once. */
export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({ error: 'Invalid request origin.' }, { status: 403 });
  const uid = await uidFromIdToken(request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '');
  if (!uid) return Response.json({ error: 'Sign in again to continue.' }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { guest?: unknown };
  const outcome = await welcomeNewAccount(uid, { guest: body.guest === true });
  return Response.json({ outcome }, { headers: { 'Cache-Control': 'no-store' } });
}

// Isolated workerd integration fixture. Every RPC is intercepted below; this
// Worker has no credentials and never sends a request to Firebase.
import { Firestore, FieldValue } from '@google-cloud/firestore';
import { prepareFirestoreTransport } from '../src/lib/firebase/prepareTransport.ts';

prepareFirestoreTransport();
const timestamp = '2026-09-11T00:00:00.000000Z';
let calls = [];
const createDb = () => new Firestore({
  projectId: 'local-transport-fixture',
  preferRest: true,
  authClient: {
    getRequestHeaders: async () => new Headers(),
    async fetch(url, options) {
      const method = new URL(url).pathname.split(':').at(-1);
      const input = JSON.parse(options.body || '{}');
      calls.push(method);
      if (method === 'batchGet' && input.documents[0].endsWith('/error')) {
        return Response.json({ error: { code: 404, status: 'NOT_FOUND', message: 'Fixture error' } }, { status: 404 });
      }
      let result;
      if (method === 'batchGet') result = [{ missing: input.documents[0], readTime: timestamp }];
      else if (method === 'runQuery') result = [{ readTime: timestamp }];
      else if (method === 'commit') result = { writeResults: input.writes.map(() => ({ updateTime: timestamp })), commitTime: timestamp };
      else throw new Error(`Unexpected fixture RPC: ${method}`);
      return new Response(JSON.stringify(result), { headers: { 'content-type': 'application/json' } });
    },
  },
});

const worker = {
  async fetch() {
    calls = [];
    const db = createDb();
    const missing = await db.collection('coupons').doc('missing').get();
    const query = await db.collection('packages').get();
    await db.collection('trips').doc('local-only').set({ paymentStatus: 'test', updatedAt: FieldValue.serverTimestamp() });
    if (missing.exists || !query.empty) throw new Error('Unexpected fixture data');
    try {
      await db.collection('coupons').doc('error').get();
      throw new Error('Expected a fixture error');
    } catch (error) {
      if (error.code !== 5) throw error;
    }
    return Response.json({ ok: true, calls });
  },
};

export default worker;

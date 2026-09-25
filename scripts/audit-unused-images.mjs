// Read-only audit. Fail closed if any database read fails; never delete here.
import { readdir, readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import nextEnv from '@next/env';
import { cert, initializeApp, deleteApp } from 'firebase-admin/app';
import { initializeFirestore } from 'firebase-admin/firestore';

nextEnv.loadEnvConfig(process.cwd());
const candidates = (await readdir('public', { recursive: true }))
  .filter(file => /^(hotelLogo\/hotel\d+\.png|visaLogo\/visa\d+\.png)$/.test(file));
const references = new Map(candidates.map(file => [file, new Set()]));
function inspect(value, location) {
  // A basename match is deliberately conservative, including encoded URLs.
  let text = typeof value === 'string' ? value : JSON.stringify(value);
  try { text = decodeURIComponent(text); } catch { /* retain original */ }
  for (const file of candidates) {
    if (text.includes(file) || text.includes(file.split('/').at(-1))) references.get(file).add(location);
  }
}
for (const root of ['src', 'content', 'scripts']) {
  for (const file of await readdir(root, { recursive: true })) {
    if (!/\.(tsx?|m?js|json|css)$/.test(file)) continue;
    inspect(await readFile(`${root}/${file}`, 'utf8'), `${root}/${file}`);
  }
}
let app;
const deadline = setTimeout(() => { console.error('Asset audit timed out; nothing may be deleted.'); process.exit(1); }, 60000);
try {
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;
  if (!encoded) throw new Error('Missing database credentials');
  const account = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
  app = initializeApp({ credential: cert(account) }, 'asset-reference-audit');
  const db = initializeFirestore(app, { preferRest: true });
  let documents = 0;
  async function scan(collection) {
    const snapshot = await collection.get();
    for (const document of snapshot.docs) {
      documents++;
      inspect(document.data(), `firestore:${collection.id}`);
      for (const child of await document.ref.listCollections()) await scan(child);
    }
  }
  for (const collection of await db.listCollections()) await scan(collection);
  const files = [];
  for (const [file, matches] of references) files.push({ file, bytes: (await stat(`public/${file}`)).size, references: [...matches] });
  const report = { checkedAt: new Date().toISOString(), databaseReadComplete: true, documents, files };
  await mkdir('tmp/performance', { recursive: true });
  await writeFile('tmp/performance/unused-images.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} catch {
  console.error('Asset audit failed; retain every candidate until a complete authenticated scan succeeds.');
  process.exitCode = 1;
} finally {
  clearTimeout(deadline);
  if (app) await deleteApp(app);
}

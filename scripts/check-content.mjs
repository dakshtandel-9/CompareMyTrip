import nextEnv from '@next/env';
import { cert, initializeApp, deleteApp } from 'firebase-admin/app';
import { initializeFirestore } from 'firebase-admin/firestore';

nextEnv.loadEnvConfig(process.cwd());
let app;
const timeout = setTimeout(() => {
  console.error('Release content check timed out. Restore CMS access before building.');
  process.exit(1);
}, 30000);
try {
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;
  if (!encoded) throw new Error('Firebase Admin credentials are missing.');
  let account;
  try { account = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8')); }
  catch { throw new Error('Firebase Admin credentials are invalid.'); }
  app = initializeApp({ credential: cert(account) }, 'release-content-check');
  const db = initializeFirestore(app, { preferRest: true });
  const packages = await db.collection('packages').get();
  if (!packages.docs.some(doc => doc.id === '_catalog')) throw new Error('The CMS catalogue has not been initialized.');
  const posts = await db.collection('blogPosts').get();
  let published = 0;
  for (const item of packages.docs) {
    if (item.id === '_catalog') continue;
    const pkg = item.data().package;
    if (!pkg || typeof pkg.title !== 'string' || !Number.isFinite(pkg.price)) {
      throw new Error('A package record is malformed. Review the CMS catalogue.');
    }
    if (pkg.status !== 'draft') published++;
  }
  for (const item of posts.docs) {
    if (!item.data().post || typeof item.data().post.title !== 'string') {
      throw new Error('A blog record is malformed. Review the CMS blog.');
    }
  }
  console.log(`CMS content verified: ${published} published package records, ${posts.size} blog records. Production seed fallback is disabled.`);
} catch (error) {
  // SDK failures may contain operational information. Print only our own guidance.
  const safe = ['Firebase Admin credentials are missing.', 'Firebase Admin credentials are invalid.',
    'The CMS catalogue has not been initialized.', 'A package record is malformed. Review the CMS catalogue.',
    'A blog record is malformed. Review the CMS blog.'];
  console.error(`Release content check failed: ${safe.includes(error.message) ? error.message : 'Could not read the CMS. Check Firebase credentials, access and availability.'}`);
  process.exitCode = 1;
} finally {
  clearTimeout(timeout);
  if (app) await deleteApp(app);
}

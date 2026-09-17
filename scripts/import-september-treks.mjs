/** Add the September trek PDFs to the CMS; never replace an existing record.
 * Preview: node scripts/import-september-treks.mjs
 * Save:    node scripts/import-september-treks.mjs --write
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { isDeepStrictEqual } from 'node:util';
import ts from 'typescript';
import nextEnv from '@next/env';
import { cert, initializeApp, deleteApp } from 'firebase-admin/app';
import { initializeFirestore, FieldValue } from 'firebase-admin/firestore';

const directory = 'content/package-imports/september-treks';
const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'manifest.json'), 'utf8'));
const files = manifest.map(entry => entry.file);
function load(file, dependencies = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports, URL, require: (name) => {
    if (!(name in dependencies)) throw new Error(`Unexpected import: ${name}`);
    return dependencies[name];
  }});
  return exports;
}
const sections = load('src/lib/packageDetailSections.ts');
const editor = load('src/app/admin/packages/catalogueEditorState.ts', { '@/lib/packageDetailSections': sections, '@/lib/packageData': load('src/lib/packageData.ts') });
const packages = files.map((file) => JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8')));

for (const pkg of packages) {
  const details = pkg.details;
  const form = {
    ...pkg, ...details,
    nights: String(pkg.nights), days: String(pkg.days), price: String(pkg.price),
    originalPrice: String(pkg.originalPrice), discount: String(pkg.discount),
    places: details.places.join(', '), pageSections: sections.getPackagePageSections(details),
    departureDays: pkg.departureDays.length ? pkg.departureDays : [0, 1, 2, 3, 4, 5, 6],
  };
  const issue = editor.packageValidationIssue(form);
  if (issue) throw new Error(`${pkg.id}: ${issue.message}`);
  for (const photo of details.gallery) {
    if (!photo.startsWith('/') || !fs.existsSync(path.join('public', photo))) throw new Error(`Missing local photo for ${pkg.id}`);
  }
  if (!Number.isFinite(pkg.price) || pkg.price < 0 || (pkg.status !== 'draft' && pkg.price <= 0)) throw new Error(`Missing published price for ${pkg.id}`);
  console.log(`${pkg.title}: ${pkg.status}, ${pkg.price > 0 ? `INR ${pkg.price}/person` : 'price pending'}`);
}

nextEnv.loadEnvConfig(process.cwd());
if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64) throw new Error('Firebase Admin credentials are required.');
const account = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64, 'base64').toString('utf8'));
const app = initializeApp({ credential: cert(account) }, 'september-trek-import');
const timeout = setTimeout(() => { console.error('CMS import timed out. Re-run to check which IDs exist.'); process.exit(1); }, 30000);
try {
  const db = initializeFirestore(app, { preferRest: true });
  const existing = await db.getAll(...packages.map((pkg) => db.collection('packages').doc(pkg.id)));
  const catalogue = await db.collection('packages').get();
  const pending = packages.filter((_, index) => !existing[index].exists);
  for (const pkg of pending) {
    const duplicate = catalogue.docs.find(doc => doc.data().package?.title?.trim().toLowerCase() === pkg.title.trim().toLowerCase());
    if (duplicate) throw new Error(`Existing package with the same title: ${duplicate.id}; no packages were changed.`);
  }
  existing.filter((doc) => doc.exists).forEach((doc) => console.log(`Kept existing package: ${doc.id}`));
  if (!process.argv.includes('--write')) {
    console.log(`Preview only: ${pending.length} package(s) would be created. Pass --write to save.`);
  } else if (pending.length) {
    const batch = db.batch();
    pending.forEach((pkg, index) => batch.create(db.collection('packages').doc(pkg.id), {
      package: pkg, position: Date.now() + index, updatedAt: FieldValue.serverTimestamp(),
      source: { kind: 'user-supplied-pdf', file: manifest.find(entry => entry.file === `${pkg.id}.json`).source },
    }));
    batch.set(db.collection('packages').doc('_catalog'), { initialized: true, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    await batch.commit();
    const saved = await db.getAll(...pending.map((pkg) => db.collection('packages').doc(pkg.id)));
    saved.forEach((doc, index) => {
      if (!isDeepStrictEqual(doc.data()?.package, pending[index])) throw new Error(`Could not verify saved package ${doc.id}`);
      console.log(`Saved and verified: ${doc.id} (${doc.data().package.status})`);
    });
    console.log('The CMS records are saved. Public pages refresh through normal content revalidation.');
  } else {
    console.log('All requested packages already exist; no changes made.');
  }
} finally {
  clearTimeout(timeout);
  await deleteApp(app);
}

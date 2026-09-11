import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';
const loadDependency = createRequire(import.meta.url);

function load(file, mocks = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, require: id => id in mocks ? mocks[id] : loadDependency(id), Response, Request, Buffer, process, console, URL });
  return exports;
}
const shared = load('src/lib/quoteUpload.ts');
const input = { name: 'quote.pdf', size: 10_000_000, type: 'application/pdf' };
test('PDF size boundary, extension, MIME and empty files', () => {
  assert.equal(shared.quoteFileError(input), '');
  assert.match(shared.quoteFileError({ ...input, size: 10_000_001 }), /10 MB/);
  assert.match(shared.quoteFileError({ ...input, size: 0 }), /empty/);
  assert.match(shared.quoteFileError({ ...input, name: 'quote.png' }), /PDF/);
  assert.match(shared.quoteFileError({ ...input, type: 'text/plain' }), /PDF/);
  assert.equal(shared.quoteFileError({ ...input, name: 'QUOTE.PDF', type: '' }), '');
  assert.equal(shared.QUOTE_RETENTION_MS, 259_200_000);
});
test('enquiry validation rejects missing contact data and oversized messages', () => {
  const enquiry = { name: 'Test Traveller', email: 'test@example.com', phone: '+919999999999', destination: 'Bali', departure: '', travellers: '2', message: 'Trip' };
  assert.equal(shared.validQuoteEnquiry(enquiry), true);
  assert.equal(shared.validQuoteEnquiry({ ...enquiry, message: 'a'.repeat(5001) }), false);
  assert.equal(shared.validQuoteEnquiry({ ...enquiry, email: 'wrong' }), false);
});

test('upload signs the validated size and records 72-hour expiry before returning credentials', async () => {
  let record, options;
  const route = load('src/app/api/quotes/route.ts', {
    '@/lib/quoteUpload': shared,
    '@/lib/quoteStorage': { quoteStorage: () => ({
      db: { collection: name => ({ doc: () => name === 'quoteUploads' ? { id: 'abcdefghijklmnopqrst', set: async data => { record = data; } } : {} }), runTransaction: async fn => fn({ get: async () => ({ data: () => undefined }), set: () => {} }) },
      bucket: { name: 'private', signUpload: async (key, size) => { options = { key, size }; return { url: 'https://storage.example', headers: { 'Content-Type': 'application/pdf' } }; } },
    }) },
  });
  process.env.CRON_SECRET = 'test-secret';
  const enquiry = { name: 'Test Traveller', email: 'test@example.com', phone: '+919999999999', destination: '', departure: '', travellers: '2', message: '' };
  const response = await route.POST(new Request('http://localhost/api/quotes', { method: 'POST', headers: { origin: 'http://localhost', 'Content-Type': 'application/json' }, body: JSON.stringify({ file: input, enquiry }) }));
  assert.equal(response.status, 200);
  assert.equal(options.size, 10_000_000);
  assert.equal(record.expiresAt.toMillis() - record.createdAt.toMillis(), 259_200_000);
  assert.equal(record.state, 'pending');
  assert.equal(record.storageProvider, 'r2');
  assert.equal(record.bucket, 'private');
  assert.equal((await response.json()).headers['Content-Type'], 'application/pdf');
});

function cleanupRoute(failStorage = false) {
  const events = [];
  const record = { id: 'abcdefghijklmnopqrst', ref: 'record', data: () => ({ storageProvider: 'r2', bucket: 'private' }) };
  const query = { where: () => query, orderBy: () => query, limit: () => query, get: async () => ({ docs: [record] }) };
  const db = {
    collection: name => name === 'quoteUploads' ? query : name === 'quoteUploadLimits' ? { where: () => ({ limit: () => ({ get: async () => ({ empty: true }) }) }) } : { doc: () => 'enquiry' },
    runTransaction: async fn => fn({ get: async () => ({ exists: true }), update: () => events.push('clear attachment'), delete: () => events.push('delete record') }),
  };
  const bucket = { name: 'private', remove: async path => { events.push(path); if (failStorage) throw new Error('Storage unavailable'); } };
  return { events, route: load('src/app/api/cron/quote-cleanup/route.ts', { '@/lib/quoteStorage': { quoteStorage: () => ({ db, bucket }) } }) };
}
test('cleanup requires cron authentication', async () => {
  process.env.CRON_SECRET = 'test-secret';
  const { route, events } = cleanupRoute();
  assert.equal((await route.GET(new Request('http://localhost/api/cron/quote-cleanup'))).status, 401);
  assert.equal(events.length, 0);
});
test('cleanup removes both objects before deleting upload data', async () => {
  const { route, events } = cleanupRoute();
  const response = await route.GET(new Request('http://localhost/api/cron/quote-cleanup', { headers: { authorization: 'Bearer test-secret' } }));
  assert.equal(response.status, 200);
  assert.deepEqual(events, ['quotes/abcdefghijklmnopqrst/pending.pdf', 'quotes/abcdefghijklmnopqrst/quote.pdf', 'clear attachment', 'delete record']);
});
test('storage deletion failure retains the database record for retry', async () => {
  const { route, events } = cleanupRoute(true);
  const response = await route.GET(new Request('http://localhost/api/cron/quote-cleanup', { headers: { authorization: 'Bearer test-secret' } }));
  assert.equal(response.status, 500);
  assert.equal(events.includes('delete record'), false);
});

test('expired PDFs cannot be downloaded, even before the cleanup runs', async () => {
  let signed = false;
  const route = load('src/app/api/quotes/[id]/route.ts', {
    '@/lib/quoteUpload': shared,
    '@/lib/adminApiGuard': { isFirebaseAdmin: async () => true },
    '@/lib/quoteStorage': { quoteStorage: () => ({ db: { collection: () => ({ doc: () => ({ get: async () => ({ data: () => ({ state: 'ready', expiresAt: { toMillis: () => Date.now() - 1 } }) }) }) }) }, bucket: { signDownload: async () => { signed = true; return 'url'; } } }) },
  });
  const response = await route.GET(new Request('http://localhost/api/quotes/abcdefghijklmnopqrst'), { params: Promise.resolve({ id: 'abcdefghijklmnopqrst' }) });
  assert.equal(response.status, 410);
  assert.equal(signed, false);
});

const r2 = load('src/lib/quoteStorage.ts', {
  './firebase/admin': { getAdminDb: () => null }, './quoteUpload': shared,
});
test('R2 presigned PUT binds content length, type and private caching', async () => {
  const { S3Client } = loadDependency('@aws-sdk/client-s3');
  const client = new S3Client({ region: 'auto', endpoint: 'https://test-account.r2.cloudflarestorage.com', credentials: { accessKeyId: 'test-access', secretAccessKey: 'test-secret' }, requestChecksumCalculation: 'WHEN_REQUIRED' });
  try {
    const bucket = r2.createR2QuoteBucket('private-quotes', client);
    const upload = await bucket.signUpload('quotes/test/pending.pdf', 10_000_000);
    const url = new URL(upload.url);
    assert.equal(url.hostname.endsWith('.r2.cloudflarestorage.com'), true);
    const signed = url.searchParams.get('X-Amz-SignedHeaders').split(';');
    for (const header of ['content-length', 'content-type', 'cache-control']) assert.ok(signed.includes(header));
    assert.equal(url.searchParams.get('X-Amz-Expires'), '600');
    assert.equal(upload.headers['Content-Type'], 'application/pdf');
    assert.equal(upload.headers['Cache-Control'], 'private, no-store');
    await assert.rejects(bucket.signUpload('quotes/test/pending.pdf', 10_000_001), /size/);
    await assert.rejects(bucket.signDownload('quotes/test/quote.pdf', Date.now() - 1), /expired/);
    const download = new URL(await bucket.signDownload('quotes/test/quote.pdf', Date.now() + 30_000));
    assert.ok(Number(download.searchParams.get('X-Amz-Expires')) <= 30);
  } finally { client.destroy(); }
});
test('R2 inspection and copy are bound to the same ETag', async () => {
  const commands = [];
  const bucket = r2.createR2QuoteBucket('private', { send: async command => {
    commands.push(command);
    if (command.constructor.name === 'HeadObjectCommand') return { ContentLength: 5, ContentType: 'application/pdf', ETag: 'validated-etag' };
    if (command.constructor.name === 'GetObjectCommand') return { Body: { transformToByteArray: async () => Buffer.from('%PDF-') } };
    return {};
  } });
  const metadata = await bucket.inspect('quotes/test/pending.pdf');
  assert.equal((await bucket.readHeader('quotes/test/pending.pdf', metadata.etag)).toString(), '%PDF-');
  await bucket.copy('quotes/test/pending.pdf', 'quotes/test/quote.pdf', metadata.etag);
  assert.equal(commands[1].input.IfMatch, 'validated-etag');
  assert.equal(commands[1].input.Range, 'bytes=0-4');
  assert.equal(commands[2].input.CopySourceIfMatch, 'validated-etag');
  assert.equal(commands[2].input.CacheControl, 'private, no-store');
});

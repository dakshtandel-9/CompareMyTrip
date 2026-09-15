import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function loadDeleteImage(fetch) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync('src/lib/cloudflareUpload.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, {
    exports, URL, fetch,
    require: (name) => {
      assert.equal(name, '@/lib/firebase/client');
      return { getFirebaseAuth: () => ({
        authStateReady: async () => {},
        currentUser: { getIdToken: async () => 'test-token' },
      }) };
    },
  });
  return exports.deleteImageFromCloudflare;
}

test('built-in package images and empty slots do not request storage deletion', async () => {
  const remove = loadDeleteImage(() => assert.fail('Unexpected storage request'));
  for (const image of ['/weekend-treks/savandurga.jpg', '/destinations/kerala.jpg', '', 'data:image/png;base64,abc']) {
    await remove(image);
  }
});

test('uploaded images are sent to the authenticated deletion endpoint', async () => {
  let calls = 0;
  const image = 'https://images.example.com/packages/upload.webp';
  const remove = loadDeleteImage(async (url, options) => {
    calls++;
    assert.equal(url, '/api/uploads/image');
    assert.equal(options.method, 'DELETE');
    assert.equal(options.headers.Authorization, 'Bearer test-token');
    assert.deepEqual(JSON.parse(options.body), { url: image });
    return { ok: true, json: async () => ({ removed: true }) };
  });
  await remove(image);
  assert.equal(calls, 1);
});

test('real storage failures remain visible to cleanup callers', async () => {
  const remove = loadDeleteImage(async () => ({
    ok: false, json: async () => ({ error: 'Storage unavailable' }),
  }));
  await assert.rejects(remove('https://images.example.com/packages/upload.webp'), /Storage unavailable/);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const { NextRequest, NextResponse } = require('next/server');
function load(file, dependencies = {}, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports, Headers, Request, Response, URL, AbortSignal, ...globals, require(name) {
    assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`);
    return dependencies[name];
  } });
  return exports;
}
const preview = load('src/lib/adminPreview.ts');
const settings = load('src/lib/comingSoon.ts');

function guard({ tokenValid = true, member = true, disabled = false, offline = false } = {}) {
  const calls = { verified: [], read: [] };
  const guardModule = load('src/lib/serverAdminGuard.ts', {
    './firebase/admin': {
      getAdminAuth: () => ({ verifyIdToken: async (token, checkRevoked) => {
        calls.verified.push({ token, checkRevoked });
        if (offline || !tokenValid || disabled) throw new Error('not authorized');
        return { uid: 'verified-uid' };
      } }),
      getAdminDb: () => ({ collection: name => ({ doc: id => ({ get: async () => {
        calls.read.push(`${name}/${id}`);
        if (offline) throw new Error('offline');
        return { exists: member };
      } }) }) }),
    },
    './adminApiGuard': { notFound: () => 'not-found' },
  });
  return { ...guardModule, calls };
}

function edgeGuard({ authorized = true, offline = false } = {}) {
  const calls = [];
  const guardModule = load('src/lib/adminApiGuard.ts', {}, {
    fetch: async (url, options) => {
      calls.push({ url: String(url), options });
      if (offline) throw new Error('offline');
      return { ok: authorized, json: async () => ({ authorized }) };
    },
  });
  return { ...guardModule, calls };
}

function session(verify) {
  return load('src/app/api/admin/preview-session/route.ts', {
    'next/server': { NextResponse },
    '@/lib/serverAdminGuard': { isFirebaseAdmin: verify },
    '@/lib/adminPreview': preview,
  });
}
function previewCheck(verify) {
  return load('src/app/api/admin/preview-check/route.ts', {
    '@/lib/serverAdminGuard': { isFirebaseAdmin: verify },
  });
}
function request(method = 'POST', origin = 'https://example.com') {
  return new Request('https://example.com/api/admin/preview-session', {
    method, headers: { origin, authorization: 'Bearer firebase-token' },
  });
}
function checkRequest(origin = 'https://example.com') {
  return new Request('https://example.com/api/admin/preview-check', {
    method: 'POST', headers: { origin, authorization: 'Bearer firebase-token' },
  });
}

test('preview requires a verified Firebase identity and current admin membership', async () => {
  for (const options of [{}, { tokenValid: false }, { member: false }, { disabled: true }]) {
    const verifier = guard(options);
    const response = await session(verifier.isFirebaseAdmin).POST(request());
    const authorized = !Object.values(options).includes(false) && !options.disabled;
    assert.equal(response.status, authorized ? 200 : 403);
    assert.equal((await response.json()).authorized, authorized);
    const cookie = response.cookies.get(preview.ADMIN_PREVIEW_COOKIE);
    assert.equal(cookie.value, authorized ? 'firebase-token' : '');
    assert.equal(cookie.maxAge, authorized ? 3600 : 0);
    assert.equal(cookie.httpOnly, true);
    assert.equal(cookie.secure, true);
    assert.equal(cookie.sameSite, 'lax');
    assert.match(response.headers.get('cache-control'), /private.*no-store/);
    assert.deepEqual(verifier.calls.verified, [{ token: 'firebase-token', checkRevoked: true }]);
    assert.deepEqual(verifier.calls.read, options.tokenValid === false || options.disabled
      ? []
      : ['admins/verified-uid']);
  }
});

test('unavailable admin verification clears preview access and sign-out expires its cookie', async () => {
  const routes = session(guard({ offline: true }).isFirebaseAdmin);
  const failed = await routes.POST(request());
  assert.equal(failed.status, 403);
  assert.equal(failed.cookies.get(preview.ADMIN_PREVIEW_COOKIE).maxAge, 0);
  const signedOut = await routes.DELETE(request('DELETE'));
  assert.equal(signedOut.status, 200);
  assert.equal(signedOut.cookies.get(preview.ADMIN_PREVIEW_COOKIE).maxAge, 0);
});

test('Edge admin checks use the same-origin Node route, which works with Firestore App Check enforced', async () => {
  const edge = edgeGuard();
  const request = new Request('https://example.com/packages/bali', {
    headers: { authorization: 'Bearer firebase-token' },
  });
  assert.equal(await edge.isFirebaseAdmin(request, AbortSignal.timeout(1000)), true);
  assert.equal(edge.calls.length, 1);
  assert.equal(edge.calls[0].url, 'https://example.com/api/admin/preview-check');
  assert.equal(edge.calls[0].options.method, 'POST');
  assert.equal(edge.calls[0].options.headers.authorization, 'Bearer firebase-token');
  assert.equal(edge.calls[0].options.headers.origin, 'https://example.com');
  assert.equal(edge.calls[0].options.cache, 'no-store');

  assert.equal(await edgeGuard({ authorized: false }).isFirebaseAdmin(request), false);
  assert.equal(await edgeGuard({ offline: true }).isFirebaseAdmin(request), false);
  assert.equal(await edge.isFirebaseAdmin(new Request('https://example.com/'), undefined), false);
});

test('Node preview-check validates same-origin calls and returns only the authorization result', async () => {
  const verifier = guard();
  const route = previewCheck(verifier.isFirebaseAdmin);
  const allowed = await route.POST(checkRequest());
  assert.equal(allowed.status, 200);
  assert.deepEqual(await allowed.json(), { authorized: true });
  assert.equal(allowed.headers.get('cache-control'), 'private, no-store, max-age=0');

  const denied = await previewCheck(guard({ member: false }).isFirebaseAdmin).POST(checkRequest());
  assert.equal(denied.status, 403);
  assert.deepEqual(await denied.json(), { authorized: false });

  let checks = 0;
  const crossOrigin = await previewCheck(async () => { checks++; return true; }).POST(checkRequest('https://attacker.example'));
  assert.equal(crossOrigin.status, 403);
  assert.deepEqual(await crossOrigin.json(), { authorized: false });
  assert.equal(checks, 0);
});

test('another origin cannot establish or clear an admin preview session', async () => {
  let checks = 0;
  const routes = session(async () => { checks++; return true; });
  for (const method of ['POST', 'DELETE']) {
    const response = await routes[method](request(method, 'https://other.example'));
    assert.equal(response.status, 403);
    assert.equal(response.headers.has('set-cookie'), false);
  }
  assert.equal(checks, 0);
});

test('middleware permits verified admin deep links and keeps previews out of shared caches', async () => {
  let checks = 0;
  const { middleware } = load('src/middleware.ts', {
    'next/server': { NextResponse },
    '@/lib/comingSoon': settings,
    '@/lib/comingSoonServer': { readComingSoonEnabled: async () => true },
    '@/lib/adminPreview': preview,
    '@/lib/adminApiGuard': { isFirebaseAdmin: async (identity, signal) => {
      checks++;
      assert.equal(identity.headers.get('authorization'), 'Bearer firebase-token');
      assert.ok(signal);
      return true;
    } },
  });
  for (const path of ['/', '/packages/bali?date=2026-10-01', '/pay', '/compare', '/contact']) {
    for (const method of ['GET', 'HEAD']) {
      const response = await middleware(new NextRequest(`https://example.com${path}`, {
        method, headers: { cookie: `${preview.ADMIN_PREVIEW_COOKIE}=firebase-token` },
      }));
      assert.equal(response.headers.get('x-middleware-next'), '1');
      assert.match(response.headers.get('cache-control'), /private.*no-store/);
      assert.equal(response.headers.get('vary'), 'Cookie');
    }
  }
  assert.equal(checks, 10, 'membership is checked on every request');
});

test('absent, forged, expired, removed-admin and unavailable sessions retain coming-soon redirects', async () => {
  for (const cookie of ['', 'true', 'forged', 'expired', 'removed-admin', 'offline']) {
    const { middleware } = load('src/middleware.ts', {
      'next/server': { NextResponse },
      '@/lib/comingSoon': settings,
      '@/lib/comingSoonServer': { readComingSoonEnabled: async () => true },
      '@/lib/adminPreview': preview,
      '@/lib/adminApiGuard': { isFirebaseAdmin: async () => {
        if (cookie === 'offline') throw new Error('offline');
        return false;
      } },
    });
    const response = await middleware(new NextRequest('https://example.com/packages/bali?date=2026-10-01', {
      headers: cookie ? { cookie: `${preview.ADMIN_PREVIEW_COOKIE}=${cookie}` } : {},
    }));
    assert.equal(response.status, 307, cookie);
    const destination = new URL(response.headers.get('location'));
    assert.equal(destination.pathname, '/coming-soon');
    assert.equal(destination.searchParams.get('next'), '/packages/bali?date=2026-10-01');
    if (cookie) assert.equal(response.cookies.get(preview.ADMIN_PREVIEW_COOKIE).value, '');
  }
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(file, globals = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, URL, URLSearchParams, ...globals });
  return exports;
}

function setup({ persistence, popupError } = {}) {
  const calls = [];
  const user = { uid: 'traveller', displayName: 'Google name', email: 'traveller@example.com' };
  const auth = {};
  const provider = {};
  const sdk = {
    browserLocalPersistence: 'local', browserSessionPersistence: 'session',
    setPersistence(instance, preference) {
      assert.equal(instance, auth);
      calls.push(['persistence', preference]);
      return persistence ?? Promise.resolve();
    },
    signInWithPopup(instance, selectedProvider) {
      assert.equal(instance, auth);
      assert.equal(selectedProvider, provider);
      calls.push(['popup']);
      return popupError ? Promise.reject(popupError) : Promise.resolve({ user });
    },
  };
  const library = load('src/lib/firebase/auth.ts', {
    require(name) {
      if (name === 'firebase/auth') return sdk;
      if (name === 'firebase/firestore') return {};
      if (name === './client') return {
        getFirebaseAuth: () => auth,
        createGoogleProvider: () => provider,
        getFirebaseDb: () => { throw new Error('Firestore unavailable'); },
      };
      if (name === './profileEvents') return {};
      throw new Error(`Unexpected module: ${name}`);
    },
  });
  return { ...library, calls, user };
}

test('Google popup starts without waiting for browser persistence, then honors the selected preference', async () => {
  let finishPersistence;
  const h = setup({ persistence: new Promise(resolve => { finishPersistence = resolve; }) });
  const pending = h.signInWithGoogle({ remember: false });
  assert.deepEqual(h.calls, [['persistence', 'session'], ['popup']]);
  let completed = false;
  pending.then(() => { completed = true; });
  await new Promise(setImmediate);
  assert.equal(completed, false);
  finishPersistence();
  assert.equal(await pending, h.user);
});

test('successful Google login does not depend on Firestore or overwrite the customer profile', async () => {
  const h = setup();
  assert.equal(await h.signInWithGoogle(), h.user);
  assert.deepEqual(h.calls, [['persistence', 'local'], ['popup']]);
});

test('Google popup errors remain distinguishable and actionable', async () => {
  const failure = { code: 'auth/unauthorized-domain' };
  const h = setup({ popupError: failure });
  await assert.rejects(h.signInWithGoogle(), error => error === failure);
  assert.match(h.getAuthErrorMessage(failure), /website address/);
  assert.match(h.getAuthErrorMessage({ code: 'auth/popup-blocked' }), /Allow pop-ups/);
  assert.match(h.getAuthErrorMessage({ code: 'auth/operation-not-allowed' }), /another method/);
  assert.match(h.getAuthErrorMessage({ code: 'auth/account-exists-with-different-credential' }), /original method/);
  assert.equal(h.getAuthErrorMessage(undefined), 'Something went wrong. Please try again.');
});

const destination = load('src/lib/firebase/authDestination.ts');
test('sign-in keeps a same-origin checkout return, including query and fragment, through signup', () => {
  const next = '/checkout?package=kerala&travellers=2#details';
  const search = `?${new URLSearchParams({ next })}`;
  assert.equal(destination.getAuthDestination(search, 'https://comparemytrip.in'), next);
  const signup = destination.getAuthPageHref('/signup', next);
  assert.equal(destination.getAuthDestination(new URL(signup, 'https://comparemytrip.in').search, 'https://comparemytrip.in'), next);
});

test('sign-in rejects external, malformed and looping return addresses', () => {
  for (const next of ['https://evil.example', '//evil.example', '/\\evil.example', '/login', '/signup?next=/login', '/forgot-password', 'javascript:alert(1)']) {
    assert.equal(destination.getAuthDestination(`?${new URLSearchParams({ next })}`, 'https://comparemytrip.in'), '/');
  }
  assert.equal(destination.getAuthDestination('', 'https://comparemytrip.in'), '/');
  assert.equal(destination.getAuthPageHref('/login', '/'), '/login');
});

test('profile completion still signals the current tab when browser storage is blocked', () => {
  const events = [];
  const profiles = load('src/lib/firebase/profileEvents.ts', {
    sessionStorage: { setItem() { throw new Error('SecurityError'); }, getItem() { throw new Error('SecurityError'); } },
    window: { dispatchEvent: event => events.push(event) },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
  });
  profiles.markProfileCompleted('traveller');
  assert.equal(events[0].type, profiles.USER_PROFILE_SAVED_EVENT);
  assert.equal(events[0].detail.uid, 'traveller');
  assert.equal(profiles.consumeCompletedProfile('traveller'), false);
});

test('both Google auth forms capture the return address before the guest guard changes the URL', async () => {
  for (const page of ['login', 'signup']) {
    const next = '/checkout?package=kerala';
    const location = { origin: 'https://comparemytrip.in', search: `?${new URLSearchParams({ next })}` };
    const redirects = [];
    const jsx = (type, props) => ({ type, props });
    const exports = load(`src/app/(auth)/${page}/page.tsx`, {
      window: { location },
      require(name) {
        if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
        if (name === 'react') return { useState: initial => [initial, () => {}] };
        if (name === 'next/navigation') return { useRouter: () => ({ push: value => redirects.push(value) }) };
        if (name === '@/lib/firebase/authDestination') return destination;
        if (name === '@/lib/firebase/useAuthDestination') return { useAuthDestination: () => next };
        if (name === '@/lib/useSiteContent') return { useSiteContent: () => ({ auth: { login: { trust: [] }, signup: { features: [] } } }) };
        if (name === '@/lib/firebase/auth') return {
          async signInWithGoogle() {
            // Firebase emits auth state before the form's await completes;
            // RequireGuest has now moved from /login?next=... to checkout.
            location.search = '?package=kerala';
          },
          getAuthErrorMessage: error => String(error),
        };
        return { __esModule: true, default: name };
      },
    });
    const tree = exports.default();
    function findGoogle(node) {
      if (!node || typeof node !== 'object') return undefined;
      if (Array.isArray(node)) return node.map(findGoogle).find(Boolean);
      if (node.props?.children === 'Continue with Google') return node;
      return findGoogle(node.props?.children);
    }
    const button = findGoogle(tree);
    assert.ok(button, `${page} renders the Google sign-in action`);
    await button.props.onClick();
    assert.deepEqual(redirects, [next], `${page} preserves the original destination`);
  }
});

function setupProfileSave() {
  const timers = new Map();
  let nextTimer = 0;
  const profileLibrary = load('src/lib/firebase/profileSave.ts', {
    setTimeout(fn) { timers.set(++nextTimer, fn); return nextTimer; },
    clearTimeout(id) { timers.delete(id); },
  });
  return {
    ...profileLibrary,
    controller: profileLibrary.createProfileSaveController(),
    timers,
    expire() { const pending = [...timers.values()]; timers.clear(); pending.forEach(fn => fn()); },
  };
}

test('an offline profile save times out, rechecks the same pending write, and completes when connectivity returns', async () => {
  const h = setupProfileSave();
  let resolveWrite, writes = 0, completed = 0;
  const request = new Promise(resolve => { resolveWrite = resolve; });
  const first = h.controller.start('traveller', () => { writes++; return request; }, () => completed++);
  const timedOut = assert.rejects(first, error => error instanceof h.ProfileSaveTimeoutError);
  await new Promise(setImmediate);
  h.expire();
  await timedOut;
  assert.equal(writes, 1);
  const retry = h.controller.start('traveller', () => { throw new Error('Must not enqueue competing edits'); }, () => { throw new Error('Must reuse completion'); });
  resolveWrite();
  await retry;
  assert.equal(completed, 1);
  assert.equal(writes, 1);
  assert.equal(h.timers.size, 0);
});

test('late save completion from a previous account cannot complete the newly active profile request', async () => {
  const h = setupProfileSave();
  let resolveOld, resolveNew;
  const completed = [];
  const old = h.controller.start('old-user', () => new Promise(resolve => { resolveOld = resolve; }), () => completed.push('old'));
  const current = h.controller.start('new-user', () => new Promise(resolve => { resolveNew = resolve; }), () => completed.push('new'));
  await new Promise(setImmediate);
  resolveOld();
  await old;
  assert.deepEqual(completed, []);
  resolveNew();
  await current;
  assert.deepEqual(completed, ['new']);
  assert.equal(h.timers.size, 0);
});

test('a rejected profile write can be corrected and retried without leaving timers behind', async () => {
  const h = setupProfileSave();
  await assert.rejects(h.controller.start('traveller', () => Promise.reject(new Error('Permission denied')), () => {}), /Permission denied/);
  let complete = false;
  await h.controller.start('traveller', () => Promise.resolve(), () => { complete = true; });
  assert.equal(complete, true);
  assert.equal(h.timers.size, 0);
});

test('a pending save belonging to the previous account cannot disable the next account profile form', () => {
  const h = setupProfileSave();
  const previous = { uid: 'old-user', saving: true, pending: true, failed: true };
  assert.equal(h.getProfileSaveStateForUser(previous, 'old-user'), previous);
  for (const uid of ['new-user', null, undefined]) {
    const current = h.getProfileSaveStateForUser(previous, uid);
    assert.equal(current.saving, false);
    assert.equal(current.pending, false);
    assert.equal(current.failed, false);
  }
  // The retained old request is still visibly pending if that same account
  // returns; signing out must not silently discard a queued Firestore write.
  assert.equal(h.getProfileSaveStateForUser(previous, 'old-user').pending, true);
});

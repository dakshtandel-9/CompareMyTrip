import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(file, dependencies = {}, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, {
    exports, URL, URLSearchParams, queueMicrotask, process: { env: { NODE_ENV: 'production' } }, ...globals,
    require(name) {
      assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  });
  return exports;
}

const jsx = (type, props) => ({ type, props });
const jsxRuntime = { jsx, jsxs: jsx, Fragment: 'fragment' };
const destination = load('src/lib/firebase/authDestination.ts');
const comingSoon = load('src/lib/comingSoon.ts');

// Exercise the component's observable states, effects and event handlers without
// a browser or a Firebase account. The requests and timers stay under test control.
function renderer() {
  const slots = [];
  let cursor = 0, dirty = true, Component, props, tree;
  const effects = [];
  const same = (a, b) => a && b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: typeof initial === 'function' ? initial() : initial };
      return [slots[index].value, next => {
        const value = typeof next === 'function' ? next(slots[index].value) : next;
        if (!Object.is(value, slots[index].value)) { slots[index].value = value; dirty = true; }
      }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { current: initial };
      return slots[index];
    },
    useEffect(effect, dependencies) {
      const index = cursor++;
      if (!slots[index] || !same(slots[index].dependencies, dependencies)) {
        const previous = slots[index];
        slots[index] = { dependencies, cleanup: previous?.cleanup };
        effects.push(() => {
          slots[index].cleanup?.();
          slots[index].cleanup = effect();
        });
      }
    },
  };
  function flush() {
    let iterations = 0;
    while (dirty) {
      assert.ok(++iterations < 30, 'component effects settle');
      dirty = false;
      cursor = 0;
      tree = Component(props);
      effects.splice(0).forEach(effect => effect());
    }
    return tree;
  }
  return {
    react,
    mount(component, value) { Component = component; props = value; return flush(); },
    render() { dirty = true; return flush(); },
    async settle() { await new Promise(setImmediate); return flush(); },
    get tree() { return tree; },
  };
}

function nodes(tree) {
  if (tree === null || tree === undefined || tree === false) return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (typeof tree !== 'object') return [tree];
  return [tree, ...nodes(tree.props?.children)];
}

function text(tree) {
  return nodes(tree).filter(node => typeof node === 'string' || typeof node === 'number').join(' ');
}

function button(tree, label) {
  const found = nodes(tree).find(node => node?.type === 'button' && label.test(text(node)));
  assert.ok(found, `button matching ${label} is available`);
  return found;
}

function deferred() {
  let resolve, reject;
  const promise = new Promise((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}

const protectedChild = { type: 'protected-admin-content', props: {} };
function hasProtected(tree) { return nodes(tree).includes(protectedChild); }

function setupAdmin({ user = { uid: 'admin-a', email: 'admin@example.com' }, signOutError } = {}) {
  const view = renderer();
  const timers = new Map();
  const requests = [];
  const redirects = [];
  let nextTimer = 0, signOutCalls = 0;
  const location = {
    origin: 'https://comparemytrip.in', pathname: '/admin/content',
    search: '?section=coming-soon', hash: '#settings',
  };
  const auth = { currentUser: user };
  const router = { replace: value => redirects.push(value) };
  const timerGlobals = {
    setTimeout(callback, delay) { timers.set(++nextTimer, { callback, delay }); return nextTimer; },
    clearTimeout(id) { timers.delete(id); },
  };
  const { default: AdminAccessGate } = load('src/app/admin/_components/AdminAccessGate.tsx', {
    react: view.react,
    'react/jsx-runtime': jsxRuntime,
    'next/navigation': { useRouter: () => router, usePathname: () => location.pathname },
    'next/link': { __esModule: true, default: 'link' },
    'lucide-react': {},
    'firebase/firestore': {
      doc: (_db, collection, uid) => ({ collection, uid }),
      getDocFromServer(reference) {
        assert.equal(reference.collection, 'admins');
        const request = deferred();
        requests.push({ ...request, uid: reference.uid });
        return request.promise;
      },
    },
    'firebase/auth': { async signOut(instance) {
      assert.equal(instance, auth);
      signOutCalls++;
      if (signOutError) throw signOutError;
      auth.currentUser = null;
    } },
    '@/lib/firebase/client': { getFirebaseDb: () => ({}), getFirebaseAuth: () => auth },
    '@/lib/firebase/useAuthUser': { useAuthUser: () => auth.currentUser },
    '@/lib/firebase/authDestination': destination,
  }, { window: { location, ...timerGlobals }, ...timerGlobals });
  view.mount(AdminAccessGate, { children: protectedChild });
  return {
    view, requests, redirects, timers, location,
    get signOutCalls() { return signOutCalls; },
    setUser(value) { auth.currentUser = value; view.render(); },
    expire() {
      const timeouts = [...timers.values()].filter(timer => timer.delay === 10000);
      assert.ok(timeouts.length, 'admin verification has a bounded timeout');
      timers.clear();
      timeouts.forEach(timer => timer.callback());
      view.render();
    },
  };
}

test('signed-out admin bookmarks go to login with their complete return address', async () => {
  const h = setupAdmin({ user: null });
  await h.view.settle();
  assert.equal(hasProtected(h.view.tree), false);
  assert.equal(h.requests.length, 0);
  assert.equal(h.redirects.length, 1);
  const login = new URL(h.redirects[0], h.location.origin);
  assert.equal(login.pathname, '/login');
  assert.equal(login.searchParams.get('next'), '/admin/content?section=coming-soon#settings');
});

test('admin content appears only after server membership verification succeeds', async () => {
  const h = setupAdmin();
  await h.view.settle();
  assert.equal(hasProtected(h.view.tree), false);
  assert.equal(h.requests[0].uid, 'admin-a');
  h.requests[0].resolve({ exists: () => true });
  await h.view.settle();
  assert.equal(hasProtected(h.view.tree), true);
  assert.equal(h.timers.size, 0);
  assert.deepEqual(h.redirects, []);
});

test('a signed-in non-member can switch accounts without a misleading 404', async () => {
  const h = setupAdmin();
  await h.view.settle();
  h.requests[0].resolve({ exists: () => false });
  await h.view.settle();
  assert.equal(hasProtected(h.view.tree), false);
  assert.deepEqual(h.redirects, []);
  await button(h.view.tree, /another account|switch account/i).props.onClick();
  await h.view.settle();
  assert.equal(h.signOutCalls, 1);
  h.view.render();
  await h.view.settle();
  assert.ok(h.redirects.length);
  assert.equal(new URL(h.redirects.at(-1), h.location.origin).searchParams.get('next'), '/admin/content?section=coming-soon#settings');
});

test('a failed membership lookup offers a retry that can recover', async () => {
  const h = setupAdmin();
  await h.view.settle();
  h.requests[0].reject(new Error('Connection unavailable'));
  await h.view.settle();
  assert.equal(hasProtected(h.view.tree), false);
  assert.deepEqual(h.redirects, []);
  await button(h.view.tree, /retry|try again/i).props.onClick();
  await h.view.settle();
  assert.equal(h.requests.length, 2);
  assert.equal(hasProtected(h.view.tree), false);
  h.requests[1].resolve({ exists: () => true });
  await h.view.settle();
  assert.equal(hasProtected(h.view.tree), true);
});

test('a stalled membership lookup times out and cannot authorize through a late result', async () => {
  const h = setupAdmin();
  await h.view.settle();
  h.expire();
  await h.view.settle();
  assert.equal(hasProtected(h.view.tree), false);
  button(h.view.tree, /retry|try again/i);
  button(h.view.tree, /another account|switch account/i);
  h.requests[0].resolve({ exists: () => true });
  await h.view.settle();
  assert.equal(hasProtected(h.view.tree), false);
});

test('membership results belonging to a previous account cannot unlock the current account', async () => {
  const h = setupAdmin();
  await h.view.settle();
  h.setUser({ uid: 'admin-b', email: 'second@example.com' });
  await h.view.settle();
  assert.equal(h.requests.length, 2);
  h.requests[0].resolve({ exists: () => true });
  await h.view.settle();
  assert.equal(hasProtected(h.view.tree), false);
  h.requests[1].resolve({ exists: () => false });
  await h.view.settle();
  assert.equal(hasProtected(h.view.tree), false);
  button(h.view.tree, /another account|switch account/i);
});

test('signing back into the same UID requires fresh membership verification', async () => {
  const h = setupAdmin();
  await h.view.settle();
  h.requests[0].resolve({ exists: () => true });
  await h.view.settle();
  assert.equal(hasProtected(h.view.tree), true);
  h.setUser(null);
  assert.equal(hasProtected(h.view.tree), false);
  h.setUser({ uid: 'admin-a', email: 'admin@example.com' });
  await h.view.settle();
  assert.equal(h.requests.length, 2);
  assert.equal(hasProtected(h.view.tree), false, 'a new sign-in does not reuse the old membership result');
  h.requests[1].resolve({ exists: () => false });
  await h.view.settle();
  assert.equal(hasProtected(h.view.tree), false);
  button(h.view.tree, /another account|switch account/i);
});

test('a failed account switch stays recoverable and does not reveal admin content', async () => {
  const h = setupAdmin({ signOutError: new Error('Storage unavailable') });
  await h.view.settle();
  h.requests[0].resolve({ exists: () => false });
  await h.view.settle();
  await button(h.view.tree, /another account|switch account/i).props.onClick();
  await h.view.settle();
  assert.equal(h.signOutCalls, 1);
  assert.equal(hasProtected(h.view.tree), false);
  assert.deepEqual(h.redirects, []);
  assert.match(text(h.view.tree), /sign.*out|retry|try again/i);
  button(h.view.tree, /another account|switch account/i);
});

test('admin and sign-in routes never mount customer profile completion', () => {
  for (const enabled of [false, true]) {
    // Public signup intentionally remains unavailable during maintenance.
    const paths = ['/admin', '/admin/content', '/login', '/forgot-password', ...(!enabled ? ['/signup'] : [])];
    for (const path of paths) {
    const view = renderer();
    const ProfileCompletionGate = 'customer-profile-completion';
    const chrome = ['coming-soon-screen', 'floating-actions', 'mobile-navigation', 'trip-plan-prompt'];
    const { default: SiteExperience } = load('src/components/SiteExperience.tsx', {
      react: view.react,
      'react/jsx-runtime': jsxRuntime,
      'next/navigation': { usePathname: () => path, useRouter: () => ({ replace() {} }) },
      '@/lib/comingSoon': comingSoon,
      '@/lib/firebase/useAdminPreview': { useAdminPreview: () => 'denied' },
      '@/lib/firebase/authDestination': destination,
      '@/lib/useSiteContent': { useSiteContentState: () => ({ loading: false, content: { comingSoon: { enabled } } }) },
      './ComingSoonScreen': { __esModule: true, default: chrome[0] },
      './FloatingActions': { __esModule: true, default: chrome[1] },
      './MobileNavigation': { __esModule: true, default: chrome[2] },
      'next/dynamic': { __esModule: true, default: () => ProfileCompletionGate },
      '@/lib/firebase/useAuthUser': { useAuthUser: () => ({ uid: 'customer' }) },
      './TripPlanPromptDialog': { __esModule: true, default: chrome[3] },
    });
    const tree = view.mount(SiteExperience, { children: protectedChild });
    assert.equal(hasProtected(tree), true, `${path} retains its own authentication surface`);
    assert.equal(nodes(tree).some(node => node?.type === ProfileCompletionGate), false, `${path} does not ask for a traveller phone number`);
    assert.equal(nodes(tree).some(node => chrome.includes(node?.type)), false, `${path} omits customer overlays`);
    }
  }
});

test('only verified admins see the website during coming-soon mode, including cached navigation and sign-out', () => {
  const view = renderer();
  let preview = 'checking';
  let path = '/packages/bali';
  const redirects = [];
  const router = { replace: value => redirects.push(value) };
  const { default: SiteExperience } = load('src/components/SiteExperience.tsx', {
    react: view.react,
    'react/jsx-runtime': jsxRuntime,
    'next/navigation': { usePathname: () => path, useRouter: () => router },
    '@/lib/comingSoon': comingSoon,
    '@/lib/firebase/useAdminPreview': { useAdminPreview: () => preview },
    '@/lib/firebase/authDestination': destination,
    '@/lib/useSiteContent': { useSiteContentState: () => ({ loading: false, content: { comingSoon: { enabled: true } } }) },
    './ComingSoonScreen': { __esModule: true, default: 'coming-soon-screen' },
    './FloatingActions': { __esModule: true, default: 'floating-actions' },
    './MobileNavigation': { __esModule: true, default: 'mobile-navigation' },
    'next/dynamic': { __esModule: true, default: () => 'profile-completion' },
    '@/lib/firebase/useAuthUser': { useAuthUser: () => ({ uid: 'customer' }) },
    './TripPlanPromptDialog': { __esModule: true, default: 'trip-prompt' },
  }, { window: { location: { pathname: path, search: '?date=2026-10-01', hash: '#itinerary', origin: 'https://example.com' } } });
  view.mount(SiteExperience, { children: protectedChild });
  assert.equal(hasProtected(view.tree), false, 'no content is exposed while checking');
  assert.equal(redirects.length, 0, 'wait for verification before redirecting an admin');
  preview = 'authorized';
  view.render();
  assert.equal(hasProtected(view.tree), true);
  assert.equal(nodes(view.tree).some(node => ['profile-completion', 'trip-prompt'].includes(node?.type)), false);
  preview = 'denied';
  view.render();
  assert.equal(hasProtected(view.tree), false, 'sign-out and non-admin accounts are gated');
  assert.equal(new URL(redirects.at(-1), 'https://example.com').searchParams.get('next'), '/packages/bali?date=2026-10-01#itinerary');
  path = '/coming-soon';
  preview = 'authorized';
  view.render();
  assert.equal(redirects.at(-1), '/', 'an already signed-in admin leaves the coming-soon page');
});

test('admin preview session waits for verification and serializes sign-out behind an in-flight sign-in', async () => {
  const view = renderer();
  const admin = { uid: 'admin-a', getIdToken: async () => 'firebase-token' };
  let user = admin;
  let tokenChanged;
  let path = '/packages';
  const requests = [];
  const { useAdminPreview } = load('src/lib/firebase/useAdminPreview.ts', {
    react: view.react,
    'firebase/auth': { onIdTokenChanged: (_, callback) => { tokenChanged = callback; queueMicrotask(() => callback(user)); return () => {}; } },
    '@/lib/adminPreview': { ADMIN_PREVIEW_SESSION_PATH: '/api/admin/preview-session' },
    './client': { getFirebaseAuth: () => ({}) },
    './useAuthUser': { useAuthUser: () => user },
  }, {
    AbortSignal,
    fetch: async (url, options) => {
      const pending = deferred();
      requests.push({ url, options, ...pending });
      return pending.promise;
    },
  });
  view.mount(() => ({ type: useAdminPreview(path) }));
  await view.settle();
  assert.equal(view.tree.type, 'checking');
  assert.equal(requests[0].options.method, 'POST');
  assert.equal(requests[0].options.headers.authorization, 'Bearer firebase-token');
  user = null;
  tokenChanged(null);
  view.render();
  assert.equal(view.tree.type, 'denied', 'sign-out hides preview immediately');
  assert.equal(requests.length, 1, 'cookie writes cannot race each other');
  requests[0].resolve({ ok: true, json: async () => ({ authorized: true }) });
  await view.settle();
  assert.equal(requests[1].options.method, 'DELETE');
  assert.equal(view.tree.type, 'denied', 'a late successful sign-in cannot restore preview');
  requests[1].resolve({ ok: true });
  await view.settle();
  user = admin;
  view.render();
  await view.settle();
  await view.settle();
  requests[2].resolve({ ok: true, json: async () => ({ authorized: true }) });
  await view.settle();
  assert.equal(view.tree.type, 'authorized');
  tokenChanged(admin);
  await view.settle();
  requests[3].resolve({ ok: true, json: async () => ({ authorized: true }) });
  await view.settle();
  assert.equal(view.tree.type, 'authorized', 'Firebase token refresh renews the preview cookie');
  path = '/pay';
  view.render();
  assert.equal(view.tree.type, 'checking', 'client navigation rechecks current membership');
  await view.settle();
  requests[4].resolve({ ok: false });
  await view.settle();
  assert.equal(view.tree.type, 'denied', 'removed admins lose preview access');
});

function authPage(file, returnTo) {
  const dependencies = {
    react: { useState: initial => [initial, () => {}] },
    'react/jsx-runtime': jsxRuntime,
    'next/navigation': { useRouter: () => ({ push() {} }) },
    'next/link': { __esModule: true, default: 'link' },
    'lucide-react': {},
    '@/lib/firebase/auth': {},
    '@/lib/firebase/authDestination': destination,
    '@/lib/firebase/useAuthDestination': { useAuthDestination: () => returnTo },
    '@/lib/adminIcons': {},
    '@/lib/useSiteContent': { useSiteContent: () => ({ auth: { login: { title: 'Welcome back', trust: [] } } }) },
  };
  for (const name of ['AuthAlert', 'Button', 'Checkbox', 'Divider', 'GoogleIcon', 'SplitAuthShell', 'TextField']) {
    dependencies[`../_components/${name}`] = { __esModule: true, default: name };
  }
  return load(file, dependencies).default();
}

test('admin sign-in and password-reset links preserve the admin return destination', () => {
  const returnTo = '/admin/content?section=coming-soon#settings';
  const login = authPage('src/app/(auth)/login/page.tsx', returnTo);
  assert.equal(login.props.title, 'Admin sign in');
  assert.equal(login.props.navPrompt, 'Administrator access', 'admin login does not offer customer signup');
  const resetLink = nodes(login).find(node => node?.type === 'link' && /Forgot password/.test(text(node)));
  assert.ok(resetLink);
  const resetUrl = new URL(resetLink.props.href, 'https://comparemytrip.in');
  assert.equal(resetUrl.pathname, '/forgot-password');
  assert.equal(resetUrl.searchParams.get('next'), returnTo);

  const reset = authPage('src/app/(auth)/forgot-password/page.tsx', returnTo);
  const backLinks = [...nodes(reset), ...nodes(reset.props.navPrompt)].filter(node => node?.type === 'link');
  assert.equal(backLinks.length, 2);
  for (const link of backLinks) {
    const url = new URL(link.props.href, 'https://comparemytrip.in');
    assert.equal(url.pathname, '/login');
    assert.equal(url.searchParams.get('next'), returnTo);
  }
});

test('admin login wording only applies to actual admin paths', () => {
  for (const returnTo of ['/', '/account', '/administer', '/admin-elsewhere']) {
    const login = authPage('src/app/(auth)/login/page.tsx', returnTo);
    assert.equal(login.props.title, 'Welcome back', returnTo);
  }
});

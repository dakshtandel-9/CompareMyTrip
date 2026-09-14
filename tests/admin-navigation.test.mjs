import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import * as icons from 'lucide-react';

const exports = {};
const source = fs.readFileSync('src/app/admin/_components/adminNavigation.ts', 'utf8');
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
  exports,
  require(name) { assert.equal(name, 'lucide-react'); return icons; },
});
const { ADMIN_NAV_ITEMS, ADMIN_NAV_GROUPS, findAdminPage, searchAdminPages } = exports;
const hrefs = Array.from(ADMIN_NAV_ITEMS, item => item.href);

test('every admin page remains discoverable through the workspace navigation or guide', () => {
  const originalRoutes = ['/admin', '/admin/trips', '/admin/enquiries', '/admin/package-enquiries', '/admin/popup-form', '/admin/packages', '/admin/destinations', '/admin/coupons', '/admin/content', '/admin/banners', '/admin/blog', '/admin/users', '/admin/subscribers'];
  for (const route of originalRoutes) assert.ok(hrefs.includes(route), `${route} must remain accessible`);
  for (const file of fs.readdirSync('src/app/admin', { recursive: true })) {
    if (path.basename(file) !== 'page.tsx') continue;
    const directory = path.dirname(file);
    const route = directory === '.' ? '/admin' : `/admin/${directory.split(path.sep).join('/')}`;
    assert.ok(hrefs.includes(route), `${route} needs a discoverable navigation entry`);
  }
  assert.equal(hrefs.length, new Set(hrefs).size, 'each route should have exactly one canonical navigation entry');
});

test('active navigation matches nested pages without matching unrelated route prefixes', () => {
  for (const item of ADMIN_NAV_ITEMS) {
    assert.equal(findAdminPage(item.href)?.href, item.href);
    if (item.href !== '/admin') {
      assert.equal(findAdminPage(`${item.href}/example/edit`)?.href, item.href);
      assert.equal(findAdminPage(`${item.href}-other`), undefined);
    }
  }
  assert.equal(findAdminPage('/admin/not-a-page'), undefined);
  assert.equal(findAdminPage('/packages'), undefined);
});

test('familiar page names and common tasks find their destination', () => {
  const queries = [
    ['dashboard', '/admin'], ['trips', '/admin/trips'], ['payments', '/admin/trips'],
    ['pop-up form', '/admin/popup-form'], ['registered users', '/admin/users'],
    ['coupons', '/admin/coupons'], ['photos', '/admin/packages'], ['hero', '/admin/banners'],
    ['footer', '/admin/content'], ['maintenance', '/admin/content'], ['newsletter', '/admin/subscribers'],
    ['articles', '/admin/blog'], ['quotation', '/admin/package-enquiries'], ['help', '/admin/guide'],
  ];
  for (const [query, route] of queries) assert.ok(searchAdminPages(query).some(item => item.href === route), `Searching ${JSON.stringify(query)} should find ${route}`);
});

test('task search handles case, whitespace and multiple words without losing all-page browsing', () => {
  assert.deepEqual(Array.from(searchAdminPages('  \t '), item => item.href), hrefs);
  assert.deepEqual(Array.from(searchAdminPages('  PaCkAgE   PrIcE '), item => item.href), Array.from(searchAdminPages('package price'), item => item.href));
  assert.ok(searchAdminPages('package price').some(item => item.href === '/admin/package-enquiries'));
  assert.equal(searchAdminPages('not-a-real-admin-task-93852').length, 0);
  for (const group of ADMIN_NAV_GROUPS) {
    assert.ok(group.label.trim());
    assert.ok(group.items.length);
    for (const item of group.items) assert.ok(item.label.trim() && item.description.trim() && item.icon);
  }
});

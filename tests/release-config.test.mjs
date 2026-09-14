import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { releaseProblems } from '../scripts/lib/release-config.mjs';

const { privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
});
const account = {
  type: 'service_account', project_id: 'test-project',
  client_email: 'admin@test-project.iam.gserviceaccount.com', private_key: privateKey,
};
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64');
const env = {
  NEXT_PUBLIC_SITE_URL: 'https://comparemytrip.in',
  NEXT_PUBLIC_FIREBASE_API_KEY: 'test-api-key',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'test-project.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'test-project', NEXT_PUBLIC_FIREBASE_APP_ID: 'test-app',
  FIREBASE_SERVICE_ACCOUNT_KEY_BASE64: encode(account),
  PAYU_MERCHANT_KEY: 'test-merchant', PAYU_SALT: 'test-salt', PAYU_MODE: 'test',
  PAYU_LIVE_PAYMENTS_ENABLED: 'false', CRON_SECRET: 'test-cron-secret'.repeat(3),
  CLOUDFLARE_R2_ACCOUNT_ID: 'test-account', CLOUDFLARE_R2_ACCESS_KEY_ID: 'test-key',
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: 'test-secret', CLOUDFLARE_R2_BUCKET_NAME: 'test-public',
  CLOUDFLARE_R2_PUBLIC_URL: 'https://test-public.r2.dev', CLOUDFLARE_R2_QUOTE_BUCKET_NAME: 'test-private',
  NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY: 'test-site-key',
};
const policies = `export const LEGAL_POLICIES_APPROVED: boolean = true;
export const BUSINESS_DETAILS = {
  legalName: "Test Business", address: "Test Address", supportEmail: "support@example.com", supportPhone: "+919999999999",
};`;

test('release accepts complete test settings without requiring live payments', () => {
  assert.deepEqual(releaseProblems(env), []);
});

test('release rejects malformed Admin credentials without exposing their contents', () => {
  for (const value of ['sensitive-malformed-key', encode(null), encode({ ...account, private_key: 'sensitive-invalid-private-key' })]) {
    const problems = releaseProblems({ ...env, FIREBASE_SERVICE_ACCOUNT_KEY_BASE64: value });
    assert.equal(problems.length, 1);
    assert.match(problems[0], /valid Firebase service account/);
    assert.doesNotMatch(problems.join('\n'), /sensitive|BEGIN PRIVATE KEY/);
  }
});

test('release detects client and Admin project mismatches', () => {
  assert.match(releaseProblems({ ...env, FIREBASE_SERVICE_ACCOUNT_KEY_BASE64: encode({ ...account, project_id: 'another-project' }) }).join('\n'), /same project/);
});

test('release catches auth and media URLs that break deployed integrations', () => {
  for (const value of ['https://test-project.firebaseapp.com', 'test-project.firebaseapp.com/path', 'localhost:3100']) {
    assert.match(releaseProblems({ ...env, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: value }).join('\n'), /must be a hostname/);
  }
  for (const value of ['http://cdn.example.com', 'https://user:secret@cdn.example.com', 'https://cdn.example.com?key=secret', 'https://cdn.example.com#videos']) {
    assert.match(releaseProblems({ ...env, NEXT_PUBLIC_VIDEO_CDN_URL: value }).join('\n'), /must be an HTTPS URL/);
  }
  assert.deepEqual(releaseProblems({ ...env, NEXT_PUBLIC_VIDEO_CDN_URL: 'https://cdn.example.com/media/' }), []);
});

test('release requires separate private quote storage and an App Check site key', () => {
  const problems = releaseProblems({ ...env, CLOUDFLARE_R2_QUOTE_BUCKET_NAME: env.CLOUDFLARE_R2_BUCKET_NAME, NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY: '' });
  assert.match(problems.join('\n'), /separate private bucket/);
  assert.match(problems.join('\n'), /NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY is missing/);
});

test('normal release also blocks partially enabled live payments', () => {
  const problems = releaseProblems({ ...env, PAYU_MODE: 'live' });
  assert.match(problems.join('\n'), /Live PayU settings are not enabled/);
  assert.match(problems.join('\n'), /Business policies have not been approved/);
});

test('live release requires explicit enablement and complete approved policies', () => {
  assert.match(releaseProblems(env, { live: true, policies }).join('\n'), /Live PayU settings are not enabled/);
  const liveEnv = { ...env, PAYU_MODE: 'live', PAYU_LIVE_PAYMENTS_ENABLED: 'true' };
  assert.deepEqual(releaseProblems(liveEnv, { live: true, policies }), []);
  assert.match(releaseProblems(liveEnv, { policies: policies.replace('"Test Address"', '""') }).join('\n'), /Business detail address is missing/);
  assert.match(releaseProblems(liveEnv, { policies: `// ${policies}` }).join('\n'), /Business policies have not been approved/);
});

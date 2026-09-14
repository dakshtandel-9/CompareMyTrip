import { createPrivateKey } from 'node:crypto';

const required = [
  'NEXT_PUBLIC_FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'NEXT_PUBLIC_FIREBASE_APP_ID',
  'FIREBASE_SERVICE_ACCOUNT_KEY_BASE64', 'PAYU_MERCHANT_KEY', 'PAYU_SALT',
  'CRON_SECRET', 'CLOUDFLARE_R2_ACCOUNT_ID', 'CLOUDFLARE_R2_ACCESS_KEY_ID',
  'CLOUDFLARE_R2_SECRET_ACCESS_KEY', 'CLOUDFLARE_R2_BUCKET_NAME',
  'CLOUDFLARE_R2_PUBLIC_URL', 'CLOUDFLARE_R2_QUOTE_BUCKET_NAME',
  'NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY',
];

export function releaseProblems(env, { live = false, policies = '' } = {}) {
  const problems = [];
  for (const name of required) {
    if (!env[name]?.trim()) problems.push(`${name} is missing.`);
  }
  if (env.NEXT_PUBLIC_SITE_URL !== 'https://comparemytrip.in') problems.push('NEXT_PUBLIC_SITE_URL must be https://comparemytrip.in.');
  if ((env.CRON_SECRET?.trim().length ?? 0) < 32) problems.push('CRON_SECRET must contain at least 32 random characters.');
  if (env.CLOUDFLARE_R2_QUOTE_BUCKET_NAME && env.CLOUDFLARE_R2_QUOTE_BUCKET_NAME === env.CLOUDFLARE_R2_BUCKET_NAME) problems.push('Quote PDFs must use a separate private bucket.');

  const authDomain = env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  if (authDomain && !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(authDomain)) {
    problems.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN must be a hostname without a protocol, path or port.');
  }
  for (const name of ['CLOUDFLARE_R2_PUBLIC_URL', 'NEXT_PUBLIC_VIDEO_CDN_URL']) {
    if (!env[name]) continue;
    try {
      const url = new URL(env[name]);
      if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error();
    } catch {
      problems.push(`${name} must be an HTTPS URL without credentials, a query string or a fragment.`);
    }
  }

  if (env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64) {
    try {
      const account = JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64, 'base64').toString('utf8'));
      if (account?.type !== 'service_account' || typeof account.project_id !== 'string' || !account.project_id ||
        typeof account.client_email !== 'string' || !/^[^\s@]+@[^\s@]+$/.test(account.client_email) ||
        typeof account.private_key !== 'string' || createPrivateKey(account.private_key).asymmetricKeyType !== 'rsa') throw new Error();
      if (account.project_id !== env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
        problems.push('Firebase Admin and public Firebase configuration must use the same project.');
      }
    } catch {
      // Never include the parser or crypto error: they can contain credential data.
      problems.push('FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 must contain a valid Firebase service account JSON with an RSA private key.');
    }
  }

  if (!['test', 'live'].includes(env.PAYU_MODE)) problems.push('PAYU_MODE must explicitly be test or live.');
  // A normal release must also reject a half-enabled live configuration.
  if (live || env.PAYU_MODE === 'live') {
    if (env.PAYU_MODE !== 'live' || env.PAYU_LIVE_PAYMENTS_ENABLED !== 'true') problems.push('Live PayU settings are not enabled.');
    if (!/^\s*export const LEGAL_POLICIES_APPROVED:\s*boolean\s*=\s*true\s*;/m.test(policies)) problems.push('Business policies have not been approved.');
    for (const field of ['legalName', 'address', 'supportEmail', 'supportPhone']) {
      if (!new RegExp(`${field}:\\s*"[^"\\s][^"]*"`).test(policies)) problems.push(`Business detail ${field} is missing.`);
    }
  }
  return problems;
}

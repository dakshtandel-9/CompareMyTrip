import { readFileSync } from 'node:fs';
import nextEnv from '@next/env';
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
const live = process.argv.includes('--live');
const problems = [];
for (const name of ['NEXT_PUBLIC_FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'NEXT_PUBLIC_FIREBASE_APP_ID', 'FIREBASE_SERVICE_ACCOUNT_KEY_BASE64', 'PAYU_MERCHANT_KEY', 'PAYU_SALT', 'CRON_SECRET', 'CLOUDFLARE_R2_ACCOUNT_ID', 'CLOUDFLARE_R2_ACCESS_KEY_ID', 'CLOUDFLARE_R2_SECRET_ACCESS_KEY', 'CLOUDFLARE_R2_BUCKET_NAME', 'CLOUDFLARE_R2_PUBLIC_URL', 'CLOUDFLARE_R2_QUOTE_BUCKET_NAME', 'NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY']) {
  if (!process.env[name]?.trim()) problems.push(`${name} is missing.`);
}
if (process.env.NEXT_PUBLIC_SITE_URL !== 'https://comparemytrip.in') problems.push('NEXT_PUBLIC_SITE_URL must be https://comparemytrip.in.');
if ((process.env.CRON_SECRET?.length ?? 0) < 32) problems.push('CRON_SECRET must contain at least 32 random characters.');
if (process.env.CLOUDFLARE_R2_QUOTE_BUCKET_NAME === process.env.CLOUDFLARE_R2_BUCKET_NAME) problems.push('Quote PDFs must use a separate private bucket.');
if (!['test', 'live'].includes(process.env.PAYU_MODE)) problems.push('PAYU_MODE must explicitly be test or live.');
if (live) {
  if (process.env.PAYU_MODE !== 'live' || process.env.PAYU_LIVE_PAYMENTS_ENABLED !== 'true') problems.push('Live PayU settings are not enabled.');
  const policies = readFileSync('src/lib/legalPolicies.ts', 'utf8');
  if (!/LEGAL_POLICIES_APPROVED:\s*boolean\s*=\s*true/.test(policies)) problems.push('Business policies have not been approved.');
  for (const field of ['legalName', 'address', 'supportEmail', 'supportPhone']) {
    if (!new RegExp(`${field}:\\s*"[^"\\s][^"]*"`).test(policies)) problems.push(`Business detail ${field} is missing.`);
  }
}
if (problems.length) {
  console.error('Release configuration needs attention (secret values are never printed):\n' + problems.map(p => `- ${p}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Local ${live ? 'live' : 'test-mode'} configuration checks passed. This does not verify remote secrets, bucket access, rules, App Check enforcement or a payment transaction; complete DEPLOYMENT.md.`);
}

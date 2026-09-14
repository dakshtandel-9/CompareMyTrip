import nextEnv from '@next/env';
import { cert } from 'firebase-admin/app';

// Read-only: never creates users or changes Firebase/OAuth configuration.
nextEnv.loadEnvConfig(process.cwd());

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const domains = process.argv.slice(2).length
  ? process.argv.slice(2).map(value => new URL(value.includes('://') ? value : `https://${value}`).hostname)
  : ['comparemytrip.in', 'www.comparemytrip.in'];
let failures = 0;

function report(ok, label) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
  if (!ok) failures++;
}

async function check(label, run) {
  try {
    await run();
  } catch {
    // Error objects/URLs may contain API keys or bearer-token request details.
    report(false, `${label}: request failed; verify connectivity and configuration`);
  }
}

if (!apiKey || !authDomain || !projectId) {
  report(false, 'Set NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN and NEXT_PUBLIC_FIREBASE_PROJECT_ID before building');
  process.exit(1);
}

await check('Authorized domains', async () => {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/projects?key=${encodeURIComponent(apiKey)}`, {
    signal: AbortSignal.timeout(15000),
  });
  report(response.ok, `Firebase public authentication configuration (HTTP ${response.status})`);
  if (!response.ok) return;
  const config = await response.json();
  for (const domain of domains) {
    report(config.authorizedDomains?.includes(domain) === true, `${domain} is authorized for Google sign-in`);
  }
});

for (const helper of ['handler', 'iframe']) {
  await check(`Firebase ${helper}`, async () => {
    const response = await fetch(`https://${authDomain}/__/auth/${helper}`, { signal: AbortSignal.timeout(15000) });
    const html = await response.text();
    report(response.ok && html.includes(`${helper}.js`), `Firebase ${helper} helper is available (HTTP ${response.status})`);
  });
}

const encodedAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;
if (encodedAccount) {
  await check('Google provider', async () => {
    const account = JSON.parse(Buffer.from(encodedAccount, 'base64').toString('utf8'));
    report(account.project_id === projectId, 'Client and service account use the same Firebase project');
    if (account.project_id !== projectId) return;
    const { access_token: accessToken } = await cert(account).getAccessToken();
    const response = await fetch(`https://identitytoolkit.googleapis.com/admin/v2/projects/${encodeURIComponent(projectId)}/defaultSupportedIdpConfigs/google.com`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(15000),
    });
    report(response.ok, `Google provider configuration is readable (HTTP ${response.status})`);
    if (!response.ok) return;
    const provider = await response.json();
    report(provider.enabled === true && Boolean(provider.clientId), 'Google provider is enabled with an OAuth client');
  });
} else {
  console.log('SKIP Google provider settings: no server service account configured; confirm Google is enabled in Firebase Authentication');
}

console.log('A real Google account sign-in is still required to verify the complete consent and return flow.');
process.exitCode = failures ? 1 : 0;

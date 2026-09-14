import { readFileSync } from 'node:fs';
import nextEnv from '@next/env';
import { releaseProblems } from './lib/release-config.mjs';
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
const live = process.argv.includes('--live') || process.env.PAYU_MODE === 'live';
const problems = releaseProblems(process.env, {
  live,
  policies: readFileSync('src/lib/legalPolicies.ts', 'utf8'),
});
if (problems.length) {
  console.error('Release configuration needs attention (secret values are never printed):\n' + problems.map(p => `- ${p}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Local ${live ? 'live' : 'test-mode'} configuration checks passed. This does not verify remote secrets, bucket access, rules, App Check enforcement or a payment transaction; complete DEPLOYMENT.md.`);
}

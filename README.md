# CompareMyTrip

Next.js travel comparison site targeting Cloudflare Workers through OpenNext.
Production domain: https://comparemytrip.in.

```sh
npm ci
cp .env.example .env.local
# Fill the Firebase, R2 and PayU test settings in .env.local.
npm run dev
```

For an existing checkout, preserve its `.env.local` rather than overwriting credentials.

```sh
npm test
npm run lint
npx tsc --noEmit
npm run check:release
npm run build:cloudflare
```

PayU remains in test mode. Live payments require approved business policies and explicit
enablement. See [DEPLOYMENT.md](DEPLOYMENT.md) for the audit fixes, unresolved account setup,
manual release checklist, optional media CDN and production verification steps.

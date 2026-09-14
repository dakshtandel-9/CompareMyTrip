# CompareMyTrip

Next.js travel comparison site. The current live domain, https://comparemytrip.in, uses
Vercel; the repository also supports Cloudflare Workers through OpenNext.

Use Node.js 22 and the committed package lock. Preserve an existing `.env.local`.

```sh
npm ci
cp .env.example .env.local # only on a new checkout; fill the required settings
npm run dev
```

Release checks:

```sh
npm test
npm run lint
npm run check:assets
npm run check:auth
npm run check:release
npm run build
npm run start -- --port 3100
# In a second terminal:
npm run test:smoke
# If the CMS coming-soon switch is enabled, use this instead:
npm run test:smoke:maintenance
```

The local release check deliberately fails until the private quote bucket and App Check
site key are configured. PayU remains in test mode; do not enable live payments without
approved business policies and live merchant settings.

See [DEPLOYMENT.md](DEPLOYMENT.md) for hosting, account setup and launch verification,
and [the performance audit](docs/performance-audit.md) for fixes and validation evidence.

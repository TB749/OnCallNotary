# On-Call Notary

React website and Cloudflare Worker API for business inquiries. Pricing and eligibility are centralized in shared/catalog.mjs.

## Build

Use Node 22.13 or newer and pnpm. Install with `pnpm install --frozen-lockfile`, then run `pnpm build`. The generated website is in dist/; it is not committed.

## Cloudflare

Use Cloudflare Workers Builds with static assets, not static-only hosting. Build command: `pnpm build`. Deploy command: `npx wrangler deploy`. The Worker name in Cloudflare must match wrangler.jsonc. The Worker entry is worker/index.mjs; the ASSETS binding serves dist/ and the DB binding serves inquiries.

Before deployment, replace the D1 database placeholder in wrangler.jsonc with the approved database ID. Review the existing database before applying server/migrations/0001_initial.sql. Preserve historical records. Configure RESEND_API_KEY, BOOKING_SECRET and ADMIN_TOKEN as Worker secrets; the latter two require at least 32 characters. Set BOOKING_FROM_EMAIL to the approved verified sender, BOOKING_OWNER_EMAIL to the client inquiry recipient, and PUBLIC_ORIGIN to the deployed origin. The .env.example file documents names only; it does not configure hosted Worker variables. Never commit secret values.

## Booking configuration still required

The user explicitly requested retaining the shared tombee10 Calendly TEST event and its visible test notice in this package. It is not approved for production booking. Configure and verify the approved client event routes, duration, format, question mapping and notifications before releasing. Do not merely remove the test notice. The unused original calendar section and its initialization code have been removed. No production D1 database or hosting linkage was verified for this package.

Calendly owns appointment confirmation. Website prices are estimates; payment follows confirmation. The inquiry API and protected /owner page remain included. Email retries process inquiry jobs only.

Cloudflare build configuration: https://developers.cloudflare.com/workers/ci-cd/builds/configuration/

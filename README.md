# On-Call Notary P1

P1 extends the production source supplied in `D:\notary-web-current-prod-code`. The working folder is `D:\P1`. Previous demo implementations are not a code baseline.

The original four services, image sources, branding, calendar link and contact email remain. Mediation and Legal Document Drafting extend the English site in a responsive 3 + 3 service grid. Smart Booking collects service, today's Toronto appointment time, eligible meeting format, details and review. The 60-second wording is a design target, not a measured completion guarantee.

## Run locally

Use Node 22.13 or newer (the local API uses node:sqlite), and pnpm. Install with `pnpm install --frozen-lockfile`, copy `.env.example` to `.env`, then `pnpm dev`. Open http://127.0.0.1:5173. The API uses port 8788 and persists local requests in `.local`; the owner interface is `/owner`. Never commit credentials or the local database.

Run `pnpm test` and `pnpm build`. The browser regression script is `tests/browser-check.mjs`; it currently uses the Codex bundled Playwright runtime and installed Microsoft Edge. Browser tests intercept API requests with an in-memory database and fake email transport. They do not send real email.

## Booking and payment

The server validates date, time, service eligibility and price. Requested appointments are today in America/Toronto, in the future; urgent appointments require at least 30 minutes of notice. At 18:00 and later only eligible online services are offered. Requests do not reserve an appointment. The owner must check the existing Calendly calendar and other commitments before confirming; Calendly is not automatically synchronized. Confirmed P1 intervals cannot overlap.

Price calculations use integer cents, 13% HST and a 50% deposit, rounded once; the balance is total minus deposit. No Stripe or on-site payment is included. An e-Transfer recipient and payable deposit appear only after owner confirmation. Deposit receipt requires the owner to verify the bank transaction manually. A signed quote expires after 15 minutes.

Requests and owner notification jobs are saved transactionally. Confirmation, reservation and confirmation email are also transactional. Delivery failures remain pending for retry; the scheduled worker retries every five minutes. Jobs older than 23 hours require operational review to avoid crossing the email provider's 24-hour idempotency window. Do not blindly replay an old job without checking provider delivery records.

## Configuration required before production

The supplied production source contains a Calendly link and contact email, but no reusable email delivery credentials. Smart Booking adds a Resend adapter: configure a verified sender, owner recipient, API key, separate random BOOKING_SECRET and ADMIN_TOKEN of at least 32 characters, and the approved ETRANSFER_EMAIL. Preserve existing production mailbox and DNS configuration. With missing mail configuration, submission reports unavailable honestly and retains the form.

Review these business decisions before enabling production:

- Confirm final terms in BOOKING_TERMS and change TERMS_VERSION from p1-review.
- Existing seal pricing remains $29 commissioning / $39 notarization for the first seal, plus $15 for additional seals. Commissioning urgency is currently 2x; other urgent scopes require an owner quote.
- Mediation is $100 per planned hour; the form supports 1–8 whole hours. Other durations and overtime require direct agreement.
- Drafting options are affidavit $65 and travel consent $50. Certification is separate.
- Optional page pricing is disabled until scope and price drops are approved: 1–14 pages at $15 each, 15–49 at $4 each, 50+ at $3 each. PAGE_PRICING_OPERATIONS controls eligible operations.
- Mobile requests require an address and manual final quote. Owner-confirmed travel uses $1.50/km; the travel origin and distance basis must be agreed before confirmation.

Set the real D1 database ID in wrangler.jsonc, apply server/migrations with Wrangler, configure worker secrets and PUBLIC_ORIGIN, build, then validate in a staging environment before switching production routing. Cloudflare deployment is not part of the local preview. No production DNS, mail settings or live site have been changed by this implementation.

## Source and release

Development repository: https://github.com/TB749/Notary2026. Client production repository: https://github.com/on-callnotary/notary-web. Test on Vercel, obtain client approval of the tested version, then promote to the client repository and Cloudflare. Release via a separate codex/p1 branch for review; do not push changes directly to production main. The local docs/P1-requirements.docx is the supplied specification snapshot, not a rewritten document; this README records implementation decisions and unresolved configuration. The DOCX and QA screenshots are excluded from Git.

The pnpm lockfile is authoritative. The stale baseline npm lockfile was removed to avoid conflicting dependency installation.

References: [Cloudflare D1 transactional batches](https://developers.cloudflare.com/d1/worker-api/d1-database/) and [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys).

Vercel test limitation: the frontend builds successfully, but the current booking API requires the Cloudflare Worker/D1 backend or a separately implemented test adapter. A static Vercel deployment alone does not provide booking submission. No Vercel deployment or end-to-end hosted test is claimed.

## Vercel test booking notifications

The approved test owner recipient is epict5036@gmail.com. config/vercel-test.env.example records BOOKING_OWNER_EMAIL for the test API backend. The existing API already reads this setting; no pricing or production-recipient changes are needed. Set this on the server handling /api/booking (on a separate test Worker if the frontend proxies there). Merely adding an environment variable to a static Vercel frontend cannot send email. Do not use a VITE_ variable or commit mail secrets. Keep the verified BOOKING_FROM_EMAIL, customer email and ETRANSFER_EMAIL separate.

This configuration file is a template, not an automatically applied Vercel project setting. Hosting connection, durable test API/database, verified sender and mail API credentials are still required. No live email was sent to validate this change.

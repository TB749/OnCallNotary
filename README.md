# On-Call Notary P1

D:\P1 is the working folder, based on D:\notary-web-current-prod-code. Preserve the production appearance, original four images, contact settings and calendar. All six service cards and website copy remain English. Pricing and eligibility stay in shared/catalog.mjs.

## Appointments

Smart Booking calculates estimates locally and sends every valid selection to the shared test event https://calendly.com/tombee10/notary-commissioner-standard-1, as temporarily requested by the user. Name, email and service details prefill its a1 question. The shared 30-minute event does not establish the requested service, format, duration or final price. Known charges for custom requests remain subject to review. No payment is collected on the website; e-Transfer arrangements follow booking confirmation.

Calendly owns appointment scheduling, cancellation and rescheduling. The original general calendar remains unchanged. See CALENDLY_SETUP.md for public event findings and remaining cloud verification. Notification recipient tombee10@gmail.com is the user's Calendly test configuration, not a replacement for website contacts or the business inquiry recipient.

## Business inquiries and saved records

BusinessInquiry continues to POST /api/inquiry. The retained backend stores inquiries and queues owner notifications atomically. It requires the private settings listed in .env.example; BOOKING_SECRET retains its old name for compatibility. Missing configuration returns an unavailable response without claiming submission succeeded. Static Vercel hosting alone does not provide this API.

The /owner page lists inquiries and previous booking records. Previous bookings are read-only. Custom config, quote, booking/status, confirmation and payment-receipt endpoints are retired with HTTP 410. Email retries process inquiry jobs only; previous booking jobs are preserved without replay. Jobs older than 23 hours need manual review. Database schema, migrations and .local data are preserved to avoid destroying saved records. No database cleanup or replay is part of this migration.

## Local development and verification

Use Node 22.13 or newer and pnpm. Install with pnpm install --frozen-lockfile. Copy .env.example to .env only for a new setup; preserve existing private files. pnpm dev starts Vite and the inquiry API. For frontend-only preview, run pnpm exec vite --host 127.0.0.1 --port 5173.

Run pnpm build to check TypeScript and build the website. Automated tests and local QA tooling are excluded from this repository.

## Open business configuration

Commissioning is $29 for the first seal, plus one $10 appointment fee for in-person service before 6 PM. Notarization is $39 for the first seal. Additional seals remain $15 each. Urgent online commissioning remains 2x. Mediation before 6 PM is in-person only. Online drafting from 6 PM retains regular rates; after-hours mediation still requires review. Mediation is $100 per planned hour; drafting is $65 for affidavits and $50 for travel consent, before HST. Website amounts remain estimates. No new bulk-page rules, travel distances, urgency approvals or event capacities are assumed. The retained catalogue includes historical validation helpers; its calculations were not changed during migration.

## Release workflow

Develop on codex/p1 in https://github.com/TB749/OnCallNotary, now configured as origin. Verify the new repository's Vercel linkage before publishing; automatic deployment was established only for the previous Notary2026 repository. Obtain approval of the specific tested commit/deployment before promoting to https://github.com/on-callnotary/notary-web and the client's Cloudflare site. Do not deploy, send live test emails or submit live appointments without authorization. Keep secrets and test data out of version control.

## Source package
The repository contains the website, required assets, inquiry backend, configuration templates. Local reports, spreadsheet deliverables, standalone Windows QA tooling, dependencies and build output are excluded. Install dependencies using the lockfile before building. The shared Calendly event is for testing; backend configuration and hosting linkage require separate setup.

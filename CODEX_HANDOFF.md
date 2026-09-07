# P1 resume checkpoint

Updated 2026-09-07, America/Toronto. Repository files and verified Git state are authoritative; latest user instructions override older spec assumptions.

## Resume first

Read AGENTS.md and this file in D:\P1. Inspect git status, unstaged/staged diffs, untracked files and recent commits; compare remote branches before any push. Verify actual implementation against this checkpoint. Resume the first incomplete task, without redoing completed work or modifying unrelated files.

Working folder: D:\P1. Original baseline: D:\notary-web-current-prod-code. Never import retired demo code. The app may still default to the demo directory; always specify P1 explicitly.

## Verified release state

- Developer repository: https://github.com/TB749/Notary2026. Local development branch: codex/p1. Working tree was clean before this documentation-only update.
- Developer main at 99458b727687d977aa883917afe3a431a45d974e was pushed and automatically deployed to https://notary2026.vercel.app/.
- Vercel reported success / Deployment has completed. Live homepage returned 200 with P1 assets index-D8yZgQFr.js and index-Q653AMPX.css, matching the local build. Frontend deployment is DONE.
- codex/p1 subsequently received deployment checkpoint ddd76a0. This documentation refresh follows it and is published to codex/p1 only; main may legitimately lag by documentation commits. Do not redeploy just to repeat verification.
- Client repository https://github.com/on-callnotary/notary-web and client Cloudflare production remain untouched.
- Workflow: client baseline → developer GitHub → developer main auto-deploys Vercel test → changes/tests → client approval of a specific version → client repository → client Cloudflare production. Developer main is NOT client production main.

## Completed changes

- Six English service categories with original production look and four image sources retained; added Mediation and Legal Document Drafting, desktop 3 + 3 and mobile order.
- Smart Booking UI, centralized pricing, server-side validation/signed quotes, owner review, confirmation-before-e-Transfer, bank-verified deposit receipt.
- Local SQLite / Cloudflare D1 API, transactional email outbox and confirmation, overlapping-reservation protection, explicit external Calendly check, pending-mail retry handling.
- Test notification recipient prepared as BOOKING_OWNER_EMAIL=epict5036@gmail.com in config/vercel-test.env.example; regression tests verify isolation from production/sender/customer/payment recipient. This is a template, NOT a deployed backend setting.
- pnpm lockfile replaces stale npm lockfile; README records setup and limitations. Source pushed to developer repository and frontend verified live.

## Files modified or added versus production baseline

Modified: .gitignore, index.html, package.json, README.md, tsconfig.json, vite.config.ts, src/index.css, src/main.tsx, src/NotarySite.tsx.

Added: config/vercel-test.env.example, .env.example, AGENTS.md, CODEX_HANDOFF.md, pnpm-lock.yaml, postcss.config.cjs, tailwind.config.cjs, wrangler.jsonc; scripts/dev.mjs; shared/catalog.mjs; server/api.mjs, server/local.mjs, server/schema.sql, server/migrations/0001_initial.sql; worker/index.mjs; src/booking.css, src/BusinessInquiry.tsx, src/Owner.tsx, src/SmartBooking.tsx; tests/booking.test.mjs, tests/browser-check.mjs; public/services/mediation.png, public/services/legal-drafting.png; docs/P1-requirements.docx.

Generated/local only: dist/, node_modules/, .local/, qa/. DOCX is an existing specification snapshot, not a newly revised specification; it and QA are ignored by Git. Removed the unchanged but stale original package-lock.json; pnpm-lock.yaml is authoritative.

## Decisions and pricing requirements

- Preserve existing site look and feel throughout. Original four service calculations must remain unchanged under the latest user instruction; do not expand pricing changes to them.
- Order: Affidavits & Statutory Declarations; Certified Copies & Legalization; Business & Real Estate; International & Immigration; Mediation; Legal Document Drafting.
- New rates: Mediation CAD 100 × planned hours; Draft Affidavit CAD 65; Travel Consent Letter CAD 50. Drafting excludes commissioning/notarization. Add 13% HST.
- Current implementation uses 50% of tax-inclusive total, rounded half up to cents, balance by subtraction. Spec still marks deposit basis/rounding pending confirmation. Do not describe it as finally approved.
- Examples: 1-hour mediation total 113.00, deposit 56.50; affidavit total 73.45, deposit 36.73, balance 36.72; travel consent total 56.50, deposit/balance 28.25.
- Booking is same-day Toronto. Before 18:00 use service-eligible office/in-person, online or mobile; from 18:00 online only, with 30-minute urgent notice. Physical-only operations cannot become online. Phone required for WhatsApp and all urgent requests. Current validation only requires a future time for ordinary bookings (README now matches this rule).
- Existing P1 seal rates remain 29/39 first +15 additional. Current commissioning urgency is 2x; do not extend that to new services without approval. Page tiers are disabled by default. Never silently replace existing seal calculations.
- No automatic new-service overtime or unresolved urgency charge. Mobile distance and final amount require owner verification; no assumed zero travel. No Stripe/on-site payment. e-Transfer only after owner confirms; receipt is a separate bank-verified status.

## Tests completed

- Latest run: node --test tests/booking.test.mjs — 22/22 passed (including test/production email-recipient isolation; mocked transport, no live mail), including existing pricing, new rates, rounding, tampered quotes, repeat submissions, access checks, confirmation ordering, overlap and transaction rollback, mobile quote and email retry.
- TypeScript check and Vite production build passed after the last implementation change. Build/type checks passed before publication; the later email-routing additions raised the passing test count to 22 without changing runtime code.
- Browser regression previously passed; qa/browser-results.json re-read for this checkpoint: passed=true, pageErrors=[], checks desktop 3+3, direct service selection, drafting price, retained quote consent, confirm/payment ordering, urgent online/phone rules and mobile overflow. Screenshots in qa/. Do not assume previous preview process is still alive.
- Local runtime: C:\Users\Windows\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe. Browser script currently depends on bundled Playwright and installed Edge. pnpm lockfile is authoritative.

## Unresolved issues

- Booking API is NOT deployed/configured for Vercel. Earlier GET checks of /api/config and /api/booking returned 404 before the P1 frontend deployment; no later end-to-end API success has been verified. Current source provides Cloudflare Worker/D1 and local SQLite adapters, not a Vercel serverless backend. Do not confuse a working frontend with functioning booking/email.
- No connected Vercel administration access or linked local project was available. Its dashboard deployment reference is https://vercel.com/tb-100-s-projects/notary2026/GfiJejR4UbtEiw6p5upVyx7JXGu5. Do not request passwords in chat.
- Need durable test API/database, verified mail sender/API credentials, server/owner secrets and approved transfer recipient. Apply epict5036@gmail.com only as the test backend BOOKING_OWNER_EMAIL. Keep production mailbox, customer recipient and transfer recipient separate. No live email has been sent.
- Business decisions still pending: deposit basis/rounding, mediation hour increments/limits (UI currently whole 1–8 hours), overtime, new-service urgent eligibility/rates, mobile distance basis, optional page-tier scope, final terms. Preserve existing service calculations.
- Calendly requires manual availability checks; no automatic synchronization. Old email jobs require delivery review before replay. Browser test runtime is machine-specific.

## Exact next action

After the resume Git/file verification, read worker/index.mjs, server/local.mjs, server/api.mjs, wrangler.jsonc and config/vercel-test.env.example. Check current /api/config with a read-only request, then identify and implement the minimum durable TEST backend connection for the existing Vercel frontend. Resolve required hosting access/configuration explicitly; do not invent credentials or use ephemeral storage as a durable booking database. Apply BOOKING_OWNER_EMAIL=epict5036@gmail.com to that backend. Keep all existing pricing unchanged and use mocked mail for tests unless the user explicitly authorizes a live test. Frontend deployment is complete; do not repeat it as the next task.

## Checkpoint maintenance

This task changes only AGENTS.md and CODEX_HANDOFF.md; runtime tests are not rerun for prose edits. Update this checkpoint after meaningful work and before a planned stop, replacing stale statements rather than appending contradictory histories. Include files, decisions, test evidence, blockers and one exact next action. Never store secrets/customer data or rely on advance warning of a usage cutoff.

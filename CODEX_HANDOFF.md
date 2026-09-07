# P1 handoff

Last verified: 2026-09-07, America/Toronto. This checkpoint records evidence, not approval of unresolved business rules.

## Resume protocol / source of truth

Read this file and AGENTS.md in D:\P1. Inspect current git status and diff (including staged and untracked files), verify actual files against this checkpoint, and resume from the first incomplete task. Do not redo completed work or modify unrelated files. Latest explicit user decisions override older documents; code records implementation, not automatic business approval.

D:\P1 is the sole working folder. Original source: D:\notary-web-current-prod-code. Do not import old demo code. Current app working directory may still be the retired demo; specify D:\P1 explicitly.

Git is now initialized in D:\P1. Branch codex/p1 is based on origin/main (0605062bb86406a76f609dca6884e69eda31e70a) from https://github.com/TB749/Notary2026. The user's latest instruction explicitly authorizes pushing P1 to that development repository, superseding the earlier Git permission rejection. Implementation commit 5ce03d1 was successfully pushed to origin/codex/p1 on 2026-09-07. This documentation checkpoint follows that implementation commit; verify the latest remote branch against local HEAD on resume. Client production repository and Cloudflare remain untouched.

## Development, review and production release workflow

1. Start from the client's On-Call Notary code; keep D:\P1 as the local working folder.
2. Publish development changes to the developer's GitHub repository: https://github.com/TB749/Notary2026.
3. Deploy that repository to Vercel as the test/review environment.
4. Make and test changes through this development repository and Vercel environment.
5. Obtain client review and approval of the specific tested version; record its commit and deployment reference.
6. Push only that approved version to the client's production repository: https://github.com/on-callnotary/notary-web.
7. Deploy the approved version to the client's Cloudflare production site, on-callnotary.ca.

Use codex/ branches for development review. TB749/Notary2026 is the development source of truth; the client's repository is the production release destination. This supersedes earlier instructions to publish development work directly to the client repository. Keep test configuration and data separate from production. Do not promote unapproved changes or treat approval of this workflow as approval of a particular release. This documentation update does not initialize Git, push code, create a Vercel deployment or change production.

## Completed

- Prepared test-only owner recipient epict5036@gmail.com via config/vercel-test.env.example (BOOKING_OWNER_EMAIL). Existing API already supports this setting; runtime/pricing code and production default are unchanged. Updated README.md, AGENTS.md and this handoff; added two mocked email-routing regression tests in tests/booking.test.mjs. Hosted Vercel settings have NOT been applied: no connected project or test API backend is available.

- Updated AGENTS.md and this handoff with the developer GitHub → Vercel test → client approval → client GitHub → Cloudflare production workflow. Only these two Markdown files changed in this task.

- Preserved production design and original four service image sources; added Mediation and Legal Document Drafting, English content, desktop 3 + 3 and mobile ordering.
- Smart Booking: service/time, eligible format, conditional details, review; server validation and signed quotes; request acceptance precedes owner confirmation and e-Transfer instructions.
- Local SQLite / Cloudflare D1 API, owner review, explicit external-calendar check, atomic overlapping-slot protection, transactionally queued request and confirmation emails, retry handling and manual bank-receipt verification.
- Centralized prices, cent-based HST/deposit math, honest quote-needed and missing-configuration states. Latest pricing request required no code change: new service base rates already match the spec; existing calculation was untouched.
- Local README/setup instructions, tests, production build and browser QA. No live test email sent.

## Files modified or added versus production baseline

Modified: .gitignore, index.html, package.json, README.md, tsconfig.json, vite.config.ts, src/index.css, src/main.tsx, src/NotarySite.tsx.

Added: .env.example, AGENTS.md, CODEX_HANDOFF.md, pnpm-lock.yaml, postcss.config.cjs, tailwind.config.cjs, wrangler.jsonc; scripts/dev.mjs; shared/catalog.mjs; server/api.mjs, server/local.mjs, server/schema.sql, server/migrations/0001_initial.sql; worker/index.mjs; src/booking.css, src/BusinessInquiry.tsx, src/Owner.tsx, src/SmartBooking.tsx; tests/booking.test.mjs, tests/browser-check.mjs; public/services/mediation.png, public/services/legal-drafting.png; docs/P1-requirements.docx.

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
- TypeScript check and Vite production build passed after the last implementation change. Both rerun successfully before publication, along with all 20 booking tests.
- Browser regression previously passed; qa/browser-results.json re-read for this checkpoint: passed=true, pageErrors=[], checks desktop 3+3, direct service selection, drafting price, retained quote consent, confirm/payment ordering, urgent online/phone rules and mobile overflow. Screenshots in qa/. Do not assume previous preview process is still alive.
- Local runtime: C:\Users\Windows\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe. Browser script currently depends on bundled Playwright and installed Edge. pnpm lockfile is authoritative.

## Unresolved / incomplete

- Release cleanup completed: removed stale npm lockfile and corrected README notice/repository wording. Browser test runtime path remains machine-specific.
- Business approvals: deposit basis/rounding, mediation hour increments and duration limits (UI currently restricts to whole 1–8 hours), overtime brackets, new-service urgent eligibility/pricing, mobile distance basis, optional page-tier scope and final terms. Do not invent resolutions or change original-service rates.
- Production config: verified mail sender/API credentials, approved transfer recipient, strong server/owner secrets, real D1 ID/migrations and staging checks. Existing Calendly is manually checked, not synchronized. Old pending mail jobs require provider delivery review, not blind replay.
- Development code published successfully to TB749/Notary2026, branch codex/p1 (implementation commit 5ce03d1). Vercel remains an unverified test environment. No client-production push or deployment.
- Vercel booking API compatibility is unverified: current backend uses a Cloudflare Worker/D1 adapter and local SQLite. A static frontend preview alone cannot validate the full booking workflow. Determine a test backend/adapter and persistence setup before claiming end-to-end Vercel tests passed.

## Exact next action

Verify the latest Git status/diff and remote checkpoint. Vercel URL is https://notary2026.vercel.app/. Read-only checks on 2026-09-07 found homepage 200 with old production HTML (Tailwind CDN, asset index-BOAdohWO.js), and /api/config plus /api/booking both 404. The live site is not the current P1 build. Obtain authorized Vercel project access, deploy codex/p1 and establish the test API/database; then apply BOOKING_OWNER_EMAIL=epict5036@gmail.com to that TEST backend only. If it has no backend, establish a durable test API/database before claiming email delivery works. Configure verified sender and mail credentials privately; do not change the production recipient or e-Transfer recipient, and do not send live test emails without explicit authorization.

## Checkpoint maintenance

Update this small file after meaningful completed work, changed decisions, tests or blockers, and before a planned stop. Do not rely on detecting an exact usage-limit cutoff. Record test evidence, uncommitted state and one exact next action; never store credentials or customer data. Verify files before trusting narrative history.

Latest hosted check: only GET requests were made; no booking submitted or live email sent. Vercel project settings/authentication are not available in this session. Test notification recipient remains epict5036@gmail.com; hosted configuration has not been applied.

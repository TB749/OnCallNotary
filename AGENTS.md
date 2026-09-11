# P1 working instructions

Use D:\P1 for all further implementation. Its original baseline is D:\notary-web-current-prod-code. This explicit user decision supersedes older demo baseline instructions. Do not import previous demo code.

Preserve the production appearance, original four service images, calendar and email links. Keep all website content English. Services are Affidavits & Statutory Declarations, Certified Copies & Legalization, Business & Real Estate, International & Immigration, Mediation, Legal Document Drafting, in that order, three per row on desktop and one column on mobile.

Keep prices and eligibility centralized in shared/catalog.mjs. Website prices are estimates; Calendly is authoritative for new appointments. Booking confirmation precedes e-Transfer; never imply a completed website form is a confirmed appointment. Do not invent unresolved prices or travel distances. Read README.md for open configuration decisions.

Run the local preview and relevant tests yourself. Do not send live test emails or deploy production without explicit authorization. Publish review changes on a codex/ branch. Preserve secrets outside version control.

Communicate plainly and identify concrete problems promptly. Do not repeat completed work. Record durable user decisions here.

## Persistent handoff
Read CODEX_HANDOFF.md first when resuming, inspect Git status and diffs (or compare the production baseline if Git is absent), and verify actual files before continuing the first incomplete task. Do not redo completed work or modify unrelated files. Update CODEX_HANDOFF.md after meaningful progress and before planned stops with completed work, changed files, requirements, tests, unresolved issues and one exact next action. Never store secrets. Do not depend on advance notice of a usage cutoff.

Latest pricing scope: calculate the two added services from the specification; leave existing service calculations unchanged. Preserve the production look and feel across the entire website.

## Development, review and production release workflow

Latest repository decision (September 8): origin now points to https://github.com/TB749/OnCallNotary.git for fetch and push. Use TB749/OnCallNotary as the development repository, superseding TB749/Notary2026 references below. Keep codex/p1. The old repository's Vercel integration must not be assumed to apply to this new repository; verify hosting linkage before any requested deployment. This remote change does not authorize a push or deployment.

1. Start from the client's On-Call Notary code; keep D:\P1 as the local working folder.
2. Publish development changes to the developer's GitHub repository: https://github.com/TB749/Notary2026.
3. Deploy that repository to Vercel as the test/review environment.
4. Make and test changes through this development repository and Vercel environment.
5. Obtain client review and approval of the specific tested version; record its commit and deployment reference.
6. Push only that approved version to the client's production repository: https://github.com/on-callnotary/notary-web.
7. Deploy the approved version to the client's Cloudflare production site, on-callnotary.ca.

Use codex/ branches for development review. TB749/Notary2026 is the development source of truth; the client's repository is the production release destination. This supersedes earlier instructions to publish development work directly to the client repository. Keep test configuration and data separate from production. Do not promote unapproved changes or treat approval of this workflow as approval of a particular release. Documentation checkpoints normally go to codex/p1; publishing the test site updates developer main and triggers Vercel automatically.

Vercel test booking notification recipient: epict5036@gmail.com. The configuration template is prepared, but hosted backend settings are not yet applied. Configure BOOKING_OWNER_EMAIL server-side on the test API backend. Preserve the client production recipient. Do not substitute this address for the sender, customer confirmation recipient or e-Transfer recipient. See config/vercel-test.env.example.

User clarification: TB749/Notary2026 main automatically deploys the Vercel TEST site. When the user requests publishing the test site, fast-forward the tested P1 version to this developer main after checking remote changes. This does not authorize changes to the client's production repository. Keep codex/p1 for development; do not confuse developer main with client production main.

## Current resume boundary

Live UI test authorization: user explicitly approved submitting test Calendly appointments for the service/mode/period matrix and confirmed tombee10@gmail.com as the customer email as well as the configured test notification target. Use only the independent tombee10 event. This approval does not cover client production events or deployment. Preserve confirmation evidence and never automatically retry an uncertain submission.

Code-first cleanup completed September 8: custom booking/quote/status/confirmation/payment endpoints are retired (410); owner booking actions removed. Keep the inquiry API and its backend infrastructure, read-only historical records, schema/migrations and .local data. Email retries must process inquiry jobs only, never replay legacy booking messages. This supersedes older instructions below to retain all booking backend code pending service-specific configuration. All valid requests still use the user-authorized shared Calendly test event. Cloud verification and deployment are deferred.

Latest user override (September 8): for now use https://calendly.com/tombee10/notary-commissioner-standard-1 for ALL valid Smart Booking requests, including custom-scope/mobile/urgent requests and all mediation durations. Do not block this temporary connection on per-service event settings. Preserve estimate/eligibility validation and original calendar; clearly identify the shared 30-minute test event and carry requested details into a1. This supersedes the activation blockers below for temporary testing only, not production readiness. No deployment or live booking was authorized.

User supplied the independent test event https://calendly.com/tombee10/notary-commissioner-standard-1 on September 8. Reply in English. Public event inspection found a 30-minute online event, a1 text question and no payment, but no platform, America/New_York timezone and future booking dates. Do not mark it reviewed until the remaining settings and seal capacity are resolved.

September 8, 2026 update: use a separate Calendly test event with test notifications to tombee10@gmail.com. The user reports cloud setup complete; independently verify the actual event link and prefill before claiming connection verified. This supersedes recipient deferral for Calendly testing only; the older epict5036@gmail.com setting refers to the legacy API. Preserve production/contact/customer/e-Transfer settings. Do not invent the test URL or submit a live booking without authorization.

The previously deployed P1 frontend at https://notary2026.vercel.app/ is separate from the local Calendly migration. Do not republish without authorization. The user has superseded the old next action of deploying D1/Resend: retain P1 pages, catalogue and calculations, replace Smart Booking scheduling with Calendly, then remove unused backend/configuration/UI/tests after connection verification. Email recipients are explicitly deferred. Do not invent event URLs or question mappings. Keep the original calendar and all existing contact email settings. Read CODEX_HANDOFF.md and CALENDLY_SETUP.md for current blockers and verification. Existing business inquiry functionality still uses the legacy API; account for that before deleting it.


September 10 approved cost matrix: use the user-supplied D:/Esther Master/On_Call_Notary_Cost_Matrix.xlsx table cells C6:H17. Before 6 PM, commissioning is $29 plus one $10 in-person appointment fee across Affidavits, Business and International; additional seals remain $15 each. Online/mobile commissioning base and urgent online 2x remain unchanged. Before-6-PM mediation is in-person only. From-6-PM online drafting stays $65/$50 without urgency adjustment or after-hours price-review flag. After-hours mediation and mobile travel still require review. This supersedes older pricing-scope restrictions and stale proposed/unresolved notes in the workbook. Website estimates and shared Calendly test routing remain in effect.

September 10 repository scope: user requested removing test code from GitHub. Keep tests/ and standalone QA tooling locally, ignored by Git. package.json has no test script in the distributed source; local unit tests can still run with node --test tests/*.test.mjs. This does not change the shared Calendly test event.

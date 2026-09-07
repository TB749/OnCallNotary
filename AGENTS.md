# P1 working instructions

Use D:\P1 for all further implementation. Its original baseline is D:\notary-web-current-prod-code. This explicit user decision supersedes older demo baseline instructions. Do not import previous demo code.

Preserve the production appearance, original four service images, calendar and email links. Keep all website content English. Services are Affidavits & Statutory Declarations, Certified Copies & Legalization, Business & Real Estate, International & Immigration, Mediation, Legal Document Drafting, in that order, three per row on desktop and one column on mobile.

Keep prices and eligibility centralized in shared/catalog.mjs. The server is authoritative. Booking confirmation precedes e-Transfer; never imply a submitted request is a confirmed appointment. Do not invent unresolved prices or travel distances. Read README.md for open configuration decisions.

Run the local preview and relevant tests yourself. Do not send live test emails or deploy production without explicit authorization. Publish review changes on a codex/ branch. Preserve secrets outside version control.

Communicate plainly and identify concrete problems promptly. Do not repeat completed work. Record durable user decisions here.

## Persistent handoff
Read CODEX_HANDOFF.md first when resuming, inspect Git status and diffs (or compare the production baseline if Git is absent), and verify actual files before continuing the first incomplete task. Do not redo completed work or modify unrelated files. Update CODEX_HANDOFF.md after meaningful progress and before planned stops with completed work, changed files, requirements, tests, unresolved issues and one exact next action. Never store secrets. Do not depend on advance notice of a usage cutoff.

Latest pricing scope: calculate the two added services from the specification; leave existing service calculations unchanged. Preserve the production look and feel across the entire website.

## Development, review and production release workflow

1. Start from the client's On-Call Notary code; keep D:\P1 as the local working folder.
2. Publish development changes to the developer's GitHub repository: https://github.com/TB749/Notary2026.
3. Deploy that repository to Vercel as the test/review environment.
4. Make and test changes through this development repository and Vercel environment.
5. Obtain client review and approval of the specific tested version; record its commit and deployment reference.
6. Push only that approved version to the client's production repository: https://github.com/on-callnotary/notary-web.
7. Deploy the approved version to the client's Cloudflare production site, on-callnotary.ca.

Use codex/ branches for development review. TB749/Notary2026 is the development source of truth; the client's repository is the production release destination. This supersedes earlier instructions to publish development work directly to the client repository. Keep test configuration and data separate from production. Do not promote unapproved changes or treat approval of this workflow as approval of a particular release. This documentation update does not initialize Git, push code, create a Vercel deployment or change production.

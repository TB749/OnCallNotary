# On-Call Notary — static frontend

React/Vite frontend for Cloudflare Pages. Appointments are completed in Calendly. The website has no business-inquiry form, owner dashboard, custom API, Worker, D1 database, Resend integration, or scheduled email jobs.

## Local development

Use Node 22.13 or later and npm:

```sh
npm ci
npm run dev
npm run build
npm run preview
```

The production output is `dist/`. No environment variables or backend secrets are required.

## Cloudflare Pages deployment

Create a Pages project, not a Worker deployment. Connect the repository containing this folder and choose its intended deployment branch.

- Project root: the folder containing package.json.
- Build command: `npm run build`.
- Build output directory: `dist`.
- No Worker deploy command, database bindings, migrations, email secrets, or cron triggers.

Alternatively, build locally and upload the contents of `dist` through Pages Direct Upload. Never upload the source folder or node_modules.

This local change does not delete or disable any previously deployed cloud resources. If an older Worker has been deployed, its scheduled jobs and bindings must be retired separately in the correct Cloudflare account. Existing database records are not migrated or deleted by this frontend.

## Booking behavior and launch check

The service selection, pricing, estimates, customer details, Calendly prefill, embedded calendar, and direct-calendar fallback are retained. Completing the website form does not create an appointment; visitors must finish the Calendly booking.

**Current configuration is still a shared test event:** all valid selections use https://calendly.com/tombee10/notary-commissioner-standard-1. The test notice remains visible. Confirm the intended Calendly account/event before public launch; this change does not configure production events or their availability.

Review service selection and estimates on mobile and desktop, open the calendar, and verify it is the intended event. Confirm a real appointment only with the event owner's agreement. External Calendly and image resources require network access.

## Source layout

- src/: React interface and styles.
- shared/catalog.mjs: service eligibility and pricing.
- shared/calendly.mjs: Calendly routing and prefill.
- public/: static images and icons.

## Deployment reference

https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite3-project/

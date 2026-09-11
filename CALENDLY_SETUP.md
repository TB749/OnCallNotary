# Calendly connection

## Active temporary configuration

The user instructed all valid Smart Booking selections to use https://calendly.com/tombee10/notary-commissioner-standard-1 for now. USE_SHARED_TEST_EVENT in shared/calendly.mjs enables this override for all six services, eligible formats, periods, quantities and mediation durations, including review-required estimates. Form eligibility and catalogue calculations remain unchanged.

The shared event receives name, email and service details in its a1 text question. UI copy identifies the shared 30-minute test event and states that service, format, duration and final price remain subject to review. Website form completion does not create an appointment or payment request. Calendly handles scheduling and appointment management. The original general calendar and contact email settings remain unchanged.

## Verified public event settings

Inspected September 8: Tommy Bee, “Notary / Commissioner – Online”, 30 minutes, optional text question “Please share anything that will help prepare for our meeting.” at position 0 (a1), no active payment method. Public configuration has no meeting platform, America/New_York timezone and a moving future booking window. Seal capacity is unspecified. The real event loaded through the local React embed; September showed no selectable dates at inspection, so final invitee-form prefill has not been verified end to end.

The user's temporary shared-link decision explicitly allows connection despite these configuration gaps. reviewed:false records that service-specific review remains incomplete; it does not disable shared test mode. EVENT_ROUTES remains available for future exact service mappings after shared test mode is disabled. Such mappings require exact service/operation/period/mode/platform, mediation hours or seal capacity and a reviewed text question.

## Notifications and release

The user reports Calendly cloud setup complete and selected tombee10@gmail.com for test notifications. Delivery has not been tested. Do not replace website contacts, customer recipients or e-Transfer settings. No live booking, email, push or deployment has been performed. Production event settings and approval remain separate from local code completion.

## Backend after migration

Custom config, quote, booking/status, confirmation and payment-receipt endpoints return HTTP 410. The business inquiry API, owner read-only record list, inquiry email retries, Worker and local API remain. Retry processes inquiry jobs only. Preserve schema, migrations, old booking records and .local data; do not replay old booking emails. See README.md for configuration.

## Verification

Run pnpm test, pnpm build, node tests/calendly-browser.mjs and node tests/browser-check.mjs. Browser regressions use local fixtures, not live bookings. The first covers shared-event routing/prefill, estimates, message isolation, failure recovery and mobile layout; the second covers business inquiry submission and protected owner access. qa/ contains ignored local evidence.

import {SERVICES, OPERATIONS, MODES, allowedModes, quoteBooking, money} from './catalog.mjs';

export const CALENDLY_HOME = 'https://calendly.com/oncall-notaryontario';
// User-supplied independent test event. Its public question is verified, but
// platform, same-day availability and seal capacity still need review.
export const CALENDLY_TEST_EVENT = {
  url: 'https://calendly.com/tombee10/notary-commissioner-standard-1',
  detailsQuestion: 'a1',
  durationMinutes: 30,
  reviewed: false,
};
// Add only real, reviewed event types. See CALENDLY_SETUP.md for the contract.
// An empty map is intentional: never book an unrelated event as a fallback.
export const EVENT_ROUTES = [];
// Temporary user decision: every valid request uses the shared test event.
// This does not mark its service-specific configuration as reviewed.
export const USE_SHARED_TEST_EVENT = true;
export const estimateTime = timing => timing === 'urgent' ? '18:00' : '12:00';

export function validateDetails(form) {
  /** @type {Record<string, string>} */
  const errors = {};
  const service = SERVICES.find(item => item.id === form.serviceId);
  const operation = OPERATIONS[form.operation];
  if (!service) errors.serviceId = 'Choose a service.';
  if (!service?.operations.includes(form.operation)) errors.operation = 'Choose the document service.';
  if (!['regular', 'urgent'].includes(form.timing)) errors.timing = 'Choose an appointment period.';
  if (!allowedModes(form.serviceId, estimateTime(form.timing)).includes(form.mode)) errors.mode = 'Choose an eligible format.';
  if (form.mode === 'online' && operation?.online === false) errors.operation = 'This operation requires physical attendance. Change the format or service.';
  if (form.mode === 'online' && !['whatsapp', 'zoom'].includes(form.platform)) errors.platform = 'Choose WhatsApp or Zoom.';
  if (form.name.trim().length < 2 || form.name.length > 100) errors.name = 'Enter your full name (2–100 characters).';
  if (form.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email.';
  if ((form.timing === 'urgent' || form.platform === 'whatsapp' || form.phone) && (!/^[+\d\s().-]+$/.test(form.phone) || form.phone.replace(/\D/g, '').length < 7 || form.phone.replace(/\D/g, '').length > 15)) errors.phone = 'Enter a valid phone number.';
  if (form.mode === 'mobile' && (form.address.trim().length < 8 || form.address.length > 500)) errors.address = 'Enter the service address (8–500 characters).';
  if (!Number.isInteger(form.quantity) || form.quantity < 1 || form.quantity > 500) errors.quantity = 'Enter 1 to 500 seals.';
  if (!Number.isInteger(form.hours) || form.hours < 1 || form.hours > 8) errors.hours = 'Choose 1 to 8 whole hours.';
  if (form.notes.length > 2000) errors.notes = 'Keep notes under 2,000 characters.';
  return errors;
}

export function estimateBooking(form) {
  return quoteBooking({...form, time: estimateTime(form.timing)});
}

export function resolveEvent(form, routes = EVENT_ROUTES) {
  if (routes === EVENT_ROUTES && USE_SHARED_TEST_EVENT) {
    return Object.keys(validateDetails(form)).length ? null : CALENDLY_TEST_EVENT;
  }
  // Scope/travel/unapproved urgency cannot silently turn into a fixed-price event.
  if (estimateBooking(form).status !== 'calculated') return null;
  const matches = routes.filter(route => route.serviceId === form.serviceId &&
    route.operation === form.operation && route.timing === form.timing &&
    route.mode === form.mode && route.platform === (form.mode === 'online' ? form.platform : '') &&
    (form.operation !== 'mediation' || route.hours === form.hours));
  if (matches.length !== 1) return null;
  const route = matches[0];
  if (OPERATIONS[form.operation]?.unit === 'seal' &&
      (!Number.isInteger(route.maxSeals) || route.maxSeals < form.quantity || route.maxSeals > 500)) return null;
  try {
    const url = new URL(route.url);
    if (url.origin !== 'https://calendly.com' || url.username || url.password || url.search || url.hash ||
        (!/^\/oncall-notaryontario\/[^/]+\/?$/.test(url.pathname) && route.url !== CALENDLY_TEST_EVENT.url)) return null;
  } catch { return null; }
  // Reviewed in Calendly: same-day Toronto window, lead time, duration, location,
  // no on-site payment, and a text question to retain the full service request.
  if (route.reviewed !== true || !/^a([1-9]|10)$/.test(route.detailsQuestion)) return null;
  return route;
}

export function bookingDetails(form, quote) {
  return [SERVICES.find(s => s.id === form.serviceId)?.title, OPERATIONS[form.operation]?.label,
    `Period: ${form.timing === 'urgent' ? '18:00 or later' : 'Before 18:00'} America/Toronto`,
    `Format: ${MODES[form.mode]}${form.platform ? ` / ${form.platform}` : ''}`,
    ...(form.operation === 'mediation' ? [`Planned hours: ${form.hours}`] : OPERATIONS[form.operation]?.unit === 'seal' ? [`Seals: ${form.quantity}`] : []),
    ...(form.phone ? [`Phone: ${form.phone}`] : []), ...(form.address ? [`Address: ${form.address}`] : []),
    `${quote.status === 'review_required' ? 'Known charges only' : 'Website estimate'} including HST: ${money(quote.total)} (not a final invoice)`,
    ...quote.reasons, ...(form.notes ? [`Notes: ${form.notes}`] : [])].join('\n');
}

export function eventPrefill(form, route, quote) {
  const notice = route === CALENDLY_TEST_EVENT ? 'Shared test event: requested service, format, duration and price remain subject to review.\n' : '';
  return {name: form.name.trim(), email: form.email.trim(), customAnswers: {[route.detailsQuestion]: notice + bookingDetails(form, quote)}};
}

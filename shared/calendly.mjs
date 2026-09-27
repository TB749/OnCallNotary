import {
  SERVICES,
  OPERATIONS,
  MODES,
  allowedModes,
  quoteBooking,
  money,
} from './catalog.mjs';

export const CALENDLY_HOME =
  'https://calendly.com/oncall-notaryontario';

// Keep this question position identical on every event on the landing page.
export const PRICING_ANSWER_KEY = 'a1';

export const estimateTime = (timing) =>
  timing === 'urgent' ? '18:00' : '12:00';

export function validateDetails(form) {
  /** @type {Record<string, string>} */
  const errors = {};

  const service = SERVICES.find(
    (item) => item.id === form.serviceId
  );

  const operation = OPERATIONS[form.operation];

  if (!service) {
    errors.serviceId = 'Choose a service.';
  }

  if (!service?.operations.includes(form.operation)) {
    errors.operation = 'Choose the document service.';
  }

  if (!['regular', 'urgent'].includes(form.timing)) {
    errors.timing = 'Choose an appointment period.';
  }

  const modes = allowedModes(
    form.serviceId,
    estimateTime(form.timing),
    form.operation
  );

  if (!modes.includes(form.mode)) {
    errors.mode = 'Choose an eligible format.';
  }

  if (
    form.mode === 'online' &&
    operation?.online === false
  ) {
    errors.operation =
      'This operation requires physical attendance. Change the format or service.';
  }

  if (
    form.mode === 'online' &&
    !['whatsapp', 'zoom'].includes(form.platform)
  ) {
    errors.platform =
      'Choose WhatsApp or Zoom.';
  }

  if (
    form.name.trim().length < 2 ||
    form.name.length > 100
  ) {
    errors.name =
      'Enter your full name (2–100 characters).';
  }

  if (
    form.email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
  ) {
    errors.email =
      'Enter a valid email.';
  }

  if (
    (
      form.timing === 'urgent' ||
      form.platform === 'whatsapp' ||
      form.phone
    ) &&
    (
      !/^[+\d\s().-]+$/.test(form.phone) ||
      form.phone.replace(/\D/g, '').length < 7 ||
      form.phone.replace(/\D/g, '').length > 15
    )
  ) {
    errors.phone =
      'Enter a valid phone number.';
  }

  if (
    form.mode === 'mobile' &&
    (
      form.address.trim().length < 8 ||
      form.address.length > 500
    )
  ) {
    errors.address =
      'Enter the service address (8–500 characters).';
  }

  if (
    !Number.isInteger(form.quantity) ||
    form.quantity < 1 ||
    form.quantity > 500
  ) {
    errors.quantity =
      'Enter 1 to 500 seals.';
  }

  if (
    !Number.isInteger(form.hours) ||
    form.hours < 1 ||
    form.hours > 8
  ) {
    errors.hours =
      'Choose 1 to 8 whole hours.';
  }

  if (form.notes.length > 2000) {
    errors.notes =
      'Keep notes under 2,000 characters.';
  }

  return errors;
}

export function estimateBooking(form) {
  return quoteBooking({
    ...form,
    time: estimateTime(form.timing),
  });
}

/*
 * P5 / PROD Calendly behavior
 *
 * All direct scheduling uses the existing production
 * Calendly landing page:
 *
 * https://calendly.com/oncall-notaryontario
 *
 * Only bookings with a fully calculated price may
 * continue directly to scheduling.
 *
 * Requests requiring manual review — for example
 * mobile travel pricing or other review_required
 * scenarios — do not proceed directly to Calendly.
 */
export function resolveEvent(form) {
  const errors = validateDetails(form);

  if (Object.keys(errors).length > 0) {
    return null;
  }

  const quote = estimateBooking(form);

  if (quote.status !== 'calculated') {
    return null;
  }

  return {
    url: CALENDLY_HOME,
  };
}

export function bookingDetails(form, quote) {
  const service = SERVICES.find(
    (item) => item.id === form.serviceId
  );

  const operation = OPERATIONS[form.operation];

  const review = quote.status !== 'calculated';

  const charges = quote.lines.flatMap(
    (line, index) => {
      // Expand the existing seal charge for readability;
      // do not change the quote.
      if (
        index === 0 &&
        line.unit === 'seal' &&
        line.quantity > 1 &&
        Number.isInteger(operation?.first) &&
        line.amount >= operation.first
      ) {
        return [
          `Base service (first seal): ${money(operation.first)}`,
          `Additional seals (${line.quantity - 1}): ${money(
            line.amount - operation.first
          )}`,
        ];
      }

      const units = [
        'seal',
        'page',
        'hour',
        'document'
      ].includes(line.unit)
        ? ` (${line.quantity} ${line.unit}${
            line.quantity === 1 ? '' : 's'
          })`
        : '';

      return [
        `${line.label}${units}: ${money(line.amount)}`
      ];
    }
  );

  return [
    'New Booking – Pricing Summary',

    `Customer: ${form.name.trim()}`,

    `Service: ${service?.title} / ${operation?.label}`,

    'Appointment: See the date and time in this Calendly confirmation.',

    `Requested period: ${
      form.timing === 'urgent'
        ? '18:00 or later'
        : 'Before 18:00'
    } America/Toronto`,

    `Service method: ${
      MODES[form.mode]
    }${
      form.platform
        ? ` / ${form.platform}`
        : ''
    }`,

    ...(
      form.operation === 'mediation'
        ? [
            `Planned hours: ${form.hours}`
          ]
        : operation?.unit === 'seal'
          ? [
              `${
                quote.lines[0]?.unit === 'page'
                  ? 'Pages'
                  : 'Seals'
              }: ${form.quantity}`
            ]
          : []
    ),

    ...(
      form.phone
        ? [`Phone: ${form.phone}`]
        : []
    ),

    ...(
      form.address
        ? [`Address: ${form.address}`]
        : []
    ),

    ...charges,

    ...(
      form.mode === 'mobile'
        ? [
            'Mobile / travel charge: To be confirmed.'
          ]
        : []
    ),

    ...(
      form.operation === 'mediation'
        ? [
            'Overtime: By separate agreement; not included.'
          ]
        : []
    ),

    `${
      review
        ? 'Known subtotal'
        : 'Subtotal'
    }: ${money(quote.subtotal)}`,

    `HST (13%${
      review
        ? ', known charges only'
        : ''
    }): ${money(quote.tax)}`,

    `${
      review
        ? 'Known charges including HST'
        : 'Estimated total'
    }: ${money(quote.total)} CAD`,

    ...(
      review
        ? [
            'Final total: To be confirmed.',
            '50% deposit and balance: To be confirmed after pricing review.',
          ]
        : [
            `Deposit required after owner confirmation (50%): ${money(
              quote.deposit
            )}`,
            `Balance after deposit: ${money(
              quote.balance
            )}`,
          ]
    ),

    'Website proposal, not an invoice. Changes to the service, format or booked period require price review. No payment recorded here.',

    ...quote.reasons,

    ...(
      form.notes
        ? [`Notes: ${form.notes}`]
        : []
    ),
  ]
    .filter(Boolean)
    .join('\n');
}

/*
 * PROD Calendly uses the general booking page rather
 * than service-specific event routing.
 */
export function eventPrefill(form, quote) {
  return {
    name: form.name.trim(),
    email: form.email.trim(),

    customAnswers: {
      [PRICING_ANSWER_KEY]:
        bookingDetails(
          form,
          quote
        ),
    },
  };
}

export function prefilledEventUrl(
  url,
  prefill
) {
  const result =
    new URL(url);

  result.searchParams.set(
    'name',
    prefill.name
  );

  result.searchParams.set(
    'email',
    prefill.email
  );

  for (
    const [
      key,
      value
    ] of Object.entries(
      prefill.customAnswers
    )
  ) {
    result.searchParams.set(
      key,
      String(value)
    );
  }

  return result.toString();
}
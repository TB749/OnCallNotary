export async function onRequestPost(context) {
  const { request, env } = context;

  const json = (body, status = 200) =>
    new Response(
      JSON.stringify(body),
      {
        status,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      }
    );

  try {
    /*
     * Only allow browser requests coming from the
     * same Cloudflare Pages deployment/domain.
     */
    const origin =
      request.headers.get('Origin');

    const requestOrigin =
      new URL(request.url).origin;

    if (
      origin &&
      origin !== requestOrigin
    ) {
      return json(
        {
          error:
            'Request origin is not allowed.',
        },
        403
      );
    }

    /*
     * Verify required Cloudflare environment
     * configuration.
     */
    if (
      !env.RESEND_API_KEY ||
      !env.BOOKING_FROM_EMAIL ||
      !env.BOOKING_OWNER_EMAIL
    ) {
      console.error(
        'Booking email configuration is incomplete.'
      );

      return json(
        {
          error:
            'Email service is not configured.',
        },
        500
      );
    }

    const body =
      await request.json();

    const name =
      typeof body.name === 'string'
        ? body.name.trim()
        : '';

    const email =
      typeof body.email === 'string'
        ? body.email.trim()
        : '';

    const pricingSummary =
      typeof body.pricingSummary ===
      'string'
        ? body.pricingSummary.trim()
        : '';

    const calendlyEventUri =
      typeof body.calendlyEventUri ===
      'string'
        ? body.calendlyEventUri.trim()
        : '';

    const calendlyInviteeUri =
      typeof body.calendlyInviteeUri ===
      'string'
        ? body.calendlyInviteeUri.trim()
        : '';

    if (
      name.length < 2 ||
      name.length > 100
    ) {
      return json(
        {
          error:
            'Invalid customer name.',
        },
        400
      );
    }

    if (
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      return json(
        {
          error:
            'Invalid customer email.',
        },
        400
      );
    }

    if (
      !pricingSummary ||
      pricingSummary.length > 12000
    ) {
      return json(
        {
          error:
            'Invalid pricing summary.',
        },
        400
      );
    }

    const timestamp =
      new Date().toLocaleString(
        'en-CA',
        {
          timeZone:
            'America/Toronto',
          dateStyle: 'full',
          timeStyle: 'long',
        }
      );

    const message = [
      'New On-Call Notary Booking',
      '',
      `Received: ${timestamp}`,
      `Customer: ${name}`,
      `Customer email: ${email}`,
      '',
      '----------------------------------------',
      'BOOKING AND PRICING SUMMARY',
      '----------------------------------------',
      '',
      pricingSummary,
      '',
      '----------------------------------------',

      calendlyEventUri
        ? `Calendly event: ${calendlyEventUri}`
        : '',

      calendlyInviteeUri
        ? `Calendly invitee: ${calendlyInviteeUri}`
        : '',

      '',
      'This email was generated automatically after Calendly reported that the appointment was scheduled.',
    ]
      .filter(Boolean)
      .join('\n');

    const resendBody = {
      from:
        `On-Call Notary Bookings <${env.BOOKING_FROM_EMAIL}>`,

      to: [
        env.BOOKING_OWNER_EMAIL,
      ],

      subject:
        `New On-Call Notary Booking - ${name}`,

      text:
        message,

      reply_to:
        email,
    };

    /*
     * Optional CC configured in Cloudflare.
     * For staging:
     * BOOKING_CC_EMAIL = tombee@gmail.com
     */
    if (
      env.BOOKING_CC_EMAIL
    ) {
      resendBody.cc = [
        env.BOOKING_CC_EMAIL,
      ];
    }

    const response =
      await fetch(
        'https://api.resend.com/emails',
        {
          method: 'POST',

          headers: {
            Authorization:
              `Bearer ${env.RESEND_API_KEY}`,

            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify(
              resendBody
            ),
        }
      );

    const result =
      await response.json();

    if (!response.ok) {
      console.error(
        'Resend delivery failed:',
        result
      );

      return json(
        {
          error:
            'Email delivery failed.',
        },
        502
      );
    }

    return json({
      ok: true,
      emailId:
        result.id || null,
    });
  } catch (error) {
    console.error(
      'Booking email function failed:',
      error
    );

    return json(
      {
        error:
          'Unable to send booking notification.',
      },
      500
    );
  }
}
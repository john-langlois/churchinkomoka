import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY is not set. Email functionality will be disabled.');
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@churchinkomoka.com';
const FROM_NAME = process.env.RESEND_FROM_NAME || 'Church in Komoka';

export type EmailAttachment = {
  filename: string;
  content: Buffer;
};

export type EmailOptions = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  attachments?: EmailAttachment[];
};

/**
 * Send an email using Resend
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string; messageId?: string }> {
  if (!resend) {
    console.error('Resend is not configured. Email not sent.');
    return { success: false, error: 'Email service is not configured' };
  }

  try {
    const payload: Parameters<typeof resend.emails.send>[0] = {
      from: options.from || `${FROM_NAME} <${FROM_EMAIL}>`,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    };
    if (options.attachments?.length) {
      payload.attachments = options.attachments.map((a) => ({
        filename: a.filename,
        content: a.content,
      }));
    }
    const { data, error } = await resend.emails.send(payload);

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message || 'Failed to send email' };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Send OTP code email
 */
export async function sendOTPEmail(
  email: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #1c1917; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;">Church in Komoka</h1>
        </div>
        <div style="background-color: #fafaf9; padding: 40px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1c1917; margin-top: 0; font-size: 24px; font-weight: 700;">Your Admin Login Code</h2>
          <p style="color: #57534e; font-size: 16px; margin-bottom: 30px;">
            Use the following code to log in to the admin panel:
          </p>
          <div style="background-color: white; border: 2px solid #1c1917; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
            <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #1c1917; font-family: 'Courier New', monospace;">
              ${code}
            </div>
          </div>
          <p style="color: #78716c; font-size: 14px; margin-top: 30px;">
            This code will expire in 10 minutes. If you didn't request this code, please ignore this email.
          </p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #78716c; font-size: 12px;">
          <p>Church in Komoka &copy; ${new Date().getFullYear()}</p>
        </div>
      </body>
    </html>
  `;

  const text = `
Church in Komoka - Admin Login Code

Your login code is: ${code}

This code will expire in 10 minutes. If you didn't request this code, please ignore this email.

Church in Komoka © ${new Date().getFullYear()}
  `;

  return sendEmail({
    to: email,
    subject: 'Your Admin Login Code',
    html,
    text,
  });
}

/**
 * Send notification email (generic template for various notifications)
 */
export async function sendNotificationEmail(
  email: string,
  subject: string,
  message: string,
  actionText?: string,
  actionUrl?: string
): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #1c1917; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;">Church in Komoka</h1>
        </div>
        <div style="background-color: #fafaf9; padding: 40px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1c1917; margin-top: 0; font-size: 24px; font-weight: 700;">${subject}</h2>
          <div style="color: #57534e; font-size: 16px; margin-bottom: 30px;">
            ${message.split('\n').map(p => `<p style="margin-bottom: 16px;">${p}</p>`).join('')}
          </div>
          ${actionText && actionUrl ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${actionUrl}" style="display: inline-block; background-color: #1c1917; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px;">
                ${actionText}
              </a>
            </div>
          ` : ''}
        </div>
        <div style="text-align: center; margin-top: 20px; color: #78716c; font-size: 12px;">
          <p>Church in Komoka &copy; ${new Date().getFullYear()}</p>
        </div>
      </body>
    </html>
  `;

  const text = `
Church in Komoka - ${subject}

${message}

${actionText && actionUrl ? `\n${actionText}: ${actionUrl}` : ''}

Church in Komoka © ${new Date().getFullYear()}
  `;

  return sendEmail({
    to: email,
    subject,
    html,
    text,
  });
}

// Types for retreat confirmation email (minimal shapes)
export type PricingTierForEmail = {
  name: string;
  minAge: number;
  maxAge: number | null;
  price: number | null;
  isFree: boolean;
};

export type RetreatConfirmationRetreat = {
  name: string;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  location?: string | null;
  pricingTiers?: PricingTierForEmail[] | null;
};

export type RetreatConfirmationRegistration = {
  id: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string | null;
  notes?: string | null;
};

export type RetreatConfirmationRegistrant = {
  firstName: string;
  lastName: string;
  age?: number | null;
  isAdult: boolean;
};

/** Find first tier that matches age (tiers should be ordered by minAge ascending). */
function findTierForAge(tiers: PricingTierForEmail[], age: number | null | undefined): { tier: PricingTierForEmail; price: number } | null {
  const a = age ?? 99; // unknown age treat as adult
  const sorted = [...tiers].sort((x, y) => x.minAge - y.minAge);
  for (const tier of sorted) {
    if (a < tier.minAge) continue;
    if (tier.maxAge != null && a > tier.maxAge) continue;
    const price = tier.isFree ? 0 : (tier.price ?? 0);
    return { tier, price };
  }
  return null;
}

/**
 * Compute per-registrant line price and total for retreat confirmation using dynamic tiers.
 * Returns { lines: { name, tierName, price }, total } or { lines, total: null } if no tiers.
 */
export function computeRetreatPricing(
  retreat: RetreatConfirmationRetreat,
  registrants: RetreatConfirmationRegistrant[]
): {
  lines: { name: string; tierName: string; price: number }[];
  total: number | null;
} {
  const tiers = retreat.pricingTiers ?? [];
  const hasPricing = tiers.length > 0;

  const lines = registrants.map((r) => {
    const match = findTierForAge(tiers, r.age);
    const name = `${r.firstName} ${r.lastName}`;
    if (!match) {
      return { name, tierName: '—', price: 0 };
    }
    return { name, tierName: match.tier.name, price: match.price };
  });

  const total = hasPricing ? lines.reduce((sum, l) => sum + l.price, 0) : null;
  return { lines, total };
}

function formatRetreatDate(d: Date | string | null | undefined): string {
  if (!d) return 'TBA';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/New_York' });
}

/**
 * Send retreat registration confirmation email with registration ID, retreat details,
 * registrants list, and pricing breakdown (if retreat has pricing set).
 */
export async function sendRetreatConfirmationEmail(
  to: string,
  retreat: RetreatConfirmationRetreat,
  registration: RetreatConfirmationRegistration,
  registrants: RetreatConfirmationRegistrant[]
): Promise<{ success: boolean; error?: string }> {
  const { lines, total } = computeRetreatPricing(retreat, registrants);
  const hasPricing = total !== null;
  const registrationId = registration.id;
  const lookupUrl = typeof process.env.NEXT_PUBLIC_APP_URL === 'string'
    ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')}/retreat?lookup=${registrationId}`
    : null;

  const registrantsRows = lines
    .map(
      (l) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #e7e5e4;">${l.name}</td><td style="padding:8px 12px;border-bottom:1px solid #e7e5e4;">${l.tierName}</td><td style="padding:8px 12px;border-bottom:1px solid #e7e5e4;text-align:right;">${hasPricing ? `$${l.price}` : '-'}</td></tr>`
    )
    .join('');

  const totalRow =
    hasPricing &&
    `<tr><td colspan="2" style="padding:12px;font-weight:700;color:#1c1917;">Total</td><td style="padding:12px;text-align:right;font-weight:700;">$${total}</td></tr>`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #1c1917; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;">Church in Komoka</h1>
        </div>
        <div style="background-color: #fafaf9; padding: 40px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1c1917; margin-top: 0; font-size: 24px; font-weight: 700;">Retreat registration confirmed</h2>
          <p style="color: #57534e; font-size: 16px;">Thank you for registering for <strong>${retreat.name}</strong>.</p>

          <div style="background-color: white; border: 2px solid #1c1917; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #78716c;">Your registration ID</p>
            <p style="margin: 0; font-size: 18px; font-weight: 900; font-family: 'Courier New', monospace; color: #1c1917;">${registrationId}</p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #57534e;">Save this ID to look up your registration on our retreat page.</p>
          </div>
          ${lookupUrl ? `<p style="margin-bottom: 24px;"><a href="${lookupUrl}" style="color: #1c1917; font-weight: 700;">View your registration</a></p>` : ''}

          <h3 style="color: #1c1917; font-size: 18px; margin-top: 24px;">Retreat details</h3>
          <ul style="color: #57534e; padding-left: 20px;">
            <li><strong>Dates:</strong> ${formatRetreatDate(retreat.startDate)}${retreat.endDate ? ` – ${formatRetreatDate(retreat.endDate)}` : ''}</li>
            ${retreat.location ? `<li><strong>Location:</strong> ${retreat.location}</li>` : ''}
          </ul>

          <h3 style="color: #1c1917; font-size: 18px; margin-top: 24px;">Registrants</h3>
          <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #e7e5e4;">
            <thead><tr style="background: #f5f5f4;"><th style="padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 700; color: #78716c;">Name</th><th style="padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 700; color: #78716c;">Category</th><th style="padding: 10px 12px; text-align: right; font-size: 12px; font-weight: 700; color: #78716c;">Price</th></tr></thead>
            <tbody>${registrantsRows}${totalRow || ''}</tbody>
          </table>
          ${!hasPricing ? '<p style="color: #78716c; font-size: 14px; margin-top: 8px;">Contact us for pricing details.</p>' : ''}

          ${registration.notes ? `<p style="margin-top: 24px; color: #57534e;"><strong>Your notes:</strong><br/>${registration.notes.replace(/\n/g, '<br/>')}</p>` : ''}
        </div>
        <div style="text-align: center; margin-top: 20px; color: #78716c; font-size: 12px;">
          <p>Church in Komoka &copy; ${new Date().getFullYear()}</p>
        </div>
      </body>
    </html>
  `;

  const text = [
    `Church in Komoka – Retreat registration confirmed`,
    ``,
    `Thank you for registering for ${retreat.name}.`,
    ``,
    `Your registration ID: ${registrationId}`,
    `Save this ID to look up your registration on our retreat page.`,
    lookupUrl ? `View: ${lookupUrl}` : '',
    ``,
    `Retreat details:`,
    `Dates: ${formatRetreatDate(retreat.startDate)}${retreat.endDate ? ` – ${formatRetreatDate(retreat.endDate)}` : ''}`,
    retreat.location ? `Location: ${retreat.location}` : '',
    ``,
    `Registrants:`,
    ...lines.map((l) => `  ${l.name} – ${l.tierName}${hasPricing ? ` – $${l.price}` : ''}`),
    hasPricing ? `Total: $${total}` : `Contact us for pricing.`,
    registration.notes ? `\nYour notes: ${registration.notes}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return sendEmail({
    to,
    subject: `Retreat registration confirmed – ${retreat.name}`,
    html,
    text,
  });
}

/**
 * Send admin notification email when a new retreat registration is submitted.
 */
export async function sendAdminRetreatNotificationEmail(
  adminEmails: string[],
  retreat: RetreatConfirmationRetreat,
  registration: RetreatConfirmationRegistration,
  registrants: RetreatConfirmationRegistrant[]
): Promise<{ success: boolean; error?: string }> {
  if (adminEmails.length === 0) return { success: true };

  const { lines, total } = computeRetreatPricing(retreat, registrants);
  const hasPricing = total !== null;
  const adminUrl = typeof process.env.NEXT_PUBLIC_APP_URL === 'string'
    ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')}/admin/retreat/${registration.id}`
    : null;

  const registrantsRows = lines
    .map(
      (l) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #e7e5e4;">${l.name}</td><td style="padding:8px 12px;border-bottom:1px solid #e7e5e4;">${l.tierName}</td><td style="padding:8px 12px;border-bottom:1px solid #e7e5e4;text-align:right;">${hasPricing ? `$${l.price}` : '-'}</td></tr>`
    )
    .join('');

  const totalRow =
    hasPricing &&
    `<tr><td colspan="2" style="padding:12px;font-weight:700;color:#1c1917;">Total</td><td style="padding:12px;text-align:right;font-weight:700;">$${total}</td></tr>`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #1c1917; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;">Church in Komoka</h1>
        </div>
        <div style="background-color: #fafaf9; padding: 40px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1c1917; margin-top: 0; font-size: 24px; font-weight: 700;">New Retreat Registration</h2>
          <p style="color: #57534e; font-size: 16px;">A new registration has been submitted for <strong>${retreat.name}</strong>.</p>

          <h3 style="color: #1c1917; font-size: 18px; margin-top: 24px;">Contact Info</h3>
          <table style="color: #57534e; font-size: 15px;">
            <tr><td style="padding: 4px 12px 4px 0; font-weight: 700; color: #78716c;">Name</td><td>${registration.contactName}</td></tr>
            <tr><td style="padding: 4px 12px 4px 0; font-weight: 700; color: #78716c;">Email</td><td>${registration.contactEmail}</td></tr>
            ${registration.contactPhone ? `<tr><td style="padding: 4px 12px 4px 0; font-weight: 700; color: #78716c;">Phone</td><td>${registration.contactPhone}</td></tr>` : ''}
          </table>

          <h3 style="color: #1c1917; font-size: 18px; margin-top: 24px;">Registrants (${registrants.length})</h3>
          <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #e7e5e4;">
            <thead><tr style="background: #f5f5f4;"><th style="padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 700; color: #78716c;">Name</th><th style="padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 700; color: #78716c;">Category</th><th style="padding: 10px 12px; text-align: right; font-size: 12px; font-weight: 700; color: #78716c;">Price</th></tr></thead>
            <tbody>${registrantsRows}${totalRow || ''}</tbody>
          </table>

          ${registration.notes ? `<p style="margin-top: 24px; color: #57534e;"><strong>Notes:</strong><br/>${registration.notes.replace(/\n/g, '<br/>')}</p>` : ''}

          ${adminUrl ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${adminUrl}" style="display: inline-block; background-color: #1c1917; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px;">
                View in Admin
              </a>
            </div>
          ` : ''}
        </div>
        <div style="text-align: center; margin-top: 20px; color: #78716c; font-size: 12px;">
          <p>Church in Komoka &copy; ${new Date().getFullYear()}</p>
        </div>
      </body>
    </html>
  `;

  const text = [
    `Church in Komoka – New Retreat Registration`,
    ``,
    `A new registration has been submitted for ${retreat.name}.`,
    ``,
    `Contact: ${registration.contactName}`,
    `Email: ${registration.contactEmail}`,
    registration.contactPhone ? `Phone: ${registration.contactPhone}` : '',
    ``,
    `Registrants (${registrants.length}):`,
    ...lines.map((l) => `  ${l.name} – ${l.tierName}${hasPricing ? ` – $${l.price}` : ''}`),
    hasPricing ? `Total: $${total}` : '',
    registration.notes ? `\nNotes: ${registration.notes}` : '',
    adminUrl ? `\nView in admin: ${adminUrl}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return sendEmail({
    to: adminEmails,
    subject: `New retreat registration – ${registration.contactName} – ${retreat.name}`,
    html,
    text,
  });
}

// ---------------------------------------------------------------------------
// ICS calendar invite helpers
// ---------------------------------------------------------------------------

function padTwo(n: number): string {
  return String(n).padStart(2, '0');
}

function toICSDateUTC(date: Date): string {
  return `${date.getUTCFullYear()}${padTwo(date.getUTCMonth() + 1)}${padTwo(date.getUTCDate())}T${padTwo(date.getUTCHours())}${padTwo(date.getUTCMinutes())}${padTwo(date.getUTCSeconds())}Z`;
}

function toICSDateOnly(date: Date): string {
  return `${date.getFullYear()}${padTwo(date.getMonth() + 1)}${padTwo(date.getDate())}`;
}


function escapeICS(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export type CalendarEventForICS = {
  id: string;
  title: string;
  description?: string | null;
  location: string;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  time?: string | null;
  isRecurring: boolean;
  recurrencePattern?: string | null;
  recurrenceDayOfWeek?: number | null;
  recurrenceDayOfMonth?: number | null;
  recurrenceEndDate?: Date | string | null;
};

export function generateICSContent(event: CalendarEventForICS, nextOccurrence?: Date | null): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Church in Komoka//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@churchinkomoka.com`,
    `DTSTAMP:${toICSDateUTC(new Date())}`,
  ];

  let refDate: Date;
  if (event.isRecurring && nextOccurrence) {
    refDate = new Date(nextOccurrence);
  } else if (event.startDate) {
    refDate = new Date(event.startDate);
  } else {
    refDate = new Date();
  }

  const hasTime = refDate.getUTCHours() !== 0 || refDate.getUTCMinutes() !== 0;

  if (hasTime) {
    lines.push(`DTSTART:${toICSDateUTC(refDate)}`);
    const endDate = (event.endDate && !event.isRecurring) ? new Date(event.endDate) : refDate;
    lines.push(`DTEND:${toICSDateUTC(endDate)}`);
  } else {
    lines.push(`DTSTART;VALUE=DATE:${toICSDateOnly(refDate)}`);
    if (event.endDate && !event.isRecurring) {
      const end = new Date(event.endDate);
      end.setDate(end.getDate() + 1);
      lines.push(`DTEND;VALUE=DATE:${toICSDateOnly(end)}`);
    } else {
      const next = new Date(refDate);
      next.setDate(next.getDate() + 1);
      lines.push(`DTEND;VALUE=DATE:${toICSDateOnly(next)}`);
    }
  }

  if (event.isRecurring && event.recurrencePattern) {
    const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    let rrule = `RRULE:FREQ=${event.recurrencePattern.toUpperCase()}`;
    if (event.recurrencePattern === 'weekly' && event.recurrenceDayOfWeek != null) {
      rrule += `;BYDAY=${dayMap[event.recurrenceDayOfWeek]}`;
    } else if (event.recurrencePattern === 'monthly' && event.recurrenceDayOfMonth != null) {
      rrule += `;BYMONTHDAY=${event.recurrenceDayOfMonth}`;
    }
    if (event.recurrenceEndDate) {
      rrule += `;UNTIL=${toICSDateUTC(new Date(event.recurrenceEndDate))}`;
    }
    lines.push(rrule);
  }

  lines.push(`SUMMARY:${escapeICS(event.title)}`);
  if (event.description) lines.push(`DESCRIPTION:${escapeICS(event.description)}`);
  lines.push(`LOCATION:${escapeICS(event.location)}`);
  lines.push('END:VEVENT');
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export async function sendCalendarInviteEmail(
  to: string,
  event: CalendarEventForICS,
  nextOccurrence?: Date | null,
): Promise<{ success: boolean; error?: string }> {
  const icsContent = generateICSContent(event, nextOccurrence);

  const html = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #1c1917; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;">Church in Komoka</h1>
        </div>
        <div style="background-color: #fafaf9; padding: 40px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1c1917; margin-top: 0; font-size: 24px; font-weight: 700;">Calendar Event</h2>
          <p style="color: #57534e; font-size: 16px;">Here's your calendar event for <strong>${event.title}</strong>.</p>
          <div style="background-color: white; border: 1px solid #e7e5e4; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 8px 0; font-weight: 700; color: #1c1917; font-size: 18px;">${event.title}</p>
            ${event.time ? `<p style="margin: 0 0 4px 0; color: #57534e;">Time: ${event.time}</p>` : ''}
            <p style="margin: 0 0 4px 0; color: #57534e;">Location: ${event.location}</p>
            ${event.isRecurring ? `<p style="margin: 8px 0 0 0; color: #78716c; font-size: 14px;">Recurring ${event.recurrencePattern} event</p>` : ''}
          </div>
          <p style="color: #78716c; font-size: 14px;">Open the attached .ics file to add this event to your calendar app.</p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #78716c; font-size: 12px;">
          <p>Church in Komoka &copy; ${new Date().getFullYear()}</p>
        </div>
      </body>
    </html>
  `;

  const text = [
    `Church in Komoka – Calendar Event`,
    ``,
    event.title,
    event.time ? `Time: ${event.time}` : '',
    `Location: ${event.location}`,
    event.isRecurring ? `Recurring: ${event.recurrencePattern}` : '',
    ``,
    `Open the attached .ics file to add this event to your calendar.`,
  ].filter(Boolean).join('\n');

  return sendEmail({
    to,
    subject: `Calendar Event: ${event.title} – Church in Komoka`,
    html,
    text,
    attachments: [{
      filename: 'event.ics',
      content: Buffer.from(icsContent, 'utf-8'),
    }],
  });
}

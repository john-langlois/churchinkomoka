import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY is not set. Email functionality will be disabled.');
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@churchinkomoka.com';
const FROM_NAME = process.env.RESEND_FROM_NAME || 'Church in Komoka';

export type EmailOptions = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
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
    const { data, error } = await resend.emails.send({
      from: options.from || `${FROM_NAME} <${FROM_EMAIL}>`,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

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

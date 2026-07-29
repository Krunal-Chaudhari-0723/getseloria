import nodemailer from 'nodemailer';

export async function sendPasswordResetEmail(email: string, otpCode: string, resetUrl: string) {
  const resendApiKey = process.env.RESEND_API_KEY?.trim() || process.env.RESEND_KEY?.trim();

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222; max-width: 560px;">
      <h2 style="font-weight: 400; color: #7B2D42;">Reset your Seloria password</h2>
      <p>We received a request to reset your password.</p>
      <p>Your reset code is <strong style="font-size: 18px; letter-spacing: 2px;">${otpCode}</strong>.</p>
      <p><a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #7B2D42; color: #fff; text-decoration: none; border-radius: 4px;">Open Reset Page</a></p>
      <p style="font-size: 12px; color: #666;">This code expires in 1 hour. If you did not request this, you can ignore this email.</p>
    </div>
  `;
  const textContent = `Your Seloria reset code is ${otpCode}.\n\nOpen this link to continue: ${resetUrl}\n\nThis code expires in 1 hour. If you did not request this, you can ignore this email.`;

  // Use Resend HTTP API if RESEND_API_KEY or RESEND_KEY is provided
  if (resendApiKey) {
    const resendFrom = process.env.RESEND_FROM?.trim() || 'Seloria <onboarding@resend.dev>';
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: resendFrom,
        to: [email],
        subject: 'Reset your Seloria password',
        text: textContent,
        html: htmlContent,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Resend API Error:', data);
      throw new Error(data.message || data.error || 'Failed to send email via Resend API');
    }

    console.log('Password reset email sent via Resend API successfully. Message ID:', data.id);
    return;
  }

  // Fallback to Nodemailer / SMTP
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER?.trim();
  let smtpPass = process.env.SMTP_PASS?.trim();
  if (smtpHost?.includes('gmail') && smtpPass) {
    smtpPass = smtpPass.replace(/\s+/g, '');
  }
  const smtpFrom = process.env.SMTP_FROM?.trim() || smtpUser;

  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error('Email delivery is not configured. Add RESEND_API_KEY in Vercel and redeploy.');
  }

  const isGmail = smtpHost?.includes('gmail');

  const transporter = nodemailer.createTransport(
    isGmail
      ? {
          service: 'gmail',
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        }
      : {
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        }
  );
  await transporter.verify();

  const info = await transporter.sendMail({
    from: smtpFrom,
    to: email,
    subject: 'Reset your Seloria password',
    text: textContent,
    html: htmlContent,
  });

  if (!info.messageId) {
    throw new Error('SMTP email delivery failed.');
  }
}

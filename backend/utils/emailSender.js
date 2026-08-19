const nodemailer = require('nodemailer');

// Configure transport using environment variables or test Ethereal account
const createTransporter = async () => {
  const host = (process.env.EMAIL_HOST || '').trim();
  const user = (process.env.EMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');

  if (host && user && pass) {
    return nodemailer.createTransport({
      service: 'gmail',
      host: host,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: false, // 587 uses STARTTLS
      auth: {
        user: user,
        pass: pass,
      },
    });
  }

  // Fallback to ethereal test account
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

const sendWelcomeCredentialsEmail = async ({ toEmail, name, loginEmail, password, role, department }) => {
  try {
    const transporter = await createTransporter();
    const senderEmail = (process.env.EMAIL_USER || 'admin@civora.gov').trim();

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 16px;">
        <div style="background-color: #0f172a; padding: 20px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: #4CC9B0; margin: 0; font-size: 24px;">Civora Smart City Portal</h1>
          <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 13px;">Official Personnel Credentials</p>
        </div>

        <div style="padding: 24px; background-color: #ffffff;">
          <p style="font-size: 16px; color: #1e293b;">Hello <strong>${name}</strong>,</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">
            Your account as a <strong>${role.toUpperCase()}</strong> (${department || 'General Department'}) has been successfully created by the City Administrator.
          </p>

          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 16px; border-radius: 10px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: bold; color: #0f172a;">YOUR LOGIN CREDENTIALS:</p>
            <p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Login Civora Email:</strong> <span style="color: #2563eb;">${loginEmail}</span></p>
            <p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>Password:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${password}</code></p>
          </div>

          <p style="font-size: 13px; color: #64748b;">
            Please log in at <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="color: #4CC9B0; text-decoration: none; font-weight: bold;">Civora Portal</a> using the login email listed above.
          </p>
        </div>

        <div style="background-color: #f1f5f9; padding: 12px; text-align: center; font-size: 12px; color: #94a3b8; border-radius: 0 0 12px 12px;">
          Civora Smart City Management System • Confidential Email
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"Civora City Admin" <${senderEmail}>`,
      to: toEmail,
      subject: `[Civora] Welcome ${name} - Your ${role.toUpperCase()} Credentials`,
      html: htmlContent,
    });

    console.log(`[SMTP SUCCESS] Email dispatched to ${toEmail}. Message ID: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error('[SMTP ERROR] Failed to send credentials email:', err);
    return false;
  }
};

module.exports = { sendWelcomeCredentialsEmail };

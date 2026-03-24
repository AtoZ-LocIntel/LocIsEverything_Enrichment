/**
 * Test Forward Email (or any SMTP) with the same env vars as api/contact.ts.
 * Does not use the HTTP handler — isolates SMTP credentials and network.
 *
 * PowerShell (from repo root, with secrets in your environment):
 *   $env:CONTACT_SMTP_USER='...'; $env:CONTACT_SMTP_PASS='...'; node scripts/test-contact-smtp.mjs
 *
 * Optional: CONTACT_SMTP_HOST, CONTACT_SMTP_PORT, CONTACT_MAIL_TO, CONTACT_MAIL_FROM, CONTACT_SMTP_DEBUG=1
 */

import nodemailer from 'nodemailer';

const user = process.env.CONTACT_SMTP_USER;
const pass = process.env.CONTACT_SMTP_PASS;
if (!user || !pass) {
  console.error('Set CONTACT_SMTP_USER and CONTACT_SMTP_PASS (same as Vercel).');
  process.exit(1);
}

const host = process.env.CONTACT_SMTP_HOST || 'smtp.forwardemail.net';
const envPort = process.env.CONTACT_SMTP_PORT;
const explicitPort = envPort != null && envPort !== '' ? Number(envPort) : undefined;
const mailTo = process.env.CONTACT_MAIL_TO || 'submit@knowyourlocation.com';
const mailFrom = process.env.CONTACT_MAIL_FROM || user;
const debug = process.env.CONTACT_SMTP_DEBUG === '1';

const portsToTry =
  explicitPort != null && !Number.isNaN(explicitPort) ? [explicitPort] : [465, 587];

function options(port) {
  const secure = port === 465;
  return {
    host,
    port,
    secure,
    auth: { user, pass },
    ...(port === 587 ? { requireTLS: true } : {}),
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
    family: 4,
    tls: { minVersion: 'TLSv1.2' },
    ...(debug ? { debug: true, logger: true } : {}),
  };
}

const subject = '[Location Enrichment] SMTP test (scripts/test-contact-smtp.mjs)';
const text = `This is a manual SMTP test at ${new Date().toISOString()}.
If you received this, CONTACT_SMTP_* credentials and Forward Email SMTP are working.`;

let lastErr;
for (const port of portsToTry) {
  try {
    const transporter = nodemailer.createTransport(options(port));
    await transporter.sendMail({
      from: mailFrom,
      to: mailTo,
      subject,
      text,
    });
    console.log(`OK: sent via ${host}:${port} to ${mailTo}`);
    process.exit(0);
  } catch (e) {
    lastErr = e;
    console.error(`Fail ${host}:${port}:`, e?.message || e);
  }
}

console.error('All attempts failed:', lastErr?.message || lastErr);
process.exit(1);

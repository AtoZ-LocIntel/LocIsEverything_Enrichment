import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

/**
 * Contact form → email via Forward Email SMTP (or any SMTP).
 *
 * Forward Email (paid SMTP): https://forwardemail.net — use smtp.forwardemail.net:465,
 * username = your alias (e.g. submit@knowyourlocation.com), password = generated SMTP password.
 *
 * Vercel env:
 *   CONTACT_SMTP_USER     (required) SMTP login, usually submit@knowyourlocation.com
 *   CONTACT_SMTP_PASS     (required) SMTP password from Forward Email “Generate Password”
 *   CONTACT_MAIL_TO       (optional) default submit@knowyourlocation.com — forwarded to your inbox
 *   CONTACT_MAIL_FROM     (optional) default same as CONTACT_SMTP_USER (envelope From)
 *   CONTACT_SMTP_HOST     (optional) default smtp.forwardemail.net
 *   CONTACT_SMTP_PORT     (optional) default 465 (use 587 for STARTTLS)
 */

const MAX_MESSAGE = 10_000;
const MAX_NAME = 200;

const emailOk = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = process.env.CONTACT_SMTP_USER;
  const pass = process.env.CONTACT_SMTP_PASS;
  if (!user || !pass) {
    console.error('contact: missing CONTACT_SMTP_USER or CONTACT_SMTP_PASS');
    return res.status(503).json({ error: 'Contact form is not configured.' });
  }

  const host = process.env.CONTACT_SMTP_HOST || 'smtp.forwardemail.net';
  const port = Number(process.env.CONTACT_SMTP_PORT) || 465;
  const mailTo = process.env.CONTACT_MAIL_TO || 'submit@knowyourlocation.com';
  const mailFrom = process.env.CONTACT_MAIL_FROM || user;

  let body: { name?: string; replyEmail?: string; message?: string };
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, MAX_NAME) : '';
  const replyEmail = typeof body.replyEmail === 'string' ? body.replyEmail.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }
  if (message.length > MAX_MESSAGE) {
    return res.status(400).json({ error: 'Message is too long.' });
  }
  if (replyEmail && !emailOk(replyEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  const textLines = [
    'New message from the Location Enrichment Platform contact form.',
    '',
    name ? `Name: ${name}` : 'Name: (not provided)',
    replyEmail ? `Reply-To: ${replyEmail}` : 'Reply email: (not provided)',
    '',
    '---',
    '',
    message,
  ];
  const text = textLines.join('\n');
  const subject = `[Location Enrichment] Contact${name ? ` from ${name}` : ''}`;

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      ...(port === 587 ? { requireTLS: true } : {}),
    });

    await transporter.sendMail({
      from: mailFrom,
      to: mailTo,
      replyTo: replyEmail || undefined,
      subject,
      text,
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('contact: sendMail error', e);
    return res.status(500).json({ error: 'Could not send your message. Please try again later.' });
  }
}

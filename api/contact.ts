import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

/**
 * Contact form → email via Forward Email SMTP (or any SMTP).
 *
 * Forward Email (paid SMTP): smtp.forwardemail.net — port 465 (SSL) or 587 (STARTTLS).
 *
 * Vercel env:
 *   CONTACT_SMTP_USER, CONTACT_SMTP_PASS (required)
 *   CONTACT_MAIL_TO       default submit@knowyourlocation.com — if delivery fails, set to your Gmail directly
 *   CONTACT_MAIL_FROM     default same as CONTACT_SMTP_USER
 *   CONTACT_SMTP_HOST     default smtp.forwardemail.net
 *   CONTACT_SMTP_PORT     default 465; we retry 587 STARTTLS if 465 fails (unless you set PORT explicitly)
 *   CONTACT_SMTP_DEBUG=1  verbose SMTP logs in Vercel function logs
 */

const MAX_MESSAGE = 10_000;
const MAX_NAME = 200;

const emailOk = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

function parseBody(req: VercelRequest): unknown {
  const raw = req.body;
  if (raw == null) return undefined;
  if (Buffer.isBuffer(raw)) {
    try {
      return JSON.parse(raw.toString('utf8'));
    } catch {
      return undefined;
    }
  }
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return undefined;
    }
  }
  return raw;
}

function smtpOptions(
  host: string,
  port: number,
  user: string,
  pass: string,
  debug: boolean
): SMTPTransport.Options {
  const secure = port === 465;
  return {
    host,
    port,
    secure,
    auth: { user, pass },
    ...(port === 587 ? { requireTLS: true } : {}),
    // Stay within Vercel Hobby ~10s function limit (two port attempts max ~8s connect)
    connectionTimeout: 4_000,
    greetingTimeout: 4_000,
    socketTimeout: 8_000,
    // Vercel → SMTP often fails on IPv6; force IPv4
    family: 4,
    tls: {
      minVersion: 'TLSv1.2',
    },
    ...(debug ? { debug: true, logger: true } : {}),
  };
}

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
  const envPort = process.env.CONTACT_SMTP_PORT;
  const explicitPort = envPort != null && envPort !== '' ? Number(envPort) : undefined;
  const mailTo = process.env.CONTACT_MAIL_TO || 'submit@knowyourlocation.com';
  const mailFrom = process.env.CONTACT_MAIL_FROM || user;
  const debug = process.env.CONTACT_SMTP_DEBUG === '1';

  const parsed = parseBody(req);
  if (!parsed || typeof parsed !== 'object') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  const body = parsed as { name?: string; replyEmail?: string; message?: string };

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

  const mailOptions = {
    from: mailFrom,
    to: mailTo,
    replyTo: replyEmail || undefined,
    subject,
    text,
  };

  const trySend = async (port: number) => {
    const transporter = nodemailer.createTransport(smtpOptions(host, port, user, pass, debug));
    await transporter.sendMail(mailOptions);
  };

  const portsToTry =
    explicitPort != null && !Number.isNaN(explicitPort)
      ? [explicitPort]
      : [465, 587];

  let lastErr: unknown;
  for (const port of portsToTry) {
    try {
      await trySend(port);
      return res.status(200).json({ ok: true });
    } catch (e) {
      lastErr = e;
      const err = e as Error & { response?: string; responseCode?: number; code?: string };
      console.error('contact: SMTP attempt failed', {
        port,
        message: err.message,
        code: err.code,
        responseCode: err.responseCode,
        response: err.response?.slice?.(0, 500),
      });
    }
  }

  console.error('contact: all SMTP attempts failed', lastErr);
  return res.status(500).json({ error: 'Could not send your message. Please try again later.' });
}

import type { VercelRequest, VercelResponse } from '@vercel/node';

const UPSTREAM = 'https://api.mobilitydatabase.org/v1/gtfs_feeds';

/**
 * Proxies Mobility Database Catalog GET /v1/gtfs_feeds with server-side auth.
 * Set MOBILITY_DATABASE_API_TOKEN in Vercel (Firebase ID token / API bearer from mobilitydatabase.org).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.MOBILITY_DATABASE_API_TOKEN;
  if (!token || !String(token).trim()) {
    return res.status(503).json({
      error: 'Mobility Database API token not configured',
      hint: 'Set MOBILITY_DATABASE_API_TOKEN in project environment (Vercel or local .env).',
    });
  }

  const qs = new URLSearchParams();
  for (const [k, raw] of Object.entries(req.query || {})) {
    if (raw === undefined) continue;
    const vals = Array.isArray(raw) ? raw : [raw];
    for (const v of vals) {
      if (v != null) qs.append(k, String(v));
    }
  }
  const q = qs.toString();
  const url = q ? `${UPSTREAM}?${q}` : UPSTREAM;

  const upstream = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await upstream.text();
  const ct = upstream.headers.get('content-type');
  if (ct) res.setHeader('Content-Type', ct);
  res.status(upstream.status);

  try {
    return res.json(JSON.parse(text));
  } catch {
    return res.send(text);
  }
}

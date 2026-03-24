import type { VercelRequest, VercelResponse } from '@vercel/node';

const UPSTREAM = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT =
  'LocIsEverything-Enrichment/1.0 (https://knowyourlocation.com; noreply@locationmart.com)';

/**
 * Proxy Nominatim search server-side so browsers are not blocked by CORS.
 * Route: GET /api/nominatim/search?...
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Accept, User-Agent');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const params = new URLSearchParams();
  const q = req.query;
  for (const [key, value] of Object.entries(q)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, String(v)));
    } else {
      params.append(key, String(value));
    }
  }

  const target = `${UPSTREAM}?${params.toString()}`;
  try {
    const r = await fetch(target, {
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
      },
    });
    const text = await r.text();
    const ct = r.headers.get('content-type') || 'application/json; charset=utf-8';
    res.status(r.status);
    res.setHeader('Content-Type', ct);
    return res.send(text);
  } catch (e) {
    console.error('nominatim proxy:', e);
    return res.status(502).json({ error: 'Nominatim proxy failed' });
  }
}

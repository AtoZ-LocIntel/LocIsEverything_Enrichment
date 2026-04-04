import type { VercelRequest, VercelResponse } from '@vercel/node';

const UPSTREAM_BASE = 'https://opensky-network.org/api/states/all';

/**
 * Proxy OpenSky Network states API server-side (browser CORS only allows opensky-network.org).
 * Route: GET /api/opensky-proxy?... (query forwarded to upstream)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Accept');

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

  const qs = params.toString();
  const target = qs ? `${UPSTREAM_BASE}?${qs}` : UPSTREAM_BASE;

  try {
    const r = await fetch(target, {
      headers: {
        Accept: 'application/json',
      },
    });
    const text = await r.text();
    const ct = r.headers.get('content-type') || 'application/json; charset=utf-8';
    res.status(r.status);
    res.setHeader('Content-Type', ct);
    return res.send(text);
  } catch (e) {
    console.error('opensky-proxy:', e);
    return res.status(502).json({ error: 'OpenSky proxy failed' });
  }
}

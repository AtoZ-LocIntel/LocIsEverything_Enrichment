import type { VercelRequest, VercelResponse } from '@vercel/node';
import { runAISStreamSnapshotQuery } from '../lib/aisStreamSnapshotCore.js';

/** Snapshot needs several seconds to collect WebSocket messages. */
export const config = {
  maxDuration: 60,
};

function sendJson(res: VercelResponse, status: number, body: Record<string, unknown>) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  let payload: string;
  try {
    payload = JSON.stringify(body);
  } catch (e) {
    console.error('ais-snapshot: JSON.stringify failed', e);
    payload = JSON.stringify({
      error: 'AIS snapshot response could not be serialized',
      details: e instanceof Error ? e.message : String(e),
    });
    return res.status(500).end(payload);
  }
  return res.status(status).end(payload);
}

/** Flat `/api/ais-snapshot` — avoids nested `/api/aisstream/...` routing edge cases on static hosts. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const { status, body } = await runAISStreamSnapshotQuery(
      req.query as Record<string, string | string[] | undefined>
    );

    if (status === 200) {
      res.setHeader('Cache-Control', 'no-store');
    }
    return sendJson(res, status, body);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('ais-snapshot: unhandled error', e);
    return sendJson(res, 500, {
      error: 'AIS snapshot failed',
      details: msg,
    });
  }
}

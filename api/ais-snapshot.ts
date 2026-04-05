import type { VercelRequest, VercelResponse } from '@vercel/node';
import { runAISStreamSnapshotQuery } from './aisstream/snapshotCore';

/** Vercel Pro / configurable; snapshot needs several seconds to collect messages. */
export const config = {
  maxDuration: 60,
};

/** Flat `/api/ais-snapshot` — avoids nested `/api/aisstream/...` routing edge cases on static hosts. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { status, body } = await runAISStreamSnapshotQuery(
    req.query as Record<string, string | string[] | undefined>
  );

  if (status === 200) {
    res.setHeader('Cache-Control', 'no-store');
  }
  return res.status(status).json(body);
}

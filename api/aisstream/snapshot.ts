import type { VercelRequest, VercelResponse } from '@vercel/node';
import WebSocket from 'ws';

const AIS_STREAM_URL = 'wss://stream.aisstream.io/v0/stream';

/** Vercel Pro / configurable; snapshot needs several seconds to collect messages. */
export const config = {
  maxDuration: 60,
};

function milesToLatDelta(miles: number): number {
  return miles / 69;
}

function milesToLonDelta(miles: number, latDeg: number): number {
  const cos = Math.cos((latDeg * Math.PI) / 180);
  const denom = 69 * Math.max(Math.abs(cos), 0.01);
  return miles / denom;
}

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface AISStreamFeature {
  mmsi: string;
  lat: number;
  lon: number;
  latitude: number;
  longitude: number;
  sog?: number;
  cog?: number;
  navigationalStatus?: number;
  trueHeading?: number;
  timestamp?: number;
  shipName?: string;
  distance_miles?: number;
}

/** AIS class A (Message 1/2/3) + Class B (18/19) — many vessels only emit Standard/Extended Class B. */
function extractPositionPayload(msg: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!msg) return undefined;
  return (msg.PositionReport ||
    msg.StandardClassBPositionReport ||
    msg.ExtendedClassBPositionReport ||
    msg.positionreport ||
    msg.standardclassbpositionreport) as Record<string, unknown> | undefined;
}

function parsePositionMessage(raw: Record<string, unknown>): AISStreamFeature | null {
  const msg = raw.Message as Record<string, unknown> | undefined;
  const pr = extractPositionPayload(msg);
  if (!pr) return null;

  const lat = pr.Latitude ?? pr.latitude;
  const lon = pr.Longitude ?? pr.longitude;
  if (typeof lat !== 'number' || typeof lon !== 'number' || Number.isNaN(lat) || Number.isNaN(lon)) {
    return null;
  }

  const meta = (raw.MetaData || raw.Metadata || {}) as Record<string, unknown>;
  const userId = pr.UserID ?? pr.userId;
  const mmsi =
    meta.MMSI != null
      ? String(meta.MMSI)
      : userId != null
        ? String(userId)
        : '';

  const shipName =
    (typeof meta.ShipName === 'string' && meta.ShipName.trim()) ||
    (typeof meta.shipName === 'string' && meta.shipName.trim()) ||
    undefined;

  return {
    mmsi: mmsi || 'unknown',
    lat,
    lon,
    latitude: lat,
    longitude: lon,
    sog: typeof pr.Sog === 'number' ? pr.Sog : undefined,
    cog: typeof pr.Cog === 'number' ? pr.Cog : undefined,
    navigationalStatus: typeof pr.NavigationalStatus === 'number' ? pr.NavigationalStatus : undefined,
    trueHeading: typeof pr.TrueHeading === 'number' ? pr.TrueHeading : undefined,
    timestamp: typeof pr.Timestamp === 'number' ? pr.Timestamp : undefined,
    shipName,
  };
}

function collectSnapshot(
  apiKey: string,
  boundingBoxes: number[][][],
  collectMs: number,
  maxMessages: number
): Promise<AISStreamFeature[]> {
  return new Promise((resolve, reject) => {
    const byMmsi = new Map<string, AISStreamFeature>();
    let finished = false;
    let messageCount = 0;

    const ws = new WebSocket(AIS_STREAM_URL);

    const done = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      try {
        ws.close();
      } catch {
        /* ignore */
      }
      resolve([...byMmsi.values()]);
    };

    const timer = setTimeout(done, collectMs);

    ws.on('open', () => {
      const subscription = {
        APIKey: apiKey,
        BoundingBoxes: boundingBoxes,
        // Class A uses PositionReport; most recreational / smaller vessels use Class B (18/19).
        FilterMessageTypes: ['PositionReport', 'StandardClassBPositionReport', 'ExtendedClassBPositionReport'],
      };
      ws.send(JSON.stringify(subscription));
    });

    ws.on('message', (data: WebSocket.RawData) => {
      if (finished) return;
      try {
        const raw = JSON.parse(String(data)) as Record<string, unknown>;
        const feature = parsePositionMessage(raw);
        if (feature && feature.mmsi !== 'unknown') {
          byMmsi.set(feature.mmsi, feature);
        } else if (feature) {
          byMmsi.set(`${feature.lat.toFixed(5)},${feature.lon.toFixed(5)}`, feature);
        }
        messageCount++;
        if (messageCount >= maxMessages) {
          done();
        }
      } catch {
        /* ignore malformed */
      }
    });

    ws.on('error', (err: Error) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      try {
        ws.close();
      } catch {
        /* ignore */
      }
      if (byMmsi.size > 0) {
        resolve([...byMmsi.values()]);
      } else {
        reject(err);
      }
    });

    ws.on('close', () => {
      if (!finished) {
        done();
      }
    });
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.AISSTREAM_API_KEY || process.env.AIS_STREAM_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'AIS Stream is not configured',
      hint: 'Set AISSTREAM_API_KEY in the deployment environment (aisstream.io).',
    });
  }

  const lat = parseFloat(String(req.query.lat ?? ''));
  const lon = parseFloat(String(req.query.lon ?? ''));
  const radiusMiles = Math.min(
    500,
    Math.max(1, parseFloat(String(req.query.radiusMiles ?? '50')) || 50)
  );

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return res.status(400).json({ error: 'Query parameters lat and lon are required (decimal degrees).' });
  }

  const dLat = milesToLatDelta(radiusMiles);
  const dLon = milesToLonDelta(radiusMiles, lat);
  const minLat = Math.max(-90, lat - dLat);
  const maxLat = Math.min(90, lat + dLat);
  const minLon = Math.max(-180, lon - dLon);
  const maxLon = Math.min(180, lon + dLon);

  const boundingBoxes: number[][][] = [[[maxLat, minLon], [minLat, maxLon]]];

  const collectMs = Math.min(15000, Math.max(4000, parseInt(String(req.query.collectMs ?? '12000'), 10) || 12000));

  try {
    const features = await collectSnapshot(apiKey, boundingBoxes, collectMs, 4000);
    const filtered = features
      .map((f) => {
        const d = haversineMiles(lat, lon, f.lat, f.lon);
        return { ...f, distance_miles: d };
      })
      .filter((f) => f.distance_miles! <= radiusMiles + 0.5)
      .sort((a, b) => (a.distance_miles ?? 0) - (b.distance_miles ?? 0));

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      collectedAt: new Date().toISOString(),
      bbox: { minLat, maxLat, minLon, maxLon },
      count: filtered.length,
      features: filtered,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('aisstream snapshot:', msg);
    return res.status(502).json({
      error: 'Failed to connect to AIS Stream',
      details: msg,
    });
  }
}

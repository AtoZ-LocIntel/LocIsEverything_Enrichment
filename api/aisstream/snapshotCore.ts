/**
 * Shared AIS Stream snapshot logic (Vercel serverless + Vite dev middleware).
 */
import WebSocket from 'ws';

const AIS_STREAM_URL = 'wss://stream.aisstream.io/v0/stream';

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

function normalizeNum(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = parseFloat(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function extractPositionPayload(
  msg: Record<string, unknown> | undefined,
  messageType: string | undefined
): Record<string, unknown> | undefined {
  if (!msg) return undefined;
  const explicit =
    msg.PositionReport ||
    msg.StandardClassBPositionReport ||
    msg.ExtendedClassBPositionReport ||
    msg.positionreport ||
    msg.standardclassbpositionreport;
  if (explicit && typeof explicit === 'object') {
    return explicit as Record<string, unknown>;
  }
  if (messageType && typeof msg[messageType] === 'object' && msg[messageType]) {
    return msg[messageType] as Record<string, unknown>;
  }
  return undefined;
}

function parsePositionMessage(raw: Record<string, unknown>): AISStreamFeature | null {
  const msg = raw.Message as Record<string, unknown> | undefined;
  const mt = typeof raw.MessageType === 'string' ? raw.MessageType : undefined;
  const pr = extractPositionPayload(msg, mt);

  const meta = (raw.MetaData || raw.Metadata || {}) as Record<string, unknown>;

  let lat = pr ? normalizeNum(pr.Latitude ?? pr.latitude) : null;
  let lon = pr ? normalizeNum(pr.Longitude ?? pr.longitude) : null;
  if (lat == null || lon == null) {
    lat = normalizeNum(meta.Latitude ?? meta.latitude);
    lon = normalizeNum(meta.Longitude ?? meta.longitude);
  }
  if (lat == null || lon == null) {
    return null;
  }

  const userId = pr ? pr.UserID ?? pr.userId : undefined;
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

  const sogN = pr ? normalizeNum(pr.Sog ?? pr.sog) : null;
  const cogN = pr ? normalizeNum(pr.Cog ?? pr.cog) : null;
  const navN = pr ? normalizeNum(pr.NavigationalStatus ?? pr.navigationalstatus) : null;
  const thN = pr ? normalizeNum(pr.TrueHeading ?? pr.trueheading) : null;
  const tsN = pr ? normalizeNum(pr.Timestamp ?? pr.timestamp) : null;

  return {
    mmsi: mmsi || 'unknown',
    lat,
    lon,
    latitude: lat,
    longitude: lon,
    sog: sogN ?? undefined,
    cog: cogN ?? undefined,
    navigationalStatus: navN ?? undefined,
    trueHeading: thN ?? undefined,
    timestamp: tsN ?? undefined,
    shipName,
  };
}

interface CollectSnapshotStats {
  rawMessageCount: number;
  parsedPositionCount: number;
}

function collectSnapshot(
  apiKey: string,
  boundingBoxes: number[][][],
  collectMs: number,
  maxMessages: number
): Promise<{ features: AISStreamFeature[]; stats: CollectSnapshotStats }> {
  return new Promise((resolve, reject) => {
    const byMmsi = new Map<string, AISStreamFeature>();
    let finished = false;
    let messageCount = 0;
    let rawMessageCount = 0;
    let parsedPositionCount = 0;

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
      resolve({
        features: [...byMmsi.values()],
        stats: { rawMessageCount, parsedPositionCount },
      });
    };

    const timer = setTimeout(done, collectMs);

    ws.on('open', () => {
      const subscription = {
        APIKey: apiKey,
        BoundingBoxes: boundingBoxes,
        FilterMessageTypes: ['PositionReport', 'StandardClassBPositionReport', 'ExtendedClassBPositionReport'],
      };
      ws.send(JSON.stringify(subscription));
    });

    ws.on('message', (data: WebSocket.RawData) => {
      if (finished) return;
      try {
        rawMessageCount++;
        const raw = JSON.parse(String(data)) as Record<string, unknown>;
        const feature = parsePositionMessage(raw);
        if (feature) {
          parsedPositionCount++;
          if (feature.mmsi !== 'unknown') {
            byMmsi.set(feature.mmsi, feature);
          } else {
            byMmsi.set(`${feature.lat.toFixed(5)},${feature.lon.toFixed(5)}`, feature);
          }
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
        resolve({
          features: [...byMmsi.values()],
          stats: { rawMessageCount, parsedPositionCount },
        });
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

function pickQuery(
  query: Record<string, string | string[] | undefined>,
  key: string
): string {
  const v = query[key];
  if (v == null) return '';
  return Array.isArray(v) ? String(v[0]) : String(v);
}

/**
 * Core snapshot handler: same JSON as Vercel `/api/aisstream/snapshot`.
 */
export async function runAISStreamSnapshotQuery(
  query: Record<string, string | string[] | undefined>
): Promise<{ status: number; body: Record<string, unknown> }> {
  const apiKey = process.env.AISSTREAM_API_KEY || process.env.AIS_STREAM_API_KEY;
  if (!apiKey) {
    return {
      status: 503,
      body: {
        error: 'AIS Stream is not configured',
        hint: 'Set AISSTREAM_API_KEY in .env (local) or deployment env (aisstream.io).',
      },
    };
  }

  const lat = parseFloat(pickQuery(query, 'lat'));
  const lon = parseFloat(pickQuery(query, 'lon'));
  const radiusMiles = Math.min(
    500,
    Math.max(1, parseFloat(pickQuery(query, 'radiusMiles')) || 50)
  );

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return {
      status: 400,
      body: { error: 'Query parameters lat and lon are required (decimal degrees).' },
    };
  }

  const dLat = milesToLatDelta(radiusMiles);
  const dLon = milesToLonDelta(radiusMiles, lat);
  const minLat = Math.max(-90, lat - dLat);
  const maxLat = Math.min(90, lat + dLat);
  const minLon = Math.max(-180, lon - dLon);
  const maxLon = Math.min(180, lon + dLon);

  /** Official docs: each corner is [latitude, longitude] (see aisstream.io documentation). */
  const boundingBoxes: number[][][] = [[[minLat, minLon], [maxLat, maxLon]]];

  const collectMs = Math.min(
    15000,
    Math.max(4000, parseInt(pickQuery(query, 'collectMs') || '12000', 10) || 12000)
  );

  const wantDebug = pickQuery(query, 'debug') === '1';

  try {
    const { features, stats } = await collectSnapshot(apiKey, boundingBoxes, collectMs, 4000);
    const filtered = features
      .map((f) => {
        const d = haversineMiles(lat, lon, f.lat, f.lon);
        return { ...f, distance_miles: d };
      })
      .filter((f) => f.distance_miles! <= radiusMiles + 0.5)
      .sort((a, b) => (a.distance_miles ?? 0) - (b.distance_miles ?? 0));

    const body: Record<string, unknown> = {
      collectedAt: new Date().toISOString(),
      bbox: { minLat, maxLat, minLon, maxLon },
      count: filtered.length,
      features: filtered,
    };

    if (wantDebug) {
      body.debug = {
        boundingBoxes,
        collectMs,
        radiusMiles,
        center: { lat, lon },
        rawWsMessages: stats.rawMessageCount,
        parsedPositions: stats.parsedPositionCount,
        featuresBeforeRadiusFilter: features.length,
        hint:
          stats.rawMessageCount === 0
            ? 'No WebSocket messages — check API key, network, or try a busy port/coastal bbox.'
            : stats.parsedPositionCount === 0
              ? 'Messages received but none parsed as positions — message shape may have changed.'
              : features.length === 0 && filtered.length === 0
                ? 'Positions parsed but none within radius (try larger radius or coastal area).'
                : undefined,
      };
    }

    return {
      status: 200,
      body,
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('aisstream snapshot:', msg);
    return {
      status: 502,
      body: {
        error: 'Failed to connect to AIS Stream',
        details: msg,
      },
    };
  }
}

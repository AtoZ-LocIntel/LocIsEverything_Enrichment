/**
 * AIS live positions via server-side AIS Stream (aisstream.io).
 * Browsers must not connect to AIS Stream directly; the app calls /api/aisstream/snapshot.
 */

export interface AISLivePosition {
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

export interface AISLiveSnapshotDebug {
  boundingBoxes?: number[][][];
  collectMs?: number;
  radiusMiles?: number;
  center?: { lat: number; lon: number };
  rawWsMessages?: number;
  parsedPositions?: number;
  featuresBeforeRadiusFilter?: number;
  hint?: string;
}

export async function fetchAISLivePositionReports(
  lat: number,
  lon: number,
  radiusMiles: number,
  options?: { debug?: boolean }
): Promise<{
  features: AISLivePosition[];
  collectedAt?: string;
  error?: string;
  hint?: string;
  debug?: AISLiveSnapshotDebug;
}> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    radiusMiles: String(radiusMiles),
  });
  const wantDebug =
    options?.debug === true || (typeof import.meta !== 'undefined' && import.meta.env?.DEV === true);
  if (wantDebug) {
    params.set('debug', '1');
  }
  const res = await fetch(`/api/aisstream/snapshot?${params}`);
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    return {
      features: [],
      error:
        'AIS snapshot response was not JSON (often the SPA HTML). Use `npm run dev` with AISSTREAM_API_KEY in .env, or set VITE_AIS_PROXY_TARGET to your deployed site.',
    };
  }

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok) {
    return {
      features: [],
      error: typeof data.error === 'string' ? data.error : res.statusText,
      hint: typeof data.hint === 'string' ? data.hint : undefined,
    };
  }

  const features = Array.isArray(data.features) ? (data.features as AISLivePosition[]) : [];
  const collectedAt = typeof data.collectedAt === 'string' ? data.collectedAt : undefined;
  const dbg = data.debug;
  const debugPayload =
    dbg && typeof dbg === 'object' && !Array.isArray(dbg) ? (dbg as AISLiveSnapshotDebug) : undefined;
  if (debugPayload && typeof import.meta !== 'undefined' && import.meta.env?.DEV === true) {
    const payload = {
      count: features.length,
      rawWsMessages: debugPayload.rawWsMessages,
      parsedPositions: debugPayload.parsedPositions,
      beforeFilter: debugPayload.featuresBeforeRadiusFilter,
      hint: debugPayload.hint,
      center: debugPayload.center,
      radiusMiles: debugPayload.radiusMiles,
    };
    if (features.length === 0) {
      console.warn('[AIS snapshot] No vessels drawn — diagnostics:', payload);
    } else {
      console.info('[AIS snapshot]', payload);
    }
  }
  return { features, collectedAt, debug: debugPayload };
}

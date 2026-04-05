/**
 * AIS live positions via server-side AIS Stream (aisstream.io).
 * Browsers must not connect to AIS Stream directly; the app calls /api/ais-snapshot.
 */

export interface AISLivePosition {
  mmsi: string;
  lat: number;
  lon: number;
  latitude: number;
  longitude: number;
  /** AIS Stream message type (e.g. ExtendedClassBPositionReport). */
  aisMessageType?: string;
  sog?: number;
  cog?: number;
  navigationalStatus?: number;
  trueHeading?: number;
  rateOfTurn?: number;
  timestamp?: number;
  shipName?: string;
  shipType?: number;
  dimension?: { a: number; b: number; c: number; d: number };
  metaTimeUtc?: string;
  messageId?: number;
  positionAccuracy?: boolean;
  raim?: boolean;
  fixType?: number;
  dte?: boolean;
  assignedMode?: boolean;
  specialManoeuvre?: number;
  reportValid?: boolean;
  /** AIS message 5 / ShipStaticData (merged from snapshot when available). */
  hasShipStaticData?: boolean;
  callSign?: string;
  imoNumber?: number;
  destination?: string;
  maximumStaticDraught?: number;
  aisVersion?: number;
  etaMonth?: number;
  etaDay?: number;
  etaHour?: number;
  etaMinute?: number;
  shipStaticMessageId?: number;
  staticRepeatIndicator?: number;
  shipStaticValid?: boolean;
  staticSpare?: boolean;
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
  note?: string;
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
  const res = await fetch(`/api/ais-snapshot?${params}`);
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const prodHint =
      typeof import.meta !== 'undefined' && import.meta.env?.PROD === true
        ? ' Production: the app received HTML instead of JSON — usually the SPA fallback is serving index.html for /api/ais-snapshot (check vercel.json rewrites exclude /api/* and that api/ais-snapshot.ts is deployed). AISSTREAM_API_KEY on Vercel is correct for the serverless function once the route is hit.'
        : ' Local: use `npm run dev` with AISSTREAM_API_KEY in .env, or set VITE_AIS_PROXY_TARGET to your deployed site.';
    return {
      features: [],
      error: `AIS snapshot response was not JSON (often the SPA HTML).${prodHint}`,
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
      note: debugPayload.note,
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

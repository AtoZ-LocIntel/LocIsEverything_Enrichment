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

export async function fetchAISLivePositionReports(
  lat: number,
  lon: number,
  radiusMiles: number
): Promise<{ features: AISLivePosition[]; collectedAt?: string; error?: string; hint?: string }> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    radiusMiles: String(radiusMiles),
  });
  const res = await fetch(`/api/aisstream/snapshot?${params}`);
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    return {
      features: [],
      error: 'AIS snapshot returned non-JSON (local dev: run against Vercel build or set VITE_AIS_PROXY_TARGET to your deployed site in .env)',
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
  return { features, collectedAt };
}

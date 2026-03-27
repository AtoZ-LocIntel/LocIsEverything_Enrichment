/**
 * DataSF — Temporary Street Closures (Socrata, LineString)
 * SFMTA-permitted temporary street closures (Shared Spaces, events, construction, etc.).
 * API: https://data.sfgov.org/api/v3/views/8x25-yybr/query.geojson
 * Proximity via SoQL within_circle on `shape` (line geometry intersects search radius).
 */

const RESOURCE_GEOJSON = 'https://data.sfgov.org/resource/8x25-yybr.geojson';
const SHAPE_FIELD = 'shape';
const MAX_RADIUS_MILES = 5;
const MILES_TO_METERS = 1609.34;
const EARTH_RADIUS_MI = 3958.8;

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_MI * c;
}

/** Minimum distance from a point to a polyline (segment-wise), in miles. Coords are [lon, lat]. */
function distancePointToLineCoordsMiles(lat: number, lon: number, coords: [number, number][]): number {
  if (!coords || coords.length < 2) {
    return Infinity;
  }
  let min = Infinity;
  for (let i = 0; i < coords.length - 1; i++) {
    const [lonA, latA] = coords[i];
    const [lonB, latB] = coords[i + 1];
    const latM = (latA + latB) / 2;
    const k = Math.cos((latM * Math.PI) / 180);
    const px = lon * k;
    const py = lat;
    const ax = lonA * k;
    const ay = latA;
    const bx = lonB * k;
    const by = latB;
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 > 0 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0;
    const cx = ax + t * dx;
    const cy = ay + t * dy;
    const clon = cx / k;
    const clat = cy;
    const d = haversineMiles(lat, lon, clat, clon);
    if (d < min) min = d;
  }
  return min;
}

function distancePointToGeometryMiles(
  lat: number,
  lon: number,
  geom: { type?: string; coordinates?: unknown }
): number {
  const t = geom.type;
  const c = geom.coordinates;
  if (t === 'LineString' && Array.isArray(c)) {
    return distancePointToLineCoordsMiles(lat, lon, c as [number, number][]);
  }
  if (t === 'MultiLineString' && Array.isArray(c)) {
    let min = Infinity;
    for (const line of c as [number, number][][]) {
      const d = distancePointToLineCoordsMiles(lat, lon, line);
      if (d < min) min = d;
    }
    return min;
  }
  return Infinity;
}

export type DatasfTemporaryStreetClosure = Record<string, unknown> & {
  geometry: { type: 'LineString' | 'MultiLineString'; coordinates: number[][] | number[][][] };
  distance_miles: number;
};

export async function getDatasfTemporaryStreetClosuresData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<DatasfTemporaryStreetClosure[]> {
  if (!radiusMiles || radiusMiles <= 0) {
    return [];
  }

  const cappedMiles = Math.min(radiusMiles, MAX_RADIUS_MILES);
  const radiusMeters = cappedMiles * MILES_TO_METERS;
  const where = `within_circle(${SHAPE_FIELD}, ${lat}, ${lon}, ${radiusMeters})`;
  const url = new URL(RESOURCE_GEOJSON);
  url.searchParams.set('$where', where);
  url.searchParams.set('$limit', '50000');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`DataSF Temporary Street Closures HTTP ${response.status}`);
  }

  const data = (await response.json()) as {
    type?: string;
    features?: Array<{
      geometry?: { type?: string; coordinates?: unknown };
      properties?: Record<string, unknown>;
    }>;
  };

  if (!data.features || !Array.isArray(data.features)) {
    return [];
  }

  const results: DatasfTemporaryStreetClosure[] = [];

  for (const feature of data.features) {
    const geom = feature.geometry;
    const props = feature.properties || {};
    if (!geom || (geom.type !== 'LineString' && geom.type !== 'MultiLineString')) {
      continue;
    }

    const distance_miles = Number(
      distancePointToGeometryMiles(lat, lon, geom as { type?: string; coordinates?: unknown }).toFixed(4)
    );
    if (distance_miles > cappedMiles + 1e-5) {
      continue;
    }

    const row: DatasfTemporaryStreetClosure = {
      ...props,
      geometry: geom as DatasfTemporaryStreetClosure['geometry'],
      distance_miles,
    };
    results.push(row);
  }

  results.sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
  return results;
}

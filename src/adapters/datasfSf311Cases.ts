/**
 * DataSF — SF 311 Service Requests / Cases (Socrata)
 * 311 cases with geocoded point_geom where available.
 * API: https://data.sfgov.org/api/v3/views/vw6y-z8j6/query.geojson
 * Proximity via SoQL within_circle on `point_geom` (queries capped at 0.25 mile).
 */

const RESOURCE_GEOJSON = 'https://data.sfgov.org/resource/vw6y-z8j6.geojson';
const LOCATION_FIELD = 'point_geom';
const MAX_RADIUS_MILES = 0.25;
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

export type DatasfSf311Case = Record<string, unknown> & {
  latitude: number;
  longitude: number;
  geometry: { type: 'Point'; coordinates: [number, number] };
  distance_miles: number;
};

export async function getDatasfSf311CasesData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<DatasfSf311Case[]> {
  if (!radiusMiles || radiusMiles <= 0) {
    return [];
  }

  const cappedMiles = Math.min(radiusMiles, MAX_RADIUS_MILES);
  const radiusMeters = cappedMiles * MILES_TO_METERS;
  const where = `within_circle(${LOCATION_FIELD}, ${lat}, ${lon}, ${radiusMeters})`;
  const url = new URL(RESOURCE_GEOJSON);
  url.searchParams.set('$where', where);
  url.searchParams.set('$limit', '50000');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`DataSF SF 311 Cases HTTP ${response.status}`);
  }

  const data = (await response.json()) as {
    type?: string;
    features?: Array<{ geometry?: { type?: string; coordinates?: number[] }; properties?: Record<string, unknown> }>;
  };

  if (!data.features || !Array.isArray(data.features)) {
    return [];
  }

  const results: DatasfSf311Case[] = [];

  for (const feature of data.features) {
    const geom = feature.geometry;
    const props = feature.properties || {};
    if (!geom || geom.type !== 'Point' || !geom.coordinates || geom.coordinates.length < 2) {
      continue;
    }
    const [plon, plat] = geom.coordinates as [number, number];
    const distance_miles = Number(haversineMiles(lat, lon, plat, plon).toFixed(4));
    if (distance_miles > cappedMiles + 1e-6) {
      continue;
    }

    const row: DatasfSf311Case = {
      ...props,
      latitude: plat,
      longitude: plon,
      geometry: { type: 'Point', coordinates: [plon, plat] },
      distance_miles,
    };
    results.push(row);
  }

  results.sort((a, b) => (a.distance_miles || 0) - (b.distance_miles || 0));
  return results;
}

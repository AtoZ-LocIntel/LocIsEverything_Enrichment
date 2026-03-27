/**
 * DataSF — Police Department Incident Reports (2018–present) (Socrata)
 * Point locations where available; excludes rows without coordinates (not returned by within_circle).
 * API: https://data.sfgov.org/api/v3/views/wg3w-h783/query.geojson
 * Proximity via SoQL within_circle on `point` and incident_date >= 2018-01-01 (dataset scope).
 */

const RESOURCE_GEOJSON = 'https://data.sfgov.org/resource/wg3w-h783.geojson';
const LOCATION_FIELD = 'point';
/** Matches dataset title “2018 – Present”; reduces payload vs. unbounded history. */
const INCIDENT_DATE_MIN = '2018-01-01';
const MAX_RADIUS_MILES = 1;
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

export type DatasfPdIncidentReport = Record<string, unknown> & {
  latitude: number;
  longitude: number;
  geometry: { type: 'Point'; coordinates: [number, number] };
  distance_miles: number;
};

export async function getDatasfPdIncidentReportsData(
  lat: number,
  lon: number,
  radiusMiles?: number
): Promise<DatasfPdIncidentReport[]> {
  if (!radiusMiles || radiusMiles <= 0) {
    return [];
  }

  const cappedMiles = Math.min(radiusMiles, MAX_RADIUS_MILES);
  const radiusMeters = cappedMiles * MILES_TO_METERS;
  const where = `within_circle(${LOCATION_FIELD}, ${lat}, ${lon}, ${radiusMeters}) AND incident_date >= '${INCIDENT_DATE_MIN}'`;
  const url = new URL(RESOURCE_GEOJSON);
  url.searchParams.set('$where', where);
  url.searchParams.set('$limit', '50000');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`DataSF PD Incident Reports HTTP ${response.status}`);
  }

  const data = (await response.json()) as {
    type?: string;
    features?: Array<{ geometry?: { type?: string; coordinates?: number[] }; properties?: Record<string, unknown> }>;
  };

  if (!data.features || !Array.isArray(data.features)) {
    return [];
  }

  const results: DatasfPdIncidentReport[] = [];

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

    const row: DatasfPdIncidentReport = {
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
